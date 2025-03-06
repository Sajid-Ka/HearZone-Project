const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema({
    productName: {
         type: String,
          required: true },
    description: {
         type: String,
          required: true },
    brand: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: "Brand" }, 
    category: { 
        type: Schema.Types.ObjectId, 
        ref: "Category", 
        required: true }, 
    regularPrice: { 
        type: Number, 
        required: true },
    salePrice: { 
        type: Number, 
        required: true },
    quantity: { 
        type: Number, 
        default: 0 },
    color: { 
        type: String, 
        required: true },
    productImage: { 
        type: [String], 
        required: true }, 
    isBlocked: { 
        type: Boolean, 
        default: false },
    status: {
        type: String,
        enum: ["Available", "out of Stock", "Discontinued"],
        required: true,
        default: "Available"
    }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);
module.exports = Product;