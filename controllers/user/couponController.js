const Coupon = require('../../models/couponSchema');
const Cart = require('../../models/cartSchema');

const getAvailableCoupons = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const coupons = await Coupon.find({ 
            $or: [
                { 
                    isActive: true,
                    expiryDate: { $gte: new Date() },
                    $expr: { $lt: ["$usedCount", "$usageLimit"] },
                    usersUsed: { $nin: [userId] },
                    isReferral: false // Regular coupons
                },
                { 
                    isActive: true,
                    expiryDate: { $gte: new Date() },
                    $expr: { $lt: ["$usedCount", "$usageLimit"] },
                    usersUsed: { $nin: [userId] },
                    userId: userId, // Referral coupons for this user
                    isReferral: true
                }
            ]
        });
        res.json(coupons);
    } catch (error) {
        console.error('Error in getAvailableCoupons:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.session.user.id;
        
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

        const cart = await Cart.findOne({ userId });
        if (!cart || !cart.items.length) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        if (cart.subTotal < coupon.minPurchase) {
            return res.status(400).json({ 
                success: false, 
                message: `Minimum purchase of ₹${coupon.minPurchase} required`
            });
        }

        let discountAmount = 0;
        if (coupon.discountType === 'percentage') {
            discountAmount = (cart.subTotal * coupon.value) / 100;
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        } else {
            discountAmount = coupon.value;
        }

        discountAmount = Math.min(discountAmount, cart.subTotal);

        cart.couponCode = coupon.code;
        cart.discountAmount = discountAmount;
        cart.finalAmount = cart.subTotal - discountAmount;
        
        await cart.save();

        req.session.appliedCoupon = {
            code: coupon.code,
            discountAmount,
            couponId: coupon._id
        };

        res.status(200).json({
            success: true,
            discountAmount,
            finalAmount: cart.finalAmount,
            message: 'Coupon applied successfully'
        });
    } catch (error) {
        console.error('Error in applyCoupon:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const removeCoupon = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(400).json({ success: false, message: 'Cart not found' });
        }

        if (!cart.couponCode) {
            return res.status(400).json({ success: false, message: 'No coupon applied' });
        }

        // Reset coupon-related fields
        cart.couponCode = null;
        cart.discountAmount = 0;
        cart.finalAmount = cart.subTotal;
        
        await cart.save();

        // Clear session
        delete req.session.appliedCoupon;

        res.status(200).json({
            success: true,
            finalAmount: cart.finalAmount,
            discountAmount: 0,
            message: 'Coupon removed successfully'
        });
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