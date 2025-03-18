const Review = require('../../models/reviewSchema');
const Product = require('../../models/productSchema');

const addReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.session.user.id;

        // Check if user has already reviewed this product
        const existingReview = await Review.findOne({ productId, userId });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this product'
            });
        }

        const review = new Review({
            productId,
            userId,
            username: req.session.user.name,
            rating: parseInt(rating),
            comment
        });

        await review.save();

        // Update product average rating
        const reviews = await Review.find({ productId });
        const avgRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
        await Product.findByIdAndUpdate(productId, { rating: avgRating });

        res.status(200).json({
            success: true,
            message: 'Review added successfully',
            review: {
                username: review.username,
                rating: review.rating,
                comment: review.comment,
                createdAt: review.createdAt
            }
        });
    } catch (error) {
        console.error('Add review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add review'
        });
    }
};

const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ productId })
            .sort({ createdAt: -1 })
            .select('-__v -productId');

        const stats = {
            totalReviews: reviews.length,
            averageRating: reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length || 0,
            ratingDistribution: {
                5: reviews.filter(r => r.rating === 5).length,
                4: reviews.filter(r => r.rating === 4).length,
                3: reviews.filter(r => r.rating === 3).length,
                2: reviews.filter(r => r.rating === 2).length,
                1: reviews.filter(r => r.rating === 1).length
            }
        };

        res.status(200).json({
            success: true,
            reviews,
            stats,
            allReviewsCount: reviews.length // Add this line
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews'
        });
    }
};

const getFullReviews = async (req, res) => {
    try {
        const productId = req.params.productId;
        
        // Validate ObjectId
        if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(404).render('page-404');
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).render('page-404');
        }

        const reviews = await Review.find({ productId })
            .sort({ createdAt: -1 });

        const stats = {
            totalReviews: reviews.length,
            averageRating: reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length || 0,
            ratingDistribution: {
                5: reviews.filter(r => r.rating === 5).length,
                4: reviews.filter(r => r.rating === 4).length,
                3: reviews.filter(r => r.rating === 3).length,
                2: reviews.filter(r => r.rating === 2).length,
                1: reviews.filter(r => r.rating === 1).length
            }
        };

        res.render('reviews', {  // Changed from 'user/full-reviews' to 'user/reviews'
            product,
            reviews,
            stats,
            user: req.session.user
        });
    } catch (error) {
        console.error('Get full reviews error:', error);
        res.status(404).render('page-404');
    }
};

module.exports = {
    addReview,
    getProductReviews,
    getFullReviews
};