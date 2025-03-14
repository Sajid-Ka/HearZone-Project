const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminController');
const { isAdminAuth, isAdminLogin } = require('../middlewares/auth');
const customerController = require('../controllers/admin/customerController');
const categoryController = require('../controllers/admin/categoryController');
const brandController = require('../controllers/admin/brandController');
const productController = require('../controllers/admin/productController');

// Import the configured multer instance only once
const upload = require('../helpers/multer');

router.get('/pageError', adminController.pageError);

// Login and logout routes with proper middleware
router.get('/login', isAdminLogin, adminController.loadLogin);
router.post('/login', isAdminLogin, adminController.login);
router.get('/dashboard', isAdminAuth, adminController.loadDashboard);
router.get('/logout', isAdminAuth, adminController.logout);

// Protect all admin routes with isAdminAuth
router.get('/users', isAdminAuth, customerController.customerInfo);
router.get('/blockCustomer', isAdminAuth, customerController.customerBlocked);
router.get('/unblockCustomer', isAdminAuth, customerController.customerUnblocked);

//category
router.get('/category', isAdminAuth, categoryController.categoryInfo);
router.post('/category', isAdminAuth, categoryController.addCategory);
router.get('/listCategory', isAdminAuth, categoryController.getListCategory);
router.get('/unlistCategory', isAdminAuth, categoryController.getUnlistCategory);
router.post('/editCategory/:id', isAdminAuth, categoryController.editCategory);
router.get('/deleteCategory', isAdminAuth, categoryController.deleteCategory); 

//brand
router.get('/brands', isAdminAuth, brandController.getAllBrands);
router.post('/brands/add', isAdminAuth, upload.single('brandImage'), brandController.addBrand);
router.post('/brands/update', isAdminAuth, upload.single('brandImage'), brandController.updateBrand);
router.post('/brands/toggle', isAdminAuth, brandController.toggleBrandStatus);
router.post('/brands/delete', isAdminAuth, brandController.deleteBrand);

//product 
router.get('/addProducts', isAdminAuth, productController.getProductAddPage);
router.post('/addProducts', isAdminAuth, upload.array("images",4), productController.addProducts);
router.get('/products', isAdminAuth, productController.getAllProducts);
router.get('/blockProduct', isAdminAuth, productController.blockProduct);
router.get('/unblockProduct', isAdminAuth, productController.unblockProduct);
router.get('/editProduct', isAdminAuth, productController.getEditProduct);
router.post('/editProduct/:id', isAdminAuth, upload.array("images",4), productController.editProduct);
router.post('/deleteImage', isAdminAuth, productController.deleteSingleImage);

module.exports = router;