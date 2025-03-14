const User = require('../../models/userSchema');
const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema');
const Brand = require('../../models/brandSchema');
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
            category: { $in: categories.map(category => category._id) },
            quantity: { $gt: 0 }
        });

        productData.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));
        productData = productData.slice(0, 4);

        // Add cache control headers
        res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        
        res.render('home', { 
            user: userData, 
            products: productData,
            admin: req.session.admin // Pass admin session to view
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

        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);

        if (!emailSent) {
            return res.render('signup', { message: 'Failed to send verification email' });
        }

        req.session.userOtp = otp;
        req.session.userData = { name, phone, email, password };
        console.log('OTP generated:', otp);

        res.render('verify-otp', { message: null });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).render('error', { message: 'Signup failed' });
    }
};

const verifyOtp = async (req, res) => {
    try {
      const { otp: otpNum } = req.body;
      if (otpNum !== req.session.userOtp) {
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
      }
      const userData = req.session.userData;
      const passwordHash = await securePassword(userData.password);
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
      console.log('Session set after OTP:', req.session.user);
      delete req.session.userOtp;
      delete req.session.userData;
      res.json({ success: true, redirectUrl: '/' });
    } catch (error) {
      console.error('OTP verification error:', error);
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
        
        res.render('login', { message: null });
    } catch (error) {
        console.error('Login page load error:', error);
        res.status(500).render('page-404');
    }
};



const login = async (req, res) => {
    try {
      const { email, password } = req.body;
      const findUser = await User.findOne({ isAdmin: 0, email });
      if (!findUser) return res.render('login', { message: 'User not found' });
      if (findUser.isBlocked) return res.render('login', { message: 'User is blocked' });
      const passwordMatch = await bcrypt.compare(password, findUser.password);
      if (!passwordMatch) return res.render('login', { message: 'Incorrect password' });
  
      req.session.user = {
        id: findUser._id.toString(),
        name: findUser.name,
        email: findUser.email
      };
      
      res.redirect('/');
    } catch (error) {
      console.error('Login error:', error);
      res.render('login', { message: 'Login failed' });
    }
  };



const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
                return res.status(500).render('error', { message: 'Logout failed' });
            }
            res.redirect('/login');
        });
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
        const products = await Product.find({
            isBlocked: false,
            category: { $in: categoryIds },
            quantity: { $gt: 0 }
        })
            .populate('brand')
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit);

        const totalProducts = await Product.countDocuments({
            isBlocked: false,
            category: { $in: categoryIds },
            quantity: { $gt: 0 }
        });
        const totalPages = Math.ceil(totalProducts / limit);

        const brands = await Brand.find({ isBlocked: false });
        const categoriesWithIds = categories.map((category) => ({
            _id: category._id,
            name: category.name
        }));

        // Clear any session-stored filtered products when returning to the base shop page
        if (req.session.filteredProducts) {
            delete req.session.filteredProducts;
        }

        res.render('shop', {
            user: userData,
            products: products,
            category: categoriesWithIds,
            brand: brands,
            totalProducts: totalProducts,
            currentPage: page,
            totalPages: totalPages,
            selectedCategory: null,
            selectedBrand: null,
            gt: undefined,
            lt: undefined
        });
    } catch (error) {
        console.error("shopping page loading error", error);
        res.redirect('/pageNotFound');
    }
};

const filterProduct = async (req, res) => {
    try {
        const user = req.session.user;
        const categoryId = req.query.category;
        const brandId = req.query.brand;
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = 9;

       
        const query = {
            isBlocked: false,
            quantity: { $gt: 0 }
        };

        if (categoryId) {
            query.category = new mongoose.Types.ObjectId(categoryId);
        }

        if (brandId) {
            query.brand = new mongoose.Types.ObjectId(brandId);
        }

       
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / itemsPerPage);
        
       
        const products = await Product.find(query)
            .populate('brand')
            .populate('category')
            .sort({ createdOn: -1 })
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage)
            .lean();

        
        const categories = await Category.find({ isListed: true }).lean();
        const brands = await Brand.find({ isBlocked: false }).lean();

        
        let userData = null;
        if (user) {
            userData = await User.findById(user.id);
            if (userData && (categoryId || brandId)) {
                const searchEntry = {
                    category: categoryId || null,
                    brand: brandId || null,
                    searchedOn: new Date()
                };
                userData.searchHistory.push(searchEntry);
                await userData.save();
            }
        }

        res.render('shop', {
            user: userData,
            products: products,
            category: categories,
            brand: brands,
            totalPages,
            currentPage: page,
            selectedCategory: categoryId || null,
            selectedBrand: brandId || null
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
        let search = req.body.query;

        const brands = await Brand.find({}).lean();
        const categories = await Category.find({isListed:true}).lean();
        const categoryIds = categories.map(category=>category._id.toString());
        let searchResult = [];
        
        if(req.session.filteredProducts && req.session.filteredProducts.length>0){
            // For filtered products, make sure they include brand information
            searchResult = req.session.filteredProducts
                .filter(product => product.productName.toLowerCase().includes(search.toLowerCase()))
                .map(product => ({
                    ...product,
                    brand: brands.find(b => b._id.toString() === product.brand.toString()) || product.brand
                }));
        } else {
            // For direct database search, use populate
            searchResult = await Product.find({
                productName: { $regex: ".*" + search + ".*", $options: "i" },
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
            gt: undefined,
            lt: undefined
        });
        
    } catch (error) {
        console.error(error);
        res.redirect('/pageNotFound');
    }
}


module.exports = {
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup,
    verifyOtp,
    resendOtp,
    loadLogin,
    login,
    logout,
    loadShoppingPage,
    filterProduct,
    filterByPrice,
    searchProducts,
};