const Cart = require('../../models/cartSchema');
const Product = require('../../models/productSchema');
const Wishlist = require('../../models/wishlistSchema');
const mongoose = require('mongoose');

const getCartItems = async (req, res) => {
  try {
    const userId = req.session.user.id;

    let cart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      populate: [
        { path: 'category', select: 'name isListed offer' },
        { path: 'brand', select: 'brandName isBlocked' },
        { path: 'offer' }
      ]
    });

    let cartData = {
      items: [],
      subTotal: 0,
      discountAmount: 0,
      finalAmount: 0
    };

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.render('user/cart', {
        cart: cartData,
        subTotal: cartData.subTotal,
        discountAmount: cartData.discountAmount,
        finalAmount: cartData.finalAmount
      });
    }

    const initialItemCount = cart.items.length;
    cart.items = cart.items.filter((item) => {
      const product = item.productId;
      if (!product) return false;
      return (
        !product.isBlocked &&
        product.category &&
        product.category.isListed &&
        product.brand &&
        !product.brand.isBlocked
      );
    });

    let needsUpdate = initialItemCount !== cart.items.length;

    const updatedItems = [];
    for (const item of cart.items) {
      const product = item.productId;

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
        if (productOfferValue >= categoryOfferValue) {
          finalOfferValue = productOfferValue;
          offerType = 'product';
        } else {
          finalOfferValue = categoryOfferValue;
          offerType = 'category';
        }
      }

      let salePrice = product.regularPrice;
      if (finalOfferValue > 0) {
        salePrice = product.regularPrice * (1 - finalOfferValue / 100);
      }

      if (!item.price || item.price !== salePrice) {
        item.price = salePrice;
        item.totalPrice = salePrice * item.quantity;
        needsUpdate = true;
      }

      product.offerDetails = {
        regularPrice: product.regularPrice,
        salePrice: Math.round(salePrice),
        offerPercentage: Math.round(finalOfferValue),
        hasOffer: finalOfferValue > 0,
        offerType
      };

      updatedItems.push(item);
    }

    if (needsUpdate) {
      cart.items = updatedItems;
      await cart.calculateTotals();
      await cart.save();
    }

    const subTotal = Number(cart.subTotal || 0);
    const discountAmount = Number(
      cart.productDiscount + cart.couponDiscount || 0
    );
    const finalAmount = Number(
      Math.round(cart.finalAmount || subTotal - discountAmount)
    );

    return res.render('user/cart', {
      cart,
      subTotal,
      discountAmount,
      finalAmount
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return res.status(500).render('user/error', {
      message: 'Failed to load cart',
      cart: { items: [] },
      subTotal: 0,
      discountAmount: 0,
      finalAmount: 0
    });
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { productId, quantity = 1 } = req.body;
    const MAX_QUANTITY_PER_ITEM = 5;

    const product = await Product.findById(productId)
      .populate('category')
      .populate('brand');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.isBlocked) {
      return res.status(400).json({
        success: false,
        message: 'This product is currently unavailable'
      });
    }

    if (!product.category || !product.category.isListed) {
      return res.status(400).json({
        success: false,
        message: 'This product category is not available'
      });
    }

    if (!product.brand || product.brand.isBlocked) {
      return res.status(400).json({
        success: false,
        message: 'This product brand is currently unavailable'
      });
    }

    if (product.quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Product is out of stock'
      });
    }

    const requestedQuantity = Number(quantity);
    if (isNaN(requestedQuantity) || requestedQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity requested'
      });
    }

    if (requestedQuantity > product.quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.quantity} units available in stock`
      });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      const newQuantity =
        cart.items[existingItemIndex].quantity + requestedQuantity;

      if (newQuantity > MAX_QUANTITY_PER_ITEM) {
        return res.status(400).json({
          success: false,
          message: `Maximum limit is ${MAX_QUANTITY_PER_ITEM} units per product. You already have ${cart.items[existingItemIndex].quantity} in your cart.`
        });
      }

      if (newQuantity > product.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.quantity} units available in stock. You already have ${cart.items[existingItemIndex].quantity} in your cart.`
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].totalPrice =
        (product.salePrice || product.regularPrice) * newQuantity;
    } else {
      if (requestedQuantity > MAX_QUANTITY_PER_ITEM) {
        return res.status(400).json({
          success: false,
          message: `Maximum limit is ${MAX_QUANTITY_PER_ITEM} units per product`
        });
      }

      cart.items.push({
        productId,
        quantity: requestedQuantity,
        price: product.salePrice || product.regularPrice,
        totalPrice:
          (product.salePrice || product.regularPrice) * requestedQuantity
      });

      await Wishlist.updateOne(
        { userId },
        { $pull: { products: { productId } } }
      );
    }

    cart.calculateTotals();
    await cart.save();

    return res.status(200).json({
      success: true,
      message:
        existingItemIndex > -1
          ? 'Product quantity increased in your cart'
          : 'Product added to cart successfully',
      cartCount: cart.items.reduce((total, item) => total + item.quantity, 0),
      removedFromWishlist: existingItemIndex === -1,
      newQuantity:
        existingItemIndex > -1
          ? cart.items[existingItemIndex].quantity
          : requestedQuantity
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add product to cart'
    });
  }
};

