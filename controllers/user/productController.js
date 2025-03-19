const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');
const Review = require('../../models/reviewSchema');

const productDetails = async (req, res) => {
    try {
        const productId = req.query.id;
        if (!productId) {
            return res.status(404).render('user/page-404');
        }

        const product = await Product.findById(productId)
            .populate('category')
            .populate('brand', 'brandName -_id');

        const reviews = await Review.find({ productId: product._id });
        const averageRating = reviews.length > 0 
            ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
            : '0.0';

        const avgRating = reviews.length > 0 
            ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length 
            : null;

        if (!product) {
            return res.status(404).render('user/page-404');
        }

        const relatedProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: productId },
            isListed: true
        })
        .populate('category')
        .populate({
            path: 'brand',
            select: 'brandName -_id'
        })
        .limit(4);

        const discountedPrice = product.price - (product.price * ((product.category?.offer || 0) + (product.productOffer || 0)) / 100);

        const userId = req.session.user ? req.session.user.id : null;
        let userData = userId ? await User.findById(userId) : null;

        const productFeatures = {
            highlights: product.description?.split('\n').filter(item => item.trim()),
            specifications: {
                brand: product.brand.brandName || 'N/A',
                category: product.category?.name,
                connectivity: product.connectivity || 'N/A',
                type: product.type || 'N/A'
            }
        };

        const productImages = product.images || [];
        
        const priceInfo = {
            originalPrice: product.price,
            discountedPrice: discountedPrice.toFixed(2),
            totalDiscount: ((product.category?.offer || 0) + (product.productOffer || 0)).toFixed(0),
            savings: (product.price - discountedPrice).toFixed(2),
            brandName: product.brand?.brandName || 'N/A'  
        };

        const breadcrumb = [
            { name: 'Home', url: '/' },
            { name: product.category?.name, url: `/category/${product.category?._id}` },
            { name: product.name, url: '#' }
        ];

        const totalOffer = (product.category?.offer || 0) + (product.productOffer || 0);

        const enhancedRelatedProducts = relatedProducts.map(prod => ({
            ...prod.toObject(),
            brand: prod.brand.brandName,
            displayPrice: prod.price.toLocaleString('en-IN'),
            hasDiscount: prod.productOffer > 0,
            discountBadge: prod.productOffer > 0 ? `${prod.productOffer}% OFF` : ''
        }));

        res.render('product-details', {
            user: userData,
            product: {
                ...product.toObject(),
                averageRating,
                brand: product.brand.brandName,
                salePrice: product.salePrice,
                regularPrice: product.regularPrice
            },
            relatedProducts: enhancedRelatedProducts,
            totalOffer,
            category: product.category,
            quantity: product.quantity
        });

    } catch (error) {
        console.error('Product details error:', error);
        res.status(500).render('user/page-404');
    }
};

module.exports = {
    productDetails,
};