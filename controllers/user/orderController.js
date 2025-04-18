// orderController.js
const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
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

const generateFooter = (doc, order) => {
    doc.fontSize(10)
       .text('Thank you for your purchase!', 50, 700, {
           align: 'center',
           width: 500
       });
};


const generateInvoice = async (req, order, res, isAdmin = false) => { // Add req as a parameter
    try {
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `invoice_${order.orderId}.pdf`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/pdf');
        
        doc.pipe(res);
        
        // Define the absolute path to the logo
        const logoPath = path.join(__dirname, '../../public/images/logo.png');

        // Check if the logo file exists before adding it
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 45, { width: 50 });
        } else {
            console.warn('Logo file not found at:', logoPath);
            doc.fontSize(10).text('Logo not available', 50, 45);
        }

        // Header
        doc.fillColor('#444444')
           .fontSize(20)
           .text('INVOICE', 200, 50, { align: 'right' })
           .fontSize(10)
           .text(`Invoice #: ${order.orderId}`, 200, 80, { align: 'right' })
           .text(`Invoice Date: ${order.invoiceDate?.toLocaleDateString() || new Date().toLocaleDateString()}`, 200, 95, { align: 'right' })
           .moveDown();
        
        // Customer Information
        const customer = isAdmin ? order.userId : req.session.user; // Now req is defined
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


const generateTableHeader = (doc, y) => {
    doc.font('Helvetica-Bold')
       .fontSize(10)
       .text('Item', 50, y)
       .text('Unit Price', 280, y, { width: 90, align: 'right' })
       .text('Qty', 370, y, { width: 90, align: 'right' })
       .text('Line Total', 0, y, { align: 'right' });
    
    generateHr(doc, y + 20);
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

const generateTotalRow = (doc, y, label, value) => {
    doc.fontSize(10)
       .text(label, 50, y)
       .text(value, 0, y, { align: 'right' });
};




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


const trackStatusChange = async (order, newStatus, description) => {
    if (!order.statusHistory) {
        order.statusHistory = [];
    }
    
    order.statusHistory.push({
        status: newStatus,
        date: new Date(),
        description: description || `Status changed to ${newStatus}`
    });
    
    await order.save();
};


const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        const order = await Order.findOne({ orderId, userId: req.session.user.id })
            .populate('orderedItems.product');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (['Delivered', 'Cancelled', 'Returned'].includes(order.status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot cancel this order in its current state' 
            });
        }

        order.status = 'Cancel Request';
        order.cancellationReason = reason || 'Not specified';
        
        await trackStatusChange(
            order, 
            'Cancel Request', 
            reason ? `Cancellation requested: ${reason}` : 'Cancellation requested'
        );
        
        await order.save();

        res.status(200).json({ 
            success: true, 
            message: 'Cancellation request submitted successfully' 
        });
    } catch (error) {
        console.error('Error in cancelOrder:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to request cancellation' 
        });
    }
};


const returnOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        
        if (!reason || reason.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Return reason is required' 
            });
        }

        const order = await Order.findOne({ orderId, userId: req.session.user.id });

        if (!order || order.status !== 'Delivered') {
            return res.status(400).json({ 
                success: false, 
                message: 'Only delivered orders can be returned' 
            });
        }

        order.status = 'Return Request';
        order.returnReason = reason;
        
        await trackStatusChange(
            order, 
            'Return Request', 
            `Return requested: ${reason}`
        );
        
        await order.save();

        res.status(200).json({ 
            success: true, 
            message: 'Return request submitted successfully' 
        });
    } catch (error) {
        console.error('Error in returnOrder:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to request return' 
        });
    }
};


// Update downloadInvoice function
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
        
        // Pass req to generateInvoice
        await generateInvoice(req, order, res, isAdmin);
    } catch (error) {
        console.error('Error in downloadInvoice:', error);
        res.status(500).send('Failed to generate invoice');
    }
};


const searchOrders = async (req, res) => {
    try {
        const { query } = req.query;
        const userId = req.session.user.id;
        
        if (!query || query.trim() === '') {
            return res.redirect('/orders');
        }
        
        const orders = await Order.find({
            userId,
            $or: [
                { orderId: { $regex: query, $options: 'i' } },
                { 'address.name': { $regex: query, $options: 'i' } },
                { 'address.city': { $regex: query, $options: 'i' } },
                { 'address.state': { $regex: query, $options: 'i' } }
            ]
        })
        .populate('orderedItems.product')
        .sort({ createdAt: -1 });

        res.render('user/orders', {
            orders: orders || [],
            user: req.session.user,
            searchQuery: query,
            currentRoute: '/orders'
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