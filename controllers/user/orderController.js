const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateHr = (doc, y) => {
  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
};

const generateTableRow = (doc, y, item, unitPrice, quantity, lineTotal) => {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(unitPrice, 280, y, { width: 90, align: 'right' })
    .text(quantity, 370, y, { width: 90, align: 'right' })
    .text(lineTotal, 0, y, { align: 'right' });
};

const generateFooter = (doc) => {
  doc.fontSize(10).text('Thank you for your purchase!', 50, 700, {
    align: 'center',
    width: 500
  });
};

const generateTableHeader = (doc, y) => {
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('Item', 50, y)
    .text('Unit Price', 280, y, { width: 90, align: 'right' })
    .text('Qty', 370, y, { width: 90, align: 'right' })
    .text('Line Total', 0, y, { align: 'right' });

  generateHr(doc, y + 20);
};

const generateTotalRow = (doc, y, label, value) => {
  doc.fontSize(10).text(label, 50, y).text(value, 0, y, { align: 'right' });
};

const generateItemsTable = (doc, order, y) => {
  let i;
  const tableTop = y + 30;

  for (i = 0; i < order.orderedItems.length; i++) {
    const item = order.orderedItems[i];
    const position = tableTop + i * 30;

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

  const newSubtotal =
    (order.totalPrice || 0) +
    (order.discount || 0) +
    (order.couponDiscount || 0);
  const subtotalPosition = tableTop + i * 30;
  generateTotalRow(
    doc,
    subtotalPosition,
    'Subtotal',
    `₹${newSubtotal.toFixed(2)}`
  );

  let currentPosition = subtotalPosition;
  if (order.discount > 0) {
    currentPosition += 20;
    generateTotalRow(
      doc,
      currentPosition,
      'Product Discount',
      `-₹${order.discount.toFixed(2)}`
    );
  }

  if (order.couponDiscount > 0) {
    currentPosition += 20;
    generateTotalRow(
      doc,
      currentPosition,
      'Coupon Discount',
      `-₹${order.couponDiscount.toFixed(2)}`
    );
  }

  currentPosition += 20;
  generateTotalRow(
    doc,
    currentPosition,
    'Shipping',
    `₹${order.shippingCost.toFixed(2)}`
  );

  currentPosition += 20;
  doc.font('Helvetica-Bold');
  generateTotalRow(
    doc,
    currentPosition,
    'Total Amount',
    `₹${(order.totalPrice - order.couponDiscount || 0).toFixed(2)}`
  );
  doc.font('Helvetica');

  currentPosition += 40;
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Payment Details', 50, currentPosition);
  generateHr(doc, currentPosition + 20);

  currentPosition += 30;
  doc
    .font('Helvetica')
    .fontSize(10)
    .text(
      `Payment Method: ${order.paymentMethod || 'Not specified'}`,
      50,
      currentPosition
    );

  currentPosition += 20;
  doc.text(
    `Payment Status: ${order.paymentStatus || 'Not specified'}`,
    50,
    currentPosition
  );

  if (order.razorpayOrderId || order.transactionId) {
    currentPosition += 20;
    doc.text(
      `Transaction ID: ${order.razorpayOrderId || order.transactionId || 'N/A'}`,
      50,
      currentPosition
    );
  }

  return currentPosition;
};

const generateInvoice = async (req, order, res, isAdmin = false) => {
  try {
    const doc = new PDFDocument({ margin: 50 });
    const fileName = `invoice_${order.orderId}.pdf`;

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    doc
      .fillColor('#444444')
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('HearZone', 0, 30, { align: 'center' })
      .fontSize(10)
      .font('Helvetica')
      .text('Sounds Never Settle', 0, 55, { align: 'center' })
      .moveDown();

    doc
      .fillColor('#444444')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('INVOICE', 50, 80, { align: 'left' })
      .fontSize(10)
      .font('Helvetica')
      .text(`Invoice #: ${order.orderId}`, 50, 110, { align: 'left' })
      .text(
        `Invoice Date: ${order.invoiceDate?.toLocaleDateString() || new Date().toLocaleDateString()}`,
        50,
        125,
        { align: 'left' }
      )
      .moveDown();

    const customer = isAdmin ? order.userId : req.session.user;
    const shippingAddress = order.address;

    doc
      .fillColor('#444444')
      .fontSize(14)
      .text('Bill To:', 50, 160)
      .fontSize(10)
      .text(customer.name, 50, 180)
      .text(shippingAddress.landmark, 50, 195)
      .text(
        `${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pinCode}`,
        50,
        210
      )
      .text(`Phone: ${shippingAddress.phone}`, 50, 225)
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

const getOrderList = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const searchQuery = req.query.query || '';

    const orders = await Order.find({ userId })
      .populate('orderedItems.product')
      .sort({ createdAt: -1 });

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
    const order = await Order.findOne({
      orderId,
      userId: req.session.user.id
    }).populate({
      path: 'orderedItems.product',
      populate: ['category', 'offer']
    });

    if (!order) {
      return res.status(404).render('user/page-404');
    }

    const newSubtotal = (order.totalPrice || 0) + (order.discount || 0);

    let totalPrice = order.totalPrice - (order.couponDiscount || 0);

    res.render('user/order-details', {
      totalPrice,
      order,
      user: req.session.user,
      newSubtotal
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
    const order = await Order.findOne({
      orderId,
      userId: req.session.user.id
    }).populate('orderedItems.product');

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'Failed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a failed payment order'
      });
    }

    const cancellableItems = order.orderedItems.filter(
      (item) =>
        item.itemStatus === 'Pending' && item.cancellationStatus === 'None'
    );

    if (cancellableItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items available for cancellation'
      });
    }

    cancellableItems.forEach((item) => {
      item.cancellationStatus = 'Cancel Request';
      item.cancellationReason = reason || 'Not specified';
    });

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

const downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const isAdmin = req.path.includes('/admin/');

    const query = { orderId };
    if (!isAdmin) {
      query.userId = req.session.user.id;
    } else {
      query.isVisibleToAdmin = true;
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

const searchOrders = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.session.user.id;

    if (!query || query.trim() === '') {
      return res.redirect('/orders');
    }

    let searchQuery = query.trim();

    if (searchQuery.startsWith('Order #')) {
      searchQuery = searchQuery.replace('Order #', '').trim();
    } else if (searchQuery.startsWith('Order Details - #')) {
      searchQuery = searchQuery.replace('Order Details - #', '').trim();
    }

    const orderIdPattern = new RegExp(searchQuery.replace(/[-\s]/g, '.*'), 'i');

    const orders = await Order.find({
      userId,
      $or: [
        { orderId: orderIdPattern },
        { 'address.name': { $regex: searchQuery, $options: 'i' } },
        { 'address.city': { $regex: searchQuery, $options: 'i' } },
        { 'address.state': { $regex: searchQuery, $options: 'i' } }
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

const cancelReturnRequest = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId, userId: req.session.user.id });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'Return Request') {
      return res.status(400).json({
        success: false,
        message: 'Order is not in Return Request status'
      });
    }

    order.status = 'Delivered';
    order.returnReason = null;

    await trackStatusChange(
      order,
      'Delivered',
      'Return request cancelled by user'
    );

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Return request cancelled successfully'
    });
  } catch (error) {
    console.error('Error in cancelReturnRequest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel return request'
    });
  }
};

const cancelOrderItem = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { itemIndex, reason } = req.body;
    const order = await Order.findOne({
      orderId,
      userId: req.session.user.id
    }).populate('orderedItems.product');

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'Failed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel items in a failed payment order'
      });
    }

    const item = order.orderedItems[itemIndex];
    if (!item) {
      return res
        .status(400)
        .json({ success: false, message: 'Item not found' });
    }

    if (item.itemStatus !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel items that are in Pending status'
      });
    }

    if (item.cancellationStatus !== 'None') {
      return res.status(400).json({
        success: false,
        message: 'Item already has a cancellation request or is cancelled'
      });
    }

    item.cancellationStatus = 'Cancel Request';
    item.cancellationReason = reason || 'Not specified';

    await trackStatusChange(
      order,
      order.status,
      `Cancellation requested for item: ${item.product.productName}` +
        (reason ? ` (Reason: ${reason})` : '')
    );

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Item cancellation request submitted successfully',
      newStatus: order.status
    });
  } catch (error) {
    console.error('Error in cancelOrderItem:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request item cancellation'
    });
  }
};

