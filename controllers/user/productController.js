const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');

const productDetails = async (req, res) => {
    try {
        // Extract user ID from session
        const userId = req.session.user ? req.session.user.id : null;
        let userData = null;

        // Fetch user data if user is logged in
        if (userId) {
            userData = await User.findById(userId);
            if (!userData) {
                console.warn('User not found for ID:', userId);
            }
        }

        // Get product ID from query parameters
        const productId = req.query.id;
        if (!productId) {
            return res.redirect('/pageNotFound');
        }

        // Fetch product with populated category
        const product = await Product.findById(productId).populate('category');
        if (!product) {
            return res.redirect('/pageNotFound');
        }

        // Calculate offers
        const categoryOffer = product.category && product.category.offer ? product.category.offer : 0;
        const productOffer = product.productOffer || 0;
        const totalOffer = categoryOffer + productOffer;

        // Render the product details page with correct data
        res.render('product-details', {
            user: userData,
            product: product,
            quantity: product.quantity,
            totalOffer: totalOffer,
            category: product.category // Use product.category instead of findCategory
        });

    } catch (error) {
        console.error('Product details error:', error);
        res.redirect('/pageNotFound');
    }
};

module.exports = {
    productDetails,
};