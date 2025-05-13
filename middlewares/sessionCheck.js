const Cart = require('../models/cartSchema');
const mongoose = require('mongoose');

const checkSessionAndCoupon = async (req, res, next) => {
    try {
        if (req.session.user?.id) {
            // Check if there's an applied coupon in session but not in cart
            if (req.session.appliedCoupon) {
                const cart = await Cart.findOne({ userId: req.session.user.id });
                
                if (!cart || !cart.couponCode || cart.couponCode !== req.session.appliedCoupon.code) {
                    // Clear the session coupon if it doesn't match the cart
                    delete req.session.appliedCoupon;
                }
            }
        }
        next();
    } catch (error) {
        console.error('Session check error:', error);
        next();
    }
};

module.exports = checkSessionAndCoupon;