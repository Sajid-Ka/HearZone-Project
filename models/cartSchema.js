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
    productDiscount: {
        type: Number,
        default: 0,
        min: [0, "Product discount cannot be negative"]
    },
    couponDiscount: {
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

cartSchema.methods.calculateTotals = async function () {
    try {
        // Ensure we have populated product data
        if (this.items.some(item => typeof item.productId === 'object' && (!item.productId.offerDetails || !item.productId.regularPrice))) {
            await mongoose.model('Cart').populate(this, {
                path: 'items.productId',
                populate: [
                    { path: 'category', select: 'name isListed offer' },
                    { path: 'offer' }
                ]
            });
        }

        // Initialize totals with default values
        let regularSubTotal = 0;
        let productDiscount = 0;
        let couponDiscount = 0;

        // Calculate regular subtotal and product discounts
        this.items.forEach(item => {
            const product = item.productId;
            if (!product) return;

            // Safely get regular price with fallback
            const regularPrice = product.regularPrice || item.price || 0;
            regularSubTotal += regularPrice * item.quantity;

            // Initialize discount calculation
            let salePrice = regularPrice;
            let itemDiscount = 0;

            // Check for product offers
            if (product.offer && new Date(product.offer.endDate) > new Date()) {
                const offerValue = product.offer.discountType === 'percentage' 
                    ? product.offer.discountValue 
                    : (product.offer.discountValue / regularPrice) * 100;
                salePrice = regularPrice * (1 - offerValue / 100);
                itemDiscount = (regularPrice - salePrice) * item.quantity;
            }

            // Check for category offers
            if (product.category?.offer?.isActive && new Date(product.category.offer.endDate) > new Date()) {
                const categoryOfferValue = product.category.offer.percentage;
                const categorySalePrice = regularPrice * (1 - categoryOfferValue / 100);
                
                if (categorySalePrice < salePrice) {
                    itemDiscount = (regularPrice - categorySalePrice) * item.quantity;
                    salePrice = categorySalePrice;
                }
            }

            // Update item prices
            item.price = salePrice;
            item.totalPrice = salePrice * item.quantity;
            productDiscount += itemDiscount;

            // Store offer details
            product.offerDetails = {
                regularPrice: regularPrice,
                salePrice: salePrice,
                hasOffer: itemDiscount > 0
            };
        });

        // Calculate coupon discount if applied
        if (this.couponCode) {
            const coupon = await mongoose.model('Coupon').findOne({ code: this.couponCode });
            if (coupon) {
                const discountedSubTotal = regularSubTotal - productDiscount;
                if (coupon.discountType === 'percentage') {
                    couponDiscount = (discountedSubTotal * coupon.value) / 100;
                    if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
                        couponDiscount = coupon.maxDiscount;
                    }
                } else {
                    couponDiscount = Math.min(coupon.value, discountedSubTotal);
                }
            } else {
                this.couponCode = null;
            }
        }

        // Update cart totals with fallback to 0
        this.subTotal = regularSubTotal || 0;
        this.productDiscount = productDiscount || 0;
        this.couponDiscount = couponDiscount || 0;
        this.finalAmount = Math.max(0, (regularSubTotal || 0) - (productDiscount || 0) - (couponDiscount || 0));

        return this;
    } catch (error) {
        console.error('Error in calculateTotals:', error);
        // Set safe defaults if calculation fails
        this.subTotal = this.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        this.productDiscount = 0;
        this.couponDiscount = 0;
        this.finalAmount = this.subTotal;
        return this;
    }
};

// Pre-save hook to ensure calculations are always up-to-date
cartSchema.pre("save", async function (next) {
    try {
        // Populate product details if not already populated
        if (this.items.some(item => typeof item.productId === 'object' && !item.productId.offerDetails)) {
            await mongoose.model('Cart').populate(this, {
                path: 'items.productId',
                populate: [
                    { path: 'category', select: 'name isListed offer' },
                    { path: 'offer' }
                ]
            });
        }

        await this.calculateTotals();
        next();
    } catch (error) {
        next(error);
    }
});

// Static method to get cart with populated products
cartSchema.statics.findCartWithProducts = function (userId) {
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