const updateQuantity = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { productId, quantity, action } = req.body;
    const MAX_QUANTITY_PER_ITEM = 5;

    if (!['increment', 'decrement', 'set'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const cart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      populate: [
        { path: 'category', select: 'name isListed offer' },
        { path: 'brand', select: 'brandName isBlocked' },
        { path: 'offer' }
      ]
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId && item.productId._id.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in cart'
      });
    }

    const product = cart.items[itemIndex].productId;
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product details not found'
      });
    }

    let newQuantity;
    if (action === 'increment') {
      newQuantity = cart.items[itemIndex].quantity + 1;
    } else if (action === 'decrement') {
      newQuantity = cart.items[itemIndex].quantity - 1;
    } else {
      newQuantity = Number(quantity);
    }

    if (isNaN(newQuantity) || newQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity cannot be less than 1'
      });
    }

    if (newQuantity > MAX_QUANTITY_PER_ITEM) {
      return res.status(400).json({
        success: false,
        message: `Maximum limit is ${MAX_QUANTITY_PER_ITEM} units per product`
      });
    }

    if (newQuantity > product.quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.quantity} units available in stock`
      });
    }

    cart.items[itemIndex].quantity = newQuantity;

    await cart.save();

    const updatedCart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      populate: [
        { path: 'category', select: 'name isListed offer' },
        { path: 'brand', select: 'brandName isBlocked' },
        { path: 'offer' }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
      item: updatedCart.items[itemIndex],
      subTotal: updatedCart.subTotal,
      discountAmount: updatedCart.productDiscount + updatedCart.couponDiscount,
      finalAmount: updatedCart.finalAmount
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update cart'
    });
  }
};

const removeItem = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { productId } = req.body;

    let cart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      populate: [
        { path: 'category', select: 'name isListed offer' },
        { path: 'offer' }
      ]
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(
      (item) => item.productId._id.toString() !== productId
    );

    await cart.calculateTotals();
    await cart.save();

    const updatedCart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      populate: [
        { path: 'category', select: 'name isListed offer' },
        { path: 'offer' }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cartCount: updatedCart.items.length,
      subTotal: updatedCart.subTotal || 0,
      discountAmount:
        (updatedCart.productDiscount || 0) + (updatedCart.couponDiscount || 0),
      finalAmount: updatedCart.finalAmount || 0
    });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart'
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const result = await Cart.findOneAndUpdate(
      { userId },
      {
        $set: {
          items: [],
          subTotal: 0,
          discountAmount: 0,
          finalAmount: 0
        }
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear cart'
    });
  }
};

module.exports = {
  getCartItems,
  addToCart,
  updateQuantity,
  removeItem,
  clearCart
};
