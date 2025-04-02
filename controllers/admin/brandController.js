const Brand = require('../../models/brandSchema'); 
const path = require('path');
const fs = require('fs');

// Add these helper functions at the top
const moveFile = (oldPath, newPath) => {
    return new Promise((resolve, reject) => {
        fs.rename(oldPath, newPath, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

const getAllBrands = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5; 
        const skip = (page - 1) * limit;

        const totalBrands = await Brand.countDocuments();
        const totalPages = Math.ceil(totalBrands / limit);
        
        const brands = await Brand.find()
            .sort({createdAt:-1})
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


const addBrand = async (req, res) => {
    try {
        const { brandName } = req.body;
        
        if (!req.file) {
            return res.json({ success: false, message: 'Brand image is required' });
        }

        // Check if brand name already exists (case-insensitive)
        const existingBrand = await Brand.findOne({
            brandName: { $regex: new RegExp(`^${brandName}$`, 'i') }
        });

        if (existingBrand) {
            // Clean up the uploaded file
            if (req.file) {
                fs.unlink(req.file.path, () => {});
            }
            return res.json({ success: false, message: 'Brand name already exists' });
        }

        // Move file from temp to re-image directory
        const tempPath = req.file.path;
        const targetPath = path.join(__dirname, `../../public/uploads/re-image/${req.file.filename}`);
        await moveFile(tempPath, targetPath);

        const brandImage = `/uploads/re-image/${req.file.filename}`;
        const newBrand = new Brand({
            brandName,
            brandImage: [brandImage]
        });
        await newBrand.save();
        res.json({ success: true, message: 'Brand added successfully' });
    } catch (err) {
        // If there's an error, try to clean up the temp file
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        console.error(err);
        res.json({ success: false, message: 'Failed to add brand' });
    }
};


const updateBrand = async (req, res) => {
    try {
        const { brandId, brandName } = req.body;
        
        if (!req.file) {
            return res.json({ success: false, message: 'Brand image is required' });
        }

        // Move file from temp to re-image directory
        const tempPath = req.file.path;
        const targetPath = path.join(__dirname, `../../public/uploads/re-image/${req.file.filename}`);
        await moveFile(tempPath, targetPath);

        const brandImage = `/uploads/re-image/${req.file.filename}`;
        const updateData = {
            brandName,
            brandImage: [brandImage]
        };

        await Brand.findByIdAndUpdate(brandId, updateData);
        res.json({ success: true, message: 'Brand updated successfully' });
    } catch (err) {
        // If there's an error, try to clean up the temp file
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        console.error(err);
        res.json({ success: false, message: 'Failed to update brand' });
    }
};


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