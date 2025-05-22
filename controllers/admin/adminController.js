const User = require('../../models/userSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const moment = require('moment');

const pageError = async (req,res)=>{
    try {
        res.render('admin-error');
    } catch (error) {
        console.error("Error Page is Error");
    }
}

const loadLogin = async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Expires', '0');
        res.setHeader('Pragma', 'no-cache');
        
        if (req.session.admin) {
            return res.redirect('/admin/dashboard');
        }
        res.render('admin-login', { message: null });
    } catch (error) {
        console.error('Error loading admin login page:', error);
        res.redirect('/admin/pageError');
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await User.findOne({ email, isAdmin: true });

        if (!admin) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.setHeader('Expires', '0');
            res.setHeader('Pragma', 'no-cache');
            return res.render('admin-login', { message: 'Invalid email or password' });
        }

        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (!passwordMatch) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.setHeader('Expires', '0');
            res.setHeader('Pragma', 'no-cache');
            return res.render('admin-login', { message: 'Incorrect password' });
        }

        req.session.admin = admin._id.toString();
        delete req.session.user; 

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Expires', '0');
        res.setHeader('Pragma', 'no-cache');
        return res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Expires', '0');
        res.setHeader('Pragma', 'no-cache');
        return res.render('admin-login', { message: 'An error occurred, please try again' });
    }
};



