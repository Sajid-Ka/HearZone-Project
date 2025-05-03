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

        doc.fillColor('#444444')
           .fontSize(20)
           .text('INVOICE', 50, 50, { align: 'right' })
           .fontSize(10)
           .text(`Invoice #: ${order.orderId}`, 50, 80, { align: 'right' })
           .text(`Invoice Date: ${order.invoiceDate?.toLocaleDateString() || new Date().toLocaleDateString()}`, 50, 95, { align: 'right' })
           .moveDown();

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

        const invoiceTableTop = 250;
        generateTableHeader(doc, invoiceTableTop);
        generateItemsTable(doc, order, invoiceTableTop);
        generateFooter(doc);

        doc.end();
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).send('Failed to generate invoice');
    }
};

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
            } else if(search.startsWith('Order Details - #')) {
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
            'Pending', 'Shipped', 'Delivered', 
            'Cancel Request', 'Cancelled', 
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
        changedBy: adminId,
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

        order.orderedItems.forEach(item => {
            if (!item.subTotal) {
                item.subTotal = item.price * item.quantity;
            }
        });

        const terminalStatuses = ['Cancelled', 'Returned', 'Delivered'];
        if (terminalStatuses.includes(order.status)) {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot change status from ${order.status} as it is a final state`
            });
        }

        const validTransitions = {
            'Pending': ['Shipped', 'Cancelled'],
            'Shipped': ['Delivered', 'Cancelled'],
            'Cancel Request': ['Cancelled', 'Pending'],
            'Return Request': ['Returned', 'Delivered']
        };

        if (!validTransitions[order.status] || !validTransitions[order.status].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid status transition from ${order.status} to ${status}`
            });
        }

        if (status === 'Delivered' && order.status !== 'Delivered') {
            order.invoiceDate = new Date();
            await trackStatusChange(
                order, 
                'Delivered', 
                'Order delivered to customer',
                req.admin._id
            );
        }

        if (status === 'Cancelled') {
            await restoreProductStock(order.orderedItems);
            await trackStatusChange(
                order, 
                'Cancelled', 
                'Order cancelled',
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

        if (order.status !== 'Cancel Request') {
            return res.status(400).json({ 
                success: false, 
                message: 'Order is not in cancel request status' 
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

            let refundMessage = '';
            if (order.paymentMethod === 'Cash on Delivery') {
                refundMessage = 'Cancellation approved for Cash on Delivery order. No refund processed as no payment was made.';
            } else {
                if (!user.wallet) {
                    user.wallet = { balance: 0, transactions: [] };
                }

                const refundAmount = order.finalAmount;
                user.wallet.balance += refundAmount;
                user.wallet.transactions.push({
                    amount: refundAmount,
                    type: 'credit',
                    description: `Refund for cancelled order ${order.orderId}`,
                    date: new Date()
                });

                refundMessage = `Cancellation approved. Amount ₹${refundAmount} refunded to wallet.`;
                await user.save();
            }

            await restoreProductStock(order.orderedItems);

            order.status = 'Cancelled';
            order.cancellationReason = null;

            await trackStatusChange(
                order, 
                'Cancelled', 
                refundMessage,
                req.admin._id
            );

            await order.save();

            return res.json({ 
                success: true, 
                message: refundMessage,
                newStatus: 'Cancelled'
            });
        } else if (action === 'reject') {
            const previousStatus = order.statusHistory.length > 1 
                ? order.statusHistory[order.statusHistory.length - 2].status 
                : 'Pending';
            
            order.status = previousStatus;
            order.cancellationReason = null;

            await trackStatusChange(
                order, 
                previousStatus, 
                'Cancellation request rejected by admin',
                req.admin._id
            );

            await order.save();

            return res.json({ 
                success: true, 
                message: 'Cancellation request rejected',
                newStatus: previousStatus
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid action' 
            });
        }
    } catch (error) {
        console.error('Error processing cancel request:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to process cancel request' 
        });
    }
};

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

const getOrderStatusTimeline = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findOne({ orderId });
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const statusTimeline = order.statusHistory.map(entry => ({
            status: entry.status,
            date: entry.date,
            description: entry.description
        }));

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


const processCancelItemRequest = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { itemIndex, action } = req.body;
        const order = await Order.findOne({ orderId })
            .populate('userId')
            .populate('orderedItems.product');

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        const item = order.orderedItems[itemIndex];
        if (!item) {
            return res.status(400).json({ 
                success: false, 
                message: 'Item not found' 
            });
        }

        if (item.cancellationStatus !== 'Cancel Request') {
            return res.status(400).json({ 
                success: false, 
                message: 'Item is not in cancel request status' 
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

            let refundMessage = '';
            if (order.paymentMethod !== 'Cash on Delivery') {
                if (!user.wallet) {
                    user.wallet = { balance: 0, transactions: [] };
                }

                const refundAmount = item.price * item.quantity;
                user.wallet.balance += refundAmount;
                user.wallet.transactions.push({
                    amount: refundAmount,
                    type: 'credit',
                    description: `Refund for cancelled item in order ${order.orderId}`,
                    date: new Date()
                });

                refundMessage = `Cancellation approved for item: ${item.product.productName}. Amount ₹${refundAmount} refunded to wallet.`;
                await user.save();
            } else {
                refundMessage = `Cancellation approved for item: ${item.product.productName} (Cash on Delivery). No refund processed.`;
            }

            // Restore product stock
            await Product.updateOne(
                { _id: item.product._id },
                { $inc: { quantity: item.quantity } }
            );

            item.cancellationStatus = 'Cancelled';
            item.cancellationReason = null;

            // Check if all items are now cancelled
            const allItemsCancelled = order.orderedItems.every(i => 
                i.cancellationStatus === 'Cancelled'
            );

            // Update order status if all items are cancelled
            if (allItemsCancelled) {
                order.status = 'Cancelled';
            } else {
                // Check if there are still pending cancel requests
                const hasPendingRequests = order.orderedItems.some(i => 
                    i.cancellationStatus === 'Cancel Request'
                );
                order.status = hasPendingRequests ? 'Cancel Request' : order.status;
            }

            await trackStatusChange(
                order,
                order.status,
                refundMessage,
                req.admin._id
            );

            await order.save();

            return res.json({ 
                success: true, 
                message: refundMessage,
                newStatus: order.status
            });
        } else if (action === 'reject') {
            item.cancellationStatus = 'None';
            item.cancellationReason = null;

            // Check if there are still pending cancel requests
            const hasPendingRequests = order.orderedItems.some(i => 
                i.cancellationStatus === 'Cancel Request'
            );

            // Update order status if no pending requests
            if (!hasPendingRequests) {
                order.status = 'Pending';
            }

            await trackStatusChange(
                order,
                order.status,
                `Cancellation request rejected for item: ${item.product.productName}`,
                req.admin._id
            );

            await order.save();

            return res.json({ 
                success: true, 
                message: 'Item cancellation request rejected',
                newStatus: order.status
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid action' 
            });
        }
    } catch (error) {
        console.error('Error processing item cancel request:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to process item cancel request' 
        });
    }
};



