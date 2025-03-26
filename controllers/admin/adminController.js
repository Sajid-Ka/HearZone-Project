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
        res.setHeader('Expires', '0');
        res.setHeader('Pragma', 'no-cache');
        
        if (req.session.admin) {
            return res.redirect('/admin/dashboard');
        }
        res.render('admin-login', { message: null });
    } catch (error) {
        console.error('Error loading admin login page:', error);
        res.redirect('/admin/pageError');
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await User.findOne({ email, isAdmin: true });

        if (!admin) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.setHeader('Expires', '0');
            res.setHeader('Pragma', 'no-cache');
            return res.render('admin-login', { message: 'Invalid email or password' });
        }

        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (!passwordMatch) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.setHeader('Expires', '0');
            res.setHeader('Pragma', 'no-cache');
            return res.render('admin-login', { message: 'Incorrect password' });
        }

        req.session.admin = admin._id.toString();
        
        
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Expires', '0');
        res.setHeader('Pragma', 'no-cache');
        return res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Expires', '0');
        res.setHeader('Pragma', 'no-cache');
        return res.render('admin-login', { message: 'An error occurred, please try again' });
    }
};

const loadDashboard = async (req, res) => {
    try {
        
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Expires', '0');
        res.setHeader('Pragma', 'no-cache');
        res.render('dashboard');
    } catch (error) {
        console.error('Error loading Dashboard:', error);
        return res.redirect('/admin/pageError');
    }
};

const logout = async (req, res) => {
    try {
        delete req.session.admin;
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Expires', '0');
        res.setHeader('Pragma', 'no-cache');
        res.redirect('/admin/login');
    } catch (error) {
        console.error('Admin logout Error:', error);
        res.redirect('/admin/pageError');
    }
};

module.exports = {
    loadLogin,
    login,
    loadDashboard,
    pageError,
    logout
}