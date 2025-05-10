const mongoose = require("mongoose");
const { Schema } = mongoose;

const categorySchema = new Schema({
    name:{
        type: String,
        required:true,
    },
    description: {
        type: String,
        required: true,
    },
    isListed: {
        type: Boolean,
        default: true,
    },
    offer: {
        percentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        endDate: {
            type: Date,
            default: null
        },
        isActive: {
            type: Boolean,
            default: false
        }
    }
},{
    timestamps:true
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;