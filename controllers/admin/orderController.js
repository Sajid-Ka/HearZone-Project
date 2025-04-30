const Order = require('../../models/orderSchema');
const User = require('../../models/userSchema');
const Product = require('../../models/productSchema');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');



const generateHr = (doc, y) => {
    doc.strokeColor('#aaaaaa')
       .lineWidth(1)
       .moveTo(50, y)
       .lineTo(550, y)
       .stroke();
};

const generateTableRow = (doc, y, item, unitPrice, quantity, lineTotal) => {
    doc.fontSize(10)
       .text(item, 50, y)
       .text(unitPrice, 280, y, { width: 90, align: 'right' })
       .text(quantity, 370, y, { width: 90, align: 'right' })
       .text(lineTotal, 0, y, { align: 'right' });
};

const generateFooter = (doc) => {
    doc.fontSize(10)
       .text('Thank you for shopping with us.', 50, 700, {
           align: 'center',
           width: 500
       });
};

const generateTableHeader = (doc, y) => {
    doc.font('Helvetica-Bold')
       .fontSize(10)
       .text('Item', 50, y)
       .text('Unit Price', 280, y, { width: 90, align: 'right' })
       .text('Qty', 370, y, { width: 90, align: 'right' })
       .text('Line Total', 0, y, { align: 'right' });
    
    generateHr(doc, y + 20);
};

const generateTotalRow = (doc, y, label, value) => {
    doc.fontSize(10)
       .text(label, 50, y)
       .text(value, 0, y, { align: 'right' });
};

const generateItemsTable = (doc, order, y) => {
    let i;
    const tableTop = y + 30;
    
    for (i = 0; i < order.orderedItems.length; i++) {
        const item = order.orderedItems[i];
        const position = tableTop + (i * 30);
        
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
    
    // Totals
    const subtotalPosition = tableTop + (i * 30);
    generateTotalRow(doc, subtotalPosition, 'Subtotal', `₹${order.totalPrice.toFixed(2)}`);
    
    const discountPosition = subtotalPosition + 20;
    generateTotalRow(doc, discountPosition, 'Discount', `-₹${order.discount.toFixed(2)}`);
    
    const taxPosition = discountPosition + 20;
    generateTotalRow(doc, taxPosition, 'Tax', `₹${order.taxes.toFixed(2)}`);
    
    const shippingPosition = taxPosition + 20;
    generateTotalRow(doc, shippingPosition, 'Shipping', `₹${order.shippingCost.toFixed(2)}`);
    
    const totalPosition = shippingPosition + 20;
    doc.font('Helvetica-Bold');
    generateTotalRow(doc, totalPosition, 'Total Amount', `₹${order.finalAmount.toFixed(2)}`);
    doc.font('Helvetica');
};

const generateInvoice = async (req, order, res, isAdmin = false) => {
    try {
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `invoice_${order.orderId}.pdf`;

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/pdf');

        doc.pipe(res);

        // Header (without logo)
        doc.fillColor('#444444')
           .fontSize(20)
           .text('INVOICE', 50, 50, { align: 'right' })
           .fontSize(10)
           .text(`Invoice #: ${order.orderId}`, 50, 80, { align: 'right' })
           .text(`Invoice Date: ${order.invoiceDate?.toLocaleDateString() || new Date().toLocaleDateString()}`, 50, 95, { align: 'right' })
           .moveDown();

        // Customer Information
        const customer = isAdmin ? order.userId : req.session.user;
        const shippingAddress = order.address;

        doc.fillColor('#444444')
           .fontSize(14)
           .text('Bill To:', 50, 130)
           .fontSize(10)
           .text(customer.name, 50, 150)
           .text(shippingAddress.landmark, 50, 165)
           .text(`${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pinCode}`, 50, 180)
           .text(`Phone: ${shippingAddress.phone}`, 50, 195)
           .moveDown();

        // Items Table
        const invoiceTableTop = 250;

        generateTableHeader(doc, invoiceTableTop);
        generateItemsTable(doc, order, invoiceTableTop);

        // Footer
        generateFooter(doc, order);

        doc.end();
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).send('Failed to generate invoice');
    }
};





