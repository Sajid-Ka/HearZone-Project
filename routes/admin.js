const express = require('express');
const router = express.Router();
const Product = require('../../models/productSchema');

// ...existing code...

router.get('/checkProductName', async (req, res) => {
    try {
        const productName = req.query.name;
        const existingProduct = await Product.findOne({
            productName: { $regex: new RegExp(`^${productName}$`, 'i') }
        });
        res.json({ exists: !!existingProduct });
    } catch (error) {
        console.error('Error checking product name:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ...existing code...

module.exports = router;