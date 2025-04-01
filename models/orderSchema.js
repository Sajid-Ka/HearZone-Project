const mongoose = require("mongoose");
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const orderSchema = new Schema({
    orderId: {
        type: String,
        default: () => uuidv4(),
        unique: true
    },
    userId: { // Added to link order to user
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderedItems: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            default: 0
        }
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    taxes: { // Added for tax calculation
        type: Number,
        default: 0
    },
    shippingCost: { // Added for shipping
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },
    address: { // Changed to store full address object
        type: {
            addressType: String,
            name: String,
            city: String,
            landmark: String,
            state: String,
            pinCode: String,
            phone: String,
            altPhone: String,
            isDefault: Boolean
        },
        required: true
    },
    paymentMethod: { // Added for payment method
        type: String,
        enum: ['Cash on Delivery', 'Online Payment'],
        default: 'Cash on Delivery'
    },
    invoiceDate: {
        type: Date
    },
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Return Request', 'Returned']
    },
    createdOn: {
        type: Date,
        default: Date.now,
        required: true
    },
    couponApplied: {
        type: Boolean,
        default: false
    },
    cancellationReason: { // Added for cancellation
        type: String,
        default: null
    },
    returnReason: { // Added for returns
        type: String,
        default: null
    }
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;