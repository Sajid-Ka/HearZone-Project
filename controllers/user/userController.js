

const loadHomepage = async (req,res)=>{
    try{
        return res.render('home');
    }catch(err){
        console.log('Homepage Not found');
        res.status(500).send("Server error");
    }
}

module.exports={
    loadHomepage
}