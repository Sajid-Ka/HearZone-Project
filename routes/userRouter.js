const express = require('express');
const router = express.Router();
const userController = require('../controllers/user/userController');
const productController = require('../controllers/user/productController');
const profileController = require('../controllers/user/profileController');
const { isLogin, isLogout, userAuth } = require('../middlewares/auth');
const couponController = require('../controllers/user/couponController');
const passport = require('passport');
const reviewController = require('../controllers/user/reviewController');

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

// Apply userAuth middleware to all routes
router.use(userAuth);

// Auth routes - Add isLogin middleware
router.get('/signup', isLogin, userController.loadSignup);
router.post('/signup', isLogin, userController.signup);
router.post('/verify-otp', isLogin, userController.verifyOtp);
router.post('/resend-otp', isLogin, userController.resendOtp);
router.get('/login', isLogin, userController.loadLogin);
router.post('/login', isLogin, userController.login);
router.get('/logout', isLogout, userController.logout);

// Profile routes
router.get('/forgot-password', profileController.getForgotPassPage);
router.post('/forgot-email-valid', profileController.forgotEmailValid); // update this route
router.post('/verify-passForgot-otp', profileController.verifyForgotPassOtp);
router.get('/reset-password', profileController.getResetPassPage);
router.post('/reset-password', profileController.postNewPassword);
router.post('/resend-forgot-otp', profileController.resendOtp);

//profile management routs
router.get('/profile', isLogout, profileController.getProfilePage);
router.get('/edit-profile', isLogout, profileController.getEditProfilePage);
router.post('/edit-profile', isLogout, profileController.updateProfile);
router.post('/verify-email-otp', isLogout, profileController.verifyEmailOtp);
router.post('/resend-email-otp', isLogout, profileController.resendEmailOtp);

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

// review routes
router.post('/review/add', isLogout, reviewController.addReview);
router.get('/review/product/:productId', reviewController.getProductReviews);
router.get('/review/full/:productId', (req, res, next) => {
    // Validate ObjectId before proceeding
    if (!req.params.productId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(404).render('page-404');
    }
    reviewController.getFullReviews(req, res, next);
});
router.post('/review/delete/:reviewId', isLogout, reviewController.deleteReview);

//coupon routes
router.get('/coupon/available', couponController.getAvailableCoupons);



module.exports = router;