const multer = require('multer');
const path = require('path');
const fs = require('fs');

const productImagesDir = path.join(__dirname, '../public/uploads/product-images');
const tempDir = path.join(__dirname, '../public/uploads/temp');
const reImageDir = path.join(__dirname, '../public/uploads/re-image');
const profileImagesDir = path.join(__dirname, '../public/uploads/profile-images'); // Add profile images directory

// Ensure all directories exist
[tempDir, productImagesDir, reImageDir, profileImagesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// General storage for temporary uploads
const tempStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Separate storage for profile images
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profileImagesDir);
    },
    filename: (req, file, cb) => {
        const userId = req.session.user.id;
        const uniqueSuffix = Date.now(); // Simplified to match updateProfileImage
        cb(null, `${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Upload configurations
const upload = multer({
    storage: tempStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const profileUpload = multer({
    storage: profileStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }  // 10MB limit
});

module.exports = { upload, profileUpload };