async function getDashboardData(timeFilter, startDate, endDate) {
    let dateRange, labels, format;
    const now = moment();

    // Date range and labels logic remains unchanged
    if (startDate && endDate) {
        timeFilter = 'custom';
    }

    switch (timeFilter) {
        case 'weekly':
            startDate = moment().subtract(6, 'days').startOf('day').toDate();
            endDate = now.endOf('day').toDate();
            labels = Array.from({ length: 7 }, (_, i) =>
                moment().subtract(6 - i, 'days').format('ddd')
            );
            format = '%Y-%m-%d';
            break;
        case 'monthly':
            startDate = moment().subtract(5, 'months').startOf('month').toDate();
            endDate = now.endOf('day').toDate();
            labels = Array.from({ length: 6 }, (_, i) =>
                moment().subtract(5 - i, 'months').format('MMM')
            );
            format = '%Y-%m';
            break;
        case 'yearly':
            startDate = moment().subtract(5, 'years').startOf('year').toDate();
            endDate = now.endOf('day').toDate();
            labels = Array.from({ length: 6 }, (_, i) =>
                moment().subtract(5 - i, 'years').format('YYYY')
            );
            format = '%Y';
            break;
        case 'custom':
        default:
            if (!startDate || !endDate) {
                timeFilter = 'weekly';
                startDate = moment().subtract(6, 'days').startOf('day').toDate();
                endDate = now.endOf('day').toDate();
                labels = Array.from({ length: 7 }, (_, i) =>
                    moment().subtract(6 - i, 'days').format('ddd')
                );
                format = '%Y-%m-%d';
            } else {
                startDate = moment(startDate).startOf('day').toDate();
                endDate = moment(endDate).endOf('day').toDate();
                const daysDiff = moment(endDate).diff(moment(startDate), 'days');
                labels = [];
                for (let i = 0; i <= daysDiff; i++) {
                    labels.push(moment(startDate).add(i, 'days').format('MMM D'));
                }
                format = '%Y-%m-%d';
            }
    }

    dateRange = { startDate, endDate };

    // Previous period logic remains unchanged
    let previousStartDate, previousEndDate;
    if (startDate && endDate) {
        const daysDiff = moment(endDate).diff(moment(startDate), 'days');
        previousEndDate = moment(startDate).subtract(1, 'days').toDate();
        previousStartDate = moment(previousEndDate).subtract(daysDiff, 'days').toDate();
    } else {
        switch (timeFilter) {
            case 'weekly':
                previousEndDate = moment(startDate).subtract(1, 'days').toDate();
                previousStartDate = moment(previousEndDate).subtract(6, 'days').toDate();
                break;
            case 'yearly':
                previousEndDate = moment(startDate).subtract(1, 'days').toDate();
                previousStartDate = moment(previousEndDate).subtract(5, 'years').toDate();
                break;
            case 'monthly':
            default:
                previousEndDate = moment(startDate).subtract(1, 'days').toDate();
                previousStartDate = moment(previousEndDate).subtract(5, 'months').toDate();
        }
    }

    // Modified aggregations to exclude cancelled items
    const [
        totalRevenue,
        totalCustomers,
        totalOrders,
        currentPeriodRevenue,
        previousPeriodRevenue,
        currentPeriodCustomers,
        previousPeriodCustomers,
        currentPeriodOrders,
        previousPeriodOrders,
        salesByPeriod,
        customersByPeriod,
        ordersByPeriod,
        categoryPerformance,
        recentOrders,
        topSellingProducts,
        topSellingCategories,
        topSellingBrands
    ] = await Promise.all([
        // Total Revenue: Exclude cancelled items
        Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $nin: ['cancelled', 'failed', 'pending'] }
                }
            },
            { $unwind: '$orderedItems' },
            {
                $match: {
                    'orderedItems.cancellationStatus': { $ne: 'Cancelled' }, // Exclude cancelled items
                    'orderedItems.returnStatus': { $ne: 'Returned' } // Exclude returned items
                }
            },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: { $multiply: ['$orderedItems.price', '$orderedItems.quantity'] }
                    }
                }
            }
        ]),
        // Total Customers (unchanged)
        timeFilter === 'yearly'
            ? User.countDocuments({ isAdmin: false })
            : User.countDocuments({
                  createdAt: { $gte: startDate, $lte: endDate },
                  isAdmin: false
              }),
        // Total Orders (unchanged)
        Order.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $nin: ['cancelled', 'failed'] }
        }),
        // Current Period Revenue: Exclude cancelled items
        Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $nin: ['cancelled', 'failed', 'pending'] }
                }
            },
            { $unwind: '$orderedItems' },
            {
                $match: {
                    'orderedItems.cancellationStatus': { $ne: 'Cancelled' }, // Exclude cancelled items
                    'orderedItems.returnStatus': { $ne: 'Returned' } // Exclude returned items
                }
            },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: { $multiply: ['$orderedItems.price', '$orderedItems.quantity'] }
                    }
                }
            }
        ]),
        // Previous Period Revenue: Exclude cancelled items
        Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: previousStartDate, $lte: previousEndDate },
                    status: { $nin: ['cancelled', 'failed', 'pending'] }
                }
            },
            { $unwind: '$orderedItems' },
            {
                $match: {
                    'orderedItems.cancellationStatus': { $ne: 'Cancelled' }, // Exclude cancelled items
                    'orderedItems.returnStatus': { $ne: 'Returned' } // Exclude returned items
                }
            },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: { $multiply: ['$orderedItems.price', '$orderedItems.quantity'] }
                    }
                }
            }
        ]),
        // Current Period Customers (unchanged)
        User.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate },
            isAdmin: false
        }),
        // Previous Period Customers (unchanged)
        User.countDocuments({
            createdAt: { $gte: previousStartDate, $lte: previousEndDate },
            isAdmin: false
        }),
        // Current Period Orders (unchanged)
        Order.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $nin: ['cancelled', 'failed'] }
        }),
        // Previous Period Orders (unchanged)
        Order.countDocuments({
            createdAt: { $gte: previousStartDate, $lte: previousEndDate },
            status: { $nin: ['cancelled', 'failed'] }
        }),
        // Sales by Period: Exclude cancelled items
        Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $nin: ['cancelled', 'failed', 'pending'] }
                }
            },
            { $unwind: '$orderedItems' },
            {
                $match: {
                    'orderedItems.cancellationStatus': { $ne: 'Cancelled' }, // Exclude cancelled items
                    'orderedItems.returnStatus': { $ne: 'Returned' } // Exclude returned items
                }
            },
            {
                $group: {
                    _id: timeFilter === 'custom' || timeFilter === 'weekly'
                        ? { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                        : timeFilter === 'yearly'
                            ? { $dateToString: { format: '%Y', date: '$createdAt' } }
                            : { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    total: {
                        $sum: { $multiply: ['$orderedItems.price', '$orderedItems.quantity'] }
                    }
                }
            },
            { $sort: { '_id': 1 } }
        ]),
        // Customers by Period (unchanged)
        User.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    isAdmin: false
                }
            },
            {
                $group: {
                    _id: timeFilter === 'custom' || timeFilter === 'weekly'
                        ? { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                        : timeFilter === 'yearly'
                            ? { $dateToString: { format: '%Y', date: '$createdAt' } }
                            : { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]),
        // Orders by Period (unchanged)
        Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $nin: ['cancelled', 'failed'] }
                }
            },
            {
                $group: {
                    _id: timeFilter === 'custom' || timeFilter === 'weekly'
                        ? { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                        : timeFilter === 'yearly'
                            ? { $dateToString: { format: '%Y', date: '$createdAt' } }
                            : { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]),
        // Category Performance (unchanged)
        Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $nin: ['cancelled', 'failed', 'pending'] }
                }
            },
            { $unwind: '$orderedItems' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'orderedItems.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'productDetails.category',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            { $unwind: '$categoryDetails' },
            {
                $group: {
                    _id: '$categoryDetails._id',
                    categoryName: { $first: '$categoryDetails.name' },
                    totalSales: {
                        $sum: {
                            $cond: [
                                { $eq: ['$orderedItems.returnStatus', 'Returned'] },
                                0,
                                { $multiply: ['$orderedItems.price', '$orderedItems.quantity'] }
                            ]
                        }
                    }
                }
            },
            { $sort: { totalSales: -1 } },
            { $limit: 5 }
        ]),
        // Recent Orders (unchanged)
       Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: 'Delivered'
                }
            },
            { $unwind: '$orderedItems' }, // Unwind orderedItems to process each item individually
            {
                $match: {
                    'orderedItems.cancellationStatus': { $ne: 'Cancelled' } // Exclude cancelled items
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            { $unwind: '$userDetails' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'orderedItems.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            {
                $group: {
                    _id: '$_id', // Group by order ID to reconstruct the order
                    orderId: { $first: '$orderId' },
                    customer: { $first: '$userDetails.name' },
                    product: { $first: '$productDetails.productName' }, // Take first product name for display
                    date: { $first: '$createdAt' },
                    status: { $first: '$status' },
                    orderedItems: { $push: '$orderedItems' } // Collect non-cancelled items
                }
            },
            {
                $project: {
                    orderId: 1,
                    customer: 1,
                    product: 1,
                    date: 1,
                    status: 1,
                    totalPrice: {
                        $reduce: {
                            input: '$orderedItems',
                            initialValue: 0,
                            in: {
                                $add: [
                                    '$$value',
                                    {
                                        $cond: [
                                            { $eq: ['$$this.returnStatus', 'Returned'] },
                                            0,
                                            { $multiply: ['$$this.price', '$$this.quantity'] }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            { $sort: { date: -1 } },
            { $limit: 5 }
        ]),
        // Top Selling Products (unchanged)
        Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $nin: ['cancelled', 'failed', 'Return approved', 'refunded'] }
                }
            },
            { $unwind: '$orderedItems' },
            {
                $group: {
                    _id: '$orderedItems.product',
                    totalSold: { $sum: '$orderedItems.quantity' }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            {
                $project: {
                    productName: '$productDetails.productName',
                    productImage: '$productDetails.productImage',
                    totalSold: 1
                }
            }
        ]),
        // Top Selling Categories (unchanged)
        Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $nin: ['cancelled', 'failed', 'Return approved', 'refunded'] }
                }
            },
            { $unwind: '$orderedItems' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'orderedItems.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'productDetails.category',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            { $unwind: '$categoryDetails' },
            {
                $group: {
                    _id: '$categoryDetails._id',
                    name: { $first: '$categoryDetails.name' },
                    totalSold: { $sum: '$orderedItems.quantity' }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]),
        // Top Selling Brands (unchanged)
        Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $nin: ['cancelled', 'failed', 'Return approved', 'refunded'] }
                }
            },
            { $unwind: '$orderedItems' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'orderedItems.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            {
                $lookup: {
                    from: 'brands',
                    localField: 'productDetails.brand',
                    foreignField: '_id',
                    as: 'brandDetails'
                }
            },
            { $unwind: '$brandDetails' },
            {
                $group: {
                    _id: '$brandDetails._id',
                    brandName: { $first: '$brandDetails.brandName' },
                    brandImage: { $first: '$brandDetails.brandImage' },
                    totalSold: { $sum: '$orderedItems.quantity' }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ])
    ]);

    const revenueGrowth = calculateGrowthPercentage(
        currentPeriodRevenue[0]?.total || 0,
        previousPeriodRevenue[0]?.total || 0
    );
    const customerGrowth = calculateGrowthPercentage(
        currentPeriodCustomers,
        previousPeriodCustomers
    );
    const orderGrowth = calculateGrowthPercentage(
        currentPeriodOrders,
        previousPeriodOrders
    );

    const salesData = mapDataToLabels(salesByPeriod, labels, timeFilter, 'total');
    const customersData = mapDataToLabels(customersByPeriod, labels, timeFilter, 'count');
    const ordersData = mapDataToLabels(ordersByPeriod, labels, timeFilter, 'count');

    const categoryLabels = categoryPerformance.map(cat => cat.categoryName);
    const categoryData = categoryPerformance.map(cat => cat.totalSales);

    return {
        summary: {
            totalRevenue: totalRevenue[0]?.total || 0,
            totalCustomers,
            totalOrders,
            revenueGrowth,
            customerGrowth,
            orderGrowth
        },
        sales: {
            labels,
            data: salesData
        },
        customers: {
            labels,
            data: customersData
        },
        orders: {
            labels,
            data: ordersData
        },
        categories: {
            labels: categoryLabels,
            data: categoryData
        },
        recentOrders,
        topSellingProducts,
        topSellingCategories,
        topSellingBrands,
        startDate,
        endDate
    };
}


