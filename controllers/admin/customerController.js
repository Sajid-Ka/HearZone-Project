const User = require('../../models/userSchema');



const customerInfo = async (req, res) => {
    try {
        let search = req.query.search || "";
        let page = parseInt(req.query.page) || 1;
        const limit = 3;
        const isBlocked = req.query.blocked === 'true';

        // Base query
        let query = {
            isAdmin: false,
            isBlocked: isBlocked, // Add this filter
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } }
            ]
        };

        const userData = await User.find(query)
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        const count = await User.countDocuments(query);
        const totalPages = Math.ceil(count / limit);

        res.render("customers", {
            data: userData,
            totalPages: totalPages,
            currentPage: page,
            search: search,
            isBlocked: isBlocked // Pass to view
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};


const customerBlocked = async (req,res)=>{
    try {
        let id = req.query.id;
        await User.updateOne({_id:id},{$set:{isBlocked:true}});
        res.redirect('/admin/users?success=block');
    } catch (error) {
        res.redirect('/admin/users?error=Failed to block customer');
    }
}

const customerUnblocked = async (req,res)=>{
    try {
        let id = req.query.id;
        await User.updateOne({_id:id},{$set:{isBlocked:false}});
        res.redirect('/admin/users?success=unblock');
    } catch (error) {
        res.redirect('/admin/users?error=Failed to unblock customer');
    }
}



module.exports = {
    customerInfo,
    customerBlocked,
    customerUnblocked,
}