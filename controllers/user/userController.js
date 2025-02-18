

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

module.exports={
    loadHomepage,
    pageNotFound,
    loadSignup
}