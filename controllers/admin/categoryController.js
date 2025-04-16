const Category = require('../../models/categorySchema');

const categoryInfo = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        const categoryData = await Category.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / limit);

        // Check if the request is AJAX
        if (req.get('X-Requested-With') === 'XMLHttpRequest') {
            return res.json({
                success: true,
                data: categoryData,
                currentPage: page,
                totalPages: totalPages,
                totalCategories: totalCategories
            });
        }

        // Render EJS for initial page load
        res.render('category', {
            data: categoryData,
            totalPages: totalPages,
            currentPage: page,
            totalCategories: totalCategories
        });
    } catch (error) {
        console.error("Category Info Error", error);
        if (req.get('X-Requested-With') === 'XMLHttpRequest') {
            return res.status(500).json({
                success: false,
                message: 'Failed to load categories'
            });
        }
        res.redirect('/admin/pageError');
    }
};

// Other controllers remain unchanged
const addCategory = async (req, res) => {
    const { name, description } = req.body;
    try {
        const existingCategory = await Category.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });
        
        if (existingCategory) {
            return res.status(400).json({ success: false, error: "Category already exists" });
        }
        const newCategory = new Category({ 
            name, 
            description,
            isListed: true  
        });
        await newCategory.save();
        return res.json({ success: true, message: "Category added successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};

const getListCategory = async (req, res) => {
    try {
        const id = req.query.id;
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { $set: { isListed: true } },
            { new: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ 
                success: false, 
                message: 'Category not found'
            });
        }

        res.json({ 
            success: true, 
            message: 'Category listed successfully',
            category: updatedCategory
        });
    } catch (error) {
        console.error("Category list error", error);
        res.status(500).json({ 
            success: false, 
            message: 'Error listing category'
        });
    }
};

const getUnlistCategory = async (req, res) => {
    try {
        const id = req.query.id;
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { $set: { isListed: false } },
            { new: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ 
                success: false, 
                message: 'Category not found'
            });
        }

        res.json({ 
            success: true, 
            message: 'Category unlisted successfully',
            category: updatedCategory
        });
    } catch (error) {
        console.error("Category unlist error", error);
        res.status(500).json({ 
            success: false, 
            message: 'Error unlisting category'
        });
    }
};

const getEditCategory = async (req, res) => {
    try {
        const id = req.query.id;
        const category = await Category.findOne({ _id: id });
        if (!category) {
            return res.redirect('/admin/category');
        }
        res.render('edit-category', { category: category });
    } catch (error) {
        res.redirect('/admin/pageError');
    }
};

const editCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const { categoryName, description } = req.body;

        const currentCategory = await Category.findById(id);
        if (!currentCategory) {
            return res.status(404).json({ 
                success: false,
                error: "Category not found" 
            });
        }

        if (currentCategory.name.toLowerCase() === categoryName.toLowerCase() && 
            currentCategory.description === description) {
            return res.status(400).json({
                success: false,
                error: "No changes detected"
            });
        }

        const existingCategory = await Category.findOne({ 
            name: { $regex: new RegExp(`^${categoryName}$`, 'i') },
            _id: { $ne: id }
        });

        if (existingCategory) {
            return res.status(400).json({ 
                success: false,
                error: "Category already exists, please choose another name" 
            });
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { name: categoryName, description },
            { new: true }
        );

        return res.json({ 
            success: true,
            message: "Category updated successfully",
            category: updatedCategory
        });
    } catch (error) {
        console.error("Edit Category Error:", error);
        return res.status(500).json({ 
            success: false,
            error: "Internal server error" 
        });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const id = req.query.id;
        const deletedCategory = await Category.findByIdAndDelete(id);

        if (deletedCategory) {
            return res.json({ 
                success: true, 
                message: 'Category deleted successfully'
            });
        } else {
            return res.status(404).json({ 
                success: false, 
                message: 'Category not found' 
            });
        }
    } catch (error) {
        console.error("Delete Category Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};

module.exports = {
    categoryInfo,
    addCategory,
    getListCategory,
    getUnlistCategory,
    getEditCategory,
    editCategory,
    deleteCategory
};