const User = require('../../models/userSchema');
const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema');
const Brand = require('../../models/brandSchema');
const Review = require('../../models/reviewSchema');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
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
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: 'Verify Your Account',
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP: ${otp}</b>`
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
      console.log('Rendering 404 page'); 
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
        }).populate('brand');

        productData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        productData = productData.slice(0, 4);

        res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        
        res.render('home', {  
            user: userData, 
            products: productData,
            admin: req.session.admin 
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
        
        res.render('signup', { message: null });
    } catch (err) {
        console.error('Signup page load error:', err);
        res.status(500).render('error', { message: 'Server Error' });
    }
};


const signup = async (req, res) => {
    try {
        const { name, phone, email, password, cPassword } = req.body;
        if (password !== cPassword) {
            return res.render('signup', { message: 'Passwords do not match' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('signup', { message: 'Email already in use' });
        }
        
        if (/\d/.test(name)) {
            return res.render('signup', { message: 'Name cannot contain numbers' });
        }
        
        if (!/^[0-9]{10}$/.test(phone)) {
            return res.render('signup', { message: 'Phone number must be exactly 10 digits' });
        }
        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);
        if (!emailSent) {
            return res.render('signup', { message: 'Failed to send verification email' });
        }
        req.session.signupId = Date.now().toString();
        req.session.userOtp = otp;
        req.session.userData = { name, phone, email, password };
        console.log('Signup ID:', req.session.signupId, 'OTP:', otp);
        res.render('verify-otp', { message: null, heading: 'Email Verification Page', action: 'verify-otp' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).render('error', { message: 'Signup failed' });
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

        const newUser = new User({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            password: passwordHash
        });

        const savedUser = await newUser.save();
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
            return res.status(400).json({ success: false, message: 'Email or Google ID already in use' });
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
        delete req.session.user;
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


const loadShoppingPage = async (req, res) => {
    try {
        const user = req.session.user;
        let userData = null;
        if (user && user.id) {
            userData = await User.findOne({ _id: user.id });
        }

        const categories = await Category.find({ isListed: true });
        const categoryIds = categories.map(category => category._id);
        const blockedBrands = await Brand.find({ isBlocked: true }).select('_id');
        const blockedBrandIds = blockedBrands.map(brand => brand._id);
        const brands = await Brand.find({ isBlocked: false });

        
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;
        const sortOption = req.query.sort;
        const searchQuery = req.query.query || '';
        const categoryId = req.query.category;
        const brandId = req.query.brand;
        const gt = parseFloat(req.query.gt);
        const lt = parseFloat(req.query.lt);

        
        let query = {
            isBlocked: false,
            category: { $in: categoryIds },
            brand: { $nin: blockedBrandIds }
        };

        
        if (searchQuery.trim().length > 0) {
            query.productName = { $regex: searchQuery, $options: 'i' };
        }

        
        if (categoryId) {
            query.category = new mongoose.Types.ObjectId(categoryId);
        }

        
        if (brandId) {
            query.brand = new mongoose.Types.ObjectId(brandId);
        }

       
        if (!isNaN(gt) || !isNaN(lt)) {
            query.salePrice = {};
            if (!isNaN(gt)) query.salePrice.$gte = gt;
            if (!isNaN(lt)) query.salePrice.$lte = lt;
        }

        
        let sortQuery = { createdAt: -1 };
        let collation = null;
        
        switch (sortOption) {
            case 'newArrival':
                sortQuery = { createdAt: -1 };
                break;
            case 'priceAsc':
                sortQuery = { salePrice: 1 };
                break;
            case 'priceDesc':
                sortQuery = { salePrice: -1 };
                break;
            case 'nameAsc':
                sortQuery = { productName: 1 };
                collation = { locale: 'en', strength: 1 }; 
                break;
            case 'nameDesc':
                sortQuery = { productName: -1 };
                collation = { locale: 'en', strength: 1 }; 
                break;
        }

        
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        let productQuery = Product.find(query)
            .populate('brand')
            .sort(sortQuery)
            .skip(skip)
            .limit(limit);

        if (collation) {
            productQuery = productQuery.collation(collation);
        }

        const products = await productQuery;

        const productsWithRatings = await Promise.all(products.map(async (product) => {
            const reviews = await Review.find({ productId: product._id });
            const rating = reviews.length > 0 
                ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
                : '0.0';
            return { ...product.toObject(), rating };
        }));

        const categoriesWithIds = categories.map(category => ({
            _id: category._id,
            name: category.name
        }));

        res.render('shop', {
            user: userData,
            products: productsWithRatings,
            category: categoriesWithIds,
            brand: brands,
            totalProducts,
            currentPage: page,
            totalPages,
            selectedCategory: categoryId,
            selectedBrand: brandId,
            gt: gt || null,
            lt: lt || null,
            selectedSort: sortOption,
            searchQuery: searchQuery,
            isSearchActive: searchQuery.trim().length > 0
        });
    } catch (error) {
        console.error("shopping page loading error", error);
        res.redirect('/pageNotFound');
    }
};



const filterProduct = async (req, res) => {
    try {
        
        const { category, brand, page } = req.query;
        const queryParams = new URLSearchParams();
        if (category) queryParams.append('category', category);
        if (brand) queryParams.append('brand', brand);
        if (page) queryParams.append('page', page);
        
        res.redirect(`/shop?${queryParams.toString()}`);
    } catch (error) {
        console.error("Filter product error", error);
        res.redirect('/pageNotFound');
    }
};


const filterByPrice = async (req, res) => {
    try {
        const { gt, lt, page } = req.query;
        const queryParams = new URLSearchParams();
        if (gt) queryParams.append('gt', gt);
        if (lt) queryParams.append('lt', lt);
        if (page) queryParams.append('page', page);
        
        
        const currentQuery = req.query;
        for (const [key, value] of Object.entries(currentQuery)) {
            if (key !== 'gt' && key !== 'lt' && key !== 'page' && value) {
                queryParams.append(key, value);
            }
        }

        res.redirect(`/shop?${queryParams.toString()}`);
    } catch (error) {
        console.error("Price filter error:", error);
        res.redirect('/pageNotFound');
    }
};


const searchProducts = async (req, res) => {
    try {
        const searchQuery = req.body.query || '';
        res.redirect(`/shop?query=${encodeURIComponent(searchQuery)}`);
    } catch (error) {
        console.error("Search products error:", error);
        res.redirect('/pageNotFound');
    }
};


module.exports = {
    searchProducts,
    filterByPrice,
    filterProduct,
    loadShoppingPage,
    logout,
    login,
    loadLogin,
    resendOtp,
    verifyOtp,
    signup,
    loadSignup,
    pageNotFound,
    loadHomepage
};
