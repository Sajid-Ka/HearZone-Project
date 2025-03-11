const express = require('express');
const router = express.Router();
const userController = require("../controllers/user/userController");
const profileController = require('../controllers/user/profileController');
const {userAuth,adminAuth} = require('../middlewares/auth');
const passport = require('passport');


router.get('/pageNotFound',userController.pageNotFound);

//home page
router.get('/',userController.loadHomepage);
router.get('/shop',userAuth,userController.loadShoppingPage);
router.get('/filter',userAuth,userController.filterProduct);
router.get('/shop/filter', userController.filterProduct); // Add this line to handle filter URLs

//signup
router.get('/signup',userController.loadSignup);
router.post('/signup',userController.signup)
router.post('/verify-otp',userController.verifyOtp);
router.post('/resend-otp',userController.resendOtp);

//signup with google
router.get('/auth/google',
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        prompt: 'select_account'
    })
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

//login 
router.get('/login',userController.loadLogin);
router.post('/login',userController.login);

//logout
router.get('/logout',userController.logout);

//profile-management
router.get('/forgot-password',profileController.getForgotPassPage);
router.post('/forgot-email-valid',profileController.forgotEmailValid);
router.post('/verify-passForgot-otp',profileController.verifyForgotPassOtp);
router.get('/reset-password',profileController.getResetPassPage);
router.post('/resend-forgot-otp',profileController.resendOtp);
router.post('/reset-password',profileController.postNewPassword);

module.exports = router;