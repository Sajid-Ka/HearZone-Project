const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');
const Review = require('../../models/reviewSchema');
const Brand = require('../../models/brandSchema');
const Wishlist = require('../../models/wishlistSchema');

const productDetails = async (req, res) => {
  try {
    const productId = req.query.id;
    if (!productId) {
      return res.status(404).render('user/page-404');
    }

    const product = await Product.findById(productId)
      .populate('category')
      .populate('offer')
      .populate('brand');

    if (!product) {
      return res.status(404).render('user/page-404');
    }

    let productOffer = 0;
    let categoryOffer = 0;
    let totalOffer = 0;

    if (product.offer && new Date(product.offer.endDate) > new Date()) {
      productOffer = product.offer.discountValue;
    }

    if (
      product.category?.offer?.isActive &&
      new Date(product.category.offer.endDate) > new Date()
    ) {
      categoryOffer = product.category.offer.percentage;
    }

    if (productOffer > 0 || categoryOffer > 0) {
      totalOffer = Math.max(productOffer, categoryOffer);
    }

    let salePrice = product.regularPrice;
    if (totalOffer > 0) {
      salePrice = product.regularPrice * (1 - totalOffer / 100);
    }

    product.salePrice = Math.round(salePrice);
    product.totalOffer = totalOffer;

    const isProductListed = product.isListed !== false;

    if (!isProductListed || product.isBlocked) {
      return res.status(404).render('user/page-404');
    }

    let isInWishlist = false;
    if (req.session.user) {
      const wishlist = await Wishlist.findOne({ userId: req.session.user.id });
      isInWishlist =
        wishlist &&
        wishlist.products.some(
          (item) => item.productId.toString() === product._id.toString()
        );
    }

    const blockedBrands = await Brand.find({ isBlocked: true }).select('_id');
    const blockedBrandIds = blockedBrands.map((brand) => brand._id);

    let relatedProducts = await Product.find({
      category: product.category?._id,
      _id: { $ne: product._id },
      isBlocked: false,
      brand: { $nin: blockedBrandIds },
      $or: [{ isListed: true }, { isListed: { $exists: false } }]
    })
      .limit(3)
      .populate('brand');

    if (relatedProducts.length < 3 && product.brand?._id) {
      const brandProducts = await Product.find({
        brand: product.brand._id,
        _id: { $ne: product._id },
        category: { $ne: product.category?._id },
        isBlocked: false,
        brand: { $nin: blockedBrandIds },
        $or: [{ isListed: true }, { isListed: { $exists: false } }]
      })
        .limit(3 - relatedProducts.length)
        .populate('brand');

      relatedProducts = [...relatedProducts, ...brandProducts];
    }

    const enhancedRelatedProducts = relatedProducts.map((prod) => {
      const productOffer = prod.productOffer || 0;
      const categoryOffer = prod.category?.offer || 0;
      const totalOffer = productOffer + categoryOffer;
      const regularPrice = prod.regularPrice || 0;
      const salePrice = prod.salePrice || regularPrice;

      return {
        _id: prod._id,
        productName: prod.productName || 'Unnamed Product',
        productImage: prod.productImage || '',
        regularPrice: regularPrice,
        salePrice: salePrice,
        displayPrice: salePrice.toLocaleString('en-IN'),
        hasDiscount: regularPrice > salePrice,
        discountBadge:
          regularPrice > salePrice
            ? `${Math.round((1 - salePrice / regularPrice) * 100)}% OFF`
            : ''
      };
    });

    const reviews = await Review.find({ productId: product._id });
    const averageRating =
      reviews.length > 0
        ? (
            reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0) /
            reviews.length
          ).toFixed(1)
        : '0.0';

    res.render('product-details', {
      user: req.session.user ? await User.findById(req.session.user.id) : null,
      product: {
        ...product.toObject(),
        averageRating,
        quantity: product.quantity || 0
      },
      relatedProducts: enhancedRelatedProducts,
      totalOffer,
      category: product.category || {},
      quantity: product.quantity || 0,
      isInWishlist
    });
  } catch (error) {
    console.error('Product details error:', error);
    res.status(500).render('user/page-500', { error: error.message });
  }
};

const buyNow = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.session.user.id;

    const product = await Product.findById(productId)
      .populate('category')
      .populate('offer');

    if (!product || product.quantity < quantity) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Product unavailable or insufficient stock'
        });
    }

    let productOfferValue = 0;
    let categoryOfferValue = 0;
    let totalOffer = 0;
    let salePrice = product.regularPrice;

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

    totalOffer = Math.max(productOfferValue, categoryOfferValue);
    if (totalOffer > 0) {
      salePrice = product.regularPrice * (1 - totalOffer / 100);
    }

    const subTotal = product.regularPrice * quantity;
    const finalAmount = Math.round(salePrice * quantity);

    req.session.buyNowOrder = {
      userId,
      productId,
      productName: product.productName,
      quantity,
      regularPrice: product.regularPrice,
      salePrice: Math.round(salePrice),
      subTotal,
      finalAmount,
      totalOffer,
      couponCode: null,
      discountAmount: 0,
      appliedCoupon: null
    };

    return res.status(200).json({
      success: true,
      message: 'Proceed to checkout',
      redirectUrl: '/checkout?buyNow=true'
    });
  } catch (error) {
    console.error('Error in buyNow:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  productDetails,
  buyNow
};
