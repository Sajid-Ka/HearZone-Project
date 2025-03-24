const express = require('express');
const router = express.Router();
const userController = require('../controllers/user/userController');
const productController = require('../controllers/user/productController');
const forgotPasswordController = require('../controllers/user/forgotPasswordController');
const profileController = require('../controllers/user/profileController');
const { isLogin, isLogout, userAuth } = require('../middlewares/auth');
const couponController = require('../controllers/user/couponController');
const passport = require('passport');
const reviewController = require('../controllers/user/reviewController');
const multer = require('../helpers/multer');

// Public routes
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

// Apply userAuth middleware
router.use(userAuth);

// Auth routes
router.get('/signup', isLogin, userController.loadSignup);
router.post('/signup', isLogin, userController.signup);
router.post('/verify-otp', isLogin, userController.verifyOtp);
router.post('/resend-otp', isLogin, userController.resendOtp);
router.get('/login', isLogin, userController.loadLogin);
router.post('/login', isLogin, userController.login);
router.get('/logout', isLogout, userController.logout);

// Forgot Password routes
router.get('/forgot-password', forgotPasswordController.getForgotPassPage);
router.post('/forgot-email-valid', forgotPasswordController.forgotEmailValid);
router.post('/verify-passForgot-otp', forgotPasswordController.verifyForgotPassOtp);
router.get('/reset-password', forgotPasswordController.getResetPassPage);
router.post('/reset-password', forgotPasswordController.postNewPassword);
router.post('/resend-forgot-otp', forgotPasswordController.resendOtp);

// Profile management routes
router.get('/profile', isLogout, profileController.getProfilePage);
router.get('/edit-profile', isLogout, profileController.getEditProfilePage);
router.post('/edit-profile', isLogout, profileController.updateProfile);
router.get('/verify-email-otp', isLogout, profileController.getVerifyEmailOtpPage);
router.post('/verify-email-otp', isLogout, profileController.verifyEmailOtp);
router.post('/resend-email-otp', isLogout, profileController.resendEmailOtp);
router.post('/update-profile-image', multer.profileUpload.single('profileImage'), profileController.updateProfileImage);

// Google Auth routes
router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
    passport.authenticate('google', { 
        failureRedirect: '/login',
        failureFlash: true
    }),
    (req, res) => {
        req.session.user = {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email
        };
        res.redirect('/');
    }
);

// Review routes
router.post('/review/add', isLogout, reviewController.addReview);
router.get('/review/product/:productId', reviewController.getProductReviews);
router.get('/review/full/:productId', (req, res, next) => {
    if (!req.params.productId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(404).render('page-404');
    }
    reviewController.getFullReviews(req, res, next);
});
router.post('/review/delete/:reviewId', isLogout, reviewController.deleteReview);

// Coupon routes
router.get('/coupon/available', couponController.getAvailableCoupons);

module.exports = router;