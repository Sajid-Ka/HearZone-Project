const express = require('express');
const router = express.Router();
const userController = require('../controllers/user/userController');
const productController = require('../controllers/user/productController');
const profileController = require('../controllers/user/profileController');
const { isLogin, isLogout, userAuth } = require('../middlewares/auth');
const passport = require('passport');

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
router.post('/forgot-password', profileController.forgotEmailValid);
router.post('/verify-forgot-otp', profileController.verifyForgotPassOtp);
router.get('/reset-password', profileController.getResetPassPage);
router.post('/reset-password', profileController.postNewPassword);
router.post('/resend-forgot-otp', profileController.resendOtp);

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

module.exports = router;