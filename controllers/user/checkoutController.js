const Address = require('../../models/addressSchema');
const Cart = require('../../models/cartSchema');
const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const Coupon = require('../../models/couponSchema');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// In your checkout controller (placeOrder function or getCheckoutPage)

const getCheckoutPage = async (req, res) => {
    try {
        const userId = req.session.user.id;
        delete req.session.pendingOrder;

        const cart = await Cart.findOne({ userId }).populate({
            path: 'items.productId',
            populate: [
                { path: 'category', select: 'name isListed offer' },
                { path: 'offer' }
            ]
        });

        const addressDoc = await Address.findOne({ userId });
        const coupons = await Coupon.find({ 
            isActive: true,
            expiryDate: { $gte: new Date() },
            $expr: { $lt: ["$usedCount", "$usageLimit"] },
            usersUsed: { $nin: [userId] }
        });

        if (!cart || !cart.items.length) {
            return res.redirect('/cart');
        }

        // Calculate regular total and discount amounts for each item
        let regularSubTotal = 0;
        let discountAmount = 0;
        let itemsWithPrices = [];

        for (const item of cart.items) {
            const product = item.productId;
            
            // Calculate regular price total for this item
            const regularPriceTotal = product.regularPrice * item.quantity;
            regularSubTotal += regularPriceTotal;

            // Calculate best offer (product or category)
            let productOfferValue = 0;
            let categoryOfferValue = 0;
            let finalOfferValue = 0;
            let offerType = null;

            // Check product offer
            if (product.offer && new Date(product.offer.endDate) > new Date()) {
                productOfferValue = product.offer.discountType === 'percentage' 
                    ? product.offer.discountValue 
                    : (product.offer.discountValue / product.regularPrice) * 100;
            }

            // Check category offer
            if (product.category?.offer?.isActive && new Date(product.category.offer.endDate) > new Date()) {
                categoryOfferValue = product.category.offer.percentage;
            }

            // Determine which offer to apply (the bigger one)
            if (productOfferValue > 0 || categoryOfferValue > 0) {
                if (productOfferValue >= categoryOfferValue) {
                    finalOfferValue = productOfferValue;
                    offerType = 'product';
                } else {
                    finalOfferValue = categoryOfferValue;
                    offerType = 'category';
                }
            }

            // Calculate sale price and discount amount
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

        // Calculate final amounts
        const couponDiscount = cart.discountAmount || 0;
        const shippingCost = 0; // You can change this if you add shipping later
        const finalAmount = regularSubTotal - discountAmount - couponDiscount - shippingCost;

        res.render('user/checkout', {
            cart: {
                ...cart.toObject(),
                items: itemsWithPrices
            },
            addresses: addressDoc ? addressDoc.addresses : [],
            regularSubTotal,
            discountAmount,
            couponDiscount,
            shippingCost,
            finalAmount,
            user: req.session.user,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            appliedCoupon: req.session.appliedCoupon,
            availableCoupons: coupons
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
        
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        const addressDoc = await Address.findOne({ userId });
        
        if (!cart) {
            return res.status(400).json({ success: false, message: 'Cart not found' });
        }
        
        if (!addressDoc) {
            return res.status(400).json({ success: false, message: 'Address not found' });
        }

        const selectedAddress = addressDoc.addresses.id(addressId);
        
        if (!selectedAddress) {
            return res.status(400).json({ success: false, message: 'Selected address not found' });
        }

        // Check stock availability
        for (const item of cart.items) {
            if (item.quantity > item.productId.quantity) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Insufficient stock for ${item.productId.productName}` 
                });
            }
        }
        
        // Prepare order data
        const orderData = {
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
            discount: cart.discountAmount || 0,
            taxes: 0,
            shippingCost: 0,
            finalAmount: cart.finalAmount || cart.subTotal,
            address: selectedAddress,
            paymentMethod,
            paymentStatus: 'Pending',
            status: 'Pending',
            isVisibleToAdmin: true,
            couponApplied: !!cart.couponCode,
            couponCode: cart.couponCode
        };

        if (paymentMethod === 'Razorpay') {
            try {
                // Always create a new Razorpay order
                const razorpayOrder = await createRazorpayOrder(cart.finalAmount);
                
                // Store in session for payment processing
                req.session.pendingOrder = {
                    ...orderData,
                    razorpayOrderId: razorpayOrder.id
                };
        
                return res.status(200).json({
                    success: true,
                    razorpayOrderId: razorpayOrder.id,
                    amount: cart.finalAmount * 100,
                    currency: 'INR',
                    message: 'Razorpay order created successfully'
                });
            } catch (error) {
                console.error('Error creating Razorpay order:', error);
                
                // Create a failed payment order explicitly
                const failedOrder = new Order({
                    ...orderData,
                    paymentStatus: 'Failed',
                    status: 'Payment Failed',
                    isVisibleToAdmin: false,
                    errorMessage: error.message
                });
                
                const savedOrder = await failedOrder.save();
                
                return res.status(400).json({ 
                    success: false, 
                    orderId: savedOrder.orderId,
                    message: `Razorpay payment failed: ${error.message}` 
                });
            }
        } else {
            // For COD and other methods, simulate payment failure 30% of the time
            const isPaymentSuccessful = Math.random() > 0.3;

            if (!isPaymentSuccessful) {
                // Create order with failed payment status
                const failedOrder = new Order({
                    ...orderData,
                    paymentStatus: 'Failed',
                    status: 'Payment Failed',
                    isVisibleToAdmin: false,
                    errorMessage: 'Simulated payment failure'
                });
                
                // Save the failed order
                try {
                    const savedFailedOrder = await failedOrder.save();
                    
                    return res.status(400).json({ 
                        success: false, 
                        orderId: savedFailedOrder.orderId,
                        message: 'Payment simulation failed. Order saved with failed status.' 
                    });
                } catch (saveError) {
                    console.error('Error saving failed order:', saveError);
                    return res.status(500).json({ 
                        success: false, 
                        message: `Failed to save failed order: ${saveError.message}` 
                    });
                }
            }

            // For successful payment
            orderData.paymentStatus = 'Pending'; // For COD, payment is pending until delivery
            const order = new Order(orderData);
            const savedOrder = await order.save();

            // Update product stock for successful payment
            for (const item of cart.items) {
                await Product.findByIdAndUpdate(item.productId._id, {
                    $inc: { quantity: -item.quantity }
                });
            }

            // Update coupon usage if applied
            if (cart.couponCode) {
                await Coupon.findOneAndUpdate(
                    { code: cart.couponCode },
                    { 
                        $inc: { usedCount: 1 },
                        $push: { usersUsed: userId }
                    }
                );
            }

            await Cart.findOneAndDelete({ userId });
            delete req.session.appliedCoupon;

            res.status(200).json({ 
                success: true, 
                orderId: savedOrder.orderId,
                message: 'Order placed successfully' 
            });
        }
    } catch (error) {
        console.error('Error in placeOrder:', error);

        // Create a minimal order with failed status
        try {
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
            
            res.status(500).json({ 
                success: false, 
                orderId: savedFailedOrder.orderId,
                message: `Failed to place order: ${error.message}` 
            });
        } catch (saveError) {
            console.error('Error saving minimal failed order:', saveError);
            res.status(500).json({ 
                success: false, 
                message: `Critical error: Could not save order record: ${saveError.message}` 
            });
        }
    }
};

const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        const userId = req.session.user.id;
        const pendingOrder = req.session.pendingOrder;

        // Validate pendingOrder
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

            return res.status(400).json({ 
                success: false, 
                orderId: savedOrder.orderId, 
                message: 'Invalid or missing pending order data' 
            });
        }

        // Verify the amount matches
        const cart = await Cart.findOne({ userId });
        if (pendingOrder.finalAmount !== cart.finalAmount) {
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

        // Verify payment signature
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

            return res.status(400).json({ 
                success: false, 
                orderId: savedOrder.orderId, 
                message: 'Invalid payment signature. Order saved with failed status.' 
            });
        }

        // Valid payment verified - success path
        const successOrderData = {
            ...pendingOrder,
            paymentStatus: 'Paid',
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id
        };
        
        const order = new Order(successOrderData);
        const savedOrder = await order.save();

        // Update product stock
        if (savedOrder.orderedItems && savedOrder.orderedItems.length > 0) {
            for (const item of savedOrder.orderedItems) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { quantity: -item.quantity }
                });
            }
        }

        // Update coupon usage if applied
        if (savedOrder.couponCode) {
            await Coupon.findOneAndUpdate(
                { code: savedOrder.couponCode },
                { 
                    $inc: { usedCount: 1 },
                    $push: { usersUsed: userId }
                }
            );
        }

        await Cart.findOneAndDelete({ userId });
        delete req.session.pendingOrder;
        delete req.session.appliedCoupon;

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
        const order = await Order.findOne({ orderId }).populate('orderedItems.product');
        
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
        const order = await Order.findOne({ orderId }).populate('orderedItems.product');
        
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