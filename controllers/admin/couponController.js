const Coupon = require('../../models/couponSchema');

const getCouponPage = async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.render('admin/manageCoupons', { coupons });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const getAddCouponPage = (req, res) => {
    res.render('admin/addCoupon');
};

const createCoupon = async (req, res) => {
    try {
        const { code, discount, expirationDate, usageLimit, minOrderValue } = req.body;

        // Server-side validation with specific messages
        if (!code) {
            return res.status(400).json({ field: 'code', message: 'Coupon code is required' });
        }
        if (!discount) {
            return res.status(400).json({ field: 'discount', message: 'Discount is required' });
        }
        if (!expirationDate) {
            return res.status(400).json({ field: 'expirationDate', message: 'Expiration date is required' });
        }
        if (!usageLimit) {
            return res.status(400).json({ field: 'usageLimit', message: 'Usage limit is required' });
        }
        if (!minOrderValue && minOrderValue !== 0) { // Allow 0 as a valid value
            return res.status(400).json({ field: 'minOrderValue', message: 'Minimum order value is required' });
        }

        // Additional validation
        if (discount < 0 || discount > 100) {
            return res.status(400).json({ field: 'discount', message: 'Discount must be between 0 and 100' });
        }
        if (usageLimit < 1) {
            return res.status(400).json({ field: 'usageLimit', message: 'Usage limit must be at least 1' });
        }
        if (minOrderValue < 0) {
            return res.status(400).json({ field: 'minOrderValue', message: 'Minimum order value cannot be negative' });
        }
        const today = new Date().toISOString().split('T')[0];
        if (expirationDate < today) {
            return res.status(400).json({ field: 'expirationDate', message: 'Expiration date cannot be in the past' });
        }

        // Check for duplicate coupon code
        const existingCoupon = await Coupon.findOne({ code });
        if (existingCoupon) {
            return res.status(400).json({ field: 'code', message: 'This coupon code already exists' });
        }

        const coupon = new Coupon({
            code,
            discount,
            expirationDate,
            usageLimit,
            minOrderValue,
            usedCount: 0
        });

        await coupon.save();
        res.status(201).json({ message: 'Coupon added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        await Coupon.findByIdAndUpdate(req.params.id, { isActive: false });
        res.redirect('/admin/coupons');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getCouponPage,
    getAddCouponPage,
    createCoupon,
    deleteCoupon
};