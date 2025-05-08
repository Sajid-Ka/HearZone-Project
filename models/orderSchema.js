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
        itemStatus: {
            type: String,
            enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
            default: 'Pending'
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
    razorpayOrderId: {
        type: String
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
            'Return Request', 'Returned',
            'Payment Failed'
        ],
        default: 'Pending'
    },
    isVisibleToAdmin: {
        type: Boolean,
        default: true
    },
    statusHistory: [{
        status: {
            type: String,
            enum: ['None', 'Cancel Request', 
                'Cancelled', 'Return Request', 
                'Returned', 'Pending', 'Shipped', 
                'Delivered', 'Payment Failed']
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
    },
    errorMessage: {
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

// Pre-save hook to ensure financial consistency, status management, and payment status update
orderSchema.pre('save', async function(next) {
    // Always generate order ID for new orders regardless of payment status
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

    // IMPORTANT: Check payment status first before any other operations
    if (this.paymentStatus === 'Failed') {
        this.status = 'Payment Failed';
        this.isVisibleToAdmin = false;
        return next(); // Skip other calculations for failed payments
    }

    // Only calculate financials for orders with items
    if (this.orderedItems && this.orderedItems.length > 0) {
        // Calculate subtotal for each item
        this.orderedItems.forEach(item => {
            if (item.price && item.quantity) {
                item.subTotal = item.price * item.quantity;
            }
        });

        // Calculate total price excluding cancelled items
        this.totalPrice = this.orderedItems.reduce((total, item) => 
            item.cancellationStatus === 'Cancelled' ? total : total + (item.subTotal || 0), 0);
        
        // Ensure finalAmount is calculated, with safe defaults
        if (typeof this.totalPrice === 'number') {
            const discount = typeof this.discount === 'number' ? this.discount : 0;
            const taxes = typeof this.taxes === 'number' ? this.taxes : 0;
            const shipping = typeof this.shippingCost === 'number' ? this.shippingCost : 0;
            
            this.finalAmount = this.totalPrice - discount + taxes + shipping;
        }
    }

    // Update payment status to Paid for COD orders when status changes to Delivered
    if (this.isModified('status') && this.status === 'Delivered' && this.paymentMethod === 'Cash on Delivery') {
        this.paymentStatus = 'Paid';
    }

    // Only proceed with normal status determination if not a failed payment
    if (this.orderedItems && this.orderedItems.length > 0) {
        // Determine order status based on item statuses
        const allItemsCancelled = this.orderedItems.every(item => 
            item.cancellationStatus === 'Cancelled'
        );
        
        const allItemsCancelRequest = this.orderedItems.every(item => 
            item.cancellationStatus === 'Cancel Request'
        );

        const allItemsReturnRequest = this.orderedItems.every(item => 
            item.returnStatus === 'Return Request'
        );

        const allItemsReturned = this.orderedItems.every(item => 
            item.returnStatus === 'Returned'
        );

        const hasDeliveredItems = this.orderedItems.some(item => 
            item.itemStatus === 'Delivered' && item.cancellationStatus === 'None'
        );

        const hasReturnedItems = this.orderedItems.some(item => 
            item.returnStatus === 'Returned'
        );

        const hasShippedItems = this.orderedItems.some(item => 
            item.itemStatus === 'Shipped' && item.cancellationStatus === 'None'
        );

        const hasPendingItems = this.orderedItems.some(item => 
            item.itemStatus === 'Pending' && item.cancellationStatus === 'None'
        );

        // Update order status based on priority
        if (allItemsCancelled) {
            this.status = 'Cancelled';
        } else if (allItemsCancelRequest) {
            this.status = 'Cancel Request';
        } else if (allItemsReturnRequest) {
            this.status = 'Return Request';
        } else if (allItemsReturned) {
            this.status = 'Returned';
        } else if (hasDeliveredItems) {
            this.status = 'Delivered';
        } else if (hasReturnedItems) {
            this.status = 'Returned';
        } else if (hasShippedItems) {
            this.status = 'Shipped';
        } else if (hasPendingItems) {
            this.status = 'Pending';
        }
    }

    next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;