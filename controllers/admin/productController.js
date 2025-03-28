const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Brand = require('../../models/brandSchema');
const User = require('../../models/userSchema');
const fs = require('fs').promises; 
const path = require('path');
const sharp = require('sharp');


const tempDir = path.join(__dirname, '../../public/uploads/temp');
const productImagesDir = path.join(__dirname, '../../public/uploads/product-images');
const reImageDir = path.join(__dirname, '../../public/uploads/re-image');


[tempDir, productImagesDir, reImageDir].forEach(dir => {
    if (!require('fs').existsSync(dir)) {
        require('fs').mkdirSync(dir, { recursive: true });
    }
});

const getProductAddPage = async (req, res) => {
    try {
        const [category, brand] = await Promise.all([
            Category.find({ isListed: true }),
            Brand.find({ isBlocked: false })
        ]);
        res.render('product-add', { cat: category, brand });
    } catch (error) {
        console.error("addProductPage error:", error);
        res.redirect('/admin/pageError');
    }
};



const addProducts = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: "Please upload at least one image" });
        }

        const products = req.body;
        const productExists = await Product.findOne({ 
            productName: { $regex: new RegExp(`^${products.productName}$`, 'i') }
        });
        
        if (productExists) {
            for (const file of req.files) {
                await safeDelete(file.path);
            }
            return res.status(400).json({ success: false, message: "Product Already Exists" });
        }

        const images = [];
        for (const file of req.files) {
            const filename = file.filename;
            const tempPath = file.path;
            const reImagePath = path.join(reImageDir, filename);
            const productImagePath = path.join(productImagesDir, filename);

            await Promise.all([
                sharp(tempPath).resize(600, 600, { fit: 'cover' }).jpeg({ quality: 90 }).toFile(productImagePath),
                sharp(tempPath).resize(600, 600, { fit: 'cover' }).jpeg({ quality: 90 }).toFile(reImagePath)
            ]);

            images.push(filename);
            setTimeout(() => safeDelete(tempPath), 1000);
        }

        const [categoryId, brandDoc] = await Promise.all([
            Category.findOne({ name: products.category }),
            Brand.findOne({ brandName: products.brand })
        ]);

        if (!categoryId) return res.status(400).json({ success: false, message: "Invalid Category name" });
        if (!brandDoc) return res.status(400).json({ success: false, message: "Invalid Brand name" });

        // Process highlights
        let highlights = products.highlights ? 
            products.highlights.split('\n').map(h => h.trim()).filter(h => h.length > 0) : [];

        // Process specifications (similar to highlights)
        let specifications = products.specifications ? 
            products.specifications.split('\n').map(s => s.trim()).filter(s => s.length > 0) : [];

        const newProduct = new Product({
            productName: products.productName,
            description: products.description,
            brand: brandDoc._id,
            category: categoryId._id,
            regularPrice: products.regularPrice,
            salePrice: products.salePrice || 0,
            createdOn: new Date(),
            quantity: products.quantity,
            color: products.color,
            productImage: images,
            status: 'Available',
            isBlocked: false,
            highlights,
            specifications
        });

        await newProduct.save();
        return res.status(200).json({ success: true, message: "Product added successfully" });
    } catch (error) {
        console.error("Error saving product:", error);
        if (req.files) {
            for (const file of req.files) {
                await safeDelete(file.path);
            }
        }
        return res.status(500).json({ success: false, message: error.message || "An error occurred" });
    }
};


