const Category = require('../../models/categorySchema');
const { updateOne } = require('../../models/userSchema');


const categoryInfo = async (req,res)=>{
        try {

            const page = parseInt(req.query.page) || 1;
            const limit =4;
            const skip =  (page-1)*limit;

            const categoryData = await Category.find({})
            .sort({createdAt:-1})
            .skip(skip)
            .limit(limit);

            const totalCategories = await Category.countDocuments();
            const totalPages = Math.ceil(totalCategories/limit);
            res.render('category',{
                data: categoryData,  
                totalPages: totalPages, 
                currentPage: page, 
                totalCategories: totalCategories 
            });
            
        } catch (error) {
            console.error("Category Info Error",error);
            res.redirect('/admin/pageError');
        }
}



const addCategory = async (req,res)=>{
    const {name,description} = req.body;

    try {
        console.log("Received Data:", { name, description }); 
        const existingCategory = await Category.findOne({name});

        if(existingCategory){
            return res.status(400).json({error:"Category Alredy exists"})
        }

        const newCategory = new Category({
            name,
            description,
        })

        await newCategory.save();
        return res.json({message:"Category added successfully"});

    } catch (error) {
        return res.status(500).json({error:"Internal server error"});
    }
}



const getListCategory = async (req,res)=>{
    try {

        let id =req.query.id;
        await Category.updateOne({_id:id},{$set:{isListed:false}});
        res.redirect('/admin/category')
        
    } catch (error) {
        console.error("category listed error",error);
        res.redirect('/admin/pageError');
    }
}


const getUnlistCategory = async (req,res)=>{
    try {
        
        let id =req.query.id;
        await Category.updateOne({_id:id},{$set:{isListed:true}});
        res.redirect('/admin/category')

    } catch (error) {
        console.error("category unlisted error",error);
        res.redirect('/admin/pageError');
    }
}


const getEditCategory = async (req,res)=>{
    try {

        const id =req.query.id;
        const category = await Category.findOne({_id:id});
        if (!category) {
            return res.redirect('/admin/category'); 
        }
        res.render('edit-category',{category:category});
        
    } catch (error) {
        res.redirect('/admin/pageError')
    }
}



const editCategory = async (req,res)=>{

    try {
        
        const id = req.params.id;
        const {categoryName,description} = req.body;
        const existingCategory = await Category.findOne({name:categoryName});

        if(existingCategory){
            return res.status(400).json({error:"category alredy exist, Please choose another name"});
        }

        const updateCategory = await Category.findByIdAndUpdate(id,{
            name:categoryName,
            description:description,
        },{new:true});

        if(updateCategory){
            res.redirect('/admin/category');
        }else{
            res.status(404).json({error:"Category not found"});
        }

    } catch (error) {
        res.status(500).json({error:"Internal server error"});
    }

}


module.exports = {
    categoryInfo,
    addCategory,
    getListCategory,
    getUnlistCategory,
    getEditCategory,
    editCategory,
}