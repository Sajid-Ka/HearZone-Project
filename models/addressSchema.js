// /models/addressSchema.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const addressSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true // Adding index for faster queries
    },
    addresses: [{
        addressType: {
            type: String,
            enum: ['Home', 'Work', 'Other'], // Restrict to specific types
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
        landmark: { // Changed from landMark to landmark (camelCase consistency)
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
            type: String, // Changed to String to handle leading zeros
            required: true,
            match: [/^\d{6}$/, 'Pin code must be 6 digits'] // Basic validation
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
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Automatically manages createdAt and updatedAt
});

const Address = mongoose.model("Address", addressSchema);
module.exports = Address;