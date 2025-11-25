const path = require('path');

// Handles file upload
const handleFileUpload = (req, res) => {
    if (!req.files) {
        return res.status(400).json({ message: 'No files were uploaded.' });
    }

    const files = {
        photo: req.files.photo ? req.files.photo[0].path : null,
        guarantorFile: req.files.guarantorFile ? req.files.guarantorFile[0].path : null,
    };

    res.status(200).json({ message: 'Files uploaded successfully', files });
};

module.exports = {
  handleFileUpload
};