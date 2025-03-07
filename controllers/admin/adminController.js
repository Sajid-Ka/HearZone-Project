const User = require('../../models/userSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const pageError = async (req,res)=>{
    try {
        res.render('admin-error');
    } catch (error) {
        console.error("Error Page is Error");
    }
}

const loadLogin = async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.render("admin-login", { message: null }); 
    } catch (error) {
        console.error("Error loading admin login page:", error);
        res.redirect("/admin/pageError");
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await User.findOne({ email, isAdmin: true });

        if (admin) {
            const passwordMatch = await bcrypt.compare(password, admin.password);
            if (passwordMatch) {
                req.session.admin = admin._id;  
                return res.redirect('/admin/dashboard'); 
            } else {
                return res.render('admin-login', { message: 'Incorrect password' });
            }
        } else {
            return res.render('admin-login', { message: 'Invalid email or password' });
        }
    } catch (error) {
        console.log("Login error:", error);
        return res.render('admin-login', { message: 'An error occurred, please try again' });
    }
};

const loadDashboard = async (req, res) => {
    if (req.session.admin) {
        try {
            res.render("dashboard");  
        } catch (error) {
            console.error("Error loading Dashboard:", error);
            return res.redirect("/admin/pageError");
        }
    } else {
        return res.redirect("/admin/login");
    }
};

const logout = async (req, res) => {
    try {
        req.session.destroy(err => {
            if(err) {
                console.log("Error destroying session", err);
                return res.redirect('/pageError');
            }
            res.setHeader('Clear-Site-Data', '"storage"');
            res.redirect('/admin/login');
        });
    } catch (error) {
        console.log("Admin logout Error", error);
        res.redirect("/pageError");
    }
}

module.exports = {
    loadLogin,
    login,
    loadDashboard,
    pageError,
    logout
}