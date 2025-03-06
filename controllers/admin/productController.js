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
        res.redirect('/admin/pageError');
    }
};

const addProducts = async (req, res) => {
    try {
        const products = req.body;
        const productExists = await Product.findOne({
            productName: products.productName,
        });

        if (!productExists) {
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

            const categoryId = await Category.findOne({ name: products.category });
            if (!categoryId) {
                return res.status(400).json("Invalid Category name");
            }

            const brandDoc = await Brand.findOne({ brandName: products.brand });
            if (!brandDoc) {
                return res.status(400).json("Invalid Brand name");
            }

            const newProduct = new Product({
                productName: products.productName,
                description: products.description,
                brand: brandDoc._id,
                category: categoryId._id,
                regularPrice: products.regularPrice,
                salePrice: products.salePrice,
                createdOn: new Date(),
                quantity: products.quantity,
                size: products.size,
                color: products.color,
                productImage: images,
                status: 'Available',
            });

            await newProduct.save();
            return res.redirect('/admin/addProducts');
        } else {
            return res.status(400).json("Product Already Exists, Please try with another name");
        }
    } catch (error) {
        console.error("Error saving product", error);
        return res.redirect('/admin/pageError');
    }
};

const getAllProducts = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = req.query.page || 1;
        const limit = 4;

        const matchingBrands = await Brand.find({
            brandName: { $regex: search, $options: "i" }
        }).select("_id");

        const brandIds = matchingBrands.map(brand => brand._id);

        const productData = await Product.find({
            $or: [
                { productName: { $regex: search, $options: "i" } },
                { brand: { $in: brandIds } }
            ]
        })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate("category")
            .exec();

        const count = await Product.countDocuments({
            $or: [
                { productName: { $regex: search, $options: "i" } },
                { brand: { $in: brandIds } }
            ]
        });

        const category = await Category.find({ isListed: true });
        const brand = await Brand.find({ isBlocked: false });

        if (category.length > 0 && brand.length > 0) {
            res.render("products", {
                data: productData,
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                cat: category,
                brand: brand,
            });
        } else {
            res.render("page-404");
        }
    } catch (error) {
        console.error("Error all product page", error);
        return res.redirect("/admin/pageError");
    }
};

module.exports = {
    getProductAddPage,
    addProducts,
    getAllProducts,
};