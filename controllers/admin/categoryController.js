const Category = require('../../models/categorySchema');


const categoryInfo = async (req,res)=>{
        try {

            const page = parseInt(req.query.page) || 1;
            const limit =4;
            const skip =  (page-1)*limit;

            const categoryData = await Category.find({})
            .sort({createdAt:-1})
            .skip(skip)
            .limit(limit);

            console.log("Fetched Category Data:", categoryData); // ✅ Log fetched data

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
            res.redirect('/pageError');
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
        return res.status(500).json({error:"Internal server error"})
    }
}



module.exports = {
    categoryInfo,
    addCategory,
}