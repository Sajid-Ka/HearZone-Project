const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Brand = require('../../models/brandSchema');
const User = require('../../models/userSchema');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const getProductAddPage = async (req, res) => {
    try {
        const category = await Category.find({ isListed: true });
        const brand = await Brand.find({ isBlocked: false });
        res.render('product-add', {
            cat: category,
            brand: brand,
        });
    } catch (error) {
        console.error("addproductPage error");
        return res.redirect('/admin/pageError');
    }
};

const addProducts = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please upload at least one image"
            });
        }

        const products = req.body;
        const productExists = await Product.findOne({
            productName: products.productName,
        });

        if (productExists) {
            // Delete uploaded files if product exists
            req.files.forEach(file => {
                fs.unlinkSync(file.path);
            });
            return res.status(400).json({ 
                success: false, 
                message: "Product Already Exists" 
            });
        }

        const images = [];
        for (const file of req.files) {
            try {
                // Create re-image directory if it doesn't exist
                const reImageDir = path.join('public', 'uploads', 're-image');
                if (!fs.existsSync(reImageDir)) {
                    fs.mkdirSync(reImageDir, { recursive: true });
                }

                const filename = file.filename;
                const reImagePath = path.join(reImageDir, filename);

                // Process and save image
                await sharp(file.path)
                    .resize(600, 600, {
                        fit: 'cover',
                        position: 'center'
                    })
                    .jpeg({ quality: 90 })
                    .toFile(reImagePath);

                images.push(filename);
            } catch (err) {
                console.error("Error processing image:", err);
            }
        }

        console.log('Images saved:', images);

        const categoryId = await Category.findOne({ name: products.category });
        if (!categoryId) {
            return res.status(400).json({ success: false, message: "Invalid Category name" });
        }

        const brandDoc = await Brand.findOne({ brandName: products.brand });
        if (!brandDoc) {
            return res.status(400).json({ success: false, message: "Invalid Brand name" });
        }

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
        });

        await newProduct.save();
        
        return res.status(200).json({ 
            success: true, 
            message: "Product added successfully" 
        });
    } catch (error) {
        console.error("Error saving product:", error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || "An error occurred while adding the product" 
        });
    }
};

const getAllProducts = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 4;

        const matchingBrands = await Brand.find({
            brandName: { $regex: search, $options: "i" }
        }).select("_id");

        const brandIds = matchingBrands.map(brand => brand._id);

        const [productData, count, category, brand] = await Promise.all([
            Product.find({
                $or: [
                    { productName: { $regex: search, $options: "i" } },
                    { brand: { $in: brandIds } }
                ]
            })
                .limit(limit)
                .skip((page - 1) * limit)
                .populate("category")
                .populate("brand")
                .exec(),
            
            Product.countDocuments({
                $or: [
                    { productName: { $regex: search, $options: "i" } },
                    { brand: { $in: brandIds } }
                ]
            }),

            Category.find({ isListed: true }),
            Brand.find({ isBlocked: false })
        ]);

        // Single render with all data
        res.render("products", {
            data: productData,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            cat: category,
            brand: brand,
            search: search,
        });

    } catch (error) {
        console.error("Error all product page", error);
        res.redirect("/admin/pageError");
    }
};

const blockProduct = async (req,res)=>{
    try {
        
        let id = req.query.id;
        await Product.updateOne({_id:id},{$set:{isBlocked:true}});
        return res.redirect(`/admin/products?success=blocked`);

    } catch (error) {
        console.error(" product blocking Error", error);
        return res.redirect("/admin/pageError");
    }
}

const unblockProduct = async (req,res)=>{
    try {
        let id = req.query.id;
        await Product.updateOne({_id:id},{$set:{isBlocked:false}});
        return res.redirect(`/admin/products?success=unblocked`);
    } catch (error) {
        console.error(" product unblocking Error", error);
        return res.redirect("/admin/pageError");
    }
}



