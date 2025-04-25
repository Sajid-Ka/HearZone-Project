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
    isDeleted: {  
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }
},{
    timestamps:true
});

module.exports = mongoose.model("Review", reviewSchema);