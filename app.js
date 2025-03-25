const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
require('dotenv').config(); // Load environment variables
const passport = require('./config/passport'); // Your passport.js file
const db = require('./config/db');
const userRouter = require('./routes/userRouter');
const adminRouter = require('./routes/adminRouter');
const MongoStore = require('connect-mongo');
const nocache = require('nocache');
const fs = require('fs');
require('./jobs/cleanupExpiredUsers');
// Connect to MongoDB
db();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions',
        ttl: 24 * 60 * 60, // 1 day
        autoRemove: 'native'
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));


// Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

// Apply nocache selectively (optional, can remove if global is preferred)
app.use(nocache()); // Prevents caching globally

// Middleware to set locals for views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.admin = req.session.admin || null;
    if (req.session.admin) {
        req.session.touch(); // Extend admin session life
    }
    next();
});

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', [
    path.join(__dirname, 'views'),
    path.join(__dirname, 'views/user'),
    path.join(__dirname, 'views/admin')
]);

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', userRouter);
app.use('/admin', adminRouter);

// 404 Handling
app.use('/admin', (req, res) => {
    console.log('404 Error - Admin URL not found:', req.originalUrl);
    res.status(404).render('admin-error');
});

app.use((req, res) => {
    console.log('404 Error - URL not found:', req.originalUrl);
    res.status(404).render('page-404');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).send('Something broke!');
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;