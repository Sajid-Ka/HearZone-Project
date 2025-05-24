const Order = require('../../models/orderSchema');
const moment = require('moment');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const getDateRange = (reportType, customStart, customEnd) => {
  const startDate = moment().startOf('day');
  const endDate = moment().endOf('day');

  switch (reportType) {
    case 'daily':
      return { start: startDate.toDate(), end: endDate.toDate() };
    case 'weekly':
      return { start: moment().startOf('week').toDate(), end: moment().endOf('week').toDate() };
    case 'monthly':
      return { start: moment().startOf('month').toDate(), end: moment().endOf('month').toDate() };
    case 'custom':
      return {
        start: moment(customStart).startOf('day').toDate(),
        end: moment(customEnd).endOf('day').toDate()
      };
    default:
      throw new Error('Invalid report type');
  }
};

const loadSalesReportPage = async (req, res) => {
  try {
    const reportType = 'daily';
    const { start, end } = getDateRange(reportType);

    const report = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $nin: ['Cancelled', 'Returned', 'pending', 'failed'] },
          isVisibleToAdmin: true
        }
      },
      { $unwind: '$orderedItems' },
      {
        $match: {
          'orderedItems.cancellationStatus': { $ne: 'Cancelled' },
          'orderedItems.returnStatus': { $ne: 'Returned' }
        }
      },
      {
        $group: {
          _id: '$_id',
          totalSalesAmount: {
            $sum: { $multiply: ['$orderedItems.price', '$orderedItems.quantity'] }
          },
          discount: { $first: { $ifNull: ['$discount', 0] } },
          couponDiscount: { $first: { $ifNull: ['$couponDiscount', 0] } }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSalesAmount: { $sum: '$totalSalesAmount' },
          totalDiscount: { $sum: '$discount' },
          totalCouponDiscount: { $sum: '$couponDiscount' }
        }
      }
    ]);

    const orders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $nin: ['Cancelled', 'Returned', 'pending', 'failed'] },
          isVisibleToAdmin: true
        }
      },
      { $unwind: '$orderedItems' },
      {
        $match: {
          'orderedItems.cancellationStatus': { $ne: 'Cancelled' },
          'orderedItems.returnStatus': { $ne: 'Returned' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId'
        }
      },
      { $unwind: { path: '$userId', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$_id',
          orderId: { $first: '$orderId' },
          createdAt: { $first: '$createdAt' },
          status: { $first: '$status' },
          userName: { $first: '$userId.name' },
          userEmail: { $first: '$userId.email' },
          itemAmount: {
            $sum: { $multiply: ['$orderedItems.price', '$orderedItems.quantity'] }
          },
          discount: { $first: { $ifNull: ['$discount', 0] } },
          couponDiscount: { $first: { $ifNull: ['$couponDiscount', 0] } }
        }
      },
      {
        $project: {
          orderId: 1,
          createdAt: 1,
          finalAmount: {
            $subtract: [
              '$itemAmount',
              { $add: ['$discount', '$couponDiscount'] }
            ]
          },
          discount: 1,
          couponDiscount: 1,
          totalAmountWithDiscount: '$itemAmount',
          status: 1,
          'userId.name': '$userName',
          'userId.email': '$userEmail'
        }
      }
    ]);

    const reportData = report[0] || {
      totalOrders: 0,
      totalSalesAmount: 0,
      totalDiscount: 0,
      totalCouponDiscount: 0
    };

    res.render('admin/sales-report', {
      report: { ...reportData, orders },
      reportType,
      dateFrom: moment(start).format('YYYY-MM-DD'),
      dateTo: moment(end).format('YYYY-MM-DD'),
      error: null
    });
  } catch (error) {
    console.error('Error loading sales report page:', error);
    res.redirect('/admin/pageError');
  }
};

