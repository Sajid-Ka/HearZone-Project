const User = require('../../models/userSchema');
const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema');
const Brand = require('../../models/brandSchema');
const Review = require('../../models/reviewSchema');
const mongoose = require('mongoose');

const loadShoppingPage = async (req, res) => {
    try {
        const user = req.session.user;
        let userData = null;
        if (user && user.id) {
            userData = await User.findOne({ _id: user.id });
        }

        const categories = await Category.find({ isListed: true });
        const categoryIds = categories.map(category => category._id);
        const blockedBrands = await Brand.find({ isBlocked: true }).select('_id');
        const blockedBrandIds = blockedBrands.map(brand => brand._id);
        const brands = await Brand.find({ isBlocked: false });

        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;
        const sortOption = req.query.sort;
        const searchQuery = req.query.query || '';
        const categoryId = req.query.category;
        const brandId = req.query.brand;
        const gt = parseFloat(req.query.gt);
        const lt = parseFloat(req.query.lt);

        let query = {
            isBlocked: false,
            category: { $in: categoryIds },
            brand: { $nin: blockedBrandIds }
        };

        if (searchQuery.trim().length > 0) {
            query.productName = { $regex: searchQuery, $options: 'i' };
        }

        if (categoryId) {
            query.category = new mongoose.Types.ObjectId(categoryId);
        }

        if (brandId) {
            query.brand = new mongoose.Types.ObjectId(brandId);
        }

        if (!isNaN(gt) || !isNaN(lt)) {
            query.salePrice = {};
            if (!isNaN(gt)) query.salePrice.$gte = gt;
            if (!isNaN(lt)) query.salePrice.$lte = lt;
        }

        let sortQuery = { createdAt: -1 };
        let collation = null;
        
        switch (sortOption) {
            case 'newArrival':
                sortQuery = { createdAt: -1 };
                break;
            case 'priceAsc':
                sortQuery = { salePrice: 1 };
                break;
            case 'priceDesc':
                sortQuery = { salePrice: -1 };
                break;
            case 'nameAsc':
                sortQuery = { productName: 1 };
                collation = { locale: 'en', strength: 1 }; 
                break;
            case 'nameDesc':
                sortQuery = { productName: -1 };
                collation = { locale: 'en', strength: 1 }; 
                break;
        }

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        let productQuery = Product.find(query)
            .populate('brand')
            .populate('offer')
            .populate({
                path: 'category',
                populate: { path: 'offer' }
            })
            .sort(sortQuery)
            .skip(skip)
            .limit(limit);

        if (collation) {
            productQuery = productQuery.collation(collation);
        }

        const products = await productQuery;

        const productsWithRatings = await Promise.all(products.map(async (product) => {
            const reviews = await Review.find({ productId: product._id });
            
            // Calculate average rating
            const avgRating = reviews.length > 0 
                ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
                : '0.0';

           // Initialize offer variables
            let productOfferValue = 0;
            let categoryOfferValue = 0;
            let finalOfferValue = 0;
            let offerType = null;
            let discountBadge = '';
            
            // Check product offer
            if (product.offer && new Date(product.offer.endDate) > new Date()) {
                productOfferValue = product.offer.discountType === 'percentage' 
                    ? product.offer.discountValue 
                    : (product.offer.discountValue / product.regularPrice) * 100;
            }
            
            // Check category offer
            if (product.category?.offer?.isActive && new Date(product.category.offer.endDate) > new Date()) {
                categoryOfferValue = product.category.offer.percentage;
            }
            
            // Determine which offer to apply (the bigger one)
            if (productOfferValue > 0 || categoryOfferValue > 0) {
                if (productOfferValue >= categoryOfferValue) {
                    finalOfferValue = productOfferValue;
                    offerType = 'product';
                } else {
                    finalOfferValue = categoryOfferValue;
                    offerType = 'category';
                }
                
                discountBadge = `${Math.round(finalOfferValue)}% OFF`;
            }
            
            // Calculate sale price
            let salePrice = product.regularPrice;
            let hasDiscount = false;
            
            if (finalOfferValue > 0) {
                salePrice = product.regularPrice * (1 - finalOfferValue / 100);
                hasDiscount = true;
            }

            return { 
                ...product.toObject(), 
                rating: avgRating,
                salePrice: Math.round(salePrice),
                displayPrice: Math.round(salePrice).toLocaleString('en-IN'),
                regularPrice: product.regularPrice,
                hasDiscount,
                discountBadge,
                offerType,
                totalOffer: finalOfferValue
            };
        }));

        const categoriesWithIds = categories.map(category => ({
            _id: category._id,
            name: category.name
        }));

        res.render('shop', {
            user: userData,
            products: productsWithRatings,
            category: categoriesWithIds,
            brand: brands,
            totalProducts,
            currentPage: page,
            totalPages,
            selectedCategory: categoryId,
            selectedBrand: brandId,
            gt: gt || null,
            lt: lt || null,
            selectedSort: sortOption,
            searchQuery: searchQuery,
            isSearchActive: searchQuery.trim().length > 0
        });
    } catch (error) {
        console.error("shopping page loading error", error);
        res.redirect('/pageNotFound');
    }
};

const filterProduct = async (req, res) => {
    try {
        const { category, brand, page } = req.query;
        const queryParams = new URLSearchParams();
        if (category) queryParams.append('category', category);
        if (brand) queryParams.append('brand', brand);
        if (page) queryParams.append('page', page);
        
        res.redirect(`/shop?${queryParams.toString()}`);
    } catch (error) {
        console.error("Filter product error", error);
        res.redirect('/pageNotFound');
    }
};

const filterByPrice = async (req, res) => {
    try {
        const { gt, lt, page } = req.query;
        const queryParams = new URLSearchParams();
        if (gt) queryParams.append('gt', gt);
        if (lt) queryParams.append('lt', lt);
        if (page) queryParams.append('page', page);
        
        const currentQuery = req.query;
        for (const [key, value] of Object.entries(currentQuery)) {
            if (key !== 'gt' && key !== 'lt' && key !== 'page' && value) {
                queryParams.append(key, value);
            }
        }

        res.redirect(`/shop?${queryParams.toString()}`);
    } catch (error) {
        console.error("Price filter error:", error);
        res.redirect('/pageNotFound');
    }
};

const searchProducts = async (req, res) => {
    try {
        const searchQuery = req.body.query || '';
        res.redirect(`/shop?query=${encodeURIComponent(searchQuery)}`);
    } catch (error) {
        console.error("Search products error:", error);
        res.redirect('/pageNotFound');
    }
};

module.exports = {
    loadShoppingPage,
    filterProduct,
    filterByPrice,
    searchProducts
};