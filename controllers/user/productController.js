const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');

const productDetails = async (req, res) => {
    try {
        const productId = req.query.id;
        if (!productId) {
            return res.status(404).render('user/page-404');
        }

        // Get the main product with populated fields
        const product = await Product.findById(productId)
            .populate({
                path: 'category'
            })
            .populate({
                path: 'brand',
                select: 'name'  // Explicitly select the name field
            });
        
        if (!product) {
            return res.status(404).render('user/page-404');
        }

        // Get related products from the same category
        const relatedProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: productId },
            isListed: true
        })
        .populate('category')
        .populate({
            path: 'brand',
            select: 'name'
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
                brand: product.brand?.name,
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
            savings: (product.price - discountedPrice).toFixed(2)
        };

        // Generate breadcrumb data
        const breadcrumb = [
            { name: 'Home', url: '/' },
            { name: product.category?.name, url: `/category/${product.category?._id}` },
            { name: product.name, url: '#' }
        ];

        // Format specifications in a more structured way
        const specifications = [
            { label: 'Brand', value: product.brand ? product.brand.name : 'N/A' },
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
        .populate('brand')
        .limit(4);

        // Calculate total offer percentage
        const totalOffer = (product.category?.offer || 0) + (product.productOffer || 0);

        res.render('user/product-details', {
            user: userData,
            product: product,
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