const User = require('../../models/userSchema');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
require('dotenv').config();

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

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.error("password Securing Error", error);
        throw error;
    }
};

const getForgotPassPage = async (req, res) => {
    try {
        let userEmail = null;
        if (req.session.user) {
            const userId = req.session.user.id || req.session.user._id || req.session.user;
            if (mongoose.Types.ObjectId.isValid(userId)) {
                const user = await User.findById(userId);
                userEmail = user?.email || null;
            }
        }
        console.log("User Email:", userEmail);
        res.render('forgot-password', { 
            message: null,
            userEmail: userEmail 
        });
    } catch (error) {
        console.error("Forgot Password Page error", error);
        res.status(500).render('page-404');
    }
};

const forgotEmailValid = async (req, res) => {
    try {
        const { email } = req.body;
        const findUser = await User.findOne({ email: email });
        
        if (!findUser) {
            return res.status(400).json({ 
                success: false, 
                message: "User with this email does not exist" 
            });
        }

        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);
        
        if (!emailSent) {
            return res.status(500).json({ 
                success: false, 
                message: "Failed to send OTP, please try again" 
            });
        }

        req.session.userOtp = otp;
        req.session.email = email;
        console.log("Generated OTP: ", otp);
        
        res.json({ 
            success: true, 
            redirectUrl: '/forgotPass-otp' 
        });
        
    } catch (error) {
        console.error("Error in forgotEmailValid:", error);
        res.status(500).json({ 
            success: false, 
            message: "An error occurred. Please try again." 
        });
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
            res.json({ success: false, message: "Invalid OTP" });
        }
    } catch (error) {
        console.error("Error in OTP verification:", error);
        res.status(500).json({ 
            success: false, 
            message: "An error occurred, please try again" 
        });
    }
};

const getResetPassPage = async (req, res) => {
    try {
        res.render('reset-password', { message: null, success: false });
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

const postNewPassword = async (req, res) => {
    try {
        const { newPass1, newPass2 } = req.body;
        const email = req.session.email;

        if (!email) {
            return res.render('reset-password', { 
                message: "Session expired. Please try again.", 
                success: false 
            });
        }

        if (newPass1 !== newPass2) {
            return res.render('reset-password', { 
                message: "Passwords do not match", 
                success: false 
            });
        }

        const passwordHash = await securePassword(newPass1);
        await User.updateOne(
            { email: email },
            { $set: { password: passwordHash } }
        );

        // Clear session data
        req.session.email = null;
        req.session.userOtp = null;

        res.render('reset-password', { 
            message: null, 
            success: true 
        });

    } catch (error) {
        console.error("Password reset error:", error);
        res.render('reset-password', { 
            message: "An error occurred while resetting the password. Please try again.", 
            success: false 
        });
    }
};

const getForgotPassOtpPage = async (req, res) => {
    try {
        if (!req.session.email || !req.session.userOtp) {
            return res.redirect('/forgot-password');
        }
        res.render('forgotPass-otp', { message: null });
    } catch (error) {
        console.error("Forgot Password OTP Page error", error);
        res.status(500).render('page-404');
    }
};

module.exports = {
    getForgotPassPage,
    forgotEmailValid,
    verifyForgotPassOtp,
    getResetPassPage,
    resendOtp,
    postNewPassword,
    getForgotPassOtpPage
};