const User = require('../../models/userSchema')

const pageNotFound = async (req,res)=>{
    try{
        res.render("page-404")
    }catch(err){
        res.redirect("/pageNotFoud")
    }
}

const loadHomepage = async (req,res)=>{
    try{
        return res.render('home');
    }catch(err){
        console.log('Homepage Not found');
        res.status(500).send("Server error");
    }
}

const loadSignup = async (req,res)=>{
    try{
        return res.render('signup');
    }catch(err){
        console.log('Homepage not loading',err.message);
        res.status(500).send('Server Error')
        
    }
}

const signup = async (req,res)=>{
    const {name,email,phone,password} = req.body
    try{
        const newUser = new User({name,email,phone,password})
        console.log(newUser);
        

        await newUser.save();
        return res.redirect('/signup')
    }catch(err){
        console.error('Error for save user',err);
        res.status(500).send('Internal Server Error')
        
    }
}



module.exports={
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup
}