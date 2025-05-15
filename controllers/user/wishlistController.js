// controllers/user/wishlistController.js
const Wishlist = require('../../models/wishlistSchema');
const Product = require('../../models/productSchema');
const Cart = require('../../models/cartSchema');

// Get wishlist items
const getWishlistItems = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const wishlist = await Wishlist.findOne({ userId })
            .populate({
                path: 'products.productId',
                populate: [
                    { path: 'category', select: 'name isListed' },
                    { path: 'brand', select: 'brandName isBlocked' }
                ]
            });

        if (!wishlist || !wishlist.products.length) {
            return res.render('user/wishlist', {
                wishlist: { products: [] }
            });
        }

        // Filter out invalid products
        const validProducts = wishlist.products.filter(item => 
            item.productId && 
            !item.productId.isBlocked && 
            item.productId.category && 
            item.productId.category.isListed && 
            item.productId.brand && 
            !item.productId.brand.isBlocked
        );

        if (validProducts.length !== wishlist.products.length) {
            wishlist.products = validProducts;
            await wishlist.save();
        }

        res.render('user/wishlist', {
            wishlist
        });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).render('user/error', { message: 'Failed to load wishlist' });
    }
};

// Add to wishlist
const addToWishlist = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { productId } = req.body;

        // Check if product exists and is available
        const product = await Product.findById(productId)
            .select('isBlocked quantity');
        
        if (!product || product.isBlocked) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or unavailable'
            });
        }

        // Check if product is in cart
        const cart = await Cart.findOne({ userId })
            .select('items.productId');
        
        if (cart && cart.items.some(item => item.productId.toString() === productId)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot add to wishlist - product is already in your cart'
            });
        }

        // Check if product is already in wishlist
        const wishlist = await Wishlist.findOne({ userId });
        
        if (wishlist && wishlist.products.some(item => item.productId.toString() === productId)) {
            return res.status(400).json({
                success: false,
                message: 'Product is already in your wishlist'
            });
        }

        // Add to wishlist (create if doesn't exist)
        await Wishlist.findOneAndUpdate(
            { userId },
            { $addToSet: { products: { productId } } },
            { upsert: true, new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Product added to wishlist successfully',
            wishlistCount: wishlist ? wishlist.products.length + 1 : 1
        });

    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add to wishlist. Please try again.'
        });
    }
};


// Remove from wishlist
const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { productId } = req.body;

        const wishlist = await Wishlist.findOneAndUpdate(
            { userId },
            { $pull: { products: { productId } } },
            { new: true }
        );

        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: 'Wishlist not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product removed from wishlist',
            wishlistCount: wishlist.products.length
        });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove from wishlist'
        });
    }
};


const checkWishlistStatus = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { productId } = req.body;

        const wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            return res.json({ success: true, isInWishlist: false });
        }

        const isInWishlist = wishlist.products.some(
            item => item.productId.toString() === productId
        );

        const cart = await Cart.findOne({ userId });
        const isInCart = cart && cart.items.some(
            item => item.productId.toString() === productId
        );

        res.json({
            success: true,
            isInWishlist: isInWishlist,
            isInCart
        });
    } catch (error) {
        console.error('Error checking wishlist status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check wishlist status'
        });
    }
};
  
 
  module.exports = {
    getWishlistItems,
    addToWishlist,
    removeFromWishlist,
    checkWishlistStatus
  };