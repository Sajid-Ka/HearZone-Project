const Cart = require('../models/cartSchema');
const mongoose = require('mongoose');

const checkSessionAndCoupon = async (req, res, next) => {
    try {
        if (req.session.user?.id) {
            
            if (req.session.appliedCoupon) {
                const cart = await Cart.findOne({ userId: req.session.user.id });
                
                if (!cart || !cart.couponCode || cart.couponCode !== req.session.appliedCoupon.code) {
                    
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