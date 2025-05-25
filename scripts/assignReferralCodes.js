const mongoose = require('mongoose');
const User = require('../models/userSchema');
const { generateReferralCode } = require('../utils/referralUtils');
require('dotenv').config();

async function fixReferralCodes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    const users = await User.find({
      $or: [
        { referralCode: { $exists: false } },
        { referralCode: null },
        { referralCode: '' },
        { referralCode: { $not: /^[A-Z0-9]{8}$/ } },
        { referralCode: { $type: ['null', 'undefined', 'object', 'array'] } }
      ]
    });

    if (users.length === 0) {
      console.log('No users with invalid referral codes found');
      return;
    }

    console.log(`Found ${users.length} users with invalid referral codes`);

    for (const user of users) {
      let isUnique = false;
      let newReferralCode;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        newReferralCode = generateReferralCode();
        const existingCode = await User.findOne({
          referralCode: newReferralCode
        });
        if (!existingCode) isUnique = true;
        attempts++;
      }

      if (!isUnique) {
        console.error(
          `Could not generate unique referral code for user ${user.email}`
        );
        continue;
      }

      user.referralCode = newReferralCode;
      await user.save();
      console.log(
        `Assigned referral code ${newReferralCode} to user ${user.email}`
      );
    }

    console.log('All invalid referral codes fixed');
  } catch (error) {
    console.error('Error fixing referral codes:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

fixReferralCodes();
