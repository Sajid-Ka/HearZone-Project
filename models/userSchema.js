const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    phone: {
      type: String,
      required: false,
      sparse: true,
      default: null
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    password: {
      type: String,
      required: false
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    cart: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Cart'
      }
    ],
    wallet: {
      type: {
        balance: {
          type: Number,
          default: 0
        },
        transactions: [
          {
            amount: { type: Number, required: true },
            type: {
              type: String,
              enum: ['credit', 'debit'],
              required: true
            },
            description: String,
            date: {
              type: Date,
              default: Date.now
            }
          }
        ]
      },
      default: () => ({ balance: 0, transactions: [] })
    },
    wishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Wishlist'
      }
    ],
    orderHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Order'
      }
    ],
    referralCode: {
      type: String,
      unique: true,
      required: false
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    referralCoupons: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Coupon'
      }
    ],
    searchHistory: [
      {
        category: {
          type: Schema.Types.ObjectId,
          ref: 'Category'
        },
        brand: {
          type: String
        },
        searchOn: {
          type: Date,
          default: Date.now
        }
      }
    ],
    profileImage: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
