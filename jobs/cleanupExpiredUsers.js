const cron = require('node-cron');
const User = require('../models/userSchema');

const cleanupExpiredTempUsers = async () => {
  try {
    await User.deleteMany({
      otp: { $ne: null },
      otpExpiresAt: { $lt: new Date() }
    });
    console.log('Cleaned up expired temporary users');
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

cron.schedule('0 * * * *', cleanupExpiredTempUsers);

console.log('Scheduled job: Cleanup expired temporary users');

module.exports = cleanupExpiredTempUsers;
