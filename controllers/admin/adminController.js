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



async function getDashboardData(timeFilter) {
    const currentDate = new Date();
    let startDate, labels, format;

    // Set time filter parameters
    switch (timeFilter) {
        case 'weekly':
            startDate = moment().subtract(6, 'days').startOf('day').toDate();
            labels = Array.from({ length: 7 }, (_, i) =>
                moment().subtract(6 - i, 'days').format('ddd')
            );
            format = '%Y-%m-%d';
            break;
        case 'yearly':
            startDate = moment().subtract(5, 'years').startOf('year').toDate();
            labels = Array.from({ length: 6 }, (_, i) =>
                moment().subtract(5 - i, 'years').format('YYYY')
            );
            format = '%Y';
            break;
        case 'monthly':
        default:
            startDate = moment().subtract(5, 'months').startOf('month').toDate();
            labels = Array.from({ length: 6 }, (_, i) =>
                moment().subtract(5 - i, 'months').format('MMM')
            );
            format = '%Y-%m';
    }

    // Fetch data in parallel
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
        recentOrders
    ] = await Promise.all([
        Order.aggregate([
            { $match: { status: { $nin: ['cancelled', 'failed', 'Return approved', 'refunded', 'pending'] } } },
            { $group: { _id: null, total: { $sum: '$finalAmount' } } }
        ]),
        User.countDocuments({ isAdmin: false }),
        Order.countDocuments({ status: { $nin: ['cancelled', 'failed'] } }),
        Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: currentDate },
                    status: { $nin: ['cancelled', 'failed', 'Return approved', 'refunded'] }
                }
            },
            { $group: { _id: null, total: { $sum: '$finalAmount' } } }
        ]),
        Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: moment(startDate).subtract(
                            timeFilter === 'weekly' ? 7 : timeFilter === 'yearly' ? 6 : 6,
                            timeFilter === 'weekly' ? 'days' : timeFilter === 'yearly' ? 'years' : 'months'
                        ).toDate(),
                        $lt: startDate
                    },
                    status: { $nin: ['cancelled', 'failed', 'Return approved', 'refunded'] }
                }
            },
            { $group: { _id: null, total: { $sum: '$finalAmount' } } }
        ]),
        User.countDocuments({
            createdAt: { $gte: startDate, $lte: currentDate },
            isAdmin: false
        }),
        User.countDocuments({
            createdAt: {
                $gte: moment(startDate).subtract(
                    timeFilter === 'weekly' ? 7 : timeFilter === 'yearly' ? 6 : 6,
                    timeFilter === 'weekly' ? 'days' : timeFilter === 'yearly' ? 'years' : 'months'
                ).toDate(),
                $lt: startDate
            },
            isAdmin: false
        }),
        Order.countDocuments({
            createdAt: { $gte: startDate, $lte: currentDate },
            status: { $nin: ['cancelled', 'failed'] }
        }),
        Order.countDocuments({
            createdAt: {
                $gte: moment(startDate).subtract(
                    timeFilter === 'weekly' ? 7 : timeFilter === 'yearly' ? 6 : 6,
                    timeFilter === 'weekly' ? 'days' : timeFilter === 'yearly' ? 'years' : 'months'
                ).toDate(),
                $lt: startDate
            },
            status: { $nin: ['cancelled', 'failed'] }
        }),
        Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: currentDate },
                    status: { $nin: ['cancelled', 'failed', 'Return approved', 'refunded'] }
                }
            },
            {
                $group: {
                    _id: timeFilter === 'weekly'
                        ? { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                        : timeFilter === 'yearly'
                            ? { $dateToString: { format: '%Y', date: '$createdAt' } }
                            : { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    total: { $sum: '$finalAmount' }
                }
            },
            { $sort: { '_id': 1 } }
        ]),
        User.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: currentDate },
                    isAdmin: false
                }
            },
            {
                $group: {
                    _id: timeFilter === 'weekly'
                        ? { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                        : timeFilter === 'yearly'
                            ? { $dateToString: { format: '%Y', date: '$createdAt' } }
                            : { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]),
        Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: currentDate },
                    status: { $nin: ['cancelled', 'failed'] }
                }
            },
            {
                $group: {
                    _id: timeFilter === 'weekly'
                        ? { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                        : timeFilter === 'yearly'
                            ? { $dateToString: { format: '%Y', date: '$createdAt' } }
                            : { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]),
        Order.aggregate([
            {
                $match: {
                    status: { $nin: ['cancelled', 'failed', 'Return approved', 'refunded'] }
                }
            },
            { $unwind: '$orderedItems' }, // Changed from order_items
            {
                $lookup: {
                    from: 'products',
                    localField: 'orderedItems.product', // Changed from order_items.productId
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
                    totalSales: { $sum: { $multiply: ['$orderedItems.price', '$orderedItems.quantity'] } }
                }
            },
            { $sort: { totalSales: -1 } },
            { $limit: 5 }
        ]),
        Order.aggregate([
            { $match: { status: { $nin: ['cancelled', 'failed'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
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
                    localField: 'orderedItems.product', // Changed from order_items.productId
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $project: {
                    orderId: 1,
                    customer: '$userDetails.name',
                    product: { $arrayElemAt: ['$productDetails.productName', 0] },
                    date: '$createdAt',
                    totalPrice: 1,
                    status: 1
                }
            }
        ])
    ]);

    // Calculate growth percentages
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

    // Map data to chart format
    const salesData = mapDataToLabels(salesByPeriod, labels, timeFilter, 'total');
    const customersData = mapDataToLabels(customersByPeriod, labels, timeFilter, 'count');
    const ordersData = mapDataToLabels(ordersByPeriod, labels, timeFilter, 'count');

    // Prepare category data
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
        recentOrders
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
            key = moment(item._id).format('ddd');
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
        // Prevent caching
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Expires', '0');
        res.setHeader('Pragma', 'no-cache');

        // Check admin session
        if (!req.session.admin) {
            return res.redirect('/admin/login');
        }

        // Fetch recent orders with corrected populate field
        const orders = await Order.find({ status: { $nin: ['failed'] } })
            .populate('userId', 'name email mobile')
            .populate('orderedItems.product', 'productName productImages price') // Corrected path
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

            

        // Get time filter (default to monthly)
        const timeFilter = req.query.timeFilter || 'monthly';

        // Fetch dashboard data and top-selling data in parallel
        const [dashboardData, topSellingProducts, topSellingCategories, topSellingBrands] = await Promise.all([
            getDashboardData(timeFilter),
            Order.aggregate([
                { $match: { status: { $nin: ['cancelled', 'failed', 'Return approved', 'refunded'] } } },
                { $unwind: '$orderedItems' }, // Changed from order_items
                {
                    $group: {
                        _id: '$orderedItems.product', // Changed from order_items.productId
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
                        productImages: '$productDetails.productImages',
                        totalSold: 1
                    }
                }
            ]),
            Order.aggregate([
                { $match: { status: { $nin: ['cancelled', 'failed', 'Return approved', 'refunded'] } } },
                { $unwind: '$orderedItems' }, // Changed from order_items
                {
                    $lookup: {
                        from: 'products',
                        localField: 'orderedItems.product', // Changed from order_items.productId
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
            Order.aggregate([
                { $match: { status: { $nin: ['cancelled', 'failed', 'Return approved', 'refunded'] } } },
                { $unwind: '$orderedItems' }, // Changed from order_items
                {
                    $lookup: {
                        from: 'products',
                        localField: 'orderedItems.product', // Changed from order_items.productId
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

        // Render dashboard
        res.render('dashboard', {
            dashboardData,
            orders,
            topSellingProducts,
            topSellingCategories,
            topSellingBrands,
            timeFilter
        });
    } catch (err) {
        console.error('Dashboard load error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getDashboardDataAPI = async (req, res) => {
    try {
        const { timeFilter } = req.query;
        if (!timeFilter) {
            return res.status(400).json({ error: 'timeFilter parameter is required' });
        }

        const dashboardData = await getDashboardData(timeFilter);
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