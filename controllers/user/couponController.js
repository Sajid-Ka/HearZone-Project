// controllers/user/couponController.js
const Coupon = require('../../models/couponSchema');


const getAvailableCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({ 
            isActive: true,
            expirationDate: { $gte: new Date() },
            $expr: { $lt: ["$usedCount", "$usageLimit"] } // Fix the condition
        });
        res.json(coupons);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};


module.exports = {
    getAvailableCoupons
    };