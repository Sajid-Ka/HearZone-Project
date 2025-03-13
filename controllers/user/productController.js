const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');

const productDetails = async (req, res) => {
    try {
        const productId = req.query.id;
        if (!productId) {
            return res.status(404).render('user/page-404');
        }

        // Make sure to populate both category and brand
        const product = await Product.findById(productId)
            .populate('category')
            .populate('brand');
        
        if (!product) {
            return res.status(404).render('user/page-404');
        }

        // Get user data if logged in
        const userId = req.session.user ? req.session.user.id : null;
        let userData = userId ? await User.findById(userId) : null;

        // Ensure the view path matches your directory structure
        res.render('user/product-details', {
            user: userData,
            product: product,
            quantity: product.quantity,
            totalOffer: (product.category?.offer || 0) + (product.productOffer || 0),
            category: product.category
        });

    } catch (error) {
        console.error('Product details error:', error);
        res.status(500).render('user/page-404');
    }
};

module.exports = {
    productDetails,
};