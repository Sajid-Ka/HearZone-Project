const User = require('../../models/userSchema');
const Coupon = require('../../models/couponSchema');
const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema');
const Brand = require('../../models/brandSchema');
const Cart = require('../../models/cartSchema');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { generateReferralCode } = require('../../utils/referralUtils');
require('dotenv').config();

const securePassword = async (password) => {
    try {
        return await bcrypt.hash(password, 10);
    } catch (error) {
        console.error('Password hashing error:', error);
        throw new Error('Failed to hash password');
    }
};

const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendVerificationEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        });

        const mailOptions = {
            from: `HearZone <noreply@yourdomain.com>`,
            to: email,
            subject: 'Your OTP for Account Verification',
            replyTo: 'support@yourdomain.com',
            text: `Hello,\n\nYour OTP is ${otp}.\n\nThis code is valid for 1 minutes.\n\nBest regards,\nHearZone`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>HearZone</h2>
                    <p>Hello,</p>
                    <p>Your OTP is <b>${otp}</b>. This code is valid for 1 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    
                    <p>Best regards,<br>HearZone</p>
                    <p><a href="https://yourdomain.com">Visit our website</a></p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        return info.accepted.length > 0;
    } catch (error) {
        console.error('Email sending error:', error);
        return false;
    }
};

const pageNotFound = async (req, res) => {
    try {
      res.status(404).render('page-404');
    } catch (err) {
      console.error('Page not found error:', err);
      res.status(500).render('error', { message: 'Server error' });
    }
};

const loadHomepage = async (req, res) => {
    try {
        const userData = req.session.user;
        const categories = await Category.find({ isListed: true });
        const categoryIds = categories.map(category => category._id);

        const blockedBrands = await Brand.find({ isBlocked: true }).select('_id');
        const blockedBrandIds = blockedBrands.map(brand => brand._id);

        let productData = await Product.find({
            isBlocked: false,
            category: { $in: categoryIds },
            brand: { $nin: blockedBrandIds } 
        })
        .populate('brand')
        .populate('offer')
        .populate({
            path: 'category',
            populate: { path: 'offer' }
        });

        // Process products with correct pricing
        const processedProducts = productData.map(product => {
            let productOffer = 0;
            let categoryOffer = 0;
            let finalOffer = 0;
            let offerType = 'product';
            
            if (product.offer && new Date(product.offer.endDate) > new Date()) {
                productOffer = product.offer.discountValue;
            }
            
            if (product.category?.offer?.isActive && new Date(product.category.offer.endDate) > new Date()) {
                categoryOffer = product.category.offer.percentage;
            }
            
            if (productOffer > 0 || categoryOffer > 0) {
                if (productOffer >= categoryOffer) {
                    finalOffer = productOffer;
                    offerType = 'product';
                } else {
                    finalOffer = categoryOffer;
                    offerType = 'category';
                }
            }
            
            let salePrice = product.regularPrice;
            if (finalOffer > 0) {
                salePrice = product.regularPrice * (1 - finalOffer / 100);
            }

            return {
                ...product.toObject(),
                totalOffer: finalOffer,
                salePrice: Math.round(salePrice),
                displayPrice: Math.round(salePrice).toLocaleString('en-IN'),
                offerType
            };
        });

        processedProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const latestProducts = processedProducts.slice(0, 4);

        res.render('home', {  
            user: userData, 
            products: latestProducts
        });
    } catch (err) {
        console.error('Homepage load error:', err);
        res.status(500).render('error', { message: 'Server error' });
    }
};

const loadSignup = async (req, res) => {
    try {
        res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
        
        if (req.session.user) {
            return res.redirect('/'); 
        }
        
        const refCode = req.query.ref || '';

        res.render('signup', { 
            message: null,
            refCode 
        });
    } catch (err) {
        console.error('Signup page load error:', err);
        res.status(500).render('error', { message: 'Server Error' });
    }
};

