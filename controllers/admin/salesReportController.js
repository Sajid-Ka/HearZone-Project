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
    res.render('admin/sales-report', {
      reportType: '',
      dateFrom: '',
      dateTo: '',
      report: null,
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

    if (reportType === 'custom' && (!dateFrom || !dateTo)) {
      return res.render('admin/sales-report', {
        error: 'Custom date range requires both start and end dates',
        reportType,
        dateFrom,
        dateTo,
        report: null
      });
    }

    const { start, end } = getDateRange(reportType, dateFrom, dateTo);

    const report = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $nin: ['Cancelled', 'Returned'] },
          isVisibleToAdmin: true
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSalesAmount: { $sum: '$finalAmount' },
          totalDiscount: { $sum: '$discount' },
          totalCouponDiscount: { $sum: '$couponDiscount' }
        }
      }
    ]);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: { $nin: ['Cancelled', 'Returned'] },
      isVisibleToAdmin: true
    })
      .populate('userId', 'name email')
      .lean();

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

// Download Sales Report as PDF
const downloadSalesReportPDF = async (req, res) => {
  try {
    const { reportType, dateFrom, dateTo } = req.query;

    // Get date range
    const { start, end } = getDateRange(reportType, dateFrom, dateTo);

    // Fetch report data
    const report = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $nin: ['Cancelled', 'Returned'] },
          isVisibleToAdmin: true
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSalesAmount: { $sum: '$finalAmount' },
          totalDiscount: { $sum: '$discount' },
          totalCouponDiscount: { $sum: '$couponDiscount' }
        }
      }
    ]);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: { $nin: ['Cancelled', 'Returned'] },
      isVisibleToAdmin: true
    })
      .populate('userId', 'name')
      .lean();

    const reportData = report[0] || {
      totalOrders: 0,
      totalSalesAmount: 0,
      totalDiscount: 0,
      totalCouponDiscount: 0
    };

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    const fileName = `sales_report_${moment().format('YYYYMMDD')}.pdf`;

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Sales Report', 50, 50, { align: 'center' });
    doc.fontSize(12).text(`Period: ${moment(start).format('DD/MM/YYYY')} - ${moment(end).format('DD/MM/YYYY')}`, 50, 80, { align: 'center' });

    // Summary
    doc.fontSize(14).text('Summary', 50, 120);
    doc.fontSize(10)
       .text(`Total Orders: ${reportData.totalOrders}`, 50, 140)
       .text(`Total Sales Amount: ₹${reportData.totalSalesAmount.toFixed(2)}`, 50, 155)
       .text(`Total Discount: ₹${reportData.totalDiscount.toFixed(2)}`, 50, 170)
       .text(`Total Coupon Discount: ₹${reportData.totalCouponDiscount.toFixed(2)}`, 50, 185);

    // Table Header
    const tableTop = 220;
    doc.font('Helvetica-Bold').fontSize(10)
       .text('Order ID', 50, tableTop)
       .text('Customer', 150, tableTop)
       .text('Date', 250, tableTop)
       .text('Amount', 350, tableTop, { align: 'right' })
       .text('Discount', 450, tableTop, { align: 'right' });
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Table Rows
    orders.forEach((order, index) => {
      const y = tableTop + 30 + (index * 20);
      doc.font('Helvetica').fontSize(10)
         .text(order.orderId, 50, y)
         .text(order.userId.name, 150, y)
         .text(moment(order.createdAt).format('DD/MM/YYYY'), 250, y)
         .text(`₹${order.finalAmount.toFixed(2)}`, 350, y, { align: 'right' })
         .text(`₹${order.discount.toFixed(2)}`, 450, y, { align: 'right' });
    });

    // Footer
    doc.fontSize(10).text('Generated by Your E-commerce Platform', 50, 700, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).send('Failed to generate PDF report');
  }
};

// Download Sales Report as Excel
const downloadSalesReportExcel = async (req, res) => {
  try {
    const { reportType, dateFrom, dateTo } = req.query;

    // Get date range
    const { start, end } = getDateRange(reportType, dateFrom, dateTo);

    // Fetch report data
    const report = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $nin: ['Cancelled', 'Returned'] },
          isVisibleToAdmin: true
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSalesAmount: { $sum: '$finalAmount' },
          totalDiscount: { $sum: '$discount' },
          totalCouponDiscount: { $sum: '$couponDiscount' }
        }
      }
    ]);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: { $nin: ['Cancelled', 'Returned'] },
      isVisibleToAdmin: true
    })
      .populate('userId', 'name')
      .lean();

    const reportData = report[0] || {
      totalOrders: 0,
      totalSalesAmount: 0,
      totalDiscount: 0,
      totalCouponDiscount: 0
    };

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Add Summary
    worksheet.addRow(['Sales Report']);
    worksheet.addRow([`Period: ${moment(start).format('DD/MM/YYYY')} - ${moment(end).format('DD/MM/YYYY')}`]);
    worksheet.addRow([]);
    worksheet.addRow(['Summary']);
    worksheet.addRow(['Total Orders', reportData.totalOrders]);
    worksheet.addRow(['Total Sales Amount', `₹${reportData.totalSalesAmount.toFixed(2)}`]);
    worksheet.addRow(['Total Discount', `₹${reportData.totalDiscount.toFixed(2)}`]);
    worksheet.addRow(['Total Coupon Discount', `₹${reportData.totalCouponDiscount.toFixed(2)}`]);
    worksheet.addRow([]);

    // Add Table Headers
    worksheet.addRow(['Order ID', 'Customer', 'Date', 'Amount', 'Discount', 'Coupon Discount']);
    worksheet.getRow(worksheet.lastRow.number).font = { bold: true };

    // Add Table Rows
    orders.forEach(order => {
      worksheet.addRow([
        order.orderId,
        order.userId.name,
        moment(order.createdAt).format('DD/MM/YYYY'),
        `₹${order.finalAmount.toFixed(2)}`,
        `₹${order.discount.toFixed(2)}`,
        `₹${order.couponDiscount.toFixed(2)}`
      ]);
    });

    // Auto-fit columns
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

    // Set response headers
    const fileName = `sales_report_${moment().format('YYYYMMDD')}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Write to response
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