const getEditProduct = async (req,res)=>{
    try {

        const id = req.query.id;
        const product = await Product.findOne({_id:id});
        const category = await Category.find({});
        const brand = await Brand.find({});

        res.render('edit-product',{
            product : product,
            cat : category,
            brand : brand,
        })

        
    } catch (error) {
        console.error(" Getting EditProduct Error", error);
        return res.redirect("/admin/pageError");
    }
}



const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const product = await Product.findById(id).populate('category');
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const data = req.body;
        const existingProduct = await Product.findOne({
            productName: data.productName,
            _id: { $ne: id },
        });

        if (existingProduct) {
            return res.status(400).json({ success: false, message: "This product name already exists" });
        }

        const images = [];
        if (req.files && req.files.length > 0) {
            // Define directories
            const tempDir = path.join('public', 'uploads', 'temp');
            const productImagesDir = path.join('public', 'uploads', 'product-images');
            const reImageDir = path.join('public', 'uploads', 're-image');
            
            // Create directories if they don't exist
            [tempDir, productImagesDir, reImageDir].forEach(dir => {
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            });

            for (let file of req.files) {
                const filename = file.filename;
                const tempPath = path.join(tempDir, `temp_${filename}`);
                const productImagePath = path.join(productImagesDir, filename);
                const reImagePath = path.join(reImageDir, filename);

                // Move uploaded file to temp directory
                fs.renameSync(file.path, tempPath);

                // Process and save image to both directories
                await Promise.all([
                    sharp(tempPath)
                        .resize(600, 600, { fit: 'cover', position: 'center' })
                        .jpeg({ quality: 90 })
                        .toFile(productImagePath),
                    sharp(tempPath)
                        .resize(600, 600, { fit: 'cover', position: 'center' })
                        .jpeg({ quality: 90 })
                        .toFile(reImagePath)
                ]);

                // Clean up temp file
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                
                images.push(filename);
            }
        }

        const categoryId = await Category.findOne({ name: data.category });
        if (!categoryId) {
            return res.status(400).json({ success: false, message: "Invalid Category name" });
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
        };

        if (images.length > 0) {
            updateFields.productImage = [...(product.productImage || []), ...images];
        }

        await Product.findByIdAndUpdate(id, updateFields);
        return res.status(200).json({ success: true, message: "Product updated successfully" });
    } catch (error) {
        console.error("Error Editing product:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


const deleteSingleImage = async (req, res) => {
    try {
        const { imageNameToServer, productIdToServer } = req.body;
        
        // Validate inputs
        if (!imageNameToServer || !productIdToServer) {
            return res.status(400).json({
                success: false,
                message: "Missing required parameters"
            });
        }

        // Get product and check image exists
        const product = await Product.findById(productIdToServer);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (!product.productImage.includes(imageNameToServer)) {
            return res.status(404).json({
                success: false,
                message: "Image not found in product"
            });
        }

        // Only delete if there will be at least one image remaining
        if (product.productImage.length <= 1) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete the last image. Product must have at least one image."
            });
        }

        // Update database
        const updatedProduct = await Product.findByIdAndUpdate(
            productIdToServer,
            { $pull: { productImage: imageNameToServer } },
            { new: true }
        );

        // Delete physical file
        const imagePath = path.join(__dirname, '../../public/uploads/product-images', imageNameToServer);
        const reImagePath = path.join(__dirname, '../../public/uploads/re-image', imageNameToServer);

        try {
            if (fs.existsSync(imagePath)) {
                await fs.promises.unlink(imagePath);
            }
            if (fs.existsSync(reImagePath)) {
                await fs.promises.unlink(reImagePath);
            }
        } catch (err) {
            console.error('Error deleting physical files:', err);
            // Continue execution even if physical file deletion fails
        }

        return res.status(200).json({
            success: true,
            message: "Image deleted successfully",
            remainingImages: updatedProduct.productImage
        });

    } catch (error) {
        console.error("Error Deleting ProductImage:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while deleting the image"
        });
    }
};

module.exports = {
    getProductAddPage,
    addProducts,
    getAllProducts,
    blockProduct,
    unblockProduct,
    getEditProduct,
    editProduct,
    deleteSingleImage
};