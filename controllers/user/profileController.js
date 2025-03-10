const User = require('../../models/userSchema');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const env = require('dotenv').config();
const session = require('express-session');


function generateOtp(){
    const digits = "1234567890";
    let otp = "";
    for(let i=0;i<6;i++){
        otp+=digits[Math.floor(Math.random()*10)];
    }
    return otp;
}


const sendVerificationEmail = async (email,otp)=>{
    try {

        const transporter = nodemailer.createTransport({
            service : "gmail",
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD,
            }
        })

        const mailOptions = {
            from:process.env.NODEMAILER_EMAIL,
            to:email,
            subject:"OTP for Password-reset",
            text:`Your OTP is ${otp}`,
            html:`<b><h4>Your OTP: ${otp}</h4><br></b>`
        }

        const info = await transporter.sendMail(mailOptions);
        console.log("Email send: ",info.messageId);
        return true;
        
    } catch (error) {

        console.error("Error Sending Email",error);
        return false;
        
    }
}


const getForgotPassPage = async (req,res)=>{
    try {

        res.render('forgot-password');
        
    } catch (error) {
        console.error("Forgot Password Page error");
        res.redirect('/pageNotFound')
    }
}


const forgotEmailValid = async (req,res)=>{
    try {

        const {email} = req.body;
        const findUser = await User.findOne({email:email});
        if(findUser){
            const otp = generateOtp();
            const emailSend = await sendVerificationEmail(email,otp);
            if(emailSend){
                req.session.userOtp = otp;
                req.session.email = email;
                res.render('forgotPass-otp');
                console.log(otp);
            }else{
                res.json({success:false,message:"Failed to send OTP, Please try Again"});
            }
        }else{
            res.render("forgot-password",{
                message:"User with this Email Does not Exist"
            })
        }

        
    } catch (error) {
        res.redirect('/pageNotFound')
    }
}


const verifyForgotPassOtp = async (req, res) => {
    try {
        const enteredOtp = req.body.otp.toString(); // Ensure it's a string
        const storedOtp = req.session.userOtp.toString(); // Ensure it's a string

        console.log("Entered OTP:", enteredOtp); // Debug
        console.log("Stored OTP:", storedOtp); // Debug

        if (enteredOtp === storedOtp) {
            res.json({ success: true, redirectUrl: '/reset-password' }); // Use full path
        } else {
            res.json({ success: false, message: "OTP Not Matching" });
        }
    } catch (error) {
        console.error("Error in OTP verification:", error);
        res.status(500).json({ success: false, message: "An Error occurred, please try again" });
    }
};


const getResetPassPage = async (req,res)=>{
    try {
        
        res.render('reset-password');

    } catch (error) {
        console.error("Reset Password Page error");
        res.redirect('/pageNotFound');
    }
}



module.exports = {
    getForgotPassPage,
    forgotEmailValid,
    verifyForgotPassOtp,
    getResetPassPage
}