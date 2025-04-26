const User = require('../../models/userSchema');
const Address = require('../../models/addressSchema');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
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
            subject: "OTP for Email Verification",
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
    }
};


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
        res.render('profile', {
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
        res.render('edit-profile', { 
            user, 
            message: null, 
            currentRoute: req.path 
        });
    } catch (error) {
        console.error("Edit Profile Page Error:", error);
        res.status(500).render('page-404');
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const { name, email, phone, currentPassword, newPassword, confirmNewPassword } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let updateData = {};
        let changesMade = false;
        const errors = {};
        const passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        const phonePattern = /^\d{10}$/;
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const namePattern = /^[A-Za-z.\s]+$/;

        // Validate and collect Name update
        if (name && name.trim() !== user.name) {
            if (!namePattern.test(name.trim())) {
                errors.name = "Name must contain only letters and spaces";
            } else if (name.trim().length < 2) {
                errors.name = "Name must be at least 2 characters long";
            } else {
                updateData.name = name.trim();
                changesMade = true;
            }
        }

        // Validate and collect Phone update
        if (phone && phone.trim() !== '' && phone !== user.phone) {
            if (/[a-zA-Z]/.test(phone)) {
                errors.phone = "Phone number must contain only numbers";
            } else if (!phonePattern.test(phone)) {
                errors.phone = "Phone number must be exactly 10 digits";
            } else {
                updateData.phone = phone.trim();
                changesMade = true;
            }
        }

        // Validate Password Changes
        const isPasswordChangeAttempted = currentPassword || newPassword || confirmNewPassword;
        if (isPasswordChangeAttempted) {
            if (!currentPassword) {
                errors.currentPassword = "Current password is required";
            } else {
                const isMatch = await bcrypt.compare(currentPassword, user.password);
                if (!isMatch) {
                    errors.currentPassword = "Current password is incorrect";
                } else if (!newPassword) {
                    errors.newPassword = "New password is required";
                } else if (!confirmNewPassword) {
                    errors.confirmNewPassword = "Confirm password is required";
                } else {
                    const isSameAsCurrent = await bcrypt.compare(newPassword, user.password);
                    if (isSameAsCurrent) {
                        errors.newPassword = "New password cannot be the same as current password";
                    } else if (newPassword !== confirmNewPassword) {
                        errors.confirmNewPassword = "New passwords do not match";
                    } else if (!passwordPattern.test(newPassword)) {
                        errors.newPassword = [];
                        if (newPassword.length < 8) errors.newPassword.push("Password must be at least 8 characters long");
                        if (!/(?=.*[A-Z])/.test(newPassword)) errors.newPassword.push("Password must contain at least one uppercase letter");
                        if (!/(?=.*[a-z])/.test(newPassword)) errors.newPassword.push("Password must contain at least one lowercase letter");
                        if (!/(?=.*\d)/.test(newPassword)) errors.newPassword.push("Password must contain at least one number");
                        if (!/(?=.*[@$!%*?&])/.test(newPassword)) errors.newPassword.push("Password must contain at least one special character (@$!%*?&)");
                    } else {
                        updateData.password = await securePassword(newPassword);
                        changesMade = true;
                    }
                }
            }
        }

        // If there are any errors, return them immediately
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        // Save non-email changes (name, phone, password) if any
        if (changesMade) {
            await User.findByIdAndUpdate(userId, updateData);
            if (updateData.name) req.session.user.name = updateData.name;
            if (updateData.phone) req.session.user.phone = updateData.phone;
        }

        // Handle Email change separately
        if (email && email !== user.email) {
            if (!emailPattern.test(email)) {
                errors.email = "Please enter a valid email address (e.g., example@domain.com)";
            } else {
                const existingUser = await User.findOne({ email: email });
                if (existingUser && existingUser._id.toString() !== userId) {
                    errors.email = "This email is already registered with another account";
                } else {
                    const otp = generateOtp();
                    console.log("Generated OTP for email change:", otp);
                    const emailSent = await sendVerificationEmail(email, otp);
                    if (!emailSent) {
                        return res.status(400).json({
                            success: false,
                            message: "Failed to send verification email"
                        });
                    }
                    req.session.newEmail = email;
                    req.session.emailOtp = otp;
                    console.log("Stored OTP in session:", req.session.emailOtp);

                    // Return response indicating OTP is required
                    return res.json({
                        success: true,
                        requiresOtp: true,
                        message: changesMade
                            ? "Profile updated successfully. Please verify your new email."
                            : "Please verify your new email"
                    });
                }
            }
            // If email validation fails, return errors
            if (Object.keys(errors).length > 0) {
                return res.status(400).json({ success: false, errors });
            }
        }

        // If no email change but other changes were made
        if (changesMade) {
            return res.json({
                success: true,
                message: isPasswordChangeAttempted
                    ? "Profile and password updated successfully"
                    : "Profile updated successfully",
                redirectUrl: '/profile'
            });
        }

        // If no changes were made at all
        return res.json({ success: false, message: "No changes were made" });

    } catch (error) {
        console.error("Update Profile Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error occurred",
            error: error.message
        });
    }
};


const getVerifyEmailOtpPage = async (req, res) => {
    try {
        if (!req.session.newEmail || !req.session.emailOtp) {
            return res.redirect('/profile');
        }
        res.render('verify-otp', {
            heading: 'OTP Send in your New Email',
            title: 'Verify New Email',
            action: 'verify-email-otp',
            message: null,
            currentRoute: '/verify-email-otp'
        });
    } catch (error) {
        console.error("Get Verify Email OTP Page Error:", error);
        res.status(500).render('page-404');
    }
};

const verifyEmailOtp = async (req, res) => {
    try {
        const enteredOtp = req.body.otp.toString();
        const storedOtp = req.session.emailOtp?.toString();

        if (!storedOtp) {
            return res.json({
                success: false,
                message: "No OTP found in session. Please try changing email again."
            });
        }

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

const resendEmailOtp = async (req, res) => {
    try {
        const email = req.session.newEmail;
        if (!email) {
            return res.status(400).json({ success: false, message: "No email found in session" });
        }

        const otp = generateOtp();
        console.log("Generated new OTP for resend:", otp);
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

        await sharp(inputFilePath)
            .resize(200, 200, { fit: 'cover', withoutEnlargement: true })
            .toFile(tempFilePath);

        await fs.rename(tempFilePath, inputFilePath);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profileImage: file.filename },
            { new: true }
        );
        if (!updatedUser) {
            throw new Error('Failed to update user profile image in database');
        }

        req.session.user.profileImage = file.filename;

        const addressDoc = await Address.findOne({ userId });
        res.render('user/profile', {
            user: updatedUser,
            addresses: addressDoc ? addressDoc.addresses : [],
            message: {
                type: 'success',
                text: 'Profile image updated successfully!'
            },
            currentRoute: '/profile'
        });

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
    getProfilePage,
    getEditProfilePage,
    updateProfile,
    getVerifyEmailOtpPage,
    verifyEmailOtp,
    resendEmailOtp,
    updateProfileImage
};