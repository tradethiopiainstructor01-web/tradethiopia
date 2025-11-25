const Subcategory = require('../models/Subcategory.js');
const AssetCategory = require('../models/AssetCategory.js');

// Create a new subcategory
const createSubcategory = async (req, res) => {
  try {
    const { name, description, assetCategoryId } = req.body;

    if (!name || !description || !assetCategoryId) {
      return res.status(400).json({ message: 'Name, description, and asset category are required' });
    }

    const assetCategory = await AssetCategory.findById(assetCategoryId);
    if (!assetCategory) {
      return res.status(404).json({ message: 'Asset category not found' });
    }

    const newSubcategory = new Subcategory({
      name,
      description,
      assetCategory: assetCategoryId,
    });
    await newSubcategory.save();

    res.status(201).json(newSubcategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get all subcategories for a specific asset category
const getSubcategoriesByCategory = async (req, res) => {
  try {
    const subcategories = await Subcategory.find({ assetCategory: req.params.assetCategoryId }).populate('assetCategory');
    res.status(200).json(subcategories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  createSubcategory,
  getSubcategoriesByCategory
};