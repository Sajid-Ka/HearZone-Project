const User = require("../models/userSchema");
const mongoose = require('mongoose');

const userAuth = (req, res, next) => {
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
    if (req.session.admin) {  
        return next(); 
    } else {
        return res.redirect('/admin/login'); 
    }
};

module.exports = {
    userAuth,
    adminAuth
}