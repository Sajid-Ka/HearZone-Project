



const getForgotPassPage = async (req,res)=>{
    try {

        res.render('forgot-password');
        
    } catch (error) {
        console.error("Forgot Password Page error");
        res.redirect('/pageNotFound')
    }
}



module.exports = {
    getForgotPassPage,
}