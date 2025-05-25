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
    const {
      code,
      discountType,
      discount,
      expirationDate,
      usageLimit,
      minOrderValue
    } = req.body;

    if (!code)
      return res
        .status(400)
        .json({ field: 'code', message: 'Coupon code is required' });
    if (!discountType)
      return res
        .status(400)
        .json({ field: 'discountType', message: 'Discount type is required' });
    if (!discount)
      return res
        .status(400)
        .json({ field: 'discount', message: 'Discount value is required' });
    if (!expirationDate)
      return res
        .status(400)
        .json({
          field: 'expirationDate',
          message: 'Expiration date is required'
        });
    if (!usageLimit)
      return res
        .status(400)
        .json({ field: 'usageLimit', message: 'Usage limit is required' });
    if (!minOrderValue && minOrderValue !== 0)
      return res
        .status(400)
        .json({
          field: 'minOrderValue',
          message: 'Minimum purchase is required'
        });

    if (!['percentage', 'fixed'].includes(discountType))
      return res
        .status(400)
        .json({
          field: 'discountType',
          message: 'Discount type must be percentage or fixed'
        });
    if (discount < 0)
      return res
        .status(400)
        .json({
          field: 'discount',
          message: 'Discount value must be at least 0'
        });
    if (discountType === 'percentage' && discount > 100)
      return res
        .status(400)
        .json({
          field: 'discount',
          message: 'Percentage discount cannot exceed 100'
        });
    if (usageLimit < 1)
      return res
        .status(400)
        .json({
          field: 'usageLimit',
          message: 'Usage limit must be at least 1'
        });
    if (minOrderValue < 0)
      return res
        .status(400)
        .json({
          field: 'minOrderValue',
          message: 'Minimum purchase cannot be negative'
        });
    const today = new Date().toISOString().split('T')[0];
    if (expirationDate < today)
      return res
        .status(400)
        .json({
          field: 'expirationDate',
          message: 'Expiration date cannot be in the past'
        });

    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon)
      return res
        .status(400)
        .json({ field: 'code', message: 'This coupon code already exists' });

    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      value: parseFloat(discount),
      expiryDate: new Date(expirationDate),
      startDate: new Date(),
      usageLimit: parseInt(usageLimit),
      minPurchase: parseFloat(minOrderValue),
      usedCount: 0,
      isActive: true,
      maxDiscount: discountType === 'percentage' ? null : 0
    });

    await coupon.save();
    res.status(201).json({ message: 'Coupon added successfully' });
  } catch (error) {
    console.error('Error in createCoupon:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    if (!couponId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid coupon ID' });
    }

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    await Coupon.findByIdAndDelete(couponId);
    res.status(200).json({ message: 'Coupon permanently deleted' });
  } catch (error) {
    console.error('Error in deleteCoupon:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const toggleCouponStatus = async (req, res) => {
  try {
    const couponId = req.params.id;
    if (!couponId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid coupon ID' });
    }

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.status(200).json({
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: coupon.isActive
    });
  } catch (error) {
    console.error('Error in toggleCouponStatus:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getCouponPage,
  getAddCouponPage,
  createCoupon,
  deleteCoupon,
  toggleCouponStatus
};
