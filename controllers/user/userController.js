const User = require('../../models/userSchema');
const bcrypt = require('bcrypt');
const env = require('dotenv').config();
const nodemailer = require('nodemailer');

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

function generateOtp(){
    return Math.floor(100000 + Math.random()*900000).toString()
}

async function sendVerificationEmail(email,otp) {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD
            }
        })

        const info = await transporter.sendMail({
            from:process.env.NODEMAILER_EMAIL,
            to:email,
            subject:"Verify your account",
            text:`Your otp is ${otp}`,
            html:`<b> Your otp ${otp} </b>`
        })

        return info.accepted.length >0

    } catch (error) {

        console.error("Error sending email",error);
        return false;
        
    }
}

const signup = async (req,res)=>{
    
    try {
        
        const {name,phone,email,password,cPassword} = req.body;

        if(password !== cPassword){
            return res.render("signup",{message:"Password do not match"})
        }
        

        const findUser = await User.findOne({email})
        

        if(findUser){
            return res.render('signup',{message:"User with this email Alredy exists"})
        }

        


        const otp = generateOtp();

        
        const emailSend = await sendVerificationEmail(email,otp)

        

        if(!emailSend){
            return res.json("email-error")
        }

        req.session.userOtp = otp;
        console.log(req.session.userOtp)
        req.session.userData = {name,phone,email,password};

        res.render("verify-otp");
        console.log("OTP send",otp)



    } catch (error) {

        console.error("signup error",error);
        res.redirect('/pageNotFound')
        
    }

}

const securePassword = async (password)=>{
    try {
        
        const passwordHash = bcrypt.hash(password,10);

        return passwordHash;

    } catch (error) {
        
    }
}

const verifyOtp = async (req,res)=>{
    try {
        
        const {otp:otpNum} = req.body;

        console.log(otpNum)

        if(otpNum===req.session.userOtp){
            const user = req.session.userData;
            const passwordHash = await securePassword(user.password);
            const saveUserData = new User({
                name:user.name,
                email:user.email,
                phone:user.phone,
                password:passwordHash
            })
            await saveUserData.save();
            req.session.user = saveUserData._id;
            res.json({success:true, redirectUrl:"/"})
        }else{
            res.status(400).json({success:false, message:"Invalid OTP, Please try again"})
        }

    } catch (error) {
        console.error("Erroe Verify OTP",error);
        res.status(500).json({success:false, message:"An error occured"})
    }
}


module.exports={
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup,
    verifyOtp
}