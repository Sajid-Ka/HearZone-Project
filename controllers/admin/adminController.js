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
        res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
        
        if (req.session.admin) {
            return res.redirect('/admin/dashboard');
        }
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

        // Set no-cache headers
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        
        if (!admin) {
            return res.render('admin-login', { message: 'Invalid email or password' });
        }

        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (!passwordMatch) {
            return res.render('admin-login', { message: 'Incorrect password' });
        }

        req.session.admin = admin._id;
        return res.redirect('/admin/dashboard');

    } catch (error) {
        console.log("Login error:", error);
        return res.render('admin-login', { message: 'An error occurred, please try again' });
    }
};

const loadDashboard = async (req, res) => {
    try {
        res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
        
        res.render("dashboard");
    } catch (error) {
        console.error("Error loading Dashboard:", error);
        return res.redirect("/admin/pageError");
    }
};

const logout = async (req, res) => {
    try {
        // Only delete admin session data, preserve user session
        delete req.session.admin;
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.redirect('/admin/login');
    } catch (error) {
        console.log("Admin logout Error", error);
        res.redirect("/admin/pageError");
    }
}

module.exports = {
    loadLogin,
    login,
    loadDashboard,
    pageError,
    logout
}