const generateSalesReport = async (req, res) => {
  try {
    const { reportType, dateFrom, dateTo } = req.body;

    if (!reportType || !['daily', 'weekly', 'monthly', 'custom'].includes(reportType)) {
      return res.render('admin/sales-report', {
        error: 'Invalid report type',
        reportType,
        dateFrom,
        dateTo,
        report: null
      });
    }

    if (reportType === 'custom') {
      if (!dateFrom || !dateTo) {
        return res.render('admin/sales-report', {
          error: 'Custom date range requires both start and end dates',
          reportType,
          dateFrom,
          dateTo,
          report: null
        });
      }

      const start = moment(dateFrom);
      const end = moment(dateTo);

      if (start.isAfter(end)) {
        return res.render('admin/sales-report', {
          error: 'From Date cannot be later than To Date',
          reportType,
          dateFrom,
          dateTo,
          report: null
        });
      }

      if (start.isSame(end, 'day')) {
        return res.render('admin/sales-report', {
          error: 'From Date and To Date cannot be the same',
          reportType,
          dateFrom,
          dateTo,
          report: null
        });
      }
    }

    const { start, end } = getDateRange(reportType, dateFrom, dateTo);

    const report = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $nin: ['Cancelled', 'Returned', 'pending', 'failed'] },
          isVisibleToAdmin: true
        }
      },
      { $unwind: '$orderedItems' },
      {
        $match: {
          'orderedItems.cancellationStatus': { $ne: 'Cancelled' },
          'orderedItems.returnStatus': { $ne: 'Returned' }
        }
      },
      {
        $group: {
          _id: '$_id',
          totalSalesAmount: {
            $sum: { $multiply: ['$orderedItems.price', '$orderedItems.quantity'] }
          },
          discount: { $first: { $ifNull: ['$discount', 0] } },
          couponDiscount: { $first: { $ifNull: ['$couponDiscount', 0] } }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSalesAmount: { $sum: '$totalSalesAmount' },
          totalDiscount: { $sum: '$discount' },
          totalCouponDiscount: { $sum: '$couponDiscount' }
        }
      }
    ]);

    const orders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $nin: ['Cancelled', 'Returned', 'pending', 'failed'] },
          isVisibleToAdmin: true
        }
      },
      { $unwind: '$orderedItems' },
      {
        $match: {
          'orderedItems.cancellationStatus': { $ne: 'Cancelled' },
          'orderedItems.returnStatus': { $ne: 'Returned' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId'
        }
      },
      { $unwind: { path: '$userId', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$_id',
          orderId: { $first: '$orderId' },
          createdAt: { $first: '$createdAt' },
          status: { $first: '$status' },
          userName: { $first: '$userId.name' },
          userEmail: { $first: '$userId.email' },
          itemAmount: {
            $sum: { $multiply: ['$orderedItems.price', '$orderedItems.quantity'] }
          },
          discount: { $first: { $ifNull: ['$discount', 0] } },
          couponDiscount: { $first: { $ifNull: ['$couponDiscount', 0] } }
        }
      },
      {
        $project: {
          orderId: 1,
          createdAt: 1,
          finalAmount: {
            $subtract: [
              '$itemAmount',
              { $add: ['$discount', '$couponDiscount'] }
            ]
          },
          discount: 1,
          couponDiscount: 1,
          totalAmountWithDiscount: '$itemAmount',
          status: 1,
          'userId.name': '$userName',
          'userId.email': '$userEmail'
        }
      }
    ]);

    const reportData = report[0] || {
      totalOrders: 0,
      totalSalesAmount: 0,
      totalDiscount: 0,
      totalCouponDiscount: 0
    };

    res.render('admin/sales-report', {
      report: { ...reportData, orders },
      reportType,
      dateFrom: dateFrom || moment(start).format('YYYY-MM-DD'),
      dateTo: dateTo || moment(end).format('YYYY-MM-DD'),
      error: null
    });
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.render('admin/sales-report', {
      error: 'Failed to generate report',
      reportType: req.body.reportType,
      dateFrom: req.body.dateFrom,
      dateTo: req.body.dateTo,
      report: null
    });
  }
};

