const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');
const Review = require('../../models/reviewSchema');
const Brand = require('../../models/brandSchema'); 

const productDetails = async (req, res) => {
    try {
        const productId = req.query.id;
        if (!productId) {
            return res.status(404).render('user/page-404');
        }

        // Find product with populated category and offer
        const product = await Product.findById(productId)
            .populate('category')
            .populate('offer')
            .populate('brand');

        if (!product) {
            return res.status(404).render('user/page-404');
        }

        // Calculate offers
        let productOffer = 0;
        let categoryOffer = 0;
        let totalOffer = 0;
        
        if (product.offer && new Date(product.offer.endDate) > new Date()) {
            productOffer = product.offer.discountValue;
        }
        
        if (product.category?.offer?.isActive && new Date(product.category.offer.endDate) > new Date()) {
            categoryOffer = product.category.offer.percentage;
        }
        
        // Determine which offer to show (the bigger one)
        if (productOffer > 0 || categoryOffer > 0) {
            totalOffer = Math.max(productOffer, categoryOffer);
        }
        
        // Calculate sale price
        let salePrice = product.regularPrice;
        if (totalOffer > 0) {
            salePrice = product.regularPrice * (1 - totalOffer / 100);
        }

        // Update product with calculated values
        product.salePrice = Math.round(salePrice);
        product.totalOffer = totalOffer

        // Treat undefined isListed as true to avoid false negatives
        const isProductListed = product.isListed !== false;

        if (!isProductListed || product.isBlocked) {
            return res.status(404).render('user/page-404');
        }

        // Fetch blocked brand IDs
        const blockedBrands = await Brand.find({ isBlocked: true }).select('_id');
        const blockedBrandIds = blockedBrands.map(brand => brand._id);

        // Get related products by category with more lenient conditions
        let relatedProducts = await Product.find({
            category: product.category?._id,
            _id: { $ne: product._id },
            isBlocked: false, // Exclude blocked products
            brand: { $nin: blockedBrandIds }, // Exclude products from blocked brands
            $or: [
                { isListed: true },
                { isListed: { $exists: false } }
            ]
        })
        .limit(3)
        .populate('brand');

        // If we don't have enough products by category, try brand
        if (relatedProducts.length < 3 && product.brand?._id) {
            const brandProducts = await Product.find({
                brand: product.brand._id,
                _id: { $ne: product._id },
                category: { $ne: product.category?._id },
                isBlocked: false, // Exclude blocked products
                brand: { $nin: blockedBrandIds }, // Exclude products from blocked brands
                $or: [
                    { isListed: true },
                    { isListed: { $exists: false } }
                ]
            })
            .limit(3 - relatedProducts.length)
            .populate('brand');

            relatedProducts = [...relatedProducts, ...brandProducts];
        }

        // Process related products for display with null checks
        const enhancedRelatedProducts = relatedProducts.map(prod => {
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
                discountBadge: regularPrice > salePrice ? 
                    `${Math.round((1 - salePrice/regularPrice) * 100)}% OFF` : ''
            };
        });

        // Calculate reviews and average rating with fallback
        const reviews = await Review.find({ productId: product._id });
        const averageRating = reviews.length > 0 
            ? (reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0) / reviews.length).toFixed(1)
            : '0.0';

        // Render the page with all the data
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
            quantity: product.quantity || 0
        });

    } catch (error) {
        console.error('Product details error:', error);
        res.status(500).render('user/page-500', { error: error.message });
    }
};

module.exports = {
    productDetails,
};