// List all orders with sorting, pagination, search and filters
const listOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        let search = req.query.search || '';
        const statusFilter = req.query.status || '';
        const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : null;
        const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : null;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        let query = {};

        if (search) {

            if (search.startsWith('Order #')) {
                search = search.replace('Order #', '').trim();
            }else if(search.startsWith('Order Details - #')){
                search = search.replace('Order Details - #', '').trim();
            }

            const searchRegex = new RegExp(search, 'i');
            const isPossibleUUID = search.length >= 8 && search.includes('-');
            query.$or = [
                { 
                    orderId: isPossibleUUID 
                        ? { $regex: search, $options: 'i' } 
                        : search 
                },
                { 'address.name': searchRegex },
                { 'address.city': searchRegex },
                { 'userId.name': searchRegex },
                { 'userId.email': searchRegex }
            ];
        }

        if (statusFilter) {
            query.status = statusFilter;
        }

        if (dateFrom && dateTo) {
            query.createdAt = { 
                $gte: new Date(dateFrom.setHours(0, 0, 0, 0)),
                $lte: new Date(dateTo.setHours(23, 59, 59, 999))
            };
        } else if (dateFrom) {
            query.createdAt = { 
                $gte: new Date(dateFrom.setHours(0, 0, 0, 0)) 
            };
        } else if (dateTo) {
            query.createdAt = { 
                $lte: new Date(dateTo.setHours(23, 59, 59, 999)) 
            };
        }

        const [orders, count] = await Promise.all([
            Order.find(query)
                .populate('userId', 'name email phone')
                .sort({ [sortBy]: sortOrder })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Order.countDocuments(query)
        ]);

        const statuses = [
            'Pending', 'Processing', 'Shipped', 
            'Out for Delivery', 'Delivered', 
            'Cancelled', 'Cancel Request', 
            'Return Request', 'Returned'
        ];

        const totalPages = Math.ceil(count / limit);

        res.render('admin/orders', {
            orders: orders || [],
            currentPage: page,
            totalPages,
            search,
            statusFilter,
            dateFrom: dateFrom ? dateFrom.toISOString().split('T')[0] : '',
            dateTo: dateTo ? dateTo.toISOString().split('T')[0] : '',
            statuses,
            sortBy,
            sortOrder
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


const trackStatusChange = async (order, newStatus, description, adminId) => {
    if (!order.statusHistory) {
        order.statusHistory = [];
    }
    
    order.statusHistory.push({
        status: newStatus,
        date: new Date(),
        description: description || `Status changed to ${newStatus}`,
        changedBy: adminId, // Now using passed parameter
        changedByModel: 'Admin'
    });
    
    await order.save();
};


const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findOne({ orderId })
            .populate('orderedItems.product');

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        // Ensure subTotal is calculated for all items
        order.orderedItems.forEach(item => {
            if (!item.subTotal) {
                item.subTotal = item.price * item.quantity;
            }
        });

        // Define terminal statuses that cannot be changed
        const terminalStatuses = ['Cancelled', 'Returned', 'Delivered'];
        if (terminalStatuses.includes(order.status)) {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot change status from ${order.status} as it is a final state`
            });
        }

        // Define valid status transitions
        const validTransitions = {
            'Pending': ['Processing', 'Cancelled'],
            'Processing': ['Shipped', 'Cancelled'],
            'Shipped': ['Out for Delivery', 'Cancelled'],
            'Out for Delivery': ['Delivered', 'Cancelled'],
            'Cancel Request': ['Cancelled', 'Processing'],
            'Return Request': ['Returned', 'Delivered']
        };

        // Check if the transition is valid
        if (!validTransitions[order.status] || !validTransitions[order.status].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid status transition from ${order.status} to ${status}`
            });
        }

        // Special handling for Delivered status
        if (status === 'Delivered' && order.status !== 'Delivered') {
            order.invoiceDate = new Date();
            await trackStatusChange(
                order, 
                'Delivered', 
                'Order delivered to customer'
            );
        }

        // Special handling for Cancelled status
        if (status === 'Cancelled') {
            await restoreProductStock(order.orderedItems);
            await trackStatusChange(
                order, 
                'Delivered', 
                'Order delivered to customer',
                req.admin._id 
            );
        }

        order.status = status;
        await order.save();

        res.json({ 
            success: true, 
            message: 'Order status updated successfully' 
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update order status' 
        });
    }
};



