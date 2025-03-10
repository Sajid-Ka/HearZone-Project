const User = require('../../models/userSchema');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const env = require('dotenv').config();
const session = require('express-session');

function generateOtp() {
    const digits = "1234567890";
    let otp = "";
    for (let i = 0; i < 6; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}

const sendVerificationEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "OTP for Password-reset",
            text: `Your OTP is ${otp}`,
            html: `<b><h4>Your OTP: ${otp}</h4><br></b>`,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: ", info.messageId);
        return true;
    } catch (error) {
        console.error("Error Sending Email", error);
        return false;
    }
};



const securePassword = async (password)=>{
    try {

        const passwordHash = await bcrypt.hash(password,10);
        return passwordHash;
        
    } catch (error) {
        console.error("password Securing Error",error);
    }
}


const getForgotPassPage = async (req, res) => {
    try {
        res.render('forgot-password');
    } catch (error) {
        console.error("Forgot Password Page error", error);
        res.redirect('/pageNotFound');
    }
};

const forgotEmailValid = async (req, res) => {
    try {
        const { email } = req.body;
        const findUser = await User.findOne({ email: email });
        if (findUser) {
            const otp = generateOtp();
            const emailSend = await sendVerificationEmail(email, otp);
            if (emailSend) {
                req.session.userOtp = otp;
                req.session.email = email;
                res.render('forgotPass-otp');
                console.log("Generated OTP: ", otp);
            } else {
                res.json({ success: false, message: "Failed to send OTP, Please try Again" });
            }
        } else {
            res.render("forgot-password", {
                message: "User with this Email Does not Exist",
            });
        }
    } catch (error) {
        console.error("Error in forgotEmailValid:", error);
        res.redirect('/pageNotFound');
    }
};

const verifyForgotPassOtp = async (req, res) => {
    try {
        const enteredOtp = req.body.otp.toString();
        const storedOtp = req.session.userOtp.toString();

        console.log("Entered OTP:", enteredOtp);
        console.log("Stored OTP:", storedOtp);

        if (enteredOtp === storedOtp) {
            res.json({ success: true, redirectUrl: '/reset-password' });
        } else {
            res.json({ success: false, message: "OTP Not Matching" });
        }
    } catch (error) {
        console.error("Error in OTP verification:", error);
        res.status(500).json({ success: false, message: "An Error occurred, please try again" });
    }
};

const getResetPassPage = async (req, res) => {
    try {
        res.render('reset-password');
    } catch (error) {
        console.error("Reset Password Page error", error);
        res.redirect('/pageNotFound');
    }
};

const resendOtp = async (req, res) => {
    try {
        const email = req.session.email;
        if (!email) {
            return res.status(400).json({ success: false, message: "No email found in session" });
        }

        const otp = generateOtp();
        req.session.userOtp = otp;
        console.log("Resending OTP to email: ", email);

        const emailSend = await sendVerificationEmail(email, otp);
        if (emailSend) {
            console.log("Resend OTP: ", otp);
            return res.status(200).json({ success: true, message: "Resend OTP Successful" });
        } else {
            return res.status(500).json({ success: false, message: "Failed to send OTP" });
        }
    } catch (error) {
        console.error("Resend OTP error", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


const postNewPassword = async (req,res)=>{
    try {

        const {newPass1,newPass2} = req.body;
        const email = req.session.email;
        if(newPass1===newPass2){
            const passwordHash = await securePassword(newPass1);
            await User.updateOne(
                {email:email},
                {$set:{password:passwordHash}}
            )
            res.redirect('/login');
        }else{
            res.render('reset-password',{message:"Passwords Do not matched"})
        }
        
    } catch (error) {
        res.redirect('/pageNotFound');
    }
}


module.exports = {
    getForgotPassPage,
    forgotEmailValid,
    verifyForgotPassOtp,
    getResetPassPage,
    resendOtp,
    postNewPassword,
};