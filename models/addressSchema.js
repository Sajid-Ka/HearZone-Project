const mongoose = require('mongoose');
const { Schema } = mongoose;

const addressSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    addresses: [
      {
        addressType: {
          type: String,
          enum: ['Home', 'Work', 'Other'],
          required: true
        },
        name: {
          type: String,
          required: true,
          trim: true
        },
        city: {
          type: String,
          required: true,
          trim: true
        },
        landmark: {
          type: String,
          required: true,
          trim: true
        },
        state: {
          type: String,
          required: true,
          trim: true
        },
        pinCode: {
          type: String,
          required: true,
          match: [/^\d{6}$/, 'Pin code must be 6 digits']
        },
        phone: {
          type: String,
          required: true,
          match: [/^\d{10}$/, 'Phone must be 10 digits']
        },
        altPhone: {
          type: String,
          match: [/^\d{10}$/, 'Alternate phone must be 10 digits']
        },
        isDefault: {
          type: Boolean,
          default: false
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

const Address = mongoose.model('Address', addressSchema);
module.exports = Address;
