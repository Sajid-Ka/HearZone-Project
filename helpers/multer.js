const multer = require('multer');
const path = require('path');
const fs = require('fs');

const productImagesDir = path.join(__dirname, '../public/uploads/product-images');
const tempDir = path.join(__dirname, '../public/uploads/temp');
const reImageDir = path.join(__dirname, '../public/uploads/re-image');
const profileImagesDir = path.join(__dirname, '../public/uploads/profile-images'); 

// Ensure all directories exist
[tempDir, productImagesDir, reImageDir, profileImagesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// General storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Set appropriate destination based on fieldname
        switch (file.fieldname) {
            case 'profileImage':
                cb(null, profileImagesDir);
                break;
            case 'brandImage':
                cb(null, reImageDir);
                break;
            case 'images':
                cb(null, tempDir);
                break;
            default:
                cb(null, tempDir);
        }
    },
    filename: function (req, file, cb) {
        // Create unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Main upload middleware
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        fieldSize: 10 * 1024 * 1024, // Increase field size limit
        fields: 20, // Increase maximum number of fields
        files: 4 // Maximum number of files
    }
});

module.exports = {
    upload
};

