const SavedMatch = require('../models/SavedMatch');

// Save a match
const saveMatch = async (req, res) => {
  try {
    const {
      buyerId,
      sellerId,
      buyerName,
      sellerName,
      matchingProducts,
      matchingCriteria,
      matchReasons,
      score,
      industryMatch,
      countryMatch,
      notes,
      savedBy
    } = req.body;

    // Check if this match is already saved by this user
    const existingMatch = await SavedMatch.findOne({ buyerId, sellerId, savedBy });
    if (existingMatch) {
      return res.status(400).json({ error: 'This match is already saved.' });
    }

    const savedMatch = new SavedMatch({
      buyerId,
      sellerId,
      buyerName,
      sellerName,
      matchingProducts,
      matchingCriteria,
      matchReasons,
      score,
      industryMatch,
      countryMatch,
      notes,
      savedBy
    });

    await savedMatch.save();
    res.status(201).json(savedMatch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all saved matches for a user
const getSavedMatches = async (req, res) => {
  try {
    const { savedBy, status } = req.query;
    let filter = { savedBy };
    
    if (status) {
      filter.status = status;
    }

    const savedMatches = await SavedMatch.find(filter).sort({ createdAt: -1 });
    res.status(200).json(savedMatches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a specific saved match
const getSavedMatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const savedMatch = await SavedMatch.findById(id);
    
    if (!savedMatch) {
      return res.status(404).json({ error: 'Saved match not found' });
    }
    
    res.status(200).json(savedMatch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a saved match
const updateSavedMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, status } = req.body;

    const savedMatch = await SavedMatch.findByIdAndUpdate(
      id,
      { notes, status },
      { new: true, runValidators: true }
    );

    if (!savedMatch) {
      return res.status(404).json({ error: 'Saved match not found' });
    }

    res.status(200).json(savedMatch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a saved match
const deleteSavedMatch = async (req, res) => {
  try {
    const { id } = req.params;

    const savedMatch = await SavedMatch.findByIdAndDelete(id);

    if (!savedMatch) {
      return res.status(404).json({ error: 'Saved match not found' });
    }

    res.status(200).json({ message: 'Saved match deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Clear all matches (mark as archived)
const clearAllMatches = async (req, res) => {
  try {
    const { savedBy } = req.body;
    
    // Mark all matches as archived for this user
    const result = await SavedMatch.updateMany(
      { savedBy, status: 'Active' },
      { status: 'Archived' }
    );
    
    res.status(200).json({ 
      message: `Cleared ${result.modifiedCount} matches`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  saveMatch,
  getSavedMatches,
  getSavedMatchById,
  updateSavedMatch,
  deleteSavedMatch,
  clearAllMatches
};