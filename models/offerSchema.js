const mongoose = require('mongoose');
const { Schema } = mongoose;

const offerSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    endDate: {
        type: Date,
        required: true
    },
    products: [{
        type: Schema.Types.ObjectId,
        ref: 'Product'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

offerSchema.index({ endDate: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model('Offer', offerSchema);