const processReturnRequest = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { action } = req.body;

        const order = await Order.findOne({ orderId })
            .populate('userId')
            .populate('orderedItems.product');

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        if (order.status !== 'Return Request') {
            return res.status(400).json({ 
                success: false, 
                message: 'Order is not in return request status' 
            });
        }

        if (action === 'approve') {
            const user = await User.findById(order.userId._id);
            if (!user) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'User not found' 
                });
            }

            if (!user.wallet) {
                user.wallet = { balance: 0, transactions: [] };
            }

            const refundAmount = order.finalAmount;
            user.wallet.balance += refundAmount;
            user.wallet.transactions.push({
                amount: refundAmount,
                type: 'credit',
                description: `Refund for order ${order.orderId}`,
                date: new Date()
            });

            await restoreProductStock(order.orderedItems);

            order.status = 'Returned';
            order.returnReason = null;
            await trackStatusChange(
                order, 
                'Returned', 
                `Return approved. Amount ₹${refundAmount} refunded to wallet`,
                req.admin._id
            );
            
            await Promise.all([user.save(), order.save()]);

            return res.json({ 
                success: true, 
                message: 'Return approved and amount refunded to wallet' 
            });
        } else if (action === 'reject') {
            order.status = 'Delivered';
            order.returnReason = null;
            await trackStatusChange(
                order, 
                'Delivered', 
                'Return request rejected by admin',
                req.admin._id
            );
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
        res.status(500).json({ 
            success: false, 
            message: 'Failed to process return request' 
        });
    }
};


// Generate and download invoice
const downloadInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;
        const isAdmin = req.path.includes('/admin/');
        
        const query = { orderId };
        if (!isAdmin) {
            query.userId = req.session.user.id;
        }
        
        const order = await Order.findOne(query)
            .populate('userId')
            .populate('orderedItems.product');
        
        if (!order) {
            return res.status(404).send('Order not found');
        }
        
        await generateInvoice(req, order, res, isAdmin);

    } catch (error) {
        console.error('Error in downloadInvoice:', error);
        res.status(500).send('Failed to generate invoice');
    }
};


const processCancelRequest = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { action } = req.body; // 'approve' or 'reject'

        const order = await Order.findOne({ orderId });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status !== 'Cancel Request') {
            return res.status(400).json({ success: false, message: 'Order is not in cancel request status' });
        }

        if (action === 'approve') {
            order.status = 'Cancelled';
            await restoreProductStock(order.orderedItems);
            await order.save();
            return res.json({ success: true, message: 'Cancellation approved' });
        } else if (action === 'reject') {
            order.status = 'Pending'; // Or revert to previous status if tracked
            await order.save();
            return res.json({ success: true, message: 'Cancellation request rejected' });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        } // Removed the erroneous .Concurrent line
    } catch (error) {
        console.error('Error processing cancel request:', error);
        res.status(500).json({ success: false, message: 'Failed to process cancel request' });
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



module.exports = {
    listOrders,
    viewOrderDetails,
    updateOrderStatus,
    processReturnRequest,
    processCancelRequest, 
    downloadInvoice,
    getOrderStatusTimeline,
    generateInvoice,
};