const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin/adminController');
const { isAdminAuth, isAdminLogin } = require('../middlewares/auth');
const customerController = require('../controllers/admin/customerController');
const orderController = require('../controllers/admin/orderController');
const categoryController = require('../controllers/admin/categoryController');
const brandController = require('../controllers/admin/brandController');
const productController = require('../controllers/admin/productController');
const couponController = require('../controllers/admin/couponController');
const walletController = require('../controllers/admin/walletController');
const offerController = require('../controllers/admin/offerController');
const salesReportController = require('../controllers/admin/salesReportController');
const multer = require('../helpers/multer');

router.get('/pageError', adminController.pageError);

// Login and logout routes with proper middleware
router.get('/login', isAdminLogin, adminController.loadLogin);
router.post('/login', isAdminLogin, adminController.login);
router.get('/dashboard', isAdminAuth, adminController.loadDashboard);
router.get('/logout', isAdminAuth, adminController.logout);

// Apply adminAuth middleware to all routes
router.use(isAdminAuth);

// Offer routes
router.get('/offers', offerController.getOfferPage);
router.post('/offers/create', offerController.createOffer);
router.post('/offers/assign', offerController.assignOfferToProduct);
router.post('/offers/remove', offerController.removeOfferFromProduct);

// customers
router.get('/users', customerController.customerInfo);
router.get('/blockCustomer', customerController.customerBlocked);
router.post('/blockCustomer', customerController.customerBlocked);
router.get('/unblockCustomer', customerController.customerUnblocked);
router.post('/unblockCustomer', customerController.customerUnblocked);

// Order management routes
router.get('/orders', orderController.listOrders);
router.get('/orders/details/:orderId', orderController.viewOrderDetails); 
router.post('/orders/update-status/:orderId', orderController.updateOrderStatus);
router.post('/orders/cancel/:orderId', orderController.processCancelRequest);
router.post('/orders/:orderId/return', orderController.processReturnRequest);
router.get('/orders/invoice/:orderId', orderController.downloadInvoice); 
router.get('/orders/timeline/:orderId', orderController.getOrderStatusTimeline);
router.post('/orders/cancel-item/:orderId', orderController.processCancelItemRequest);
router.post('/orders/return-item/:orderId', orderController.processReturnItemRequest); 

// Order request routes
router.get('/pending-requests', orderController.getPendingRequests);
router.get('/orders/request-counts', orderController.getRequestCounts);
router.get('/orders/cancel-requests', orderController.getCancelRequests);
router.get('/orders/return-requests', orderController.getReturnRequests);
router.post('/orders/cancel-request/:orderId', orderController.handleCancelRequest);
router.post('/orders/return-request/:orderId', orderController.handleReturnRequest);

//category
router.get('/category', categoryController.categoryInfo);
router.post('/category', categoryController.addCategory);
router.get('/listCategory', categoryController.getListCategory);
router.get('/unlistCategory', categoryController.getUnlistCategory);
router.get('/editCategory', categoryController.getEditCategory);
router.post('/editCategory', categoryController.editCategory);
router.get('/deleteCategory', categoryController.deleteCategory);
router.post('/addCategoryOffer', categoryController.addCategoryOffer);
router.post('/cancelCategoryOffer', categoryController.cancelCategoryOffer);

//brand
router.get('/brands', brandController.getAllBrands);
router.post('/brands/add', 
    multer.upload.single('brandImage'),
    (req, res, next) => {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No brand image was uploaded' 
            });
        }
        next();
    },
    brandController.addBrand
);
router.post('/brands/update', multer
    .upload.single('brandImage'), brandController.updateBrand);
router.post('/brands/toggle', brandController.toggleBrandStatus);
router.post('/brands/delete', brandController.deleteBrand);

//product 
router.get('/addProducts', productController.getProductAddPage);

router.post('/addProducts', 
    multer.upload.array('images', 4),
    (req, res, next) => {
        if (!req.files) {
            return res.status(400).json({ 
                success: false, 
                message: 'No files were uploaded' 
            });
        }
        next();
    },
    productController.addProducts
);

router.get('/checkProductName', isAdminAuth, productController.checkProductName);
router.get('/products', productController.getAllProducts);
router.post('/blockProduct', productController.blockProduct);
router.post('/unblockProduct', productController.unblockProduct);
router.get('/editProduct', productController.getEditProduct);
router.post('/editProduct/:id', 
    multer.upload.array('images', 4),
    (req, res, next) => {
        if (!req.files && req.files.length === 0) {
            return next();
        }
        next();
    },
    productController.editProduct
);
router.post('/deleteImage', productController.deleteSingleImage);

// coupon routes
router.get('/coupons', couponController.getCouponPage);
router.get('/coupons/add-page', couponController.getAddCouponPage);
router.post('/coupons/add', couponController.createCoupon);
router.post('/coupons/delete/:id', couponController.deleteCoupon);
router.post('/coupons/toggle/:id', couponController.toggleCouponStatus);

//Wallet routes
router.get('/wallets', walletController.getAllWallets);
router.get('/wallets/:userId', walletController.getWalletDetails);
router.post('/orders/:orderId/wallet-payment', orderController.processWalletPayment);

// Sales Report Routes
router.get('/sales-report', salesReportController.loadSalesReportPage);
router.post('/sales-report/generate', salesReportController.generateSalesReport);
router.get('/sales-report/download/pdf', salesReportController.downloadSalesReportPDF);
router.get('/sales-report/download/excel', salesReportController.downloadSalesReportExcel);

module.exports = router;