const processReturnItemRequest = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { itemIndex, action } = req.body;

        const order = await Order.findOne({ orderId })
            .populate('userId')
            .populate('orderedItems.product');

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        const item = order.orderedItems[itemIndex];
        if (!item) {
            return res.status(400).json({ 
                success: false, 
                message: 'Item not found' 
            });
        }

        if (item.returnStatus !== 'Return Request') {
            return res.status(400).json({ 
                success: false, 
                message: 'Item is not in return request status' 
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

            const refundAmount = item.price * item.quantity;
            user.wallet.balance += refundAmount;
            user.wallet.transactions.push({
                amount: refundAmount,
                type: 'credit',
                description: `Refund for returned item in order ${order.orderId}`,
                date: new Date()
            });

            await Product.updateOne(
                { _id: item.product._id },
                { $inc: { quantity: item.quantity } }
            );

            item.returnStatus = 'Returned';
            item.returnReason = null;

            const anyReturnRequest = order.orderedItems.some(i => i.returnStatus === 'Return Request');
            order.status = anyReturnRequest ? 'Return Request' : 'Delivered';

            await trackStatusChange(
                order,
                order.status,
                `Return approved for item: ${item.product.productName}. Amount ₹${refundAmount} refunded to wallet`,
                req.admin._id
            );

            await Promise.all([user.save(), order.save()]);

            return res.json({ 
                success: true, 
                message: 'Item return approved and amount refunded to wallet',
                newStatus: order.status
            });
        } else if (action === 'reject') {
            item.returnStatus = 'None';
            item.returnReason = null;

            const anyReturnRequest = order.orderedItems.some(i => i.returnStatus === 'Return Request');
            order.status = anyReturnRequest ? 'Return Request' : 'Delivered';

            await trackStatusChange(
                order,
                order.status,
                `Return request rejected for item: ${item.product.productName}`,
                req.admin._id
            );

            await order.save();

            return res.json({ 
                success: true, 
                message: 'Item return request rejected',
                newStatus: order.status
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid action' 
            });
        }
    } catch (error) {
        console.error('Error processing item return request:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to process item return request' 
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
    processCancelItemRequest,
    processReturnItemRequest
};