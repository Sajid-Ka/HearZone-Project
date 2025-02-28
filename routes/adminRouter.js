const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminController');
const {userAuth,adminAuth} = require('../middlewares/auth');
const customerController = require('../controllers/admin/customerController')

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






module.exports = router;


