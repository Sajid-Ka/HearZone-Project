const multer = require('multer');
const path = require('path');
const fs = require('fs');

const productImagesDir = path.join(
  __dirname,
  '../public/uploads/product-images'
);
const tempDir = path.join(__dirname, '../public/uploads/temp');
const reImageDir = path.join(__dirname, '../public/uploads/re-image');
const profileImagesDir = path.join(
  __dirname,
  '../public/uploads/profile-images'
);

[tempDir, productImagesDir, reImageDir, profileImagesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    fieldSize: 20 * 1024 * 1024,
    fields: 20,
    files: 4
  }
});

module.exports = {
  upload
};
