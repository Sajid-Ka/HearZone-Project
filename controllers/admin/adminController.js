const User = require('../../models/userSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const loadLogin = async (req, res) => {
    try {
        res.render("admin-login", { message: null }); 
    } catch (error) {
        console.error("Error loading admin login page:", error);
        res.redirect("/pageError");
    }
};



 console.log("poooi")
 const login = async (req, res) => {
    try {
       const { email, password } = req.body;
       
       const admin = await User.findOne({ email, isAdmin: true });
 
       if (admin) {
           const passwordMatch = await bcrypt.compare(password, admin.password);
           if (passwordMatch) {
               req.session.admin = true; 
               return res.redirect('/admin/dashboard'); 
           } 
           else if(!email || !password){
               return res.render('admin-login', { message: 'Please enter email and password' });
 
           }
           else {
               return res.render('admin-login', { message: 'Incorrect password' }); 
           }
       } else {
           return res.render('admin-login', { message: 'Please enter valid email and password' }); 
       }
   } catch (error) {
       console.log("Login error:", error);
       return res.render('admin-login', { message: 'An error occurred, please try again' }); 
   }
 }


const loadDashboard = async (req, res) => {
    if (req.session.admin) {
        try {
            res.render("dashboard");  
        } catch (error) {
            console.error("Error loading Dashboard:", error);
            return res.redirect("/pageError");
        }
    } else {
        return res.redirect("/admin/login");
    }
};



module.exports = {
    loadLogin,
    login,
    loadDashboard
}