const downloadSalesReportPDF = async (req, res) => {
  try {
    const { reportType, dateFrom, dateTo } = req.query;

    const { start, end } = getDateRange(reportType, dateFrom, dateTo);

    const report = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $nin: ['Cancelled', 'Returned', 'pending', 'failed'] },
          isVisibleToAdmin: true
        }
      },
      { $unwind: '$orderedItems' },
      {
        $match: {
          'orderedItems.cancellationStatus': { $ne: 'Cancelled' },
          'orderedItems.returnStatus': { $ne: 'Returned' }
        }
      },
      {
        $group: {
          _id: '$_id',
          totalSalesAmount: {
            $sum: { $multiply: ['$orderedItems.price', '$orderedItems.quantity'] }
          },
          discount: { $first: { $ifNull: ['$discount', 0] } },
          couponDiscount: { $first: { $ifNull: ['$couponDiscount', 0] } }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSalesAmount: { $sum: '$totalSalesAmount' },
          totalDiscount: { $sum: '$discount' },
          totalCouponDiscount: { $sum: '$couponDiscount' }
        }
      }
    ]);

    const orders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $nin: ['Cancelled', 'Returned', 'pending', 'failed'] },
          isVisibleToAdmin: true
        }
      },
      { $unwind: '$orderedItems' },
      {
        $match: {
          'orderedItems.cancellationStatus': { $ne: 'Cancelled' },
          'orderedItems.returnStatus': { $ne: 'Returned' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId'
        }
      },
      { $unwind: { path: '$userId', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$_id',
          orderId: { $first: '$orderId' },
          createdAt: { $first: '$createdAt' },
          status: { $first: '$status' },
          userName: { $first: '$userId.name' },
          itemAmount: {
            $sum: { $multiply: ['$orderedItems.price', '$orderedItems.quantity'] }
          },
          discount: { $first: { $ifNull: ['$discount', 0] } },
          couponDiscount: { $first: { $ifNull: ['$couponDiscount', 0] } }
        }
      },
      {
        $project: {
          orderId: 1,
          createdAt: 1,
          finalAmount: {
            $subtract: [
              '$itemAmount',
              { $add: ['$discount', '$couponDiscount'] }
            ]
          },
          discount: 1,
          couponDiscount: 1,
          totalAmountWithDiscount: '$itemAmount',
          status: 1,
          'userId.name': '$userName'
        }
      }
    ]);

    const reportData = report[0] || {
      totalOrders: 0,
      totalSalesAmount: 0,
      totalDiscount: 0,
      totalCouponDiscount: 0
    };

    const doc = new PDFDocument({ margin: 50 });
    const fileName = `sales_report_${moment().format('YYYYMMDD')}.pdf`;

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    doc.fontSize(20).text('Sales Report', 50, 50, { align: 'center' });
    doc.fontSize(12).font('Courier').text(`Period: ${moment(start).format('DD/MM/YYYY')} - ${moment(end).format('DD/MM/YYYY')}`, 50, 80, { align: 'center' });

    doc.fontSize(14).text('Summary', 50, 120);
    doc.fontSize(10)
       .text(`Total Orders: ${reportData.totalOrders}`, 50, 140)
       .text(`Total Sales Amount: ₹${reportData.totalSalesAmount.toFixed(2)}`, 50, 155)
       .text(`Total Discount: ₹${reportData.totalDiscount.toFixed(2)}`, 50, 170)
       .text(`Total Coupon Discount: ₹${reportData.totalCouponDiscount.toFixed(2)}`, 50, 185);

    const tableTop = 220;
    doc.font('Helvetica-Bold').fontSize(10)
       .text('Order ID', 50, tableTop)
       .text('Customer', 150, tableTop)
       .text('Date', 230, tableTop)
       .text('Amount', 300, tableTop)
       .text('Discount', 380, tableTop)
       .text('Coupondiscount', 460 , tableTop)
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    orders.forEach((order, index) => {
      const y = tableTop + 30 + (index * 20);
      doc.font('Helvetica').fontSize(10)
         .text(order.orderId, 50, y)
         .text(order.userId?.name || 'Unknown', 150, y)
         .text(moment(order.createdAt).format('DD/MM/YYYY'), 230, y)
         .text(`₹${(order.totalAmountWithDiscount - order.couponDiscount || 0).toFixed(2)}`, 300, y)
         .text(`₹${order.discount.toFixed(2)}`, 380, y)
         .text(`₹${ order.couponDiscount.toFixed(2)}`, 460, y)
    });

    doc.fontSize(10).text('by HearZone', 50, 700, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).send('Failed to generate PDF report');
  }
};

