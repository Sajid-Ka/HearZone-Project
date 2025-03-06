const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminController');
const {userAuth,adminAuth} = require('../middlewares/auth');
const customerController = require('../controllers/admin/customerController');
const categoryController = require('../controllers/admin/categoryController');
const brandController = require('../controllers/admin/brandController');
const productController = require('../controllers/admin/productController');
const multer = require('multer');
const storage = require('../helpers/multer');
const uploads = multer({storage:storage});

router.get('/pageError',adminController.pageError);

//login and logout
router.get('/login',adminController.loadLogin);
router.post('/login',adminController.login);
router.get('/dashboard',adminAuth, adminController.loadDashboard);
router.get('/logout',adminController.logout);

//costomer
router.get('/users',adminAuth,customerController.customerInfo);
router.get('/blockCustomer',adminAuth,customerController.customerBlocked);
router.get('/unblockCustomer',adminAuth,customerController.customerUnblocked);

//category
router.get('/category', adminAuth, categoryController.categoryInfo);
router.post('/category', adminAuth, categoryController.addCategory);
router.get('/listCategory', adminAuth, categoryController.getListCategory);
router.get('/unlistCategory', adminAuth, categoryController.getUnlistCategory);
router.post('/editCategory/:id', adminAuth, categoryController.editCategory);
router.get('/deleteCategory', adminAuth, categoryController.deleteCategory); 


//brand
router.get('/brands',adminAuth, brandController.getAllBrands);
router.post('/brands/add',adminAuth, uploads.single('brandImage'), brandController.addBrand);
router.post('/brands/update',adminAuth, uploads.single('brandImage'), brandController.updateBrand);
router.post('/brands/toggle',adminAuth, brandController.toggleBrandStatus);
router.post('/brands/delete',adminAuth, brandController.deleteBrand);

//product 
router.get('/addProducts',adminAuth,productController.getProductAddPage);
router.post('/addProducts',adminAuth,uploads.array("images",4),productController.addProducts);
router.get('/products',adminAuth,productController.getAllProducts);
router.get('/blockProduct',adminAuth,productController.blockProduct);
router.get('/unblockProduct',adminAuth,productController.unblockProduct);


module.exports = router;