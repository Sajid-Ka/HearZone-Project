const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
require('dotenv').config();
const passport = require('./config/passport');
const db = require('./config/db');
const userRouter = require('./routes/userRouter');
const adminRouter = require('./routes/adminRouter');
const MongoStore = require('connect-mongo');
const nocache = require('nocache');
const fs = require('fs');
const User = require('./models/userSchema');
const { upload } = require('./helpers/multer');
require('./jobs/cleanupExpiredUsers');

db();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    secret: process.env.SESSION_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions',
        ttl: 24 * 60 * 60,
        autoRemove: 'native'
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(nocache());

// Global session validation
app.use((req, res, next) => {
    if (req.session.user && req.session.user.id && !req.session.admin) {
        User.findById(req.session.user.id)
            .then(user => {
                if (!user || user.isBlocked) {
                    
                    req.session.destroy((err) => {
                        if (err) console.error('Error destroying session:', err);
                        res.redirect('/login');
                    });
                } else {
                    next();
                }
            })
            .catch(err => {
                console.error('Error checking user session:', err);
                req.session.destroy(() => res.redirect('/login'));
            });
    } else {
        
        next();
    }
});

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.admin = req.session.admin || null;
    if (req.session.admin) {
        req.session.touch();
    }
    next();
});

app.set('view engine', 'ejs');
app.set('views', [
    path.join(__dirname, 'views'),
    path.join(__dirname, 'views/user'),
    path.join(__dirname, 'views/admin')
]);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', upload.none(), userRouter);
app.use('/admin', adminRouter);

app.use('/admin', (req, res) => {
    console.log('404 Error - Admin URL not found:', req.originalUrl);
    res.status(404).render('admin-error');
});

app.use((req, res) => {
    console.log('404 Error - URL not found:', req.originalUrl);
    res.status(404).render('page-404');
});

app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;