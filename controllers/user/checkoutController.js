const Address = require('../../models/addressSchema');
const Cart = require('../../models/cartSchema');
const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const Coupon = require('../../models/couponSchema');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../../models/userSchema');
const Wallet = require('../../models/walletSchema');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const getCheckoutPage = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const isBuyNow = req.query.buyNow === 'true';
    let cart = null;
    let itemsWithPrices = [];
    let regularSubTotal = 0;
    let discountAmount = 0;
    let couponDiscount = 0;
    let finalAmount = 0;
    let shippingCost = 0;

    if (isBuyNow) {
      const buyNowOrder = req.session.buyNowOrder;
      if (!buyNowOrder || buyNowOrder.userId !== userId) {
        return res
          .status(400)
          .render('user/page-404', { error: 'Invalid Buy Now order' });
      }

      const product = await Product.findById(buyNowOrder.productId)
        .populate('category')
        .populate('offer');

      if (!product || product.quantity < buyNowOrder.quantity) {
        delete req.session.buyNowOrder;
        return res
          .status(400)
          .render('user/page-404', {
            error: 'Product unavailable or insufficient stock'
          });
      }

      let regularPrice = product.regularPrice;
      let salePrice = regularPrice;
      let productOfferValue = 0;
      let categoryOfferValue = 0;

      if (product.offer && new Date(product.offer.endDate) > new Date()) {
        productOfferValue =
          product.offer.discountType === 'percentage'
            ? product.offer.discountValue
            : (product.offer.discountValue / product.regularPrice) * 100;
      }

      if (
        product.category?.offer?.isActive &&
        new Date(product.category.offer.endDate) > new Date()
      ) {
        categoryOfferValue = product.category.offer.percentage;
      }

      const finalOfferValue = Math.max(productOfferValue, categoryOfferValue);
      if (finalOfferValue > 0) {
        salePrice = regularPrice * (1 - finalOfferValue / 100);
      }

      regularSubTotal = regularPrice * buyNowOrder.quantity;
      discountAmount = (regularPrice - salePrice) * buyNowOrder.quantity;
      couponDiscount = buyNowOrder.discountAmount || 0;
      finalAmount = salePrice * buyNowOrder.quantity - couponDiscount;

      let offerType =
        finalOfferValue > 0
          ? productOfferValue >= categoryOfferValue
            ? 'product'
            : 'category'
          : null;

      itemsWithPrices = [
        {
          productId: product,
          quantity: buyNowOrder.quantity,
          regularPrice,
          salePrice: Math.round(salePrice),
          itemDiscountAmount: Math.round(discountAmount),
          offerType,
          offerPercentage: finalOfferValue
        }
      ];

      req.session.buyNowOrder = {
        ...buyNowOrder,
        subTotal: regularSubTotal,
        finalAmount,
        salePrice: Math.round(salePrice),
        regularPrice,
        discountAmount: couponDiscount,
        totalOffer: finalOfferValue
      };

      if (couponDiscount > 0 && buyNowOrder.couponCode) {
        req.session.appliedCoupon = {
          code: buyNowOrder.couponCode,
          discountAmount: couponDiscount,
          couponId: buyNowOrder.appliedCoupon?.couponId
        };
      } else {
        delete req.session.appliedCoupon;
      }
    } else {
      cart = await Cart.findOne({ userId }).populate({
        path: 'items.productId',
        populate: [
          { path: 'category', select: 'name isListed offer' },
          { path: 'offer' }
        ]
      });

      if (!cart || !cart.items.length) {
        return res.redirect('/cart');
      }

      await cart.calculateTotals();

      const outOfStockItems = cart.items.filter(
        (item) => item.productId.quantity === 0
      );
      if (outOfStockItems.length > 0) {
        const productNames = outOfStockItems
          .map((item) => item.productId.productName)
          .join(', ');
        return res.status(400).json({
          success: false,
          message: `The following products are out of stock: ${productNames}. Please remove them from your cart to proceed.`
        });
      }

      if (cart.couponCode && !req.session.appliedCoupon) {
        const coupon = await Coupon.findOne({
          code: cart.couponCode,
          isActive: true,
          expiryDate: { $gte: new Date() },
          $expr: { $lt: ['$usedCount', '$usageLimit'] },
          usersUsed: { $nin: [userId] },
          $or: [{ isReferral: false }, { userId: userId, isReferral: true }]
        });

        if (
          coupon &&
          (!coupon.minPurchase || cart.subTotal >= coupon.minPurchase)
        ) {
          const offerPrice = cart.subTotal - cart.productDiscount;
          let newCouponDiscount =
            coupon.discountType === 'percentage'
              ? (offerPrice * coupon.value) / 100
              : coupon.value;

          if (coupon.maxDiscount && newCouponDiscount > coupon.maxDiscount) {
            newCouponDiscount = coupon.maxDiscount;
          }

          newCouponDiscount = Math.min(newCouponDiscount, offerPrice);
          cart.couponDiscount = newCouponDiscount;
          cart.finalAmount = offerPrice - newCouponDiscount;

          req.session.appliedCoupon = {
            code: cart.couponCode,
            discountAmount: newCouponDiscount,
            couponId: coupon._id
          };

          await cart.save();
        } else {
          cart.couponCode = null;
          cart.couponDiscount = 0;
          cart.finalAmount = cart.subTotal - cart.productDiscount;
          await cart.save();
          delete req.session.appliedCoupon;
        }
      }

      regularSubTotal = cart.subTotal;
      discountAmount = cart.productDiscount;
      couponDiscount = cart.couponDiscount;
      finalAmount = cart.finalAmount;

      for (const item of cart.items) {
        const product = item.productId;
        const regularPriceTotal = product.regularPrice * item.quantity;
        let productOfferValue = 0;
        let categoryOfferValue = 0;
        let finalOfferValue = 0;
        let offerType = null;

        if (product.offer && new Date(product.offer.endDate) > new Date()) {
          productOfferValue =
            product.offer.discountType === 'percentage'
              ? product.offer.discountValue
              : (product.offer.discountValue / product.regularPrice) * 100;
        }

        if (
          product.category?.offer?.isActive &&
          new Date(product.category.offer.endDate) > new Date()
        ) {
          categoryOfferValue = product.category.offer.percentage;
        }

        if (productOfferValue > 0 || categoryOfferValue > 0) {
          finalOfferValue = Math.max(productOfferValue, categoryOfferValue);
          offerType =
            productOfferValue >= categoryOfferValue ? 'product' : 'category';
        }

        let salePrice = product.regularPrice;
        let itemDiscountAmount = 0;

        if (finalOfferValue > 0) {
          salePrice = product.regularPrice * (1 - finalOfferValue / 100);
          itemDiscountAmount =
            (product.regularPrice - salePrice) * item.quantity;
        }

        itemsWithPrices.push({
          ...item.toObject(),
          regularPrice: product.regularPrice,
          salePrice: Math.round(salePrice),
          itemDiscountAmount: Math.round(itemDiscountAmount),
          offerType,
          offerPercentage: finalOfferValue
        });
      }
    }

    const addressDoc = await Address.findOne({ userId });
    const user = await User.findById(userId).select('wallet');
    const walletBalance = user?.wallet?.balance || 0;
    const canUseWallet = walletBalance >= finalAmount;

    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gte: new Date() },
      $expr: { $lt: ['$usedCount', '$usageLimit'] },
      usersUsed: { $nin: [userId] },
      $or: [{ isReferral: false }, { isReferral: true, userId: userId }]
    });

    res.render('user/checkout', {
      cart: isBuyNow
        ? { items: itemsWithPrices }
        : { ...cart.toObject(), items: itemsWithPrices },
      addresses: addressDoc ? addressDoc.addresses : [],
      regularSubTotal,
      discountAmount,
      couponDiscount,
      shippingCost,
      finalAmount,
      user: req.session.user,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      appliedCoupon: req.session.appliedCoupon || null,
      availableCoupons: coupons,
      walletBalance,
      canUseWallet,
      isBuyNow
    });
  } catch (error) {
    console.error('Error in getCheckoutPage:', error);
    res.status(500).render('user/page-500');
  }
};

