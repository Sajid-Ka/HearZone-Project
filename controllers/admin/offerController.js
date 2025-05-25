const Offer = require('../../models/offerSchema');
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');

const getOfferPage = async (req, res) => {
  try {
    const offers = await Offer.find().populate('products');
    res.render('offers', { offers });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.redirect('/admin/pageError');
  }
};

const createOffer = async (req, res) => {
  try {
    const {
      name,
      discountType,
      discountValue,
      endDate,
      productId,
      regularPrice
    } = req.body;

    if (!productId || !regularPrice) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Product ID and regular price are required'
        });
    }

    if (
      discountType === 'percentage' &&
      (discountValue < 0 || discountValue > 100)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Percentage discount must be between 0 and 100'
        });
    }

    const offer = new Offer({
      name,
      discountType,
      discountValue,
      endDate,
      products: [productId]
    });

    await offer.save();

    let salePrice = parseFloat(regularPrice);
    if (offer.discountType === 'percentage') {
      salePrice = salePrice * (1 - offer.discountValue / 100);
    } else {
      salePrice = salePrice - offer.discountValue;
    }

    await Product.findByIdAndUpdate(productId, {
      offer: offer._id,
      salePrice: Math.max(0, Math.round(salePrice))
    });

    res.status(200).json({
      success: true,
      message: 'Offer created and assigned successfully',
      offer
    });
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ success: false, message: 'Error creating offer' });
  }
};

const assignOfferToProduct = async (req, res) => {
  try {
    const { productId, offerId, discountValue, endDate, regularPrice } =
      req.body;

    if (!productId || !regularPrice) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Product ID and regular price are required'
        });
    }

    let offer;
    if (offerId) {
      offer = await Offer.findById(offerId);
      if (!offer) {
        return res
          .status(404)
          .json({ success: false, message: 'Offer not found' });
      }

      offer.discountValue = discountValue || offer.discountValue;
      offer.endDate = endDate || offer.endDate;

      if (
        offer.discountType === 'percentage' &&
        (offer.discountValue < 0 || offer.discountValue > 100)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message: 'Percentage discount must be between 0 and 100'
          });
      }

      await offer.save();
    } else {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Offer ID is required for assignment'
        });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    }

    if (new Date() > new Date(offer.endDate)) {
      return res
        .status(400)
        .json({ success: false, message: 'Offer has expired' });
    }

    let salePrice = parseFloat(regularPrice);
    if (offer.discountType === 'percentage') {
      salePrice = salePrice * (1 - offer.discountValue / 100);
    } else {
      salePrice = salePrice - offer.discountValue;
    }

    await Product.findByIdAndUpdate(productId, {
      offer: offer._id,
      salePrice: Math.max(0, Math.round(salePrice))
    });

    if (!offer.products.includes(productId)) {
      offer.products.push(productId);
      await offer.save();
    }

    res.status(200).json({
      success: true,
      message: offerId
        ? 'Offer updated and assigned successfully'
        : 'Offer assigned successfully',
      salePrice: Math.max(0, Math.round(salePrice))
    });
  } catch (error) {
    console.error('Error assigning offer:', error);
    res.status(500).json({ success: false, message: 'Error assigning offer' });
  }
};

const removeOfferFromProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    }

    if (product.offer) {
      await Offer.updateOne(
        { _id: product.offer },
        { $pull: { products: productId } }
      );
    }

    await Product.findByIdAndUpdate(productId, {
      offer: null,
      salePrice: 0
    });

    res
      .status(200)
      .json({ success: true, message: 'Offer removed successfully' });
  } catch (error) {
    console.error('Error removing offer:', error);
    res.status(500).json({ success: false, message: 'Error removing offer' });
  }
};

const addCategoryOffer = async (req, res) => {
  try {
    const { categoryId, percentage, endDate } = req.body;

    if (!categoryId || !percentage || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (percentage < 0 || percentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Percentage must be between 0 and 100'
      });
    }

    const endDateObj = new Date(endDate);
    if (endDateObj <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'End date must be in the future'
      });
    }

    category.offer = {
      percentage,
      endDate: endDateObj,
      isActive: true
    };

    await category.save();

    res.json({
      success: true,
      message: 'Offer added successfully',
      category
    });
  } catch (error) {
    console.error('Add Category Offer Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const cancelCategoryOffer = async (req, res) => {
  try {
    const { categoryId } = req.body;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.offer = {
      percentage: 0,
      endDate: null,
      isActive: false
    };

    await category.save();

    res.json({
      success: true,
      message: 'Offer cancelled successfully',
      category
    });
  } catch (error) {
    console.error('Cancel Category Offer Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getOfferPage,
  createOffer,
  assignOfferToProduct,
  removeOfferFromProduct,
  addCategoryOffer,
  cancelCategoryOffer
};
