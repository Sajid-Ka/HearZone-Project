const User = require("../models/userSchema");
const mongoose = require('mongoose');

const protectedUserRoutes = process.env.PROTECTED_USER_ROUTES?.split(',') || [];
const protectedAdminRoutes = process.env.PROTECTED_ADMIN_ROUTES?.split(',') || [];

const userAuth = async (req, res, next) => {
    const path = req.path;
    if (!protectedUserRoutes.some(route => path.startsWith(route))) {
        // Even for unprotected routes, set req.user if authenticated
        if (req.session.user) {
            try {
                const userId = req.session.user.id || req.session.user._id || req.session.user;
                if (!mongoose.Types.ObjectId.isValid(userId)) {
                    console.error("Invalid ObjectId:", userId);
                    return next();
                }
                const user = await User.findById(userId);
                if (user && !user.isBlocked) {
                    req.user = user; // Set req.user for all routes if user exists
                }
            } catch (error) {
                console.error("Error in userAuth middleware", error);
            }
        }
        return next();
    }

    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const userId = req.session.user.id || req.session.user._id || req.session.user;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error("Invalid ObjectId:", userId);
            req.session.destroy();
            return res.redirect('/login');
        }

        const user = await User.findById(userId);
        if (user && !user.isBlocked) {
            req.user = user;
            return next();
        }
        req.session.destroy();
        res.redirect('/login');
    } catch (error) {
        console.error("Error in userAuth middleware", error);
        res.status(500).send("Internal Server Error");
    }
};

// Other middleware remains the same
const adminAuth = async (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Expires', '0');
    res.setHeader('Pragma', 'no-cache');

    const path = req.path;
    if (!protectedAdminRoutes.some(route => path.startsWith(route))) {
        return next();
    }

    if (!req.session.admin) {
        
        return res.redirect('/admin/login');
    }

    try {
        const adminId = req.session.admin;
        if (!mongoose.Types.ObjectId.isValid(adminId)) {
            
            req.session.destroy();
            return res.redirect('/admin/login');
        }

        const admin = await User.findOne({ _id: adminId, isAdmin: true });
        if (!admin) {
            
            req.session.destroy();
            return res.redirect('/admin/login');
        }

        req.admin = admin;
        next();
    } catch (error) {
        console.error('Error in adminAuth middleware:', error);
        req.session.destroy();
        res.redirect('/admin/login');
    }
};

const isAdminAuth = async (req, res, next) => {
    if (!req.session.admin) {
        
        return res.redirect('/admin/login');
    }

    try {
        const admin = await User.findOne({ _id: req.session.admin, isAdmin: true });
        if (!admin) {
            req.session.destroy();
            return res.redirect('/admin/login');
        }
        req.admin = admin;
        next();
    } catch (error) {
        console.error('Error in isAdminAuth:', error);
        res.redirect('/admin/login');
    }
};

const isAdminLogin = (req, res, next) => {
    if (req.session.admin) {
        return res.redirect('/admin/dashboard');
    }
    next();
};

const isLogin = (req, res, next) => {
    if (req.session.user) {
        return res.redirect('/'); 
    }
    next();
};

const isLogout = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
};

module.exports = {
    userAuth,
    adminAuth,
    isLogin,
    isLogout,
    isAdminAuth,
    isAdminLogin
};