const createRazorpayOrder = async (amount, currency = 'INR') => {
  try {
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount: Amount must be greater than zero');
    }

    const amountInPaise = Math.round(amount * 100);

    if (isNaN(amountInPaise) || !Number.isInteger(amountInPaise)) {
      throw new Error('Invalid amount: Amount must be a valid number');
    }

    const options = {
      amount: amountInPaise,
      currency,
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay Error:', error);
    throw new Error(
      `Failed to create Razorpay order: ${error.message || JSON.stringify(error)}`
    );
  }
};

const verifyPayment = (orderId, paymentId, signature) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
};

const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { addressId, paymentMethod } = req.body;
    const isBuyNow = !!req.session.buyNowOrder;
    let cart = null;
    let orderData = null;

    const addressDoc = await Address.findOne({ userId });
    const user = await User.findById(userId);

    if (!addressDoc) {
      return res
        .status(400)
        .json({ success: false, message: 'Address not found' });
    }

    const selectedAddress = addressDoc.addresses.id(addressId);
    if (!selectedAddress) {
      return res
        .status(400)
        .json({ success: false, message: 'Selected address not found' });
    }

    if (isBuyNow) {
      const buyNowOrder = req.session.buyNowOrder;
      if (!buyNowOrder || buyNowOrder.userId !== userId) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid buy now order' });
      }

      const product = await Product.findById(buyNowOrder.productId)
        .populate('category')
        .populate('offer');

      if (!product || product.quantity < buyNowOrder.quantity) {
        delete req.session.buyNowOrder;
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${buyNowOrder.productName}`
        });
      }

      let regularPrice = product.regularPrice;
      let salePrice = regularPrice;
      let productOfferValue = 0;
      let categoryOfferValue = 0;

      if (product.offer && new Date(product.offer.endDate) > new Date()) {
        productOfferValue =
          product.offer.discountType === 'percentage'
            ? product.offer.discountValue
            : (product.offer.discountValue / product.regularPrice) * 100;
      }

      if (
        product.category?.offer?.isActive &&
        new Date(product.category.offer.endDate) > new Date()
      ) {
        categoryOfferValue = product.category.offer.percentage;
      }

      const finalOfferValue = Math.max(productOfferValue, categoryOfferValue);
      if (finalOfferValue > 0) {
        salePrice = regularPrice * (1 - finalOfferValue / 100);
      }

      const quantity = buyNowOrder.quantity;
      const totalPrice = Number((regularPrice * quantity).toFixed(2));
      const productDiscount = Number(
        ((regularPrice - salePrice) * quantity).toFixed(2)
      );
      const couponDiscount = Number(
        (buyNowOrder.discountAmount || 0).toFixed(2)
      );
      const shippingCost = Number((0).toFixed(2));
      const finalAmount = Number(
        (salePrice * quantity - couponDiscount + shippingCost).toFixed(2)
      );

      orderData = {
        userId,
        orderedItems: [
          {
            product: buyNowOrder.productId,
            quantity: buyNowOrder.quantity,
            price: Number(salePrice.toFixed(2)),
            subTotal: Number((salePrice * quantity).toFixed(2)),
            status: 'Pending',
            regularPrice: regularPrice
          }
        ],
        totalPrice: totalPrice,
        discount: productDiscount,
        couponDiscount: couponDiscount,
        taxes: 0,
        shippingCost: shippingCost,
        finalAmount: finalAmount,
        address: selectedAddress,
        paymentMethod,
        paymentStatus: 'Pending',
        status: 'Pending',
        isVisibleToAdmin: true,
        couponApplied: !!buyNowOrder.couponCode,
        couponCode: buyNowOrder.couponCode || null
      };
    } else {
      cart = await Cart.findOne({ userId }).populate({
        path: 'items.productId',
        populate: ['category', 'offer']
      });

      if (!cart) {
        return res
          .status(400)
          .json({ success: false, message: 'Cart not found' });
      }

      let totalPrice = 0;
      let productDiscount = 0;
      let couponDiscount = cart.couponDiscount || 0;
      const shippingCost = 0;

      const orderedItems = cart.items.map((item) => {
        const product = item.productId;
        const regularPrice = product.regularPrice;
        let salePrice = regularPrice;
        let itemDiscount = 0;

        let productOfferValue = 0;
        let categoryOfferValue = 0;

        if (product.offer && new Date(product.offer.endDate) > new Date()) {
          productOfferValue =
            product.offer.discountType === 'percentage'
              ? product.offer.discountValue
              : (product.offer.discountValue / product.regularPrice) * 100;
        }

        if (
          product.category?.offer?.isActive &&
          new Date(product.category.offer.endDate) > new Date()
        ) {
          categoryOfferValue = product.category.offer.percentage;
        }

        if (productOfferValue > 0 || categoryOfferValue > 0) {
          const finalOfferValue = Math.max(
            productOfferValue,
            categoryOfferValue
          );
          salePrice = regularPrice * (1 - finalOfferValue / 100);
          itemDiscount = (regularPrice - salePrice) * item.quantity;
        }

        totalPrice += regularPrice * item.quantity;
        productDiscount += itemDiscount;

        if (item.quantity > product.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.productName}`
          });
        }

        return {
          product: product._id,
          quantity: item.quantity,
          price: salePrice,
          regularPrice: regularPrice,
          subTotal: salePrice * item.quantity,
          status: item.status || 'Pending',
          cancellationReason: item.cancellationReason
        };
      });

      const finalAmount =
        totalPrice - productDiscount - couponDiscount + shippingCost;

      orderData = {
        userId,
        orderedItems,
        totalPrice,
        discount: productDiscount,
        couponDiscount,
        taxes: 0,
        shippingCost,
        finalAmount,
        address: selectedAddress,
        paymentMethod,
        paymentStatus: 'Pending',
        status: 'Pending',
        isVisibleToAdmin: true,
        couponApplied: !!cart.couponCode,
        couponCode: cart.couponCode || null
      };
    }

    if (paymentMethod === 'Cash on Delivery' && orderData.finalAmount > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Cash on Delivery not available for orders above ₹5000'
      });
    }

    if (paymentMethod === 'Wallet') {
      if (user.wallet.balance < orderData.finalAmount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance'
        });
      }

      user.wallet.balance -= orderData.finalAmount;
      await user.save();

      function generateTransactionId(userId) {
        return `WALLET-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      }

      const walletTransaction = new Wallet({
        userId,
        amount: orderData.finalAmount,
        type: 'debit',
        description: 'Order payment',
        orderId: `ORDER-${Date.now()}`,
        transactionId: generateTransactionId(user._id)
      });
      await walletTransaction.save();

      orderData.paymentStatus = 'Paid';
      orderData.paymentMethod = 'Wallet';
    }

    if (paymentMethod === 'Razorpay') {
      try {
        const razorpayAmount = orderData.finalAmount;
        const roundedAmount = Math.round(razorpayAmount * 100) / 100;

        const razorpayOrder = await createRazorpayOrder(roundedAmount);

        req.session.pendingOrder = {
          ...orderData,
          razorpayOrderId: razorpayOrder.id,
          isBuyNow,
          expectedAmount: roundedAmount
        };

        return res.status(200).json({
          success: true,
          razorpayOrderId: razorpayOrder.id,
          amount: Math.round(roundedAmount * 100),
          currency: 'INR',
          message: 'Razorpay order created successfully'
        });
      } catch (error) {
        console.error('Error creating Razorpay order:', error);
        const failedOrder = new Order({
          ...orderData,
          paymentStatus: 'Failed',
          status: 'Payment Failed',
          isVisibleToAdmin: false,
          errorMessage: error.message
        });

        const savedOrder = await failedOrder.save();
        if (isBuyNow) delete req.session.buyNowOrder;

        return res.status(400).json({
          success: false,
          orderId: savedOrder.orderId,
          message: `Razorpay payment failed: ${error.message}`
        });
      }
    }

    const isPaymentSuccessful = Math.random() > 0.3;

    if (!isPaymentSuccessful && paymentMethod !== 'Wallet') {
      const failedOrder = new Order({
        ...orderData,
        paymentStatus: 'Failed',
        status: 'Payment Failed',
        isVisibleToAdmin: false,
        errorMessage: 'Simulated payment failure'
      });

      const savedFailedOrder = await failedOrder.save();
      if (isBuyNow) delete req.session.buyNowOrder;

      return res.status(400).json({
        success: false,
        orderId: savedFailedOrder.orderId,
        message: 'Payment simulation failed. Order saved with failed status.'
      });
    }

    orderData.paymentStatus = paymentMethod === 'Wallet' ? 'Paid' : 'Pending';
    const order = new Order(orderData);
    const savedOrder = await order.save();

    for (const item of orderData.orderedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity }
      });
    }

    if (orderData.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: orderData.couponCode },
        {
          $inc: { usedCount: 1 },
          $push: { usersUsed: userId }
        }
      );
    }

    if (!isBuyNow) {
      await Cart.findOneAndDelete({ userId });
      delete req.session.appliedCoupon;
    }
    if (isBuyNow) delete req.session.buyNowOrder;

    res.status(200).json({
      success: true,
      orderId: savedOrder.orderId,
      message: 'Order placed successfully'
    });
  } catch (error) {
    console.error('Error in placeOrder:', error);

    const minimalFailedOrder = new Order({
      userId: req.session.user.id,
      paymentStatus: 'Failed',
      status: 'Payment Failed',
      isVisibleToAdmin: false,
      errorMessage: error.message,
      finalAmount: 0,
      totalPrice: 0,
      address: {
        addressType: 'Unknown',
        name: 'Error',
        city: 'Error',
        state: 'Error',
        pinCode: '000000',
        phone: '0000000000'
      }
    });

    const savedFailedOrder = await minimalFailedOrder.save();
    if (req.session.buyNowOrder) delete req.session.buyNowOrder;

    res.status(500).json({
      success: false,
      orderId: savedFailedOrder.orderId,
      message: `Failed to place order: ${error.message}`
    });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      req.body;
    const userId = req.session.user.id;
    const pendingOrder = req.session.pendingOrder;
    const isBuyNow = pendingOrder?.isBuyNow || false;

    if (!pendingOrder || pendingOrder.razorpayOrderId !== razorpay_order_id) {
      const missingOrderData = {
        userId,
        paymentStatus: 'Failed',
        status: 'Payment Failed',
        isVisibleToAdmin: false,
        razorpayOrderId: razorpay_order_id,
        errorMessage: 'Invalid or missing pending order session data',
        finalAmount: 0,
        totalPrice: 0,
        address: {
          addressType: 'Unknown',
          name: 'Error',
          city: 'Error',
          state: 'Error',
          pinCode: '000000',
          phone: '0000000000'
        }
      };

      const failedOrder = new Order(missingOrderData);
      const savedOrder = await failedOrder.save();
      delete req.session.pendingOrder;
      if (isBuyNow) delete req.session.buyNowOrder;

      return res.status(400).json({
        success: false,
        orderId: savedOrder.orderId,
        message: 'Invalid or missing pending order data'
      });
    }

    const isValidSignature = verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      const invalidSignatureData = {
        ...pendingOrder,
        paymentStatus: 'Failed',
        status: 'Payment Failed',
        isVisibleToAdmin: false,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        errorMessage: 'Invalid payment signature'
      };

      const failedOrder = new Order(invalidSignatureData);
      const savedOrder = await failedOrder.save();
      delete req.session.pendingOrder;
      if (isBuyNow) delete req.session.buyNowOrder;

      return res.status(400).json({
        success: false,
        orderId: savedOrder.orderId,
        message: 'Invalid payment signature. Order saved with failed status.'
      });
    }

    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const paidAmount = payment.amount / 100;

    if (paidAmount !== pendingOrder.expectedAmount) {
      const amountMismatchData = {
        ...pendingOrder,
        paymentStatus: 'Failed',
        status: 'Payment Failed',
        isVisibleToAdmin: false,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        errorMessage: `Payment amount mismatch. Expected: ${pendingOrder.expectedAmount}, Paid: ${paidAmount}`
      };

      const failedOrder = new Order(amountMismatchData);
      const savedOrder = await failedOrder.save();
      delete req.session.pendingOrder;
      if (isBuyNow) delete req.session.buyNowOrder;

      return res.status(400).json({
        success: false,
        orderId: savedOrder.orderId,
        message: 'Payment amount mismatch. Please contact support.'
      });
    }

    const successOrderData = {
      ...pendingOrder,
      paymentStatus: 'Paid',
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      paidAmount: paidAmount
    };

    const order = new Order(successOrderData);
    const savedOrder = await order.save();

    if (savedOrder.orderedItems && savedOrder.orderedItems.length > 0) {
      for (const item of savedOrder.orderedItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: -item.quantity }
        });
      }
    }

    if (savedOrder.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: savedOrder.couponCode },
        {
          $inc: { usedCount: 1 },
          $push: { usersUsed: userId }
        }
      );
    }

    if (!isBuyNow) {
      await Cart.findOneAndDelete({ userId });
      delete req.session.appliedCoupon;
    }
    delete req.session.pendingOrder;
    if (isBuyNow) delete req.session.buyNowOrder;

    res.status(200).json({
      success: true,
      orderId: savedOrder.orderId,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    console.error('Error in verifyRazorpayPayment:', error);

    const minimalFailedOrder = new Order({
      userId: req.session.user.id,
      paymentStatus: 'Failed',
      status: 'Payment Failed',
      isVisibleToAdmin: false,
      razorpayOrderId: req.body.razorpay_order_id,
      errorMessage: `Verification error: ${error.message}`,
      finalAmount: 0,
      totalPrice: 0,
      address: {
        addressType: 'Unknown',
        name: 'Error',
        city: 'Error',
        state: 'Error',
        pinCode: '000000',
        phone: '0000000000'
      }
    });

    const savedFailedOrder = await minimalFailedOrder.save();
    delete req.session.pendingOrder;
    if (req.session.buyNowOrder) delete req.session.buyNowOrder;

    res.status(500).json({
      success: false,
      orderId: savedFailedOrder.orderId,
      message: `Failed to verify payment: ${error.message}`
    });
  }
};

const getOrderSuccessPage = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const order = await Order.findOne({ orderId }).populate(
      'orderedItems.product'
    );

    if (!order) {
      return res.status(404).render('user/page-404');
    }

    res.render('user/order-success', {
      order,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error in getOrderSuccessPage:', error);
    res.status(500).render('user/page-500');
  }
};

const getOrderFailurePage = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const pendingOrder = req.session.pendingOrder || {};
    const order = await Order.findOne({ orderId }).populate(
      'orderedItems.product'
    );

    delete req.session.buyNowOrder;

    res.render('user/order-failure', {
      order: order || { orderId: orderId || 'N/A' },
      pendingOrder,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error in getOrderFailurePage:', error);
    res.status(500).render('user/page-500');
  }
};

const clearSession = async (req, res) => {
  try {
    delete req.session.pendingOrder;
    delete req.session.appliedCoupon;
    delete req.session.buyNowOrder;
    res.status(200).json({ success: true, message: 'Session cleared' });
  } catch (error) {
    console.error('Error clearing session:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to clear session' });
  }
};

module.exports = {
  getCheckoutPage,
  placeOrder,
  verifyRazorpayPayment,
  getOrderSuccessPage,
  getOrderFailurePage,
  clearSession
};
