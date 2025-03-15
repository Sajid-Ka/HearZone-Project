const User = require("../models/userSchema");
const mongoose = require('mongoose');

const protectedUserRoutes = process.env.PROTECTED_USER_ROUTES?.split(',') || [];
const protectedAdminRoutes = process.env.PROTECTED_ADMIN_ROUTES?.split(',') || [];

const userAuth = (req, res, next) => {
    const path = req.path;
    if (!protectedUserRoutes.some(route => path.startsWith(route))) {
        return next();
    }

    if (req.session.user) {
        const userId = req.session.user.id || req.session.user._id || req.session.user;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error("Invalid ObjectId:", userId);
            return res.redirect('/login');
        }
        User.findById(userId)
            .then(data => {
                if (data && !data.isBlocked) {
                    next();
                } else {
                    res.redirect('/login');
                }
            })
            .catch(error => {
                console.error("Error in userAuth middleware", error);
                res.status(500).send("Internal Server error");
            });
    } else {
        res.redirect('/login');
    }
};

const adminAuth = (req, res, next) => {
    const path = req.path;
    if (!protectedAdminRoutes.some(route => path.startsWith(route))) {
        return next();
    }

    if (req.session.admin) {
        return next();
    } else {
        return res.redirect('/admin/login');
    }
};

const isAdminAuth = (req, res, next) => {
    try {
        if (req.session.admin) {
            next();
        } else {
            res.redirect('/admin/login');
        }
    } catch (error) {
        console.error(error);
        res.redirect('/admin/login');
    }
};

const isAdminLogin = (req, res, next) => {
    try {
        if (req.session.admin) {
            res.redirect('/admin/dashboard');
        } else {
            next();
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
};

const isLogin = (req, res, next) => {
    try {
        if (req.session.user) {
            res.redirect('/'); 
        } else {
            next();
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
};

const isLogout = (req, res, next) => {
    try {
        if (req.session.user) {
            next();
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
};

module.exports = {
    userAuth,
    adminAuth,
    isLogin,
    isLogout,
    isAdminAuth,
    isAdminLogin
};