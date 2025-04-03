const Order = require('../../models/orderSchema');
const User = require('../../models/userSchema');
const Product = require('../../models/productSchema');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// List all orders with sorting, pagination, search and filters
const listOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const search = req.query.search || '';
        const statusFilter = req.query.status || '';
        const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : null;
        const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : null;

        let query = {};

        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { 'address.name': { $regex: search, $options: 'i' } },
                { 'address.city': { $regex: search, $options: 'i' } }
            ];
        }

        if (statusFilter) {
            query.status = statusFilter;
        }

        if (dateFrom && dateTo) {
            query.createdAt = { $gte: dateFrom, $lte: dateTo };
        } else if (dateFrom) {
            query.createdAt = { $gte: dateFrom };
        } else if (dateTo) {
            query.createdAt = { $lte: dateTo };
        }

        const [orders, count] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('userId', 'name email phone')
                .exec(),
            Order.countDocuments(query)
        ]);

        // Ensure orders is always an array, even if empty
        if (!orders || orders.length === 0) {
            return res.render('admin/orders', {
                orders: [],
                currentPage: page,
                totalPages: 0,
                search,
                statusFilter,
                dateFrom: dateFrom ? dateFrom.toISOString().split('T')[0] : '',
                dateTo: dateTo ? dateTo.toISOString().split('T')[0] : '',
                statuses: ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Return Request', 'Returned']
            });
        }

        const totalPages = Math.ceil(count / limit);

        res.render('admin/orders', {
            orders,
            currentPage: page,
            totalPages,
            search,
            statusFilter,
            dateFrom: dateFrom ? dateFrom.toISOString().split('T')[0] : '',
            dateTo: dateTo ? dateTo.toISOString().split('T')[0] : '',
            statuses: ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Return Request', 'Returned']
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.redirect('/admin/pageError');
    }
};


// View order details
const viewOrderDetails = async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId })
            .populate('userId', 'name email phone')
            .populate('orderedItems.product');

        if (!order) {
            return res.redirect('/admin/orders?error=Order not found');
        }

        res.render('admin/order-details', { order });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.redirect('/admin/pageError');
    }
};

// Update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findOne({ orderId });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // If status is changing to Delivered, update invoice date
        if (status === 'Delivered' && order.status !== 'Delivered') {
            order.invoiceDate = new Date();
        }

        // If status is changing to Cancelled, restore product stock
        if (status === 'Cancelled' && order.status !== 'Cancelled') {
            await restoreProductStock(order.orderedItems);
        }

        order.status = status;
        await order.save();

        res.json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Failed to update order status' });
    }
};

// Process return request
const processReturnRequest = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { action } = req.body; // 'approve' or 'reject'

        const order = await Order.findOne({ orderId }).populate('userId');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status !== 'Return Request') {
            return res.status(400).json({ success: false, message: 'Order is not in return request status' });
        }

        if (action === 'approve') {
            // Refund amount to user's wallet
            const user = await User.findById(order.userId._id);
            if (!user.wallet) {
                user.wallet = { balance: 0, transactions: [] };
            }
            
            user.wallet.balance += order.finalAmount;
            user.wallet.transactions.push({
                amount: order.finalAmount,
                type: 'credit',
                description: `Refund for order ${order.orderId}`,
                date: new Date()
            });

            await user.save();

            // Restore product stock
            await restoreProductStock(order.orderedItems);

            order.status = 'Returned';
            await order.save();

            return res.json({ 
                success: true, 
                message: 'Return approved and amount refunded to wallet' 
            });
        } else if (action === 'reject') {
            order.status = 'Delivered';
            await order.save();

            return res.json({ 
                success: true, 
                message: 'Return request rejected' 
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid action' 
            });
        }
    } catch (error) {
        console.error('Error processing return request:', error);
        res.status(500).json({ success: false, message: 'Failed to process return request' });
    }
};