const signup = async (req, res) => {
    try {
        const { name, phone, email, password, cPassword, referralCode } = req.body;
        
        const refCode = req.query.ref || referralCode;
        
        if (password !== cPassword) {
            return res.render('signup', { message: 'Passwords do not match', refCode });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('signup', { message: 'Email already in use', refCode });
        }
        
        if (/\d/.test(name)) {
            return res.render('signup', { message: 'Name cannot contain numbers', refCode });
        }
        
        if (!/^[0-9]{10}$/.test(phone)) {
            return res.render('signup', { message: 'Phone number must be exactly 10 digits', refCode });
        }

        // Validate referral code if provided
        let referredByUser = null;
        if (refCode) {
            referredByUser = await User.findOne({ referralCode: refCode });
            if (!referredByUser) {
                return res.render('signup', { 
                    message: 'Invalid referral code',
                    refCode
                });
            }
        }

        const otp = generateOtp();

        console.log(otp);

        const emailSent = await sendVerificationEmail(email, otp);
        if (!emailSent) {
            return res.render('signup', { message: 'Failed to send verification email', refCode });
        }
        req.session.signupId = Date.now().toString();
        req.session.userOtp = otp;
        req.session.userData = { 
            name, 
            phone, 
            email, 
            password,
            referralCode: referredByUser ? refCode : null
        };
        res.render('verify-otp', { 
            message: null, 
            heading: 'Email Verification Page', 
            action: 'verify-otp' 
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.render('signup', { 
            message: 'Signup failed',
            refCode: req.query.ref || ''
        });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { otp: otpNum } = req.body;

        if (!req.session.signupId || !req.session.userOtp || !req.session.userData) {
            return res.status(400).json({ success: false, message: 'Session expired, please sign up again' });
        }
        if (otpNum !== req.session.userOtp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }
        const userData = req.session.userData;
        const passwordHash = await securePassword(userData.password);

        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already in use' });
        }

        // Generate unique referral code
        let newReferralCode;
        let isUnique = false;
        while (!isUnique) {
            newReferralCode = generateReferralCode();
            const existingCode = await User.findOne({ referralCode: newReferralCode });
            if (!existingCode) isUnique = true;
        }

        const newUser = new User({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            password: passwordHash,
            referralCode: newReferralCode, // Required for new users
            referredBy: userData.referralCode ? (await User.findOne({ referralCode: userData.referralCode }))._id : null
        });

        const savedUser = await newUser.save();

        // Create coupon for referring user if applicable
        if (userData.referralCode) {
            const referringUser = await User.findOne({ referralCode: userData.referralCode });
            if (referringUser) {
                let couponCode;
                isUnique = false;
                while (!isUnique) {
                    couponCode = `REF${generateReferralCode()}`;
                    const existingCoupon = await Coupon.findOne({ code: couponCode });
                    if (!existingCoupon) isUnique = true;
                }

                const coupon = new Coupon({
                    code: couponCode,
                    discountType: 'percentage',
                    value: 10,
                    minPurchase: 500,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    usageLimit: 1,
                    userId: referringUser._id,
                    isReferral: true
                });

                await coupon.save();
                referringUser.referralCoupons.push(coupon._id);
                await referringUser.save();
            }
        }

        req.session.user = {
            id: savedUser._id.toString(),
            name: savedUser.name,
            email: savedUser.email
        };
        delete req.session.signupId;
        delete req.session.userOtp;
        delete req.session.userData;
        res.json({ success: true, redirectUrl: '/' });
    } catch (error) {
        console.error('OTP verification error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email or referral code already in use' });
        }
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
};

const resendOtp = async (req, res) => {
    try {
        const { email } = req.session.userData || {};
        if (!email) {
            return res.status(400).json({ success: false, message: 'Session expired' });
        }

        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);

        if (!emailSent) {
            return res.status(500).json({ success: false, message: 'Failed to resend OTP' });
        }

        req.session.userOtp = otp;
        console.log('Resent OTP:', otp);

        res.status(200).json({ success: true, message: 'OTP resent successfully' });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const loadLogin = async (req, res) => {
    try {
        res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
        
        if (req.session.user) {
            return res.redirect('/');
        }
        
        const message = req.query.message || null;
        
        res.render('login', { 
            message,
            errors: null,
            email: null 
        });
    } catch (error) {
        console.error('Login page load error:', error);
        res.status(500).render('page-404');
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const errors = {};

        if (!email?.trim()) errors.email = 'Email is required';
        else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Invalid email';

        if (!password?.trim()) errors.password = 'Password is required';

        if (Object.keys(errors).length > 0) {
            return res.render('login', { message: null, errors, email });
        }

        const findUser = await User.findOne({ email, isAdmin: 0 });
        
        if (!findUser) {
            return res.render('login', { 
                message: 'User not found',
                errors: null,
                email 
            });
        }

        if (findUser.isBlocked) {
            return res.render('login', { 
                message: 'User is blocked. Contact support.',
                errors: null,
                email 
            });
        }
        
        if (findUser.password) {
            const passwordMatch = await bcrypt.compare(password, findUser.password);
            if (!passwordMatch) {
                return res.render('login', { 
                    message: 'Incorrect password',
                    errors: null,
                    email 
                });
            }
        } else {
            return res.render('login', { 
                message: 'Please sign in with Google',
                errors: null,
                email 
            });
        }
        
        req.session.user = {
            id: findUser._id.toString(),
            name: findUser.name,
            email: findUser.email
        };
        
        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { 
            message: 'Login failed. Try again.',
            errors: null,
            email: req.body.email 
        });
    }
};

const logout = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        
        if (userId) {
            // Clear any applied coupon from the cart
            const cart = await Cart.findOne({ userId });
            if (cart && cart.couponCode) {
                cart.couponCode = null;
                cart.discountAmount = 0;
                cart.finalAmount = cart.subTotal;
                await cart.save();
            }
        }
        
        // Clear session
        delete req.session.user;
        delete req.session.appliedCoupon;
        
        res.redirect('/login');
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).render('page-404');
    }
};

const validateEnv = () => {
    const required = ['NODEMAILER_EMAIL', 'NODEMAILER_PASSWORD'];
    required.forEach((key) => {
        if (!process.env[key]) {
            throw new Error(`Missing environment variable: ${key}`);
        }
    });
};

validateEnv();

module.exports = {
    pageNotFound,
    loadHomepage,
    loadSignup,
    signup,
    verifyOtp,
    resendOtp,
    loadLogin,
    login,
    logout
};