const checkProductName = async (req, res) => {
    try {
        const { name } = req.query;
        const productExists = await Product.findOne({ 
            productName: { $regex: new RegExp(`^${name}$`, 'i') }
        });
        res.json({ exists: !!productExists });
    } catch (error) {
        console.error('Error checking product name:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


const getAllProducts = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const isBlocked = req.query.blocked === "true";
        const limit = 4;

        const matchingBrands = await Brand.find({ brandName: { $regex: search, $options: "i" } }).select("_id");
        const brandIds = matchingBrands.map(brand => brand._id);

        const searchQuery = {
            $and: [
                {
                    $or: [
                        { productName: { $regex: search, $options: "i" } },
                        { brand: { $in: brandIds } }
                    ]
                },
                { isBlocked: isBlocked }
            ]
        };

        const [productData, count, category, brand] = await Promise.all([
            Product.find(searchQuery)
                .sort({ createdOn: -1 })
                .limit(limit)
                .skip((page - 1) * limit)
                .populate("category")
                .populate("brand"),
            Product.countDocuments(searchQuery),
            Category.find({ isListed: true }),
            Brand.find({ isBlocked: false })
        ]);

        res.render("products", {
            data: productData,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            cat: category,
            brand: brand,
            search: search,
            isBlocked: isBlocked
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.redirect("/admin/pageError");
    }
};

const blockProduct = async (req, res) => {
    try {
        const id = req.query.id;
        await Product.updateOne({ _id: id }, { $set: { isBlocked: true } });
        res.redirect(`/admin/products?success=blocked`);
    } catch (error) {
        console.error("Product blocking error:", error);
        res.redirect("/admin/pageError");
    }
};

const unblockProduct = async (req, res) => {
    try {
        const id = req.query.id;
        await Product.updateOne({ _id: id }, { $set: { isBlocked: false } });
        res.redirect(`/admin/products?success=unblocked`);
    } catch (error) {
        console.error("Product unblocking error:", error);
        res.redirect("/admin/pageError");
    }
};

const getEditProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const [product, category, brand] = await Promise.all([
            Product.findOne({ _id: id }),
            Category.find({}),
            Brand.find({})
        ]);

        if (!product) return res.redirect("/admin/pageError");
        res.render('edit-product', { product, cat: category, brand });
    } catch (error) {
        console.error("Error fetching edit product:", error);
        res.redirect("/admin/pageError");
    }
};

const fsExists = async (path) => {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
};

const safeDelete = async (filePath, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Check if file exists first
            try {
                await fs.access(filePath);
            } catch {
                return; // File doesn't exist, consider it "deleted"
            }

            await fs.unlink(filePath);
            return;
        } catch (error) {
            if (attempt === maxRetries) {
                // On last attempt, throw error if it's not EPERM
                if (error.code !== 'EPERM') {
                    throw error;
                }
                // For EPERM errors on last attempt, just log and continue
                console.warn(`Note: File ${path.basename(filePath)} will be cleaned up by system later`);
                return;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
};



const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const product = await Product.findById(id).populate('category');
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const data = req.body;
        
        const categoryId = await Category.findOne({ name: data.category });
        if (!categoryId) {
            return res.status(400).json({ success: false, message: "Invalid Category name" });
        }

        // Process highlights
        let newHighlights = 'highlights' in data ? 
            (data.highlights && data.highlights.trim() ? 
                data.highlights.split('\n').map(h => h.trim()).filter(h => h.length > 0) : []) : 
            product.highlights;

        // Process specifications (similar to highlights)
        let newSpecifications = 'specifications' in data ? 
            (data.specifications && data.specifications.trim() ? 
                data.specifications.split('\n').map(s => s.trim()).filter(s => s.length > 0) : []) : 
            product.specifications;

        const images = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const filename = file.filename;
                const tempPath = file.path;
                const productImagePath = path.join(productImagesDir, filename);
                const reImagePath = path.join(reImageDir, filename);

                await Promise.all([
                    sharp(tempPath).resize(600, 600, { fit: 'cover' }).jpeg({ quality: 90 }).toFile(productImagePath),
                    sharp(tempPath).resize(600, 600, { fit: 'cover' }).jpeg({ quality: 90 }).toFile(reImagePath)
                ]);

                images.push(filename);
                setTimeout(() => safeDelete(tempPath), 2000);
            }
        }

        const updateFields = {
            productName: data.productName,
            description: data.descriptionData,
            brand: data.brand,
            category: categoryId._id,
            regularPrice: data.regularPrice,
            salePrice: data.salePrice || 0,
            quantity: data.quantity,
            color: data.color,
            highlights: newHighlights,
            specifications: newSpecifications
        };

        if (images.length > 0) {
            updateFields.productImage = [...(product.productImage || []), ...images];
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        return res.status(200).json({ 
            success: true, 
            message: "Product updated successfully"
        });
    } catch (error) {
        console.error("Error editing product:", error);
        if (req.files) {
            setTimeout(() => {
                for (const file of req.files) {
                    safeDelete(file.path);
                }
            }, 2000);
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};



const deleteSingleImage = async (req, res) => {
    try {
        const { imageNameToServer, productIdToServer } = req.body;
        if (!imageNameToServer || !productIdToServer) {
            return res.status(400).json({ success: false, message: "Missing required parameters" });
        }

        const product = await Product.findById(productIdToServer);
        if (!product || !product.productImage.includes(imageNameToServer)) {
            return res.status(404).json({ success: false, message: "Image not found in product" });
        }

        if (product.productImage.length <= 1) {
            return res.status(400).json({ success: false, message: "Cannot delete the last image" });
        }

        // Update database first
        const updatedProduct = await Product.findByIdAndUpdate(
            productIdToServer,
            { $pull: { productImage: imageNameToServer } },
            { new: true }
        );

        // Then try to delete the physical files
        const imagePath = path.join(productImagesDir, imageNameToServer);
        const reImagePath = path.join(reImageDir, imageNameToServer);

        await Promise.all([
            safeDelete(imagePath),
            safeDelete(reImagePath)
        ]);

        return res.status(200).json({
            success: true,
            message: "Image deleted successfully",
            remainingImages: updatedProduct.productImage
        });
    } catch (error) {
        console.error("Error deleting product image:", error);
        return res.status(500).json({ success: false, message: "An error occurred while deleting the image" });
    }
};

module.exports = {
    getProductAddPage,
    addProducts,
    checkProductName,
    getAllProducts,
    blockProduct,
    unblockProduct,
    getEditProduct,
    editProduct,
    deleteSingleImage
};