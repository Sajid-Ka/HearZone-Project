// checkoutController.js
const Address = require('../../models/addressSchema');
const Cart = require('../../models/cartSchema');
const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');

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
            user: req.session.user
        });
    } catch (error) {
        console.error('Error in getCheckoutPage:', error);
        res.status(500).render('user/page-500');
    }
};

const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { addressId } = req.body;
        
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

        const order = new Order({
            userId,
            orderedItems: cart.items.map(item => ({
                product: item.productId._id,
                quantity: item.quantity,
                price: item.price
            })),
            totalPrice: cart.subTotal,
            discount: cart.discountAmount,
            taxes: 0, // Add tax calculation logic if needed
            shippingCost: 50, // Example shipping cost
            finalAmount: cart.finalAmount + 50, // Include shipping
            address: selectedAddress,
            paymentMethod: 'Cash on Delivery',
            status: 'Pending'
        });

        // Update product stock
        for (const item of cart.items) {
            await Product.findByIdAndUpdate(item.productId._id, {
                $inc: { quantity: -item.quantity }
            });
        }

        await order.save();
        await Cart.findOneAndDelete({ userId }); // Clear cart after order

        res.status(200).json({ 
            success: true, 
            orderId: order.orderId,
            message: 'Order placed successfully' 
        });
    } catch (error) {
        console.error('Error in placeOrder:', error);
        res.status(500).json({ success: false, message: 'Failed to place order' });
    }
};

const getOrderSuccessPage = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const order = await Order.findOne({ orderId }).populate('orderedItems.product');
        
        res.render('user/order-success', {
            order,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error in getOrderSuccessPage:', error);
        res.status(500).render('user/page-500');
    }
};

module.exports = {
    getCheckoutPage,
    placeOrder,
    getOrderSuccessPage
};