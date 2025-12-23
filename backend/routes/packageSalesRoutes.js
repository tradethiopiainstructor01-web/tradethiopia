const express = require('express');
const { getPackageSales } = require('../controllers/packageSalesController');

const router = express.Router();

router.get('/', getPackageSales);

module.exports = router;
