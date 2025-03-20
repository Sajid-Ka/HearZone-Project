// models/reviewSchema.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    productId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product", 
        required: true 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        required: true 
    },
    username: String,
    rating: { 
        type: Number, 
        min: 1, 
        max: 5, 
        required: true 
    },
    comment: String,
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    isDeleted: {  // Added for soft delete
        type: Boolean,
        default: false
    },
    deletedAt: {  // Track deletion time for time limit feature
        type: Date,
        default: null
    }
});

module.exports = mongoose.model("Review", reviewSchema);