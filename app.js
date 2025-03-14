const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
const env = require('dotenv').config();
const passport = require('./config/passport');
const db = require('./config/db');
const userRouter = require('./routes/userRouter');
const adminRouter = require('./routes/adminRouter');
const MongoStore = require("connect-mongo");
const nocache = require('nocache');
const fs = require('fs');
// Removed duplicate path require
db()

app.use(nocache());

app.use(express.json());
app.use(express.urlencoded({extended:true}));

// Ensure upload directories exist
const uploadDirs = [
    path.join(__dirname, 'public/uploads/product-images'),
    path.join(__dirname, 'public/uploads/re-image')
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: process.env.MONGODB_URI,
        collectionName: "sessions"
    }),
    cookie: {
        secure: false, // Set to true only in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Add middleware to handle both user and admin sessions
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.admin = req.session.admin || null;
    next();
});

app.use((req,res,next)=>{
    res.set('cache-control','no-store');
    next();
})

app.set("view engine","ejs");
app.set('views', [
    path.join(__dirname, 'views'),
    path.join(__dirname, 'views/user'),
    path.join(__dirname, 'views/admin')
]);
app.use(express.static(path.join(__dirname,"public")));

// Error handler middleware (add before routes)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.use('/',userRouter);
app.use('/admin',adminRouter);

// 404 handler (add after routes)
app.use((req, res) => {
    res.status(404).render('page-404');
});

app.listen(process.env.PORT, ()=>{
    console.log("server running")
});

module.exports = app;