// controllers/user/reviewController.js
const Review = require('../../models/reviewSchema');
const Product = require('../../models/productSchema');



const addReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.session.user.id;
        const adminSession = req.session.admin;

        // Check only active reviews (not deleted) for existing review
        const existingReview = await Review.findOne({ 
            productId, 
            userId, 
            isDeleted: { $ne: true }  // Only count non-deleted reviews
        });
        
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
            comment,
            isDeleted: false  // Explicitly set for new reviews
        });

        await review.save();

        // Update product average rating with only active reviews
        const reviews = await Review.find({ 
            productId, 
            isDeleted: { $ne: true } 
        });
        const avgRating = reviews.length > 0 
            ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length 
            : 0;
        await Product.findByIdAndUpdate(productId, { rating: avgRating });

        if (adminSession) {
            req.session.admin = adminSession;
            await req.session.save();
        }

        req.session.touch();

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
        // Handle existing reviews by using $ne: true instead of strictly false
        const reviews = await Review.find({ 
            productId,
            isDeleted: { $ne: true }  // Show reviews where isDeleted is not true (includes null/undefined)
        })
        .sort({ createdAt: -1 })
        .select('-__v -productId');

        const stats = {
            totalReviews: reviews.length,
            averageRating: reviews.length > 0 
                ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length 
                : 0,
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
            allReviewsCount: reviews.length
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
        
        if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(404).render('page-404');
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).render('page-404');
        }

        const reviews = await Review.find({ 
            productId,
            isDeleted: { $ne: true }  // Show reviews where isDeleted is not true
        })
        .sort({ createdAt: -1 });

        const stats = {
            totalReviews: reviews.length,
            averageRating: reviews.length > 0 
                ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length 
                : 0,
            ratingDistribution: {
                5: reviews.filter(r => r.rating === 5).length,
                4: reviews.filter(r => r.rating === 4).length,
                3: reviews.filter(r => r.rating === 3).length,
                2: reviews.filter(r => r.rating === 2).length,
                1: reviews.filter(r => r.rating === 1).length
            }
        };

        res.render('reviews', {
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


const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.session.user.id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        if (review.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own reviews'
            });
        }

        // Optional: Time limit check (24 hours)
        const timeLimit = 24 * 60 * 60 * 1000;
        const timeSinceCreation = Date.now() - new Date(review.createdAt).getTime();
        if (timeSinceCreation > timeLimit) {
            return res.status(403).json({
                success: false,
                message: 'Review can only be deleted within 24 hours of posting'
            });
        }

        // Soft delete
        review.isDeleted = true;
        review.deletedAt = new Date();
        await review.save();

        // Update product rating with only active reviews
        const activeReviews = await Review.find({ 
            productId: review.productId, 
            isDeleted: { $ne: true }
        });
        const avgRating = activeReviews.length > 0 
            ? activeReviews.reduce((acc, curr) => acc + curr.rating, 0) / activeReviews.length 
            : 0;
        await Product.findByIdAndUpdate(review.productId, { rating: avgRating });

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review'
        });
    }
};


module.exports = {
    addReview,
    getProductReviews,
    getFullReviews,
    deleteReview
};