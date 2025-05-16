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
        // Populate product data if needed
        if (this.items.some(item => typeof item.productId === 'object' && (!item.productId.offerDetails || !item.productId.regularPrice))) {
            await mongoose.model('Cart').populate(this, {
                path: 'items.productId',
                populate: [
                    { path: 'category', select: 'name isListed offer' },
                    { path: 'brand', select: 'brandName isBlocked' },
                    { path: 'offer' }
                ]
            });
        }

        // Filter out invalid items
        this.items = this.items.filter(item => {
            const product = item.productId;
            if (!product) return false;
            return (
                !product.isBlocked && // Product is not blocked
                product.category && product.category.isListed && // Category is listed
                product.brand && !product.brand.isBlocked // Brand is not blocked
            );
        });

        let regularSubTotal = 0;
        let productDiscount = 0;
        let couponDiscount = 0;

        // Calculate regular subtotal and product discounts
        for (const item of this.items) {
            const product = item.productId;
            if (!product) continue;

            const regularPrice = product.regularPrice || item.price || 0;
            regularSubTotal += regularPrice * item.quantity;

            let salePrice = regularPrice;
            let itemDiscount = 0;

            // Product offer
            if (product.offer && new Date(product.offer.endDate) > new Date()) {
                const offerValue = product.offer.discountType === 'percentage'
                    ? product.offer.discountValue
                    : (product.offer.discountValue / regularPrice) * 100;
                salePrice = regularPrice * (1 - offerValue / 100);
                itemDiscount = (regularPrice - salePrice) * item.quantity;
            }

            // Category offer
            if (product.category?.offer?.isActive && new Date(product.category.offer.endDate) > new Date()) {
                const categoryOfferValue = product.category.offer.percentage;
                const categorySalePrice = regularPrice * (1 - categoryOfferValue / 100);
                if (categorySalePrice < salePrice) {
                    salePrice = categorySalePrice;
                    itemDiscount = (regularPrice - categorySalePrice) * item.quantity;
                }
            }

            item.price = salePrice;
            item.totalPrice = salePrice * item.quantity;
            productDiscount += itemDiscount;

            product.offerDetails = {
                regularPrice,
                salePrice,
                hasOffer: itemDiscount > 0
            };
        }

        // Calculate coupon discount
        if (this.couponCode) {
            const coupon = await mongoose.model('Coupon').findOne({
                code: this.couponCode,
                isActive: true,
                expiryDate: { $gte: new Date() },
                $expr: { $lt: ["$usedCount", "$usageLimit"] }
            });

            if (coupon && (!coupon.minPurchase || regularSubTotal >= coupon.minPurchase)) {
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
                this.couponDiscount = 0;
            }
        }

        this.subTotal = regularSubTotal || 0;
        this.productDiscount = productDiscount || 0;
        this.couponDiscount = couponDiscount || 0;
        this.finalAmount = Math.max(0, regularSubTotal - productDiscount - couponDiscount);

        return this;
    } catch (error) {
        console.error('Error in calculateTotals:', error);
        this.subTotal = this.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        this.productDiscount = 0;
        this.couponDiscount = 0;
        this.finalAmount = this.subTotal;
        return this;
    }
};


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