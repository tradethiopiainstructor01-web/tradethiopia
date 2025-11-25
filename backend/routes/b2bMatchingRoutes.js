const express = require('express');
const {
  matchBuyersAndSellers,
  getTopMatchesForBuyer,
  getTopMatchesForSeller
} = require('../controllers/b2bMatchingController');

const router = express.Router();

// Get matches for buyers and sellers
router.post('/match', matchBuyersAndSellers);

// Get top matches for a specific buyer
router.get('/match/buyer/:buyerId', getTopMatchesForBuyer);

// Get top matches for a specific seller
router.get('/match/seller/:sellerId', getTopMatchesForSeller);

module.exports = router;