const downloadSalesReportExcel = async (req, res) => {
  try {
    const { reportType, dateFrom, dateTo } = req.query;

    const { start, end } = getDateRange(reportType, dateFrom, dateTo);

    const report = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $nin: ['Cancelled', 'Returned', 'pending', 'failed'] },
          isVisibleToAdmin: true
        }
      },
      { $unwind: '$orderedItems' },
      {
        $match: {
          'orderedItems.cancellationStatus': { $ne: 'Cancelled' },
          'orderedItems.returnStatus': { $ne: 'Returned' }
        }
      },
      {
        $group: {
          _id: '$_id',
          totalSalesAmount: {
            $sum: { $multiply: ['$orderedItems.price', '$orderedItems.quantity'] }
          },
          discount: { $first: { $ifNull: ['$discount', 0] } },
          couponDiscount: { $first: { $ifNull: ['$couponDiscount', 0] } }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSalesAmount: { $sum: '$totalSalesAmount' },
          totalDiscount: { $sum: '$discount' },
          totalCouponDiscount: { $sum: '$couponDiscount' }
        }
      }
    ]);

    const orders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $nin: ['Cancelled', 'Returned', 'pending', 'failed'] },
          isVisibleToAdmin: true
        }
      },
      { $unwind: '$orderedItems' },
      {
        $match: {
          'orderedItems.cancellationStatus': { $ne: 'Cancelled' },
          'orderedItems.returnStatus': { $ne: 'Returned' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId'
        }
      },
      { $unwind: { path: '$userId', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$_id',
          orderId: { $first: '$orderId' },
          createdAt: { $first: '$createdAt' },
          status: { $first: '$status' },
          userName: { $first: '$userId.name' },
          itemAmount: {
            $sum: { $multiply: ['$orderedItems.price', '$orderedItems.quantity'] }
          },
          discount: { $first: { $ifNull: ['$discount', 0] } },
          couponDiscount: { $first: { $ifNull: ['$couponDiscount', 0] } }
        }
      },
      {
        $project: {
          orderId: 1,
          createdAt: 1,
          finalAmount: {
            $subtract: [
              '$itemAmount',
              { $add: ['$discount', '$couponDiscount'] }
            ]
          },
          discount: 1,
          couponDiscount: 1,
          totalAmountWithDiscount: '$itemAmount',
          status: 1,
          'userId.name': '$userName'
        }
      }
    ]);

    const reportData = report[0] || {
      totalOrders: 0,
      totalSalesAmount: 0,
      totalDiscount: 0,
      totalCouponDiscount: 0
    };

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.addRow(['Sales Report']);
    worksheet.addRow([`Period: ${moment(start).format('DD/MM/YYYY')} - ${moment(end).format('DD/MM/YYYY')}`]);
    worksheet.addRow([]);
    worksheet.addRow(['Summary']);
    worksheet.addRow(['Total Orders', reportData.totalOrders]);
    worksheet.addRow(['Total Sales Amount', `₹${reportData.totalSalesAmount.toFixed(2)}`]);
    worksheet.addRow(['Total Discount', `₹${reportData.totalDiscount.toFixed(2)}`]);
    worksheet.addRow(['Total Coupon Discount', `₹${reportData.totalCouponDiscount.toFixed(2)}`]);
    worksheet.addRow([]);

    worksheet.addRow(['Order ID', 'Customer', 'Date', 'Amount', 'Discount', 'Coupon Discount', 'Status']);
    worksheet.getRow(worksheet.lastRow.number).font = { bold: true };

    orders.forEach(order => {
      worksheet.addRow([
        order.orderId,
        order.userId?.name || 'Unknown',
        moment(order.createdAt).format('DD/MM/YYYY'),
        `₹${(order.totalAmountWithDiscount - order.couponDiscount || 0).toFixed(2)}`,
        `₹${order.discount.toFixed(2)}`,
        `₹${order.couponDiscount.toFixed(2)}`,
        order.status
      ]);
    });

    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength;
    });

    const fileName = `sales_report_${moment().format('YYYYMMDD')}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating Excel report:', error);
    res.status(500).send('Failed to generate Excel report');
  }
};

module.exports = {
  loadSalesReportPage,
  generateSalesReport,
  downloadSalesReportPDF,
  downloadSalesReportExcel
};