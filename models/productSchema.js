const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    productName: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    brand: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Brand'
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    regularPrice: {
      type: Number,
      required: true
    },
    salePrice: {
      type: Number,
      default: 0
    },
    offer: {
      type: Schema.Types.ObjectId,
      ref: 'Offer',
      default: null
    },
    quantity: {
      type: Number,
      default: 0
    },
    color: {
      type: String,
      required: true
    },
    productImage: {
      type: [String],
      required: false,
      default: []
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['Available', 'out of Stock', 'Discontinued'],
      required: true,
      default: 'Available'
    },
    highlights: {
      type: [String],
      default: []
    },
    specifications: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
