const Address = require('../../models/addressSchema');
const Cart = require('../../models/cartSchema');
const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const Coupon = require('../../models/couponSchema');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../../models/userSchema');
const Wallet = require('../../models/walletSchema');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


const getCheckoutPage = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const isBuyNow = req.query.buyNow === 'true';
        let cart = null;
        let itemsWithPrices = [];
        let regularSubTotal = 0;
        let discountAmount = 0;
        let couponDiscount = 0;
        let finalAmount = 0;
        let shippingCost = 0;

        // Handle Buy Now
        if (isBuyNow) {
            const buyNowOrder = req.session.buyNowOrder;

            if (!buyNowOrder || buyNowOrder.userId !== userId) {
                return res.status(400).render('user/page-404', { error: 'Invalid Buy Now order' });
            }

            const product = await Product.findById(buyNowOrder.productId)
                .populate('category')
                .populate('offer');

            if (!product || product.quantity < buyNowOrder.quantity) {
                delete req.session.buyNowOrder;
                return res.status(400).render('user/page-404', { error: 'Product unavailable or insufficient stock' });
            }

            // Recalculate pricing
            let regularPrice = product.regularPrice;
            let salePrice = regularPrice;
            let productOfferValue = 0;
            let categoryOfferValue = 0;

            if (product.offer && new Date(product.offer.endDate) > new Date()) {
                productOfferValue = product.offer.discountType === 'percentage'
                    ? product.offer.discountValue
                    : (product.offer.discountValue / product.regularPrice) * 100;
            }

            if (product.category?.offer?.isActive && new Date(product.category.offer.endDate) > new Date()) {
                categoryOfferValue = product.category.offer.percentage;
            }

            const finalOfferValue = Math.max(productOfferValue, categoryOfferValue);
            if (finalOfferValue > 0) {
                salePrice = regularPrice * (1 - finalOfferValue / 100);
            }

            regularSubTotal = regularPrice * buyNowOrder.quantity;
            const baseFinalAmount = salePrice * buyNowOrder.quantity;
            discountAmount = (regularPrice - salePrice) * buyNowOrder.quantity;
            couponDiscount = buyNowOrder.discountAmount || 0;
            finalAmount = baseFinalAmount - couponDiscount;

            let offerType = null;
            if (finalOfferValue > 0) {
                offerType = productOfferValue >= categoryOfferValue ? 'product' : 'category';
            }

            itemsWithPrices = [{
                productId: product,
                quantity: buyNowOrder.quantity,
                regularPrice: regularPrice,
                salePrice: Math.round(salePrice),
                itemDiscountAmount: Math.round(discountAmount),
                offerType: offerType,
                offerPercentage: finalOfferValue
            }];

            // Update buyNowOrder with recalculated values
            req.session.buyNowOrder = {
                ...buyNowOrder,
                subTotal: regularSubTotal,
                finalAmount: baseFinalAmount,
                salePrice: Math.round(salePrice),
                regularPrice: regularPrice,
                discountAmount: couponDiscount,
                totalOffer: finalOfferValue
            };

            if (couponDiscount > 0 && buyNowOrder.couponCode) {
                req.session.appliedCoupon = {
                    code: buyNowOrder.couponCode,
                    discountAmount: couponDiscount,
                    couponId: buyNowOrder.appliedCoupon?.couponId
                };
            }
        } else {
            cart = await Cart.findOne({ userId }).populate({
                path: 'items.productId',
                populate: [
                    { path: 'category', select: 'name isListed offer' },
                    { path: 'offer' }
                ]
            });

            if (!cart || !cart.items.length) {
                return res.redirect('/cart');
            }

            // Apply session-based coupon if available
            if (req.session.appliedCoupon) {
                const coupon = await Coupon.findOne({
                    code: req.session.appliedCoupon.code,
                    isActive: true,
                    expiryDate: { $gte: new Date() },
                    $expr: { $lt: ["$usedCount", "$usageLimit"] },
                    usersUsed: { $nin: [userId] },
                    $or: [
                        { isReferral: false },
                        { userId: userId, isReferral: true }
                    ]
                });

                if (coupon && (!coupon.minPurchase || cart.subTotal >= coupon.minPurchase)) {
                    cart.couponCode = req.session.appliedCoupon.code;
                    cart.discountAmount = req.session.appliedCoupon.discountAmount;
                    cart.finalAmount = cart.subTotal - cart.discountAmount;
                    await cart.save();
                    couponDiscount = cart.discountAmount;
                } else {
                    cart.couponCode = null;
                    cart.discountAmount = 0;
                    cart.finalAmount = cart.subTotal;
                    await cart.save();
                    delete req.session.appliedCoupon;
                }
            }

            for (const item of cart.items) {
                const product = item.productId;
                const regularPriceTotal = product.regularPrice * item.quantity;
                regularSubTotal += regularPriceTotal;

                let productOfferValue = 0;
                let categoryOfferValue = 0;
                let finalOfferValue = 0;
                let offerType = null;

                if (product.offer && new Date(product.offer.endDate) > new Date()) {
                    productOfferValue = product.offer.discountType === 'percentage'
                        ? product.offer.discountValue
                        : (product.offer.discountValue / product.regularPrice) * 100;
                }

                if (product.category?.offer?.isActive && new Date(product.category.offer.endDate) > new Date()) {
                    categoryOfferValue = product.category.offer.percentage;
                }

                if (productOfferValue > 0 || categoryOfferValue > 0) {
                    if (productOfferValue >= categoryOfferValue) {
                        finalOfferValue = productOfferValue;
                        offerType = 'product';
                    } else {
                        finalOfferValue = categoryOfferValue;
                        offerType = 'category';
                    }
                }

                let salePrice = product.regularPrice;
                let itemDiscountAmount = 0;

                if (finalOfferValue > 0) {
                    salePrice = product.regularPrice * (1 - finalOfferValue / 100);
                    itemDiscountAmount = (product.regularPrice - salePrice) * item.quantity;
                }

                discountAmount += itemDiscountAmount;

                itemsWithPrices.push({
                    ...item.toObject(),
                    regularPrice: product.regularPrice,
                    salePrice: Math.round(salePrice),
                    itemDiscountAmount: Math.round(itemDiscountAmount),
                    offerType,
                    offerPercentage: finalOfferValue
                });
            }

            finalAmount = cart.finalAmount || regularSubTotal - discountAmount - couponDiscount;
        }

        const addressDoc = await Address.findOne({ userId });
        const user = await User.findById(userId).select('wallet');
        const walletBalance = user?.wallet?.balance || 0;
        const canUseWallet = walletBalance >= finalAmount;

        const coupons = await Coupon.find({
            isActive: true,
            expiryDate: { $gte: new Date() },
            $expr: { $lt: ["$usedCount", "$usageLimit"] },
            usersUsed: { $nin: [userId] },
            $or: [
                { isReferral: false },
                { isReferral: true, userId: userId }
            ]
        });

        res.render('user/checkout', {
            cart: isBuyNow ? { items: itemsWithPrices } : { ...cart.toObject(), items: itemsWithPrices },
            addresses: addressDoc ? addressDoc.addresses : [],
            regularSubTotal,
            discountAmount,
            couponDiscount,
            shippingCost,
            finalAmount,
            user: req.session.user,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            appliedCoupon: req.session.appliedCoupon || null,
            availableCoupons: coupons,
            walletBalance,
            canUseWallet,
            isBuyNow
        });
    } catch (error) {
        console.error('Error in getCheckoutPage:', error);
        res.status(500).render('user/page-500');
    }
};

