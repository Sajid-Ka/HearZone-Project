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
                min: [0, "Price cannot be negative"]
            },
            totalPrice: {
                type: Number,
                required: true,
                min: [0, "Total price cannot be negative"]
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
        min: [0, "Subtotal cannot be negative"]
    },
    productDiscount: {  // New field to track product-level discounts
        type: Number,
        default: 0,
        min: [0, "Product discount cannot be negative"]
    },
    couponDiscount: {  // New field to track coupon discounts separately
        type: Number,
        default: 0,
        min: [0, "Coupon discount cannot be negative"]
    },
    couponCode: {
        type: String,
        default: null
    },
    finalAmount: {
        type: Number,
        default: 0,
        min: [0, "Final amount cannot be negative"]
    }
}, { timestamps: true });

// Enhanced method to calculate totals with proper discount handling
cartSchema.methods.calculateTotals = async function () {
    // Ensure all items have required fields
    this.items.forEach(item => {
        if (!item.price) item.price = 0;
        if (!item.quantity) item.quantity = 1;
        item.totalPrice = item.price * item.quantity;
    });
    
    // Calculate subtotal based on regular prices (before any discounts)
    const regularSubTotal = this.items.reduce((total, item) => {
        const product = item.productId;
        if (product && product.regularPrice) {
            return total + (product.regularPrice * item.quantity);
        }
        return total + (item.price * item.quantity);
    }, 0);

    // Calculate product-level discounts (from offers)
    this.productDiscount = this.items.reduce((total, item) => {
        const product = item.productId;
        if (product && product.offerDetails && product.offerDetails.hasOffer) {
            const discountPerItem = product.offerDetails.regularPrice - product.offerDetails.salePrice;
            return total + (discountPerItem * item.quantity);
        }
        return total;
    }, 0);

    // Calculate coupon discount if applied
    if (this.couponCode) {
        const coupon = await mongoose.model('Coupon').findOne({ code: this.couponCode });
        if (coupon) {
            const discountedSubTotal = regularSubTotal - this.productDiscount;
            
            if (coupon.discountType === 'percentage') {
                this.couponDiscount = (discountedSubTotal * coupon.value) / 100;
                if (coupon.maxDiscount && this.couponDiscount > coupon.maxDiscount) {
                    this.couponDiscount = coupon.maxDiscount;
                }
            } else {
                this.couponDiscount = Math.min(coupon.value, discountedSubTotal);
            }
        } else {
            this.couponDiscount = 0;
            this.couponCode = null;
        }
    } else {
        this.couponDiscount = 0;
    }

    // Calculate final amounts
    this.subTotal = regularSubTotal;
    this.discountAmount = this.productDiscount + this.couponDiscount;
    this.finalAmount = Math.max(0, this.subTotal - this.discountAmount);

    return this;
};

// Pre-save hook to ensure calculations are always up-to-date
cartSchema.pre("save", async function (next) {
    try {
        // Populate product details if not already populated
        if (this.items.some(item => typeof item.productId === 'object' && !item.productId.offerDetails)) {
            await this.populate({
                path: 'items.productId',
                populate: [
                    { path: 'category', select: 'name isListed offer' },
                    { path: 'offer' }
                ]
            }).execPopulate();
        }

        await this.calculateTotals();
        next();
    } catch (error) {
        next(error);
    }
});

// Static method to get cart with populated products
cartSchema.statics.findCartWithProducts = function(userId) {
    return this.findOne({ userId })
        .populate({
            path: 'items.productId',
            populate: [
                { path: 'category', select: 'name isListed offer' },
                { path: 'offer' }
            ]
        });
};

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;