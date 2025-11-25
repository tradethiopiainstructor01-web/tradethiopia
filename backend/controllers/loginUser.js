const express = require('express');
const { loginUser, protect } = require('../controllers/user.controller.js');

const router = express.Router();

// Login user
router.post('/login', loginUser);

// Example protected route
router.get('/protected', protect, (req, res) => {
    res.send('This is a protected route');
});

module.exports = router;