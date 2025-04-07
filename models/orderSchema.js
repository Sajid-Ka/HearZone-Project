const mongoose = require("mongoose");
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const orderSchema = new Schema({
    orderId: {
        type: String,
        default: () => uuidv4(),
        unique: true  // This creates a unique index automatically
    },
    userId: {
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
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    taxes: {
        type: Number,
        default: 0,
        min: 0
    },
    shippingCost: {
        type: Number,
        default: 0,
        min: 0
    },
    finalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    address: {
        type: {
            addressType: { type: String, required: true },
            name: { type: String, required: true },
            city: { type: String, required: true },
            landmark: String,
            state: { type: String, required: true },
            pinCode: { type: String, required: true },
            phone: { type: String, required: true },
            altPhone: String,
            isDefault: { type: Boolean, default: false }
        },
        required: true
    },
    paymentMethod: {
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
        enum: [
            'Pending',
            'Processing',
            'Shipped',
            'Out for Delivery',
            'Delivered',
            'Cancelled',
            'Cancel Request',
            'Return Request',
            'Returned'
        ],
        default: 'Pending'
    },
    statusHistory: [{
        status: {
            type: String,
            required: true,
            enum: [
                'Pending', 'Processing', 'Shipped', 
                'Out for Delivery', 'Delivered', 
                'Cancelled', 'Cancel Request', 
                'Return Request', 'Returned'
            ]
        },
        date: { 
            type: Date, 
            default: Date.now 
        },
        description: String,
        changedBy: {
            type: Schema.Types.ObjectId,
            refPath: 'statusHistory.changedByModel'
        },
        changedByModel: {
            type: String,
            enum: ['User', 'Admin']
        }
    }],
    couponApplied: {
        type: Boolean,
        default: false
    },
    cancellationReason: {
        type: String
    },
    returnReason: {
        type: String
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});



orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

// Virtual to calculate total items
orderSchema.virtual('totalItems').get(function() {
    return this.orderedItems.reduce((total, item) => total + item.quantity, 0);
});

// Pre-save hook to ensure finalAmount consistency
orderSchema.pre('save', function(next) {
    this.finalAmount = this.totalPrice - this.discount + this.taxes + this.shippingCost;
    next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;