const calculateGrowthPercentage = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number(((current - previous) / previous * 100).toFixed(1));
};

const mapDataToLabels = (data, labels, timeFilter, valueField) => {
    const result = [];
    const dataMap = new Map();

    data.forEach(item => {
        let key;
        if (timeFilter === 'weekly') {
            key = moment(item._id, 'YYYY-MM-DD').format('ddd');
        } else if (timeFilter === 'custom') {
            key = moment(item._id, 'YYYY-MM-DD').format('MMM D');
        } else if (timeFilter === 'yearly') {
            key = item._id;
        } else {
            key = moment(item._id, 'YYYY-MM').format('MMM');
        }
        dataMap.set(key, item[valueField]);
    });

    labels.forEach(label => {
        result.push(dataMap.get(label) || 0);
    });

    return result;
};

const loadDashboard = async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Expires', '0');
        res.setHeader('Pragma', 'no-cache');

        if (!req.session.admin) {
            return res.redirect('/admin/login');
        }

        let timeFilter = req.query.timeFilter || 'weekly';
        let startDate = req.query.startDate;
        let endDate = req.query.endDate;
        let dateError = null;

        
        if (startDate && endDate) {
            const start = moment(startDate);
            const end = moment(endDate);
            if (end.isBefore(start)) {
                dateError = 'End date must be after start date';
                timeFilter = 'weekly';
                startDate = moment().subtract(6, 'days').format('YYYY-MM-DD');
                endDate = moment().format('YYYY-MM-DD');
            } else if (end.isSame(start, 'day')) {
                dateError = 'Start date and end date cannot be the same';
                timeFilter = 'weekly';
                startDate = moment().subtract(6, 'days').format('YYYY-MM-DD');
                endDate = moment().format('YYYY-MM-DD');
            } else {
                timeFilter = 'custom';
            }
        } else if (timeFilter === 'custom') {
            timeFilter = 'weekly';
            startDate = moment().subtract(6, 'days').format('YYYY-MM-DD');
            endDate = moment().format('YYYY-MM-DD');
        }

        const dashboardData = await getDashboardData(timeFilter, startDate, endDate);

        res.render('dashboard', {
            dashboardData,
            orders: dashboardData.recentOrders,
            topSellingProducts: dashboardData.topSellingProducts,
            topSellingCategories: dashboardData.topSellingCategories,
            topSellingBrands: dashboardData.topSellingBrands,
            timeFilter,
            startDate: startDate || moment(dashboardData.startDate).format('YYYY-MM-DD'),
            endDate: endDate || moment(dashboardData.endDate).format('YYYY-MM-DD'),
            dateError
        });
    } catch (err) {
        console.error('Dashboard load error:', err);
        res.redirect('/admin/pageError');
    }
};

const getDashboardDataAPI = async (req, res) => {
    try {
        const { timeFilter, startDate, endDate } = req.query;

        if (!timeFilter && (!startDate || !endDate)) {
            return res.status(400).json({ error: 'timeFilter or startDate and endDate are required' });
        }

        if (startDate && endDate && moment(endDate).isBefore(moment(startDate))) {
            return res.status(400).json({ error: 'End date must be after start date' });
        }

        const dashboardData = await getDashboardData(timeFilter, startDate, endDate);
        res.json(dashboardData);
    } catch (err) {
        console.error('Dashboard data API error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const logout = async (req, res) => {
    try {
        delete req.session.admin;
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Expires', '0');
        res.setHeader('Pragma', 'no-cache');
        res.redirect('/admin/login');
    } catch (error) {
        console.error('Admin logout Error:', error);
        res.redirect('/admin/pageError');
    }
};



module.exports = {
    loadLogin,
    login,
    loadDashboard,
    getDashboardDataAPI,
    pageError,
    logout
}