const mongoose = require('mongoose');
const { Schema } = mongoose;

const walletSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: Number.isFinite,
            message: 'Amount must be a valid number'
        }
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    orderId: {
        type: String,
        required: false,
        index: true,
        sparse: true
    },
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;