const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');

const productDetails = async (req, res) => {
    try {
        const productId = req.query.id;
        if (!productId) {
            return res.status(404).render('user/page-404');
        }

        
        const product = await Product.findById(productId)
            .populate('category')
            .populate('brand', 'brandName -_id');
        
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

        
        const specifications = [
            { label: 'Brand', value: product.brand ? product.brand.brandName : 'N/A' },
            { label: 'Model', value: product.name },
            { label: 'Category', value: product.category?.name },
            { label: 'Connectivity', value: product.connectivity || 'N/A' },
            { label: 'Type', value: product.type || 'N/A' },
            { label: 'Stock Status', value: product.quantity > 0 ? 'In Stock' : 'Out of Stock' }
        ];

        
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
            select: 'brandName -_id' 
        })
        .limit(4);

        
        const totalOffer = (product.category?.offer || 0) + (product.productOffer || 0);

        
        const displayData = {
            mainInfo: {
                name: product.productName,
                brand: product.brand.brandName,
                rating: 4.5, 
                reviewCount: 25, 
                availability: product.quantity > 0 ? 'In Stock' : 'Out of Stock',
                availabilityClass: product.quantity > 0 ? 'text-success' : 'text-danger'
            },
            pricing: {
                original: product.price,
                discounted: discountedPrice.toFixed(2),
                saveAmount: (product.price - discountedPrice).toFixed(2),
                savePercentage: totalOffer,
                showOffer: totalOffer > 0,
                installment: (discountedPrice / 3).toFixed(2) 
            },
            presentation: {
                images: product.productImage || [], 
                thumbnails: product.images || [],
                mainImage: product.productImage?.[0] || 'default.jpg',
                colors: product.color ? product.color.split(',').map(c => c.trim()) : [],
                highlights: product.description?.split('\n').filter(item => item.trim()).slice(0, 5)
            },
            specifications: [
                { icon: 'brand', label: 'Brand', value: product.brand.brandName },
                { icon: 'model', label: 'Model', value: product.name },
                { icon: 'category', label: 'Category', value: product.category?.name },
                { icon: 'connect', label: 'Connectivity', value: product.connectivity || 'N/A' },
                { icon: 'type', label: 'Type', value: product.type || 'N/A' },
                { icon: 'stock', label: 'Stock Status', value: product.quantity > 0 ? 'In Stock' : 'Out of Stock' }
            ]
        };

        
        const enhancedRelatedProducts = relatedProducts.map(prod => ({
            ...prod.toObject(),
            brand: prod.brand.brandName,
            displayPrice: prod.price.toLocaleString('en-IN'),
            hasDiscount: prod.productOffer > 0,
            discountBadge: prod.productOffer > 0 ? `${prod.productOffer}% OFF` : ''
        }));

        res.render('user/product-details', {
            user: userData,
            product: {
                ...product.toObject(), 
                displayData: displayData, 
                brand: product.brand.brandName
            },
            relatedProducts: enhancedRelatedProducts,
            similarProducts,
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