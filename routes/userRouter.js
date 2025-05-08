const express = require('express');
const router = express.Router();
const userController = require('../controllers/user/userController');
const productController = require('../controllers/user/productController');
const forgotPasswordController = require('../controllers/user/forgotPasswordController');
const profileController = require('../controllers/user/profileController');
const addressController = require('../controllers/user/addressController');
const cartController = require('../controllers/user/cartController');
const wishlistController = require('../controllers/user/wishlistController');
const checkoutController = require('../controllers/user/checkoutController');
const orderController = require('../controllers/user/orderController');
const { isLogin, isLogout, userAuth } = require('../middlewares/auth');
const couponController = require('../controllers/user/couponController');
const passport = require('passport');
const User = require('../models/userSchema'); 
const reviewController = require('../controllers/user/reviewController');
const walletController = require('../controllers/user/walletController');
const multer = require('../helpers/multer');

// Public routes (no authentication required)
router.get('/', userController.loadHomepage);
router.get('/shop', userController.loadShoppingPage);
router.post('/search', userController.searchProducts);
router.get('/filter', userController.filterProduct);
router.get('/filter-price', userController.filterByPrice);
router.get('/product-details', productController.productDetails);
router.get('/login', isLogin, userController.loadLogin);
router.post('/login', isLogin, userController.login);
router.get('/signup', isLogin, userController.loadSignup);
router.post('/signup', isLogin, userController.signup);
router.post('/verify-otp', isLogin, userController.verifyOtp);
router.post('/resend-otp', isLogin, userController.resendOtp);

// Forgot Password routes
router.get('/forgot-password', forgotPasswordController.getForgotPassPage);
router.post('/forgot-email-valid', forgotPasswordController.forgotEmailValid);
router.get('/forgotPass-otp', forgotPasswordController.getForgotPassOtpPage);
router.post('/verify-passForgot-otp', forgotPasswordController.verifyForgotPassOtp);
router.get('/reset-password', forgotPasswordController.getResetPassPage);
router.post('/reset-password', forgotPasswordController.postNewPassword);
router.post('/resend-forgot-otp', forgotPasswordController.resendOtp);

// Google Auth routes
router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
    passport.authenticate('google', { 
      failureRedirect: '/login',
      failureFlash: true 
    }),
    async (req, res) => {
      try {
        if (!req.user) {
          return res.redirect('/login?message=Authentication failed');
        }
  
        // Check if user is blocked
        const user = await User.findById(req.user._id);
        if (!user) {
          return res.redirect('/login?message=User not found');
        }
  
        if (user.isBlocked) {
          req.logout((err) => {
            if (err) console.error('Logout error:', err);
            return res.redirect('/login?message=User is blocked');
          });
          return;
        }
  
        // Successful authentication
        req.session.user = {
          id: user._id.toString(),
          name: user.name,
          email: user.email
        };
  
        res.redirect('/');
      } catch (error) {
        console.error('Google auth callback error:', error);
        res.redirect('/login?message=Login error');
      }
    }
);

// Public routes with cache control
router.get('/login', isLogin, (req, res) => {
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    userController.loadLogin(req, res);
});

router.get('/signup', isLogin, (req, res) => {
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    userController.loadSignup(req, res);
});

// Protected routes (require authentication)
router.use(userAuth);

router.get('/logout', userController.logout);

// Profile routes
router.get('/profile', profileController.getProfilePage);
router.get('/edit-profile', profileController.getEditProfilePage);
router.post('/edit-profile', profileController.updateProfile);
router.get('/verify-email-otp', profileController.getVerifyEmailOtpPage);
router.post('/verify-email-otp', profileController.verifyEmailOtp);
router.post('/resend-email-otp', profileController.resendEmailOtp);
router.post('/update-profile-image', 
    multer.upload.single('profileImage'), 
    profileController.updateProfileImage
);

// Review routes
router.post('/review/add', reviewController.addReview);
router.get('/review/product/:productId', reviewController.getProductReviews);
router.get('/review/full/:productId', reviewController.getFullReviews);
router.post('/review/delete/:reviewId', reviewController.deleteReview);

// Address routes
router.get('/address', addressController.getAddressPage);
router.post('/address/add', addressController.addAddress);
router.get('/address/edit/:id', userAuth, addressController.getEditAddressPage);
router.post('/address/edit/:id', addressController.editAddress);
router.post('/address/delete/:id', addressController.deleteAddress);

// Cart routes
router.get('/cart', userAuth, cartController.getCartItems);
router.post('/cart/add', userAuth, cartController.addToCart);
router.post('/cart/update-quantity', userAuth, cartController.updateQuantity);
router.post('/cart/remove', userAuth, cartController.removeItem);
router.post('/cart/clear', userAuth, cartController.clearCart);

// Wishlist routes 
router.get('/wishlist', userAuth, wishlistController.getWishlistItems);
router.post('/wishlist/add', userAuth, wishlistController.addToWishlist);
router.post('/wishlist/remove', userAuth, wishlistController.removeFromWishlist);
router.post('/wishlist/check', userAuth, wishlistController.checkWishlistStatus);

// checkout routes
router.get('/checkout', checkoutController.getCheckoutPage);
router.post('/place-order', checkoutController.placeOrder);
router.post('/verify-payment', checkoutController.verifyRazorpayPayment);
router.get('/order-success', checkoutController.getOrderSuccessPage);
router.get('/order-failure', checkoutController.getOrderFailurePage);
router.post('/clear-session',checkoutController.clearSession);

//order routes
router.get('/orders', orderController.getOrderList);
router.get('/orders/search', orderController.searchOrders);
router.get('/orders/:orderId', orderController.getOrderDetails);
router.post('/orders/:orderId/cancel', orderController.cancelOrder);
router.post('/orders/:orderId/return', orderController.returnOrder);
router.post('/orders/:orderId/cancel-return-request', orderController.cancelReturnRequest);
router.get('/orders/:orderId/invoice', orderController.downloadInvoice);
router.post('/orders/:orderId/cancel-item', orderController.cancelOrderItem);
router.post('/orders/:orderId/return-item', orderController.returnOrderItem);
router.post('/orders/:orderId/cancel-return-item', orderController.cancelReturnItem);

// Coupon routes
router.get('/coupon/available', couponController.getAvailableCoupons);
router.post('/coupon/apply', couponController.applyCoupon);
router.post('/coupon/remove', couponController.removeCoupon);

// Wallet routes
router.get('/wallet', walletController.getWallet);
router.post('/wallet/pay/:orderId', walletController.initiateWalletPayment);

module.exports = router;