const User = require('../../models/userSchema');
const Wallet = require('../../models/walletSchema');
const Order = require('../../models/orderSchema');

const getAllWallets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const search = req.query.search || '';

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('name email wallet')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    res.render('admin/wallets', {
      users,
      currentPage: page,
      totalPages,
      search,
      admin: req.session.admin
    });
  } catch (error) {
    console.error('Error fetching wallets:', error);
    res.redirect('/admin/pageError');
  }
};

const getWalletDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('name email wallet').lean();
    if (!user) {
      return res.redirect('/admin/wallets?error=User not found');
    }

    const transactions = await Wallet.find({ userId })
      .populate('orderId', 'orderId status')
      .sort({ date: -1 })
      .lean();

    res.render('admin/wallet-details', {
      user,
      transactions,
      admin: req.session.admin
    });
  } catch (error) {
    console.error('Error fetching wallet details:', error);
    res.redirect('/admin/pageError');
  }
};

module.exports = {
  getAllWallets,
  getWalletDetails
};