const returnOrderItem = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { itemIndex, reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Return reason is required'
      });
    }

    const order = await Order.findOne({
      orderId,
      userId: req.session.user.id
    }).populate('orderedItems.product');

    if (!order || order.status !== 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Only delivered orders can be returned'
      });
    }

    const item = order.orderedItems[itemIndex];
    if (!item) {
      return res
        .status(400)
        .json({ success: false, message: 'Item not found' });
    }

    if (item.cancellationStatus !== 'None') {
      return res.status(400).json({
        success: false,
        message: 'Cannot return a cancelled item'
      });
    }

    if (item.returnStatus !== 'None') {
      return res.status(400).json({
        success: false,
        message: 'Item already has a return request or is returned'
      });
    }

    item.returnStatus = 'Return Request';
    item.returnReason = reason;

    if (order.status !== 'Return Request') {
      order.status = 'Return Request';
    }

    await trackStatusChange(
      order,
      'Return Request',
      `Return requested for item: ${item.product.productName} - ${reason}`
    );

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Item return request submitted successfully'
    });
  } catch (error) {
    console.error('Error in returnOrderItem:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request item return'
    });
  }
};

const cancelReturnItem = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { itemIndex } = req.body;

    const order = await Order.findOne({
      orderId,
      userId: req.session.user.id
    }).populate('orderedItems.product');

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    const item = order.orderedItems[itemIndex];
    if (!item) {
      return res
        .status(400)
        .json({ success: false, message: 'Item not found' });
    }

    if (item.returnStatus !== 'Return Request') {
      return res.status(400).json({
        success: false,
        message: 'Item is not in Return Request status'
      });
    }

    item.returnStatus = 'None';
    item.returnReason = null;

    const anyReturnRequest = order.orderedItems.some(
      (i) => i.returnStatus === 'Return Request'
    );
    if (!anyReturnRequest) {
      order.status = 'Delivered';
    }

    await trackStatusChange(
      order,
      'Delivered',
      `Return request cancelled for item: ${item.product.productName}`
    );

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Item return request cancelled successfully'
    });
  } catch (error) {
    console.error('Error in cancelReturnItem:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel item return request'
    });
  }
};

const retryPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.session.user.id;

    const order = await Order.findOne({ orderId, userId }).populate(
      'orderedItems.product'
    );
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus !== 'Failed') {
      return res.status(400).json({
        success: false,
        message: 'Retry payment is only available for failed payments'
      });
    }

    for (const item of order.orderedItems) {
      if (item.quantity > item.product.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product.productName}`
        });
      }
    }

    if (order.paymentMethod === 'Razorpay') {
      const razorpayOrder = await createRazorpayOrder(order.finalAmount);
      order.razorpayOrderId = razorpayOrder.id;
      await order.save();

      req.session.pendingOrder = {
        ...order.toObject(),
        razorpayOrderId: razorpayOrder.id
      };

      return res.status(200).json({
        success: true,
        razorpayOrderId: razorpayOrder.id,
        amount: order.finalAmount * 100,
        currency: 'INR',
        message: 'Razorpay order created for retry payment'
      });
    } else {
      order.paymentStatus = 'Pending';
      order.isVisibleToAdmin = true;
      await order.save();

      for (const item of order.orderedItems) {
        await Product.findByIdAndUpdate(item.product._id, {
          $inc: { quantity: -item.quantity }
        });
      }

      res.status(200).json({
        success: true,
        orderId: order.orderId,
        message: 'Order payment retried successfully'
      });
    }
  } catch (error) {
    console.error('Error in retryPayment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry payment'
    });
  }
};

module.exports = {
  getOrderList,
  getOrderDetails,
  cancelOrder,
  returnOrder,
  downloadInvoice,
  searchOrders,
  cancelReturnRequest,
  cancelOrderItem,
  returnOrderItem,
  cancelReturnItem,
  retryPayment
};
