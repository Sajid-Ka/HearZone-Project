// orderController.js
const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const getOrderList = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const searchQuery = req.query.query || '';

        const orders = await Order.find({ userId })
            .populate('orderedItems.product')
            .sort({ createdAt: -1 });

        // Ensure orders is always an array
        res.render('user/orders', {
            orders: orders || [],
            user: req.session.user,
            searchQuery,
            currentRoute: '/orders'
        });
    } catch (error) {
        console.error('Error in getOrderList:', error);
        res.status(500).render('user/page-500');
    }
};

const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findOne({ orderId, userId: req.session.user.id })
            .populate('orderedItems.product');

        if (!order) {
            return res.status(404).render('user/page-404');
        }

        res.render('user/order-details', {
            order,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error in getOrderDetails:', error);
        res.status(500).render('user/page-500');
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        const order = await Order.findOne({ orderId, userId: req.session.user.id });

        if (!order || order.status === 'Delivered' || order.status === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'Cannot cancel this order' });
        }

        order.status = 'Cancelled';
        order.cancellationReason = reason || 'Not specified';

        // Restore stock
        for (const item of order.orderedItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { quantity: item.quantity }
            });
        }

        await order.save();
        res.status(200).json({ success: true, message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Error in cancelOrder:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel order' });
    }
};

const returnOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        
        if (!reason) {
            return res.status(400).json({ success: false, message: 'Return reason is required' });
        }

        const order = await Order.findOne({ orderId, userId: req.session.user.id });

        if (!order || order.status !== 'Delivered') {
            return res.status(400).json({ success: false, message: 'Cannot return this order' });
        }

        order.status = 'Return Request';
        order.returnReason = reason;
        await order.save();

        res.status(200).json({ success: true, message: 'Return request submitted successfully' });
    } catch (error) {
        console.error('Error in returnOrder:', error);
        res.status(500).json({ success: false, message: 'Failed to request return' });
    }
};


const downloadInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findOne({ orderId, userId: req.session.user.id })
            .populate('orderedItems.product');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        const doc = new PDFDocument();
        const fileName = `invoice_${order.orderId}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/pdf');

        doc.pipe(res);

        doc.fontSize(20).text('Invoice', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Order ID: ${order.orderId}`);
        doc.text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}`);
        doc.text(`Customer: ${order.address.name}`);
        doc.moveDown();

        doc.text('Items:', { underline: true });
        order.orderedItems.forEach(item => {
            doc.text(`${item.product.productName} - Qty: ${item.quantity} - ₹${item.price * item.quantity}`);
        });

        doc.moveDown();
        doc.text(`Subtotal: ₹${order.totalPrice}`);
        doc.text(`Discount: -₹${order.discount}`);
        doc.text(`Taxes: ₹${order.taxes}`);
        doc.text(`Shipping: ₹${order.shippingCost}`);
        doc.text(`Total: ₹${order.finalAmount}`, { bold: true });

        doc.end();
    } catch (error) {
        console.error('Error in downloadInvoice:', error);
        res.status(500).send('Failed to generate invoice');
    }
};


const searchOrders = async (req, res) => {
    try {
        const { query } = req.query;
        const userId = req.session.user.id;
        
        const orders = await Order.find({
            userId,
            $or: [
                { orderId: { $regex: query, $options: 'i' } },
                { 'address.name': { $regex: query, $options: 'i' } }
            ]
        }).populate('orderedItems.product');

        res.render('user/orders', {
            orders,
            user: req.session.user,
            searchQuery:query,
        });
    } catch (error) {
        console.error('Error in searchOrders:', error);
        res.status(500).render('user/page-500');
    }
};

module.exports = {
    getOrderList,
    getOrderDetails,
    cancelOrder,
    returnOrder,
    downloadInvoice,
    searchOrders
};