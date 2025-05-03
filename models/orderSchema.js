const mongoose = require("mongoose");
const { Schema } = mongoose;
const Counter = require('./Counter');

const orderSchema = new Schema({
    orderId: {
        type: String,
        default: true,
        unique: true
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
        },
        subTotal: { 
            type: Number, 
            required: true, 
            min: 0 
        },
        cancellationStatus: { 
            type: String, 
            enum: ['None', 'Cancel Request', 'Cancelled'], 
            default: 'None' 
        },
        cancellationReason: { type: String },
        cancellationRejected: { type: Boolean, default: false },
        returnStatus: {
            type: String,
            enum: ['None', 'Return Request', 'Returned'],
            default: 'None'
        },
        returnReason: { type: String },
        returnRejected: { type: Boolean, default: false }
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
        enum: ['Cash on Delivery', 'Razorpay', 'Wallet', 'Other'],
        default: 'Cash on Delivery'
    },
    paymentStatus: { 
        type: String, 
        enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
        default: 'Pending' 
    },
    invoiceDate: {
        type: Date
    },
    status: {
        type: String,
        required: true,
        enum: [
            'Pending', 'Shipped', 'Delivered', 
            'Cancel Request', 'Cancelled', 
            'Return Request', 'Returned'
        ],
        default: 'Pending'
    },
    statusHistory: [{
        status: {
            type: String,
            enum: ['None', 'Cancel Request', 'Cancelled', 'Return Request', 'Returned', 'Pending', 'Shipped', 'Delivered']
        },
        date: { 
            type: Date, 
            default: Date.now 
        },
        description: String,
        changedBy: {
            type: Schema.Types.ObjectId, 
            refPath: 'orderedItems.statusHistory.changedByModel' 
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
    cancellationRejected: {
         type: Boolean, default: false 
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
    return this.orderedItems.reduce((total, item) => 
        item.cancellationStatus === 'Cancelled' ? total : total + item.quantity, 0);
});

// Pre-save hook to ensure financial consistency
orderSchema.pre('save', async function(next) {
    if (this.isNew) {
        const today = new Date();
        const dateStr = today.toISOString().slice(0,10).replace(/-/g,"");
        try {
            const counter = await Counter.findByIdAndUpdate(
                { _id: dateStr },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.orderId = `HZ-${dateStr}-${String(counter.seq).padStart(4, '0')}`;
        } catch (error) {
            return next(error);
        }
    }

    this.orderedItems.forEach(item => {
        item.subTotal = item.price * item.quantity;
    });

    this.totalPrice = this.orderedItems.reduce((total, item) => 
        item.cancellationStatus === 'Cancelled' ? total : total + item.subTotal, 0);
    
    this.finalAmount = this.totalPrice - this.discount + this.taxes + this.shippingCost;

    const allItemsCancelled = this.orderedItems.every(item => item.cancellationStatus === 'Cancelled');
    const anyCancelRequest = this.orderedItems.some(item => item.cancellationStatus === 'Cancel Request');

    if (allItemsCancelled && this.status !== 'Cancelled') {
        this.status = 'Cancelled';
        this.statusHistory.push({
            status: 'Cancelled',
            date: new Date(),
            description: 'All items in the order were cancelled'
        });
    } else if (anyCancelRequest && this.status !== 'Cancel Request') {
        this.status = 'Cancel Request';
        this.statusHistory.push({
            status: 'Cancel Request',
            date: new Date(),
            description: 'Cancellation requested for one or more items'
        });
    }

    next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;