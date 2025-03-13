const Brand = require('../../models/brandSchema'); 
const path = require('path');

// Get all brands
const getAllBrands = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5; // Items per page
        const skip = (page - 1) * limit;

        const totalBrands = await Brand.countDocuments();
        const totalPages = Math.ceil(totalBrands / limit);
        
        const brands = await Brand.find()
            .skip(skip)
            .limit(limit);

        res.render('brand', { 
            brands, 
            currentPage: page,
            totalPages,
            error: null, 
            success: null 
        });
    } catch (err) {
        console.error(err);
        res.render('brand', { 
            brands: [], 
            currentPage: 1,
            totalPages: 1,
            error: 'Failed to load brands', 
            success: null 
        });
    }
};

// Add a new brand
const addBrand = async (req, res) => {
    try {
        const { brandName } = req.body;
        const brandImage = req.file ? `/uploads/re-image/${req.file.filename}` : null;

        const newBrand = new Brand({
            brandName,
            brandImage: brandImage ? [brandImage] : []
        });
        await newBrand.save();
        res.json({ success: true, message: 'Brand added successfully' });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Failed to add brand' });
    }
};

// Update a brand
const updateBrand = async (req, res) => {
    try {
        const { brandId, brandName } = req.body;
        const brandImage = req.file ? `/public/uploads/${req.file.filename}` : undefined;

        const updateData = { brandName };
        if (brandImage) {
            updateData.brandImage = [brandImage];
        }

        await Brand.findByIdAndUpdate(brandId, updateData);
        res.redirect('/admin/brands');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/brands');
    }
};

// Block/unblock a brand
const toggleBrandStatus = async (req, res) => {
    try {
        const { brandId } = req.body;
        const brand = await Brand.findById(brandId);
        brand.isBlocked = !brand.isBlocked;
        await brand.save();
        res.json({ success: true, message: `Brand ${brand.isBlocked ? 'blocked' : 'unblocked'} successfully` });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Failed to update brand status' });
    }
};

// Delete a brand
const deleteBrand = async (req, res) => {
    try {
        const { brandId } = req.body;
        await Brand.findByIdAndDelete(brandId);
        res.json({ success: true, message: 'Brand deleted successfully' });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Failed to delete brand' });
    }
};

module.exports = {
    getAllBrands,
    addBrand,
    updateBrand,
    toggleBrandStatus,
    deleteBrand
}