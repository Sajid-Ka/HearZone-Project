const Address = require('../../models/addressSchema');
const Cart = require('../../models/cartSchema');
const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const getCheckoutPage = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        const addresses = await Address.findOne({ userId });

        if (!cart || !cart.items.length) {
            return res.redirect('/cart');
        }

        for (const item of cart.items) {
            if (item.quantity > item.productId.quantity) {
                if (req.headers.accept.includes('application/json')) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Insufficient stock for ${item.productId.productName}` 
                    });
                } else {
                    return res.redirect('/cart');
                }
            }
        }

        res.render('user/checkout', {
            cart,
            addresses: addresses ? addresses.addresses : [],
            subTotal: cart.subTotal,
            discountAmount: cart.discountAmount,
            finalAmount: cart.finalAmount,
            user: req.session.user,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID
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
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error('Razorpay API keys are not configured');
        }
        const options = {
            amount: amount * 100, // Razorpay expects amount in paise
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
        const selectedAddress = addressDoc.addresses.id(addressId);

        if (!cart || !selectedAddress) {
            return res.status(400).json({ success: false, message: 'Invalid cart or address' });
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

        const orderData = {
            userId,
            orderedItems: cart.items.map(item => ({
                product: item.productId._id,
                quantity: item.quantity,
                price: item.price,
                subTotal: item.price * item.quantity 
            })),
            totalPrice: cart.subTotal,
            discount: cart.discountAmount,
            taxes: 0,
            shippingCost: 0,
            finalAmount: cart.finalAmount,
            address: selectedAddress,
            paymentMethod,
            paymentStatus: paymentMethod === 'Razorpay' ? 'Pending' : 'Pending',
            status: 'Pending'
        };

        if (paymentMethod === 'Razorpay') {
            let razorpayOrder;
            // Check if there's a pending order in session for retry
            if (req.session.pendingOrder && req.session.pendingOrder.razorpayOrderId) {
                razorpayOrder = { id: req.session.pendingOrder.razorpayOrderId };
            } else {
                razorpayOrder = await createRazorpayOrder(cart.finalAmount);
            }
            
            // Store orderData in session
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
        } else {
            const order = new Order(orderData);
            await order.save();

            // Update product stock for COD
            for (const item of cart.items) {
                await Product.findByIdAndUpdate(item.productId._id, {
                    $inc: { quantity: -item.quantity }
                });
            }

            await Cart.findOneAndDelete({ userId }); // Clear cart after order

            res.status(200).json({ 
                success: true, 
                orderId: order.orderId,
                message: 'Order placed successfully' 
            });
        }
    } catch (error) {
        console.error('Error in placeOrder:', error);
        res.status(500).json({ success: false, message: `Failed to place order: ${error.message}` });
    }
};


const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        const userId = req.session.user.id;
        const pendingOrder = req.session.pendingOrder;

        if (!pendingOrder || pendingOrder.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({ success: false, message: 'Invalid or missing pending order' });
        }

        const isValidSignature = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
        if (!isValidSignature) {
            // Clear pending order from session
            delete req.session.pendingOrder;
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        // Create and save the order
        const order = new Order({
            ...pendingOrder,
            paymentStatus: 'Paid',
            razorpayPaymentId: razorpay_payment_id
        });
        await order.save();

        // Update product stock
        for (const item of order.orderedItems) {
            await Product.findByIdAndUpdate(item.product._id, {
                $inc: { quantity: -item.quantity }
            });
        }

        await Cart.findOneAndDelete({ userId }); // Clear cart after successful payment

        // Clear pending order from session
        delete req.session.pendingOrder;

        res.status(200).json({ 
            success: true, 
            orderId: order.orderId, 
            message: 'Payment verified successfully' 
        });
    } catch (error) {
        console.error('Error in verifyRazorpayPayment:', error);
        res.status(500).json({ success: false, message: 'Failed to verify payment' });
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
        const pendingOrder = req.session.pendingOrder || {}; // Get pending order from session
        const order = await Order.findOne({ orderId }).populate('orderedItems.product');
        
        res.render('user/order-failure', {
            order: order || { orderId: orderId || 'N/A' },
            pendingOrder, // Pass pending order details
            user: req.session.user
        });
    } catch (error) {
        console.error('Error in getOrderFailurePage:', error);
        res.status(500).render('user/page-500');
    }
};

module.exports = {
    getCheckoutPage,
    placeOrder,
    verifyRazorpayPayment,
    getOrderSuccessPage,
    getOrderFailurePage
};