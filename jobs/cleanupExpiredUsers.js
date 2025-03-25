const cron = require('node-cron');
const User = require('../models/userSchema'); // Adjust the path if needed

const cleanupExpiredTempUsers = async () => {
    try {
        await User.deleteMany({
            otp: { $ne: null }, // Users with OTP set
            otpExpiresAt: { $lt: new Date() }, // Expired OTPs
        });
        console.log('Cleaned up expired temporary users');
    } catch (error) {
        console.error('Cleanup error:', error);
    }
};

// Schedule the cleanup task to run every hour
cron.schedule('0 * * * *', cleanupExpiredTempUsers);

console.log('Scheduled job: Cleanup expired temporary users');

module.exports = cleanupExpiredTempUsers;