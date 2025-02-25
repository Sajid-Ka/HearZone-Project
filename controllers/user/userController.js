const User = require('../../models/userSchema');
const bcrypt = require('bcrypt');
const env = require('dotenv').config();
const nodemailer = require('nodemailer');
const mongoose = require("mongoose");

const pageNotFound = async (req,res)=>{
    try{
        res.render("page-404")
    }catch(err){
        res.redirect("/pageNotFoud")
    }
}



// const loadHomepage = async (req,res)=>{
//     try{
//         const user = req.session.user;
//         console.log("Session User:", user);
//         if(user){
//             const userData = await User.findOne({_id:user._id})
//             res.render("home",{user:userData})
//             console.log(userData)
//         }
        
//         else{
//             return res.render('home');
//         }
        
//     }catch(err){
//         console.log('Homepage Not found');
//         res.status(500).send("Server error");
//     }
// }

const loadHomepage = async (req, res) => {
    try {
        const user = req.session.user;
        if (user) {
            const userId = new mongoose.mongo.ObjectId(user.id);
            const userData = await User.findOne({ _id: userId });

            if (!userData) {
                console.log("User not found in database!");
                return res.render("home", { user: null });
            }

            return res.render("home", { user: userData });
        } else {
            console.log("No user in session.");
            return res.render("home", { user: null });
        }
    } catch (err) {
        console.error("Error loading homepage:", err);
        res.status(500).send("Server error");
    }
};




const loadSignup = async (req,res)=>{
    try{
        return res.render('signup');
    }catch(err){
        console.log('Homepage not loading',err.message);
        res.status(500).send('Server Error')
        
    }
}

function generateOtp(){
    return Math.floor(100000 + Math.random()*900000).toString()
}

async function sendVerificationEmail(email,otp) {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD
            }
        })

        const info = await transporter.sendMail({
            from:process.env.NODEMAILER_EMAIL,
            to:email,
            subject:"Verify your account",
            text:`Your otp is ${otp}`,
            html:`<b> Your otp ${otp} </b>`
        })

        return info.accepted.length >0

    } catch (error) {

        console.error("Error sending email",error);
        return false;
        
    }
}

const signup = async (req,res)=>{
    
    try {
        
        const {name,phone,email,password,cPassword} = req.body;

        if(password !== cPassword){
            return res.render("signup",{message:"Password do not match"})
        }
        

        const findUser = await User.findOne({email})
        

        if(findUser){
            return res.render('signup',{message:"User with this email Alredy exists"})
        }

        


        const otp = generateOtp();

        
        const emailSend = await sendVerificationEmail(email,otp)

        

        if(!emailSend){
            return res.json("email-error")
        }

        req.session.userOtp = otp;
        console.log(req.session.userOtp)
        req.session.userData = {name,phone,email,password};

        res.render("verify-otp");
        console.log("OTP send",otp)



    } catch (error) {

        console.error("signup error",error);
        res.redirect('/pageNotFound')
        
    }

}

const securePassword = async (password)=>{
    try {
        
        const passwordHash = bcrypt.hash(password,10);

        return passwordHash;

    } catch (error) {
        
    }
}

const verifyOtp = async (req,res)=>{
    try {
        
        const {otp:otpNum} = req.body;

        if(otpNum===req.session.userOtp){
            const user = req.session.userData;
            const passwordHash = await securePassword(user.password);
            const saveUserData = new User({
                name:user.name,
                email:user.email,
                phone:user.phone,
                password:passwordHash
            })
            await saveUserData.save();
            req.session.user = saveUserData._id;
            res.json({success:true, redirectUrl:"/"})
        }else{
            res.status(400).json({success:false, message:"Invalid OTP, Please try again"})
        }

    } catch (error) {
        console.error("Erroe Verify OTP",error);
        res.status(500).json({success:false, message:"An error occured"})
    }
}


const resendOtp = async (req,res)=>{
    try {

        const {email} = req.session.userData;
        if(!email){
            return res.status(400).json({success:false,message:"Email not found in session"})
        }

        const otp = generateOtp();

        req.session.userOtp = otp;

        const emailSend = await sendVerificationEmail(email,otp);

        if(emailSend){
            console.log("Resend OTP",otp);
            res.status(200).json({success:true,message:"OTP Resend Successfully"})
        }else {
            res.status(500).json({success:false,message:"Fail to resend OTP. Please try again"})
        }
        
    } catch (error) {
        console.error("Error resending OTP",error);
        res.status(500).json({success:false,message:"Internal server error. Please try again"})
    }
}

const loadLogin = async (req,res)=>{
    try {

        
        if(req.session.user){
            console.log("Session User:", req.session.user);
            return res.redirect('/');
            
        }else{
            res.render('login')
        }

    } catch (error) {
        console.error('login error',error);
        res.redirect("/pageNotFound");
    }
}

const login = async (req,res) => {
    try {
        
        const {email,password} = req.body;

        const findUser = await User.findOne({isAdmin:0,email:email})

        if(!findUser){
            return res.render("login",{message:"User not Found"});
        }

        if(findUser.isBlocked){
            return res.render("login",{message:"User is Blocked by Admin"})
        }
        
        const passwordMatch = await bcrypt.compare(password,findUser.password);
        

        if(!passwordMatch){
            return res.render("login",{message:"Incorrect Password"})
        }

        req.session.user = {
            id: findUser._id.toString(),
            name: findUser.name,   // Store name for UI display
            email: findUser.email
        };
        console.log(req.session.user);
        res.redirect('/');

    } catch (error) {
        
        console.error("Log in error",error);
        res.render('login',{message:"Login Failed. Please try again Later"})

    }
}

const logout = async(req,res)=>{
    try {
        
        req.session.destroy((err)=>{
            if(err){
                console.log("session destroying error",err.message);
                return res.redirect('/pageNotFound')
            }
            return res.redirect('/login')
        })

    } catch (error) {
        console.log("Logout error",error);
        res.redirect('/pageNotFound')
    }
}


module.exports={
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup,
    verifyOtp,
    resendOtp,
    loadLogin,
    login,
    logout,
}