const express = require('express');
const router = express.Router();
const userController = require('../controllers/user/userController');
const productController = require('../controllers/user/productController');
const profileController = require('../controllers/user/profileController');

// Define routes without creating circular dependencies
router.get('/', userController.loadHomepage);
router.get('/shop', userController.loadShoppingPage);
router.post('/search', userController.searchProducts);
router.get('/filter', userController.filterProduct);
router.get('/filter-price', userController.filterByPrice);
router.get('/product-details', async (req, res, next) => {
    try {
        await productController.productDetails(req, res);
    } catch (error) {
        next(error);
    }
});

// Auth routes
router.get('/signup', userController.loadSignup);
router.post('/signup', userController.signup);
router.post('/verify-otp', userController.verifyOtp);
router.post('/resend-otp', userController.resendOtp);
router.get('/login', userController.loadLogin);
router.post('/login', userController.login);
router.get('/logout', userController.logout);

// Profile routes
router.get('/forgot-password', profileController.getForgotPassPage);
router.post('/forgot-password', profileController.forgotEmailValid);
router.post('/verify-forgot-otp', profileController.verifyForgotPassOtp);
router.get('/reset-password', profileController.getResetPassPage);
router.post('/reset-password', profileController.postNewPassword);
router.post('/resend-forgot-otp', profileController.resendOtp);

module.exports = router;