// Generate and download invoice
const downloadInvoice = async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId })
            .populate('userId', 'name email phone')
            .populate('orderedItems.product');

        if (!order) {
            return res.redirect('/admin/orders?error=Order not found');
        }

        const doc = new PDFDocument({ margin: 50 });
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${order.orderId}.pdf`);

        // Pipe the PDF to response
        doc.pipe(res);

        // Add invoice header
        generateInvoiceHeader(doc, order);
        
        // Add customer information
        generateCustomerInformation(doc, order);
        
        // Add invoice content
        generateInvoiceTable(doc, order);
        
        // Add footer
        generateFooter(doc);

        // Finalize the PDF
        doc.end();
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.redirect('/admin/orders?error=Failed to generate invoice');
    }
};

// Helper function to restore product stock
const restoreProductStock = async (orderedItems) => {
    const bulkOps = orderedItems.map(item => ({
        updateOne: {
            filter: { _id: item.product },
            update: { $inc: { quantity: item.quantity } }
        }
    }));

    if (bulkOps.length > 0) {
        await Product.bulkWrite(bulkOps);
    }
};


// Helper functions for PDF generation
function generateInvoiceHeader(doc, order) {
    doc
        .fillColor('#444444')
        .fontSize(20)
        .text('INVOICE', 50, 50)
        .fontSize(10)
        .text(`Order ID: ${order.orderId}`, 50, 80)
        .text(`Invoice Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}`, 50, 95)
        .moveDown();
}


function generateCustomerInformation(doc, order) {
    doc
        .fillColor('#444444')
        .fontSize(20)
        .text('Bill To:', 50, 130)
        .fontSize(10)
        .text(order.userId.name, 50, 150)
        .text(order.userId.email, 50, 165)
        .text(order.userId.phone, 50, 180)
        .text(
            `${order.address.name}, ${order.address.landmark}, ${order.address.city}, ${order.address.state} - ${order.address.pinCode}`,
            50,
            195
        )
        .moveDown();
}

function generateInvoiceTable(doc, order) {
    let i;
    const invoiceTableTop = 250;

    doc.font('Helvetica-Bold');
    generateTableRow(
        doc,
        invoiceTableTop,
        'Item',
        'Unit Price',
        'Quantity',
        'Line Total'
    );
    generateHr(doc, invoiceTableTop + 20);
    doc.font('Helvetica');

    for (i = 0; i < order.orderedItems.length; i++) {
        const item = order.orderedItems[i];
        const position = invoiceTableTop + (i + 1) * 30;
        
        generateTableRow(
            doc,
            position,
            item.product.productName,
            `₹${item.price.toFixed(2)}`,
            item.quantity,
            `₹${(item.price * item.quantity).toFixed(2)}`
        );

        generateHr(doc, position + 20);
    }

    const subtotalPosition = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
        doc,
        subtotalPosition,
        '',
        '',
        'Subtotal',
        `₹${order.totalPrice.toFixed(2)}`
    );

    const discountPosition = subtotalPosition + 20;
    generateTableRow(
        doc,
        discountPosition,
        '',
        '',
        'Discount',
        `-₹${order.discount.toFixed(2)}`
    );

    const taxPosition = discountPosition + 20;
    generateTableRow(
        doc,
        taxPosition,
        '',
        '',
        'Tax',
        `₹${order.taxes.toFixed(2)}`
    );

    const shippingPosition = taxPosition + 20;
    generateTableRow(
        doc,
        shippingPosition,
        '',
        '',
        'Shipping',
        `₹${order.shippingCost.toFixed(2)}`
    );

    const totalPosition = shippingPosition + 20;
    doc.font('Helvetica-Bold');
    generateTableRow(
        doc,
        totalPosition,
        '',
        '',
        'Total',
        `₹${order.finalAmount.toFixed(2)}`
    );
    doc.font('Helvetica');
}

function generateTableRow(doc, y, item, unitPrice, quantity, lineTotal) {
    doc
        .fontSize(10)
        .text(item, 50, y)
        .text(unitPrice, 280, y, { width: 90, align: 'right' })
        .text(quantity, 370, y, { width: 90, align: 'right' })
        .text(lineTotal, 0, y, { align: 'right' });
}

function generateHr(doc, y) {
    doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

function generateFooter(doc) {
    doc
        .fontSize(10)
        .text('Thank you for shopping with us.', 50, 700, {
            align: 'center',
            width: 500
        });
}

const getOrderStatusTimeline = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findOne({ orderId });
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Get all status changes from the order's updatedAt timestamps
        const statusTimeline = [];
        if (order.createdAt) {
            statusTimeline.push({
                status: 'Created',
                date: order.createdAt,
                description: 'Order was placed'
            });
        }

        // Add other status changes if they exist in the order history
        if (order.updatedAt && order.status !== 'Pending') {
            statusTimeline.push({
                status: order.status,
                date: order.updatedAt,
                description: `Order status changed to ${order.status}`
            });
        }

        // Sort by date
        statusTimeline.sort((a, b) => a.date - b.date);

        res.json({ 
            success: true, 
            timeline: statusTimeline 
        });
    } catch (error) {
        console.error('Error fetching order timeline:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch order timeline' 
        });
    }
};

// Add this new function for bulk status update
const bulkUpdateStatus = async (req, res) => {
    try {
        const { orderIds, status } = req.body;
        
        if (!orderIds || !orderIds.length || !status) {
            return res.status(400).json({ 
                success: false, 
                message: 'Order IDs and status are required' 
            });
        }

        // Validate status
        const validStatuses = [
            'Pending', 'Processing', 'Shipped', 
            'Out for Delivery', 'Delivered', 'Cancelled'
        ];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status' 
            });
        }

        // Update all orders
        const result = await Order.updateMany(
            { orderId: { $in: orderIds } },
            { $set: { status } }
        );

        res.json({ 
            success: true, 
            message: `Updated ${result.nModified} orders to ${status}` 
        });
    } catch (error) {
        console.error('Error in bulk status update:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update orders' 
        });
    }
};

// Update module.exports at the bottom to include new functions
module.exports = {
    listOrders,
    viewOrderDetails,
    updateOrderStatus,
    processReturnRequest,
    downloadInvoice,
    getOrderStatusTimeline,
    bulkUpdateStatus
};