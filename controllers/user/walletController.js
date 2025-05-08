const User = require('../../models/userSchema');
const Wallet = require('../../models/walletSchema');
const Order = require('../../models/orderSchema');

const getWallet = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const user = await User.findById(userId).lean();
        if (!user) {
            return res.status(404).render('user/page-404', { message: 'User not found' });
        }

        const transactions = await Wallet.find({ userId })
            .sort({ date: -1 })
            .lean();

        res.render('user/wallet', {
            user: req.session.user,
            wallet: user.wallet || { balance: 0, transactions: [] },
            transactions,
            currentRoute: '/wallet'
        });
    } catch (error) {
        console.error('Error fetching wallet:', error);
        res.status(500).render('user/page-500', { message: 'Failed to load wallet' });
    }
};

const initiateWalletPayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.session.user.id;

        const order = await Order.findOne({ orderId, userId });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.wallet.balance < order.finalAmount) {
            return res.status(400).json({ 
                success: false, 
                message: 'Insufficient wallet balance' 
            });
        }

        // Redirect to order controller for processing
        res.redirect(`/admin/orders/${orderId}/wallet-payment`);
    } catch (error) {
        console.error('Error initiating wallet payment:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to initiate wallet payment' 
        });
    }
};

module.exports = {
    getWallet,
    initiateWalletPayment
};