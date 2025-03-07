const User = require("../models/userSchema");

const userAuth = (req, res, next) => {
    if (req.session.user) {
        User.findById(req.session.user)
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