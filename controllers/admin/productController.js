const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Brand = require('../../models/brandSchema');
const Offer = require('../../models/offerSchema');
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
            return res.status(400).json({ success: false, message: "At least one image is required" });
        }

        const { productName, category, brand, highlights, specifications, ...products } = req.body;

        // Check for duplicate product
        const productExists = await Product.findOne({ 
            productName: { $regex: new RegExp(`^${productName}$`, 'i') }
        });
        if (productExists) {
            await Promise.all(req.files.map(file => safeDelete(file.path)));
            return res.status(400).json({ success: false, message: "Product already exists" });
        }

        // Validate category and brand
        const [categoryDoc, brandDoc] = await Promise.all([
            Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } }),
            Brand.findOne({ brandName: { $regex: new RegExp(`^${brand}$`, 'i') } })
        ]);
        if (!categoryDoc) {
            await Promise.all(req.files.map(file => safeDelete(file.path)));
            return res.status(400).json({ success: false, message: "Invalid category" });
        }
        if (!brandDoc) {
            await Promise.all(req.files.map(file => safeDelete(file.path)));
            return res.status(400).json({ success: false, message: "Invalid brand" });
        }

        // Process images
        const images = await Promise.all(req.files.map(async file => {
            const filename = file.filename;
            const tempPath = file.path;
            const productImagePath = path.join(productImagesDir, filename);

            await sharp(tempPath)
                .resize(600, 600, { fit: 'cover' })
                .jpeg({ quality: 90 })
                .toFile(productImagePath);

            await fs.copyFile(productImagePath, path.join(reImageDir, filename));
            await safeDelete(tempPath);
            return filename;
        }));

        // Process highlights and specifications
        const processedHighlights = highlights ? 
            highlights.split('\n').map(h => h.trim()).filter(h => h) : [];
        const processedSpecifications = specifications ? 
            specifications.split('\n').map(s => s.trim()).filter(s => s) : [];

        // Create new product
        const newProduct = new Product({
            productName,
            ...products,
            brand: brandDoc._id,
            category: categoryDoc._id,
            productImage: images,
            status: 'Available',
            isBlocked: false,
            highlights: processedHighlights,
            specifications: processedSpecifications,
            createdAt: new Date()
        });

        await newProduct.save();
        return res.status(200).json({ success: true, message: "Product added successfully" });
    } catch (error) {
        console.error("Error adding product:", error);
        await Promise.all((req.files || []).map(file => safeDelete(file.path)));
        return res.status(500).json({ success: false, message: "An error occurred" });
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
        const format = req.query.format || 'html';

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

        const [productData, count, category, brand, offers] = await Promise.all([
            Product.find(searchQuery)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit)
                .populate("category")
                .populate("brand")
                .populate("offer")
                .lean(),
            Product.countDocuments(searchQuery),
            Category.find({ isListed: true }),
            Brand.find({ isBlocked: false }),
            Offer.find({ isActive: true, endDate: { $gte: new Date() } })
        ]);

        // Update salePrice for expired offers
        const updatedProducts = await Promise.all(productData.map(async (product) => {
            if (product.offer && new Date(product.offer.endDate) < new Date()) {
                await Product.findByIdAndUpdate(product._id, {
                    offer: null,
                    salePrice: 0
                });
                product.offer = null;
                product.salePrice = 0;
            }
            return product;
        }));

        if (format === 'json' || req.headers.accept.includes('application/json')) {
            return res.json({
                success: true,
                data: updatedProducts,
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                search,
                isBlocked,
                offers
            });
        }

        res.render("products", {
            data: updatedProducts,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            cat: category,
            brand: brand,
            search: search,
            isBlocked: isBlocked,
            offers
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        if (req.headers.accept.includes('application/json')) {
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
        res.redirect("/admin/pageError");
    }
};

const blockProduct = async (req, res) => {
    try {
        const id = req.body.id;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        await Product.updateOne({ _id: id }, { $set: { isBlocked: true } });
        return res.status(200).json({ success: true, message: 'Product blocked successfully' });
    } catch (error) {
        console.error("Product blocking error:", error);
        return res.status(500).json({ success: false, message: 'An error occurred while blocking the product' });
    }
};

const unblockProduct = async (req, res) => {
    try {
        const id = req.body.id;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        await Product.updateOne({ _id: id }, { $set: { isBlocked: false } });
        return res.status(200).json({ success: true, message: 'Product unblocked successfully' });
    } catch (error) {
        console.error("Product unblocking error:", error);
        return res.status(500).json({ success: false, message: 'An error occurred while unblocking the product' });
    }
};

const getEditProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const [product, category, brand] = await Promise.all([
            Product.findOne({ _id: id }).populate('offer'),
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
            try {
                await fs.access(filePath);
            } catch {
                return;
            }

            await fs.unlink(filePath);
            return;
        } catch (error) {
            if (attempt === maxRetries) {
                if (error.code !== 'EPERM') {
                    throw error;
                }
                console.warn(`Note: File ${path.basename(filePath)} will be cleaned up by system later`);
                return;
            }
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
        
        const categoryId = await Category.findById(data.category);
        if (!categoryId) {
            return res.status(400).json({ success: false, message: "Invalid Category name" });
        }

        let newHighlights = 'highlights' in data ? 
            (data.highlights && data.highlights.trim() ? 
                data.highlights.split('\n').map(h => h.trim()).filter(h => h.length > 0) : []) : 
            product.highlights;

        let newSpecifications = 'specifications' in data ? 
            (data.specifications && data.specifications.trim() ? 
                data.specifications.split('\n').map(s => s.trim()).filter(s => s.length > 0) : []) : 
            product.specifications;

        let images = [...(product.productImage || [])];
        const replacedImages = data.replacedImages ? JSON.parse(data.replacedImages) : [];

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

                // Check if this is a replacement for an existing image
                const replacedImageIndex = images.findIndex(img => replacedImages.includes(img));
                if (replacedImageIndex !== -1) {
                    // Delete the old image files
                    const oldImage = images[replacedImageIndex];
                    await Promise.all([
                        safeDelete(path.join(productImagesDir, oldImage)),
                        safeDelete(path.join(reImageDir, oldImage))
                    ]);
                    // Replace the old image with the new one
                    images[replacedImageIndex] = filename;
                } else {
                    // Add as a new image if not replacing
                    if (images.length < 4) {
                        images.push(filename);
                    } else {
                        // If limit reached, skip adding and delete the uploaded file
                        await Promise.all([
                            safeDelete(productImagePath),
                            safeDelete(reImagePath)
                        ]);
                        continue;
                    }
                }

                setTimeout(() => safeDelete(tempPath), 2000);
            }
        }

        const updateFields = {
            productName: data.productName,
            description: data.descriptionData,
            brand: data.brand,
            category: categoryId._id,
            regularPrice: data.regularPrice,
            quantity: data.quantity,
            color: data.color,
            highlights: newHighlights,
            specifications: newSpecifications,
            productImage: images
        };

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

        const updatedProduct = await Product.findByIdAndUpdate(
            productIdToServer,
            { $pull: { productImage: imageNameToServer } },
            { new: true }
        );

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