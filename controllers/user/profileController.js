const User = require('../../models/userSchema');
const Address = require('../../models/addressSchema');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const env = require('dotenv').config();
const session = require('express-session');
const upload = require('../../helpers/multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

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
            from: process.env.NODEMAILER_EMAIL,nodemon, 
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
        res.render('forgot-password', { message: null });
    } catch (error) {
        console.error("Forgot Password Page error", error);
        res.status(500).render('page-404');
    }
};

const forgotEmailValid = async (req, res) => {
    try {
        const { email } = req.body;
        const findUser = await User.findOne({ email: email });
        if (findUser) {
            const otp = generateOtp();
            const emailSent = await sendVerificationEmail(email, otp);
            if (emailSent) {
                req.session.userOtp = otp;
                req.session.email = email;
                res.render('forgotPass-otp', { message: null });
                console.log("Generated OTP: ", otp);
            } else {
                res.render("forgot-password", {
                    message: "Failed to send OTP, Please try Again"
                });
            }
        } else {
            res.render("forgot-password", {
                message: "User with this Email Does not Exist"
            });
        }
    } catch (error) {
        console.error("Error in forgotEmailValid:", error);
        res.render("forgot-password", {
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


const getProfilePage = async (req, res) => {
    try {
        const userId = req.session.user.id;
        

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            profileImage: user.profileImage
        };
        

        const addressDoc = await Address.findOne({ userId });

        
        res.render('user/profile', {
            user,
            addresses: addressDoc ? addressDoc.addresses : [],
            message: null,
            currentRoute: req.path
        });
    } catch (error) {
        console.error("Profile Page Error:", error);
        res.status(500).render('page-404');
    }
};


const getEditProfilePage = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const user = await User.findById(userId);
        res.render('user/edit-profile', { 
            user, 
            message: null, 
            currentRoute: req.path // Pass the current route
        });
    } catch (error) {
        console.error("Edit Profile Page Error:", error);
        res.status(500).render('page-404');
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { name, email } = req.body;
        let updateData = { name };

        if (email !== req.session.user.email) {
            const otp = generateOtp();
            const emailSent = await sendVerificationEmail(email, otp);
            
            if (!emailSent) {
                return res.render('user/edit-profile', {
                    user: await User.findById(userId),
                    message: "Failed to send verification email"
                });
            }
            
            req.session.newEmail = email;
            req.session.emailOtp = otp;
            return res.render('verify-otp', { 
                action: 'verify-email-otp',
                heading: 'Verify New Email',
                title: 'Verify New Email',
                message: null 
            });
        }

        await User.findByIdAndUpdate(userId, updateData);
        req.session.user.name = name;
        res.redirect('/profile');
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).render('page-404');
    }
};

const verifyEmailOtp = async (req, res) => {
    try {
        const enteredOtp = req.body.otp.toString();
        const storedOtp = req.session.emailOtp.toString();

        if (enteredOtp === storedOtp) {
            const userId = req.session.user.id;
            const newEmail = req.session.newEmail;
            
            await User.findByIdAndUpdate(userId, { email: newEmail });
            req.session.user.email = newEmail;
            
            delete req.session.newEmail;
            delete req.session.emailOtp;
            
            res.json({ 
                success: true, 
                message: "Email updated successfully",
                redirectUrl: '/profile' 
            });
        } else {
            res.json({ 
                success: false, 
                message: "Invalid OTP" 
            });
        }
    } catch (error) {
        console.error("Email OTP Verification Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
};

// Note: You might want to add a resend function for email change OTP
const resendEmailOtp = async (req, res) => {
    try {
        const email = req.session.newEmail;
        if (!email) {
            return res.status(400).json({ success: false, message: "No email found in session" });
        }

        const otp = generateOtp();
        req.session.emailOtp = otp;
        const emailSent = await sendVerificationEmail(email, otp);
        
        if (emailSent) {
            return res.json({ success: true, message: "OTP resent successfully" });
        } else {
            return res.json({ success: false, message: "Failed to resend OTP" });
        }
    } catch (error) {
        console.error("Resend Email OTP Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};



const updateProfileImage = async (req, res) => {
    try {
        const userId = req.session.user.id;
        
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found in database');
        }
        

        // Delete old image if it exists
        if (user.profileImage) {
            const oldImagePath = path.join(__dirname, '../../public/uploads/profile-images', user.profileImage);
            try {
                if (await fs.access(oldImagePath).then(() => true).catch(() => false)) {
                    await fs.unlink(oldImagePath);
                    
                } else {
                    console.log(`Old profile image not found: ${oldImagePath}`);
                }
            } catch (unlinkError) {
                console.error(`Failed to delete old image: ${oldImagePath}`, unlinkError);
            }
        }

        const file = req.file;
        if (!file) {
            throw new Error('No file uploaded');
        }

        const inputFilePath = path.join(__dirname, '../../public/uploads/profile-images', file.filename);
        const tempFilePath = path.join(__dirname, '../../public/uploads/profile-images', `temp-${file.filename}`);

        

        // Resize and save to a temporary file
        await sharp(inputFilePath)
            .resize(200, 200, { fit: 'cover', withoutEnlargement: true })
            .toFile(tempFilePath);

        

        // Replace the original file with the processed one
        await fs.rename(tempFilePath, inputFilePath);
        

        // Update database
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profileImage: file.filename },
            { new: true }
        );
        if (!updatedUser) {
            throw new Error('Failed to update user profile image in database');
        }
        

        // Update session
        req.session.user.profileImage = file.filename;
        

        res.redirect('/profile');
    } catch (error) {
        console.error("Update Profile Image Error:", error);
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
                console.log(`Cleaned up failed upload: ${req.file.path}`);
            } catch (unlinkError) {
                console.error(`Failed to clean up: ${req.file.path}`, unlinkError);
            }
        }
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
    getProfilePage,
    getEditProfilePage,
    updateProfile,
    verifyEmailOtp,
    resendEmailOtp,
    updateProfileImage
};