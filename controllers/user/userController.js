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
        let productData = await Product.find({
            isBlocked: false,
            category: { $in: categories.map(category => category._id) }
            // Removed quantity check to show all products
        });

        productData.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));
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
            return res.redirect('/'); // Redirect logged-in users to homepage
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
        // Validate name (no numbers)
        if (/\d/.test(name)) {
            return res.render('signup', { message: 'Name cannot contain numbers' });
        }
        // Validate phone (only digits, exactly 10)
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

        // Recheck email to prevent race conditions
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already in use' });
        }

        const newUser = new User({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            password: passwordHash
            // googleId is omitted, defaults to undefined, not null
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
        
        res.render('login', { 
            message: null,
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

        // Server-side validation
        if (!email?.trim()) {
            errors.email = 'Email is required';
        } else if (!/^\S+@\S+\.\S+$/.test(email)) {
            errors.email = 'Please enter a valid email';
        }

        if (!password?.trim()) {
            errors.password = 'Password is required';
        }

        if (Object.keys(errors).length > 0) {
            return res.render('login', {
                message: null,
                errors,
                email
            });
        }

        const findUser = await User.findOne({ isAdmin: 0, email });
        
        if (!findUser) {
            return res.render('login', { 
                message: 'User not found',
                errors: null,
                email 
            });
        }
        
        if (findUser.isBlocked) {
            return res.render('login', { 
                message: 'User is blocked',
                errors: null,
                email 
            });
        }
        
        const passwordMatch = await bcrypt.compare(password, findUser.password);
        if (!passwordMatch) {
            return res.render('login', { 
                message: 'Incorrect password',
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
            message: 'Login failed',
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
        const categoryIds = categories.map((category) => category._id.toString());
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;
        const sortOption = req.query.sort;
        let sortQuery = { createdOn: -1 }; // default sorting by newest first

        switch(sortOption) {
            case 'newArrival':
                sortQuery = { createdOn: -1 }; // Sort by creation date descending (newest first)
                break;
            case 'priceAsc':
                sortQuery = { salePrice: 1 };
                break;
            case 'priceDesc':
                sortQuery = { salePrice: -1 };
                break;
            case 'nameAsc':
                sortQuery = { productName: 1 };
                break;
            case 'nameDesc':
                sortQuery = { productName: -1 };
                break;
        }

        let query = Product.find({
            isBlocked: false,
            category: { $in: categoryIds }
        }).populate('brand');

        // Apply collation only for name sorting
        if (sortOption === 'nameAsc' || sortOption === 'nameDesc') {
            query = query.collation({ locale: 'en', strength: 2 });
        }

        const products = await query
            .sort(sortQuery)
            .skip(skip)
            .limit(limit);

        // Calculate actual ratings
        const productsWithRatings = await Promise.all(products.map(async (product) => {
            const reviews = await Review.find({ productId: product._id });
            const rating = reviews.length > 0 
                ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
                : '0.0';
            const reviewCount = reviews.length;
            return {
                ...product.toObject(),
                rating,
                reviewCount
            };
        }));

        const totalProducts = await Product.countDocuments({
            isBlocked: false,
            category: { $in: categoryIds }
        });
        const totalPages = Math.ceil(totalProducts / limit);

        const brands = await Brand.find({ isBlocked: false });
        const categoriesWithIds = categories.map((category) => ({
            _id: category._id,
            name: category.name
        }));

        if (req.session.filteredProducts) {
            delete req.session.filteredProducts;
        }

        res.render('shop', {
            user: userData,
            products: productsWithRatings,
            category: categoriesWithIds,
            brand: brands,
            totalProducts,
            currentPage: page,
            totalPages,
            selectedCategory: null,
            selectedBrand: null,
            gt: undefined,
            lt: undefined,
            selectedSort: sortOption
        });
    } catch (error) {
        console.error("shopping page loading error", error);
        res.redirect('/pageNotFound');
    }
};



const filterProduct = async (req, res) => {
    try {
        const categoryId = req.query.category;
        const brandId = req.query.brand;
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = 9;

        // Build query filter dynamically
        const queryFilter = {
            isBlocked: false,
        };

        if (categoryId) {
            queryFilter.category = new mongoose.Types.ObjectId(categoryId);
        }

        if (brandId) {
            queryFilter.brand = new mongoose.Types.ObjectId(brandId);
        }

        const totalProducts = await Product.countDocuments(queryFilter);
        const totalPages = Math.ceil(totalProducts / itemsPerPage);

        const products = await Product.find(queryFilter)
            .populate('brand')
            .populate('category')
            .sort({ createdOn: -1 })
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage)
            .lean();

        const categories = await Category.find({ isListed: true }).lean();
        const brands = await Brand.find({ isBlocked: false }).lean();

        res.render('shop', {
            user: req.session.user ? await User.findById(req.session.user.id) : null,
            products,
            category: categories,
            brand: brands,
            totalPages,
            currentPage: page,
            selectedCategory: categoryId || null,
            selectedBrand: brandId || null,
            selectedSort: null,
            gt: null,
            lt: null
        });
    } catch (error) {
        console.error("Filter product error", error);
        res.redirect('/pageNotFound');
    }
};


const filterByPrice = async (req, res) => {
    try {
        const user = req.session.user;
        let userData = null;
        if (user && user.id) {
            userData = await User.findById(user.id);
        }
        const brands = await Brand.find({ isBlocked: false }).lean();
        const categories = await Category.find({ isListed: true }).lean();
        
        const gt = parseFloat(req.query.gt) || 0;
        const lt = parseFloat(req.query.lt) || Infinity;
        const currentPage = parseInt(req.query.page) || 1;
        const itemsPerPage = 9;
        const query = {
            isBlocked: false,
            quantity: { $gt: 0 },
            salePrice: { $gte: gt, $lte: lt }
        };

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / itemsPerPage);

        const products = await Product.find(query)
            .populate('brand')
            .sort({ createdOn: -1 })
            .skip((currentPage - 1) * itemsPerPage)
            .limit(itemsPerPage)
            .lean();

        res.render('shop', {
            user: userData,
            products: products,
            category: categories,
            brand: brands,
            totalPages,
            currentPage,
            selectedCategory: null,
            selectedBrand: null,
            gt,
            lt
        });
    } catch (error) {
        console.error("Price filter error:", error);
        res.redirect('/pageNotFound');
    }
};

const searchProducts = async (req, res) => {
    try {
        const user = req.session.user;
        let userData = null;
        if (user && user.id) {
            userData = await User.findById(user.id);
        }
        let searchQuery = req.body.query || '';

        const brands = await Brand.find({}).lean();
        const categories = await Category.find({isListed: true}).lean();
        const categoryIds = categories.map(category => category._id.toString());
        let searchResult = [];

        if(req.session.filteredProducts && req.session.filteredProducts.length > 0){
            searchResult = req.session.filteredProducts
                .filter(product => product.productName.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(product => ({
                    ...product,
                    brand: brands.find(b => b._id.toString() === product.brand.toString()) || product.brand
                }));
        } else {
            searchResult = await Product.find({
                productName: { $regex: ".*" + searchQuery + ".*", $options: "i" },
                isBlocked: false,
                quantity: { $gt: 0 },
                category: { $in: categoryIds }
            }).populate('brand');
        }

        searchResult.sort((a,b) => new Date(b.createdOn) - new Date(a.createdOn));
        let itemsPerPage = 6;
        let currentPage = parseInt(req.query.page) || 1;
        let startIndex = (currentPage-1) * itemsPerPage;
        let endIndex = startIndex + itemsPerPage;
        let totalPages = Math.ceil(searchResult.length/itemsPerPage);
        const currentProduct = searchResult.slice(startIndex,endIndex);

        res.render('shop', {
            user: userData,
            products: currentProduct,
            category: categories,
            brand: brands,
            totalPages,
            currentPage,
            count: searchResult.length,
            selectedCategory: null,
            selectedBrand: null,
            searchQuery: searchQuery,    // Pass the search query
            isSearchActive: searchQuery.trim().length > 0  // Add this flag
        });
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