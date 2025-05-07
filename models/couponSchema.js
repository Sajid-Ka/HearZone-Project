const mongoose = require('mongoose');

const {Schema} = mongoose;

const couponSchema = new Schema({
    code: {
       type: String,
        required: true,
         unique: true },
    discount: {
       type: Number,
        required: true,
         min: 0, max: 100 },
    expirationDate: {
       type: Date,
        required: true },
    usageLimit: {
       type: Number,
        required: true,
         min: 1 },
    minOrderValue: {
       type: Number,
        required: true,
         min: 0 },
    usedCount: {
       type: Number,
        default: 0 },
    isActive: {
       type: Boolean,
        default: true }
});

const Coupon = mongoose.model('Coupon',couponSchema);

module.exports = Coupon;