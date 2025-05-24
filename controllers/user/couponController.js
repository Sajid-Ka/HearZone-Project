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
                { isReferral: false }, 
                { isReferral: true, userId: userId } 
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

        
        coupon.usersUsed.push(userId);
        coupon.usedCount += 1;
        await coupon.save();

        let subTotal = 0;
        let discountAmount = 0;
        let couponDiscount = 0;
        let finalAmount = 0;
        let offerPrice = 0;

        if (isBuyNow) {
            const buyNowOrder = req.session.buyNowOrder;
            if (!buyNowOrder || buyNowOrder.userId !== userId) {
                return res.status(400).json({ success: false, message: 'Invalid Buy Now order' });
            }

            const product = await Product.findById(buyNowOrder.productId)
                .populate('category')
                .populate('offer');

            if (!product || product.quantity < buyNowOrder.quantity) {
                delete req.session.buyNowOrder;
                return res.status(400).json({ success: false, message: 'Product unavailable or insufficient stock' });
            }

            subTotal = buyNowOrder.subTotal;
            offerPrice = buyNowOrder.salePrice * buyNowOrder.quantity;
            discountAmount = subTotal - offerPrice;

            if (coupon.minPurchase && subTotal < coupon.minPurchase) {
                return res.status(400).json({
                    success: false,
                    message: `Minimum purchase of ₹${coupon.minPurchase} required`
                });
            }

            couponDiscount = coupon.discountType === 'percentage'
                ? (offerPrice * coupon.value) / 100
                : coupon.value;

            if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
                couponDiscount = coupon.maxDiscount;
            }

            couponDiscount = Math.min(couponDiscount, offerPrice);
            finalAmount = offerPrice - couponDiscount;

            req.session.buyNowOrder = {
                ...buyNowOrder,
                couponCode: coupon.code,
                discountAmount: couponDiscount,
                finalAmount,
                appliedCoupon: {
                    code: coupon.code,
                    discountAmount: couponDiscount,
                    couponId: coupon._id
                }
            };

            req.session.appliedCoupon = {
                code: coupon.code,
                discountAmount: couponDiscount,
                couponId: coupon._id
            };
        } else {
            const cart = await Cart.findOne({ userId }).populate({
                path: 'items.productId',
                populate: [
                    { path: 'category', select: 'name isListed offer' },
                    { path: 'offer' }
                ]
            });

            if (!cart || !cart.items.length) {
                return res.status(400).json({ success: false, message: 'Cart is empty' });
            }

            await cart.calculateTotals();
            subTotal = cart.subTotal;
            discountAmount = cart.productDiscount;
            offerPrice = subTotal - discountAmount;

            if (coupon.minPurchase && subTotal < coupon.minPurchase) {
                return res.status(400).json({
                    success: false,
                    message: `Minimum purchase of ₹${coupon.minPurchase} required`
                });
            }

            couponDiscount = coupon.discountType === 'percentage'
                ? (offerPrice * coupon.value) / 100
                : coupon.value;

            if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
                couponDiscount = coupon.maxDiscount;
            }

            couponDiscount = Math.min(couponDiscount, offerPrice);
            finalAmount = offerPrice - couponDiscount;

            cart.couponCode = coupon.code;
            cart.couponDiscount = couponDiscount;
            cart.finalAmount = finalAmount;

            await cart.save();

            req.session.appliedCoupon = {
                code: coupon.code,
                discountAmount: couponDiscount,
                couponId: coupon._id
            };
        }

        await new Promise((resolve, reject) => {
            req.session.save(err => err ? reject(err) : resolve());
        });

        return res.status(200).json({
            success: true,
            subTotal,
            discountAmount,
            couponDiscount,
            finalAmount,
            couponCode: coupon.code,
            message: 'Coupon applied successfully'
        });
    } catch (error) {
        console.error('Error in applyCoupon:', error);
        return res.status(500).json({ success: false, message: 'Failed to apply coupon. Please try again.' });
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

            
            const coupon = await Coupon.findOneAndUpdate(
                { 
                    code: buyNowOrder.couponCode,
                    usersUsed: userId 
                },
                { 
                    $pull: { usersUsed: userId },
                    $inc: { usedCount: -1 }
                },
                { new: true }
            );

            if (!coupon) {
                console.error('Coupon not found or user not in usersUsed array');
            }

            const product = await Product.findById(buyNowOrder.productId)
                .populate('category')
                .populate('offer');

            if (!product) {
                return res.status(400).json({ success: false, message: 'Product not found' });
            }

            const subTotal = buyNowOrder.subTotal;
            const offerPrice = buyNowOrder.salePrice * buyNowOrder.quantity;
            const discountAmount = subTotal - offerPrice;
            const finalAmount = offerPrice;

            req.session.buyNowOrder = {
                ...buyNowOrder,
                couponCode: null,
                discountAmount: 0,
                finalAmount,
                appliedCoupon: null
            };

            delete req.session.appliedCoupon;

            await new Promise((resolve, reject) => {
                req.session.save(err => err ? reject(err) : resolve());
            });

            return res.status(200).json({
                success: true,
                subTotal,
                discountAmount,
                couponDiscount: 0,
                finalAmount,
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

            
            const coupon = await Coupon.findOneAndUpdate(
                { 
                    code: cart.couponCode,
                    usersUsed: userId 
                },
                { 
                    $pull: { usersUsed: userId },
                    $inc: { usedCount: -1 }
                },
                { new: true }
            );


            await cart.calculateTotals();
            cart.couponCode = null;
            cart.couponDiscount = 0;
            cart.finalAmount = cart.subTotal - cart.productDiscount;

            await cart.save();

            delete req.session.appliedCoupon;

            await new Promise((resolve, reject) => {
                req.session.save(err => err ? reject(err) : resolve());
            });

            return res.status(200).json({
                success: true,
                subTotal: cart.subTotal,
                discountAmount: cart.productDiscount,
                couponDiscount: 0,
                finalAmount: cart.finalAmount,
                message: 'Coupon removed successfully'
            });
        }
    } catch (error) {
        console.error('Error in removeCoupon:', error);
        return res.status(500).json({ success: false, message: 'Failed to remove coupon. Please try again.' });
    }
};

module.exports = {
    getAvailableCoupons,
    applyCoupon,
    removeCoupon
};