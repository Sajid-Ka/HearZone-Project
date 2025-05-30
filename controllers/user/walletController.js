const User = require('../../models/userSchema');
const Wallet = require('../../models/walletSchema');
const Order = require('../../models/orderSchema');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.session.user.id;

    if (!amount) {
      return res
        .status(400)
        .json({ success: false, message: 'Amount is required' });
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Amount must be a valid number greater than 0',
        });
    }
    if (!Number.isInteger(parsedAmount)) {
      return res
        .status(400)
        .json({ success: false, message: 'Amount must be a whole number' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    
    const shortUserId = userId.toString().slice(-8); 
    const timestamp = Date.now().toString().slice(-6); 
    const receipt = `w_${shortUserId}_${timestamp}`; 

    const options = {
      amount: parsedAmount * 100, 
      currency: 'INR',
      receipt: receipt,
      payment_capture: 1, 
    };

    const order = await razorpay.orders.create(options);
    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: parsedAmount,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
    });
  }
};


const getWallet = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await User.findById(userId).lean();
    if (!user) {
      return res
        .status(404)
        .render('user/page-404', { message: 'User not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const totalTransactions = await Wallet.countDocuments({ userId });
    const transactions = await Wallet.find({ userId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(totalTransactions / limit);

    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      const transactionHTML = `
                ${
                  transactions.length > 0
                    ? `
                    <div class="overflow-x-auto">
                        <table class="w-full table-auto">
                            <thead>
                                <tr class="bg-gray-50 text-gray-600 border-b">
                                    <th class="px-4 py-3 text-left text-sm font-medium">Date</th>
                                    <th class="px-4 py-3 text-left text-sm font-medium">Description</th>
                                    <th class="px-4 py-3 text-left text-sm font-medium">Type</th>
                                    <th class="px-4 py-3 text-left text-sm font-medium">Amount</th>
                                    <th class="px-4 py-3 text-left text-sm font-medium">Order</th>
                                </tr>
                            </thead>
                            <tbody id="transactionTableBody">
                                ${transactions
                                  .map(
                                    (transaction, index) => `
                                    <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50 transition-colors">
                                        <td class="px-4 py-3 text-gray-700">${new Date(transaction.date).toLocaleString()}</td>
                                        <td class="px-4 py-3 text-gray-700">${transaction.description}</td>
                                        <td class="px-4 py-3">
                                            <span class="${transaction.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-xs font-medium px-2 py-1 rounded-full">
                                                ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                            </span>
                                        </td>
                                        <td class="px-4 py-3 ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'} font-medium">
                                            ${transaction.type === 'credit' ? '+' : '-'}₹${transaction.amount.toFixed(2)}
                                        </td>
                                        <td class="px-4 py-3">
                                            ${
                                              transaction.orderId
                                                ? `
                                                <a href="/orders/${transaction.orderId}" class="text-indigo-600 hover:underline flex items-center">
                                                    <span class="truncate max-w-xs">${transaction.orderId}</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            `
                                                : `
                                                <span class="text-gray-400">-</span>
                                            `
                                            }
                                        </td>
                                    </tr>
                                `
                                  )
                                  .join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="mt-6 flex flex-col sm:flex-row justify-between items-center" id="paginationControls">
                        <div class="text-sm text-gray-600 mb-4 sm:mb-0">
                            Showing ${(page - 1) * limit + 1} to ${Math.min(page * limit, totalTransactions)} of ${totalTransactions} transactions
                        </div>
                        <div class="flex space-x-2">
                            <button 
                                onclick="changePage(${page > 1 ? page - 1 : 1})" 
                                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition ${page === 1 ? 'cursor-not-allowed opacity-50' : ''}"
                                ${page === 1 ? 'disabled' : ''}
                            >
                                <span class="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Previous
                                </span>
                            </button>
                            
                            ${(() => {
                              let startPage = Math.max(1, page - 2);
                              let endPage = Math.min(totalPages, page + 2);

                              if (endPage - startPage < 4 && totalPages > 5) {
                                if (startPage === 1) {
                                  endPage = Math.min(startPage + 4, totalPages);
                                } else if (endPage === totalPages) {
                                  startPage = Math.max(endPage - 4, 1);
                                }
                              }

                              let paginationHTML = '';

                              if (startPage > 1) {
                                paginationHTML += '<button onclick="changePage(1)" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition">1</button>';
                                if (startPage > 2) {
                                  paginationHTML += '<span class="px-2 py-2 text-gray-500">...</span>';
                                }
                              }

                              for (let i = startPage; i <= endPage; i++) {
                                paginationHTML += `
                                        <button 
                                            onclick="changePage(${i})" 
                                            class="px-4 py-2 rounded-md ${page === i ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 transition'}"
                                        >
                                            ${i}
                                        </button>
                                    `;
                              }

                              if (endPage < totalPages) {
                                if (endPage < totalPages - 1) {
                                  paginationHTML += '<span class="px-2 py-2 text-gray-500">...</span>';
                                }
                                paginationHTML += `<button onclick="changePage(${totalPages})" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition">${totalPages}</button>`;
                              }

                              return paginationHTML;
                            })()}
                            
                            <button 
                                onclick="changePage(${page < totalPages ? page + 1 : totalPages})" 
                                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition ${page === totalPages ? 'cursor-not-allowed opacity-50' : ''}"
                                ${page === totalPages ? 'disabled' : ''}
                            >
                                <span class="flex items-center">
                                    Next
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </button>
                        </div>
                    </div>
                `
                    : `
                    <div class="text-center py-10">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p class="text-gray-500 text-lg">No transactions found.</p>
                        <p class="text-gray-400 mt-2">Your transaction history will appear here once you start using your wallet.</p>
                    </div>
                `
                }
            `;

      return res.json({ transactionHTML });
    }

    res.render('user/wallet', {
      user: req.session.user,
      wallet: user.wallet || { balance: 0, transactions: [] },
      transactions,
      currentRoute: '/wallet',
      page,
      limit,
      totalTransactions,
      totalPages
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res
      .status(500)
      .render('user/page-500', { message: 'Failed to load wallet' });
  }
};

const initiateWalletPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.session.user.id;

    const order = await Order.findOne({ orderId, userId });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    if (user.wallet.balance < order.finalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    res.redirect(`/admin/orders/${orderId}/wallet-payment`);
  } catch (error) {
    console.error('Error initiating wallet payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate wallet payment'
    });
  }
};

const addMoneyToWallet = async (req, res) => {
  try {
    const { amount, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const userId = req.session.user.id;

    if (!amount || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing payment details' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Amount must be a valid number greater than 0',
        });
    }
    if (!Number.isInteger(parsedAmount)) {
      return res
        .status(400)
        .json({ success: false, message: 'Amount must be a whole number' });
    }

    // Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid payment signature' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const transactionId = uuidv4();
    const walletTransaction = {
      userId,
      amount: parsedAmount,
      type: 'credit',
      description: `Added money to wallet via Razorpay (Payment ID: ${razorpay_payment_id})`,
      transactionId,
    };

    await Wallet.create(walletTransaction);

    user.wallet.balance = (user.wallet.balance || 0) + parsedAmount;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: 'Money added successfully' });
  } catch (error) {
    console.error('Error adding money to wallet:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate transaction detected. Please try again.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to add money to wallet',
    });
  }
};

module.exports = {
  getWallet,
  initiateWalletPayment,
  addMoneyToWallet,
  createRazorpayOrder
};
