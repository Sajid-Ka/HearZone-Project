const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminController');
const { isAdminAuth, isAdminLogin } = require('../middlewares/auth');
const customerController = require('../controllers/admin/customerController');
const categoryController = require('../controllers/admin/categoryController');
const brandController = require('../controllers/admin/brandController');
const productController = require('../controllers/admin/productController');
const couponController = require('../controllers/admin/couponController');

// Import the configured multer instance only once
const upload = require('../helpers/multer');

router.get('/pageError', adminController.pageError);

// Login and logout routes with proper middleware
router.get('/login', isAdminLogin, adminController.loadLogin);
router.post('/login', isAdminLogin, adminController.login);
router.get('/dashboard', adminController.loadDashboard);
router.get('/logout', isAdminAuth, adminController.logout);

// Apply adminAuth middleware to all routes
router.use(isAdminAuth);

// Protect all admin routes with isAdminAuth
router.get('/users', customerController.customerInfo);
router.get('/blockCustomer', customerController.customerBlocked);
router.get('/unblockCustomer', customerController.customerUnblocked);

//category
router.get('/category', categoryController.categoryInfo);
router.post('/category', categoryController.addCategory);
router.get('/listCategory', categoryController.getListCategory);
router.get('/unlistCategory', categoryController.getUnlistCategory);
router.post('/editCategory/:id', categoryController.editCategory);
router.get('/deleteCategory', categoryController.deleteCategory); 

//brand
router.get('/brands', brandController.getAllBrands);
router.post('/brands/add', upload.single('brandImage'), brandController.addBrand);
router.post('/brands/update', upload.single('brandImage'), brandController.updateBrand);
router.post('/brands/toggle', brandController.toggleBrandStatus);
router.post('/brands/delete', brandController.deleteBrand);

//product 
router.get('/addProducts', productController.getProductAddPage);
router.post('/addProducts', upload.array("images",4), productController.addProducts);
router.get('/products', productController.getAllProducts);
router.get('/blockProduct', productController.blockProduct);
router.get('/unblockProduct', productController.unblockProduct);
router.get('/editProduct', productController.getEditProduct);
router.post('/editProduct/:id', upload.array("images",4), productController.editProduct);
router.post('/deleteImage', productController.deleteSingleImage);

//coupon
router.get('/coupons', couponController.getCouponPage);
router.get('/coupons/add-page', couponController.getAddCouponPage);
router.post('/coupons/add', couponController.createCoupon);
router.get('/coupons/delete/:id', couponController.deleteCoupon);


module.exports = router;