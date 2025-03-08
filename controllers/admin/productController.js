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
            return res.redirect('/admin/products');
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
            search: search
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


const editProduct = async (req,res)=>{
    try {

        const id = req.params.id;
        const product = await Product.findOne({_id:id});
        const data = req.body;
        const existingProduct = await Product.findOne({
            productName:data.productName,
            _id:{$ne:id},
        });

        if(existingProduct){
            res.status(400).json({error:"This name alredy Exist, please Choose another Name"})
        }

        const images = [];

        if(req.files && req.files.length>0){
            for(let i=0;i<req.files.length;i++){
                images.push(req.files[i].filename);
            }
        }

        const updateFields = {
            productName:data.productName,
            description:data.description,
            brand:data.brand._id,
            category:product.category,
            regularPrice:data.regularPrice,
            salePrice:data.salePrice,
            quantity:data.quantity,
            size:data.size,
            color:data.color,
        }

        if(req.files.length>0){
            updateFields.$push = {productImage:{$each:images}};
        }

        await Product.findByIdAndUpdate(id,updateFields,{new:true});
        return res.redirect('/admin/products');
        
    } catch (error) {
        console.error("Error Editing product", error);
        return res.redirect('/admin/pageError');
    }
}


const deleteSingleImage = async (req,res)=>{
    try {

        const {imageNameToServer,productIdToServer} = req.body;
        const product = await Product.findByIdAndUpdate(productIdToServer,{$pull:{productImage:imageNameToServer}});
        const imagePath = path.join("public","uploads","re-image",imageNameToServer);

        if(fs.existsSync(imagePath)){
            await fs.unlinkSync(imagePath)
            console.log(`Image ${imageNameToServer} Delete Successfully`)
        }else{
            console.log(`Imgae ${imageNameToServer} Not Found`);
        }

        res.send({status:true});

        
    } catch (error) {
        console.error("Error Deleting ProductImage", error);
        return res.redirect('/admin/pageError');
    }
}


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