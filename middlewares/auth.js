const User = require("../models/userSchema");

const userAuth = (req,res,next)=>{
    if(req.sesssion.User){
        User.findById(req.sesssion.user)
        .then(data=>{
            if(data && !data.isBlocked){
                next();
            }else{
                res.redirect('/login');
            }
        })
        .catch(error=>{
            console.error("Error in userAuth middleware",error);
            res.status(500).send("Internal Server error")
        })
    }else{
        res.redirect('/login');
    }
}


const adminAuth = (req,res,next)=>{
    User.findOne({isAdmin:true})
    .then(data=>{
        if(data){
            next();
        }else{
            res.redirect('/admin/login');
        }
    })
    .catch(error=>{
        console.log("Error in admin Auth middleware",error);
        res.status(500).send("Internal server error")
    })
}


module.exports = {
    userAuth,
    adminAuth
}