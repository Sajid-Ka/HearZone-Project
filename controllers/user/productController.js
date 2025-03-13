const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');

const productDetails = async (req, res) => {
    try {
        const productId = req.query.id;
        if (!productId) {
            return res.status(404).render('user/page-404');
        }

        // Modify the product query to get clean brand name
        const product = await Product.findById(productId)
            .populate('category')
            .populate('brand', 'brandName -_id');
        
        if (!product) {
            return res.status(404).render('user/page-404');
        }

        // Update related products query to exclude brand ID
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

        // Calculate discounted price
        const discountedPrice = product.price - (product.price * ((product.category?.offer || 0) + (product.productOffer || 0)) / 100);

        // Get user data if logged in
        const userId = req.session.user ? req.session.user.id : null;
        let userData = userId ? await User.findById(userId) : null;

        // Format product specs and features
        const productFeatures = {
            highlights: product.description?.split('\n').filter(item => item.trim()),
            specifications: {
                brand: product.brand.brandName || 'N/A',
                category: product.category?.name,
                connectivity: product.connectivity || 'N/A',
                type: product.type || 'N/A'
            }
        };

        // Get additional product images if available
        const productImages = product.images || [];
        
        // Format price and discount information
        const priceInfo = {
            originalPrice: product.price,
            discountedPrice: discountedPrice.toFixed(2),
            totalDiscount: ((product.category?.offer || 0) + (product.productOffer || 0)).toFixed(0),
            savings: (product.price - discountedPrice).toFixed(2),
            brandName: product.brand?.brandName || 'N/A'  // Change to brandName
        };

        // Generate breadcrumb data
        const breadcrumb = [
            { name: 'Home', url: '/' },
            { name: product.category?.name, url: `/category/${product.category?._id}` },
            { name: product.name, url: '#' }
        ];

        // Format specifications with clean brand name
        const specifications = [
            { label: 'Brand', value: product.brand ? product.brand.brandName : 'N/A' },
            { label: 'Model', value: product.name },
            { label: 'Category', value: product.category?.name },
            { label: 'Connectivity', value: product.connectivity || 'N/A' },
            { label: 'Type', value: product.type || 'N/A' },
            { label: 'Stock Status', value: product.quantity > 0 ? 'In Stock' : 'Out of Stock' }
        ];

        // Get similar products by price range
        const similarProducts = await Product.find({
            category: product.category._id,
            price: { 
                $gte: product.price * 0.7, 
                $lte: product.price * 1.3 
            },
            _id: { $ne: productId },
            isListed: true
        })
        .populate({
            path: 'brand',
            select: 'brandName -_id' // Explicitly select the brandName field and exclude the ID field
        })
        .limit(4);

        // Calculate total offer percentage
        const totalOffer = (product.category?.offer || 0) + (product.productOffer || 0);

        res.render('user/product-details', {
            user: userData,
            product: {
                ...product.toObject(),
                brand: product.brand ? product.brand.brandName : 'N/A'  // Simplify brand to just the name
            },
            priceInfo: priceInfo,
            productImages: productImages,
            breadcrumb: breadcrumb,
            specifications: specifications,
            relatedProducts: relatedProducts,
            similarProducts: similarProducts,
            features: productFeatures,
            totalOffer: totalOffer,
            category: product.category,  // Add this line
            quantity: product.quantity   // Add this line
        });

    } catch (error) {
        console.error('Product details error:', error);
        res.status(500).render('user/page-404');
    }
};

module.exports = {
    productDetails,
};