const createRazorpayOrder = async (amount, currency = 'INR') => {
    try {
        if (!amount || amount <= 0) {
            throw new Error('Invalid amount: Amount must be greater than zero');
        }

        const options = {
            amount: amount * 100, // convert to paise
            currency,
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        return order;
    } catch (error) {
        console.error('Razorpay Error:', error);
        throw new Error(`Failed to create Razorpay order: ${error.message || JSON.stringify(error)}`);
    }
};


const verifyPayment = (orderId, paymentId, signature) => {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    return expectedSignature === signature;
};


const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { addressId, paymentMethod } = req.body;
        const isBuyNow = !!req.session.buyNowOrder;
        let cart = null;
        let orderData = null;

        const addressDoc = await Address.findOne({ userId });
        const user = await User.findById(userId);

        if (!addressDoc) {
            return res.status(400).json({ success: false, message: 'Address not found' });
        }

        const selectedAddress = addressDoc.addresses.id(addressId);

        if (!selectedAddress) {
            return res.status(400).json({ success: false, message: 'Selected address not found' });
        }

        if (isBuyNow) {
            const buyNowOrder = req.session.buyNowOrder;

            if (!buyNowOrder || buyNowOrder.userId !== userId) {
                return res.status(400).json({ success: false, message: 'Invalid buy now order' });
            }

            const product = await Product.findById(buyNowOrder.productId);

            if (!product || product.quantity < buyNowOrder.quantity) {
                delete req.session.buyNowOrder;
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${buyNowOrder.productName}`
                });
            }

            orderData = {
                userId,
                orderedItems: [{
                    product: buyNowOrder.productId,
                    quantity: buyNowOrder.quantity,
                    price: buyNowOrder.salePrice,
                    subTotal: buyNowOrder.finalAmount,
                    status: 'Pending'
                }],
                totalPrice: buyNowOrder.subTotal,
                discount: buyNowOrder.subTotal - buyNowOrder.finalAmount + (buyNowOrder.discountAmount || 0),
                taxes: 0,
                shippingCost: 0,
                finalAmount: buyNowOrder.finalAmount,
                address: selectedAddress,
                paymentMethod,
                paymentStatus: 'Pending',
                status: 'Pending',
                isVisibleToAdmin: true,
                couponApplied: !!buyNowOrder.couponCode,
                couponCode: buyNowOrder.couponCode
            };
        } else {
            cart = await Cart.findOne({ userId }).populate('items.productId');

            if (!cart) {
                return res.status(400).json({ success: false, message: 'Cart not found' });
            }

            let productDiscount = 0;
            for (const item of cart.items) {
                if (item.quantity > item.productId.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for ${item.productId.productName}`
                    });
                }
                const product = item.productId;
                let salePrice = product.regularPrice;
                let itemDiscountAmount = 0;

                let productOfferValue = 0;
                let categoryOfferValue = 0;

                if (product.offer && new Date(product.offer.endDate) > new Date()) {
                    productOfferValue = product.offer.discountType === 'percentage'
                        ? product.offer.discountValue
                        : (product.offer.discountValue / product.regularPrice) * 100;
                }

                if (product.category?.offer?.isActive && new Date(product.category.offer.endDate) > new Date()) {
                    categoryOfferValue = product.category.offer.percentage;
                }

                if (productOfferValue > 0 || categoryOfferValue > 0) {
                    const finalOfferValue = Math.max(productOfferValue, categoryOfferValue);
                    salePrice = product.regularPrice * (1 - finalOfferValue / 100);
                    itemDiscountAmount = (product.regularPrice - salePrice) * item.quantity;
                }

                productDiscount += itemDiscountAmount;
            }

            orderData = {
                userId,
                orderedItems: cart.items.map(item => ({
                    product: item.productId._id,
                    quantity: item.quantity,
                    price: item.price,
                    subTotal: item.totalPrice,
                    status: item.status,
                    cancellationReason: item.cancellationReason
                })),
                totalPrice: cart.subTotal,
                discount: productDiscount, // Product discount
                couponDiscount: cart.discountAmount || 0, // Coupon discount
                taxes: 0,
                shippingCost: 0,
                finalAmount: cart.subTotal - productDiscount - (cart.discountAmount || 0), // Correct total
                address: selectedAddress,
                paymentMethod,
                paymentStatus: 'Pending',
                status: 'Pending',
                isVisibleToAdmin: true,
                couponApplied: !!cart.couponCode,
                couponCode: cart.couponCode
            };
        }

        if (paymentMethod === 'Cash on Delivery' && orderData.finalAmount > 5000) {
            return res.status(400).json({
                success: false,
                message: 'Cash on Delivery not available for orders above ₹5000'
            });
        }

        if (paymentMethod === 'Wallet') {
            if (user.wallet.balance < orderData.finalAmount) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient wallet balance'
                });
            }

            user.wallet.balance -= orderData.finalAmount;
            await user.save();

            function generateTransactionId(userId) {
                return `WALLET-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            }

            const walletTransaction = new Wallet({
                userId,
                amount: orderData.finalAmount,
                type: 'debit',
                description: 'Order payment',
                orderId: `ORDER-${Date.now()}`,
                transactionId: generateTransactionId(user._id)
            });
            await walletTransaction.save();

            orderData.paymentStatus = 'Paid';
            orderData.paymentMethod = 'Wallet';
        }

        if (paymentMethod === 'Razorpay') {
            try {
                const razorpayOrder = await createRazorpayOrder(orderData.finalAmount);

                req.session.pendingOrder = {
                    ...orderData,
                    razorpayOrderId: razorpayOrder.id,
                    isBuyNow
                };

                return res.status(200).json({
                    success: true,
                    razorpayOrderId: razorpayOrder.id,
                    amount: orderData.finalAmount * 100,
                    currency: 'INR',
                    message: 'Razorpay order created successfully'
                });
            } catch (error) {
                console.error('Error creating Razorpay order:', error);
                const failedOrder = new Order({
                    ...orderData,
                    paymentStatus: 'Failed',
                    status: 'Payment Failed',
                    isVisibleToAdmin: false,
                    errorMessage: error.message
                });

                const savedOrder = await failedOrder.save();
                if (isBuyNow) delete req.session.buyNowOrder;

                return res.status(400).json({
                    success: false,
                    orderId: savedOrder.orderId,
                    message: `Razorpay payment failed: ${error.message}`
                });
            }
        }

        const isPaymentSuccessful = Math.random() > 0.3;

        if (!isPaymentSuccessful && paymentMethod !== 'Wallet') {
            const failedOrder = new Order({
                ...orderData,
                paymentStatus: 'Failed',
                status: 'Payment Failed',
                isVisibleToAdmin: false,
                errorMessage: 'Simulated payment failure'
            });

            const savedFailedOrder = await failedOrder.save();
            if (isBuyNow) delete req.session.buyNowOrder;

            return res.status(400).json({
                success: false,
                orderId: savedFailedOrder.orderId,
                message: 'Payment simulation failed. Order saved with failed status.'
            });
        }

        orderData.paymentStatus = paymentMethod === 'Wallet' ? 'Paid' : 'Pending';
        const order = new Order(orderData);
        const savedOrder = await order.save();

        for (const item of orderData.orderedItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { quantity: -item.quantity }
            });
        }

        if (orderData.couponCode) {
            await Coupon.findOneAndUpdate(
                { code: orderData.couponCode },
                {
                    $inc: { usedCount: 1 },
                    $push: { usersUsed: userId }
                }
            );
        }

        if (!isBuyNow) {
            await Cart.findOneAndDelete({ userId });
            delete req.session.appliedCoupon;
        }
        if (isBuyNow) delete req.session.buyNowOrder;

        res.status(200).json({
            success: true,
            orderId: savedOrder.orderId,
            message: 'Order placed successfully'
        });
    } catch (error) {
        console.error('Error in placeOrder:', error);

        const minimalFailedOrder = new Order({
            userId: req.session.user.id,
            paymentStatus: 'Failed',
            status: 'Payment Failed',
            isVisibleToAdmin: false,
            errorMessage: error.message,
            finalAmount: 0,
            totalPrice: 0,
            address: {
                addressType: 'Unknown',
                name: 'Error',
                city: 'Error',
                state: 'Error',
                pinCode: '000000',
                phone: '0000000000'
            }
        });

        const savedFailedOrder = await minimalFailedOrder.save();
        if (req.session.buyNowOrder) delete req.session.buyNowOrder;

        res.status(500).json({
            success: false,
            orderId: savedFailedOrder.orderId,
            message: `Failed to place order: ${error.message}`
        });
    }
};

const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        const userId = req.session.user.id;
        const pendingOrder = req.session.pendingOrder;
        const isBuyNow = pendingOrder?.isBuyNow || false;

        if (!pendingOrder || pendingOrder.razorpayOrderId !== razorpay_order_id) {
            const missingOrderData = {
                userId,
                paymentStatus: 'Failed',
                status: 'Payment Failed',
                isVisibleToAdmin: false,
                razorpayOrderId: razorpay_order_id,
                errorMessage: 'Invalid or missing pending order session data',
                finalAmount: 0,
                totalPrice: 0,
                address: {
                    addressType: 'Unknown',
                    name: 'Error',
                    city: 'Error',
                    state: 'Error',
                    pinCode: '000000',
                    phone: '0000000000'
                }
            };

            const failedOrder = new Order(missingOrderData);
            const savedOrder = await failedOrder.save();
            delete req.session.pendingOrder;
            if (isBuyNow) delete req.session.buyNowOrder;

            return res.status(400).json({
                success: false,
                orderId: savedOrder.orderId,
                message: 'Invalid or missing pending order data'
            });
        }

        const cart = isBuyNow ? null : await Cart.findOne({ userId });

        if (!isBuyNow && (!cart || pendingOrder.finalAmount !== cart.finalAmount)) {
            const failedOrder = new Order({
                ...pendingOrder,
                paymentStatus: 'Failed',
                status: 'Payment Failed',
                isVisibleToAdmin: false,
                razorpayOrderId: razorpay_order_id,
                errorMessage: 'Amount mismatch in pending order'
            });
            const savedOrder = await failedOrder.save();
            delete req.session.pendingOrder;

            return res.status(400).json({
                success: false,
                orderId: savedOrder.orderId,
                message: 'Amount mismatch detected. Order cancelled.'
            });
        }

        const isValidSignature = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);

        if (!isValidSignature) {
            const invalidSignatureData = {
                ...pendingOrder,
                paymentStatus: 'Failed',
                status: 'Payment Failed',
                isVisibleToAdmin: false,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                errorMessage: 'Invalid payment signature'
            };

            const failedOrder = new Order(invalidSignatureData);
            const savedOrder = await failedOrder.save();
            delete req.session.pendingOrder;
            if (isBuyNow) delete req.session.buyNowOrder;

            return res.status(400).json({
                success: false,
                orderId: savedOrder.orderId,
                message: 'Invalid payment signature. Order saved with failed status.'
            });
        }

        const successOrderData = {
            ...pendingOrder,
            paymentStatus: 'Paid',
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id
        };

        const order = new Order(successOrderData);
        const savedOrder = await order.save();

        if (savedOrder.orderedItems && savedOrder.orderedItems.length > 0) {
            for (const item of savedOrder.orderedItems) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { quantity: -item.quantity }
                });
            }
        }

        if (savedOrder.couponCode) {
            await Coupon.findOneAndUpdate(
                { code: savedOrder.couponCode },
                {
                    $inc: { usedCount: 1 },
                    $push: { usersUsed: userId }
                }
            );
        }

        if (!isBuyNow) {
            await Cart.findOneAndDelete({ userId });
            delete req.session.appliedCoupon;
        }
        delete req.session.pendingOrder;
        if (isBuyNow) delete req.session.buyNowOrder;

        res.status(200).json({
            success: true,
            orderId: savedOrder.orderId,
            message: 'Payment verified successfully'
        });
    } catch (error) {
        console.error('Error in verifyRazorpayPayment:', error);

        const minimalFailedOrder = new Order({
            userId: req.session.user.id,
            paymentStatus: 'Failed',
            status: 'Payment Failed',
            isVisibleToAdmin: false,
            razorpayOrderId: req.body.razorpay_order_id,
            errorMessage: `Verification error: ${error.message}`,
            finalAmount: 0,
            totalPrice: 0,
            address: {
                addressType: 'Unknown',
                name: 'Error',
                city: 'Error',
                state: 'Error',
                pinCode: '000000',
                phone: '0000000000'
            }
        });

        const savedFailedOrder = await minimalFailedOrder.save();
        delete req.session.pendingOrder;
        if (req.session.buyNowOrder) delete req.session.buyNowOrder;

        res.status(500).json({
            success: false,
            orderId: savedFailedOrder.orderId,
            message: `Failed to verify payment: ${error.message}`
        });
    }
};

const getOrderSuccessPage = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const order = await Order.findOne({ orderId })
            .populate('orderedItems.product');

        if (!order) {
            return res.status(404).render('user/page-404');
        }

        res.render('user/order-success', {
            order,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error in getOrderSuccessPage:', error);
        res.status(500).render('user/page-500');
    }
};

const getOrderFailurePage = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const pendingOrder = req.session.pendingOrder || {};
        const order = await Order.findOne({ orderId })
            .populate('orderedItems.product');

        delete req.session.buyNowOrder; // Clear buy-now session

        res.render('user/order-failure', {
            order: order || { orderId: orderId || 'N/A' },
            pendingOrder,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error in getOrderFailurePage:', error);
        res.status(500).render('user/page-500');
    }
};

const clearSession = async (req, res) => {
    try {
        delete req.session.pendingOrder;
        delete req.session.appliedCoupon;
        delete req.session.buyNowOrder;
        res.status(200).json({ success: true, message: 'Session cleared' });
    } catch (error) {
        console.error('Error clearing session:', error);
        res.status(500).json({ success: false, message: 'Failed to clear session' });
    }
};

module.exports = {
    getCheckoutPage,
    placeOrder,
    verifyRazorpayPayment,
    getOrderSuccessPage,
    getOrderFailurePage,
    clearSession
};