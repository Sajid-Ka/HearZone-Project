const mongoose = require("mongoose");
const { Schema } = mongoose;

const cartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: [
        {
            productId: {
                type: Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            quantity: {
                type: Number,
                default: 1,
                min: [1, "Quantity cannot be less than 1"],
                required: true
            },
            price: {
                type: Number,
                required: true,
                min: [0, "Price cannot be negative"] // Added min validator
            },
            totalPrice: {
                type: Number,
                required: true,
                min: [0, "Total price cannot be negative"] // Added min validator
            },
            status: {
                type: String,
                default: "placed",
                enum: ["placed", "processing", "shipped", "delivered", "cancelled"]
            },
            cancellationReason: {
                type: String,
                default: "none"
            }
        }
    ],
    subTotal: {
        type: Number,
        default: 0,
        min: [0, "Subtotal cannot be negative"] // Added min validator
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: [0, "Discount amount cannot be negative"] // Added min validator
    },
    couponCode: {
        type: String,
        default: null
    },
    finalAmount: {
        type: Number,
        default: 0,
        min: [0, "Final amount cannot be negative"] // Added min validator
    }
}, { timestamps: true });

// Method to calculate totals with NaN handling
cartSchema.methods.calculateTotals = function () {
    // Ensure all items have required fields
    this.items.forEach(item => {
        if (!item.price) item.price = 0;
        if (!item.quantity) item.quantity = 1;
        item.totalPrice = item.price * item.quantity;
    });
    
    // Calculate subtotal, ensuring no NaN values
    const subTotal = this.items.reduce((total, item) => {
        const itemTotal = Number(item.totalPrice) || 0;
        return total + itemTotal;
    }, 0);

    
    const discount = Number(this.discountAmount) || 0;

    
    this.subTotal = Number.isNaN(subTotal) ? 0 : subTotal;
    this.finalAmount = Math.max(0, this.subTotal - discount);

    return this;
};


cartSchema.pre("save", function (next) {
    this.calculateTotals();
    next();
});

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;