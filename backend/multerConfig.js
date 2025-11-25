// multerConfig.js
const multer = require('multer');
const path = require('path');

// Use memory storage for multer (files kept in memory for Appwrite upload)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
    const filetypes = {
        image: /jpeg|jpg|png|gif/,
        pdf: /pdf/,
    };

    if (file.fieldname === 'photo') {
        if (filetypes.image.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid image format. Only JPEG, PNG, and GIF are allowed.'));
        }
    }

    if (file.fieldname === 'guarantorFile') {
        if (filetypes.pdf.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file format. Only PDF is allowed.'));
        }
    }
};

// Initialize upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 9 * 1024 * 1024 }, // Limit file size to 9MB
    fileFilter: fileFilter
});

module.exports = upload;