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
        const product = await Product.findOne({ _id: id });
        const data = req.body;

        // Check for unique product name
        const existingProduct = await Product.findOne({
            productName: data.productName,
            _id: { $ne: id },
        });

        if (existingProduct) {
            return res.status(400).json({
                success: false,
                message: "This product name already exists, please choose another name"
            });
        }

        const images = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const originalImagePath = req.files[i].path;
                const resizedImagePath = path.join('public', 'uploads', 'product-images', req.files[i].filename);
                await sharp(originalImagePath).resize({
                    width: 440,
                    height: 440,
                }).toFile(resizedImagePath);
                images.push(req.files[i].filename);
            }
        }

        const updateFields = {
            productName: data.productName,
            description: data.description,
            brand: data.brand.id,
            category: product.category,
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            quantity: data.quantity,
            size: data.size,
            color: data.color,
        };

        if (images.length > 0) {
            updateFields.productImage = [...product.productImage, ...images];
        }

        await Product.findByIdAndUpdate(id, updateFields, { new: true });
        return res.status(200).json({
            success: true,
            message: "Product updated successfully"
        });

    } catch (error) {
        console.error("Error Editing product", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while updating the product"
        });
    }
};

const deleteSingleImage = async (req, res) => {
    try {
        const { imageNameToServer, productIdToServer } = req.body;
        const product = await Product.findByIdAndUpdate(
            productIdToServer,
            { $pull: { productImage: imageNameToServer } },
            { new: true }
        );

        const imagePath = path.join(__dirname, '../../public/uploads/product-images', imageNameToServer);

        if (fs.existsSync(imagePath)) {
            await fs.promises.unlink(imagePath);
            console.log(`Image ${imageNameToServer} Deleted Successfully`);
        } else {
            console.log(`Image ${imageNameToServer} Not Found`);
        }

        return res.status(200).json({
            success: true,
            message: "Image deleted successfully"
        });
 
    } catch (error) {
        console.error("Error Deleting ProductImage", error);
        return res.status(500).json({
            success: false,
            message: "Error deleting image"
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