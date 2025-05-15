const Coupon = require('../../models/couponSchema');
const Cart = require('../../models/cartSchema');
const Product = require('../../models/productSchema');

const getAvailableCoupons = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const coupons = await Coupon.find({ 
            isActive: true,
            expiryDate: { $gte: new Date() },
            $expr: { $lt: ["$usedCount", "$usageLimit"] },
            usersUsed: { $nin: [userId] },
            $or: [
                { isReferral: false }, // Regular coupons
                { isReferral: true, userId: userId } // Referral coupons only for this user
            ]
        });
        res.json(coupons);
    } catch (error) {
        console.error('Error in getAvailableCoupons:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.session.user.id;
        const isBuyNow = !!req.session.buyNowOrder;

        if (!couponCode) {
            return res.status(400).json({ success: false, message: 'Coupon code is required' });
        }

        const coupon = await Coupon.findOne({
            code: couponCode.toUpperCase(),
            isActive: true,
            expiryDate: { $gte: new Date() },
            $expr: { $lt: ["$usedCount", "$usageLimit"] },
            usersUsed: { $nin: [userId] },
            $or: [
                { isReferral: false },
                { userId: userId, isReferral: true }
            ]
        });

        if (!coupon) {
            return res.status(400).json({ success: false, message: 'Invalid or expired coupon' });
        }

        let subTotal = 0;
        let finalAmount = 0;
        let discountAmount = 0;

        if (isBuyNow) {
            const buyNowOrder = req.session.buyNowOrder;
            if (!buyNowOrder || buyNowOrder.userId !== userId) {
                return res.status(400).json({ success: false, message: 'Invalid Buy Now order' });
            }

            const product = await Product.findById(buyNowOrder.productId);
            if (!product || product.quantity < buyNowOrder.quantity) {
                delete req.session.buyNowOrder;
                return res.status(400).json({ success: false, message: 'Product unavailable or insufficient stock' });
            }

            subTotal = buyNowOrder.subTotal;
            finalAmount = buyNowOrder.finalAmount;

            if (coupon.minPurchase && subTotal < coupon.minPurchase) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Minimum purchase of ₹${coupon.minPurchase} required`
                });
            }

            if (coupon.discountType === 'percentage') {
                discountAmount = (finalAmount * coupon.value) / 100;
                if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                    discountAmount = coupon.maxDiscount;
                }
            } else {
                discountAmount = coupon.value;
            }

            discountAmount = Math.min(discountAmount, finalAmount);

            req.session.buyNowOrder = {
                ...buyNowOrder,
                couponCode: coupon.code,
                discountAmount,
                finalAmount: finalAmount - discountAmount,
                appliedCoupon: {
                    code: coupon.code,
                    discountAmount,
                    couponId: coupon._id
                }
            };

            req.session.appliedCoupon = {
                code: coupon.code,
                discountAmount,
                couponId: coupon._id
            };

            await new Promise((resolve, reject) => {
                req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                        return reject(new Error('Failed to save session'));
                    }
                    resolve();
                });
            });
        } else {
            const cart = await Cart.findOne({ userId });
            if (!cart || !cart.items.length) {
                return res.status(400).json({ success: false, message: 'Cart is empty' });
            }

            subTotal = cart.subTotal;
            finalAmount = cart.finalAmount || cart.subTotal;

            if (coupon.minPurchase && subTotal < coupon.minPurchase) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Minimum purchase of ₹${coupon.minPurchase} required`
                });
            }

            if (coupon.discountType === 'percentage') {
                discountAmount = (finalAmount * coupon.value) / 100;
                if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                    discountAmount = coupon.maxDiscount;
                }
            } else {
                discountAmount = coupon.value;
            }

            discountAmount = Math.min(discountAmount, finalAmount);

            cart.couponCode = coupon.code;
            cart.discountAmount = discountAmount;
            cart.finalAmount = finalAmount - discountAmount;
            
            await cart.save();

            req.session.appliedCoupon = {
                code: coupon.code,
                discountAmount,
                couponId: coupon._id
            };

            await new Promise((resolve, reject) => {
                req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                        return reject(new Error('Failed to save session'));
                    }
                    resolve();
                });
            });
        }

        res.status(200).json({
            success: true,
            discountAmount,
            finalAmount: finalAmount - discountAmount,
            message: 'Coupon applied successfully'
        });
    } catch (error) {
        console.error('Error in applyCoupon:', error);
        res.status(500).json({ success: false, message: 'Shop is temporarily down. Please try again later.' });
    }
};

const removeCoupon = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const isBuyNow = !!req.session.buyNowOrder;

        if (isBuyNow) {
            const buyNowOrder = req.session.buyNowOrder;
            if (!buyNowOrder || buyNowOrder.userId !== userId) {
                return res.status(400).json({ success: false, message: 'Invalid Buy Now order' });
            }

            if (!buyNowOrder.couponCode) {
                return res.status(400).json({ success: false, message: 'No coupon applied' });
            }

            // Calculate the original final amount without coupon discount
            const product = await Product.findById(buyNowOrder.productId);
            if (!product) {
                return res.status(400).json({ success: false, message: 'Product not found' });
            }

            // Recalculate pricing to ensure accuracy
            let regularPrice = product.regularPrice;
            let salePrice = regularPrice;
            let productOfferValue = 0;
            let categoryOfferValue = 0;

            if (product.offer && new Date(product.offer.endDate) > new Date()) {
                productOfferValue = product.offer.discountType === 'percentage'
                    ? product.offer.discountValue
                    : (product.offer.discountValue / product.regularPrice) * 100;
            }

            if (product.category?.offer?.isActive && new Date(product.category.offer.endDate) > new Date()) {
                categoryOfferValue = product.category.offer.percentage;
            }

            const finalOfferValue = Math.max(productOfferValue, categoryOfferValue);
            if (finalOfferValue > 0) {
                salePrice = regularPrice * (1 - finalOfferValue / 100);
            }

            const subTotal = regularPrice * buyNowOrder.quantity;
            const finalAmount = salePrice * buyNowOrder.quantity;

            // Update buyNowOrder
            req.session.buyNowOrder = {
                ...buyNowOrder,
                couponCode: null,
                discountAmount: 0,
                finalAmount: finalAmount,
                salePrice: Math.round(salePrice),
                subTotal: subTotal,
                appliedCoupon: null
            };

            delete req.session.appliedCoupon;

            await new Promise((resolve, reject) => {
                req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                        return reject(new Error('Failed to save session'));
                    }
                    resolve();
                });
            });

            return res.status(200).json({
                success: true,
                finalAmount: finalAmount,
                discountAmount: 0,
                message: 'Coupon removed successfully'
            });
        } else {
            const cart = await Cart.findOne({ userId });
            if (!cart) {
                return res.status(400).json({ success: false, message: 'Cart not found' });
            }

            if (!cart.couponCode) {
                return res.status(400).json({ success: false, message: 'No coupon applied' });
            }

            cart.couponCode = null;
            cart.discountAmount = 0;
            cart.finalAmount = cart.subTotal;
            
            await cart.save();

            delete req.session.appliedCoupon;

            await new Promise((resolve, reject) => {
                req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                        return reject(new Error('Failed to save session'));
                    }
                    resolve();
                });
            });

            return res.status(200).json({
                success: true,
                finalAmount: cart.finalAmount,
                discountAmount: 0,
                message: 'Coupon removed successfully'
            });
        }
    } catch (error) {
        console.error('Error in removeCoupon:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getAvailableCoupons,
    applyCoupon,
    removeCoupon
};