const File = require('../models/File.js');
const multer = require('multer');
const path = require('path');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });

// Upload file handler
const uploadFile = (req, res) => {
    const newFile = new File({
        filename: req.file.originalname,
        filetype: req.file.mimetype,
    });

    newFile.save()
        .then(() => res.status(200).json({ message: 'File uploaded successfully!' }))
        .catch(err => res.status(500).json({ error: err.message }));
};

// Get all files
const getFiles = async (req, res) => {
    try {
        const files = await File.find();
        res.status(200).json(files);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Download file handler
const downloadFile = (req, res) => {
    const fileId = req.params.id;

    File.findById(fileId, (err, file) => {
        if (err || !file) {
            return res.status(404).send('File not found');
        }
        res.download(path.join(process.cwd(), 'uploads', file.filename)); // Use process.cwd() for better compatibility
    });
};

module.exports = {
    upload,
    uploadFile,
    getFiles,
    downloadFile,
};