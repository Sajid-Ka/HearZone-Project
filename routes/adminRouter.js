const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminController');





//admin login
router.get('/login',adminController.loadLogin);
router.post('/login',adminController.login);


//admin dashboard
router.get('/dashboard', adminController.loadDashboard);


// router.get("/dashboard", (req, res) => {
//     res.render("dashboard"); // Ensure you have admin-dashboard.ejs in views/admin
// });

module.exports = router;







module.exports=router;