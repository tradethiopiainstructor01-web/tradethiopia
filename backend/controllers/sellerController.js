const Seller = require('../models/Seller');

// Create a new seller
const createSeller = async (req, res) => {
  try {
    const { companyName, contactPerson, email, phoneNumber, country, industry, products, certifications, packageType } = req.body;

    // Check if the email already exists
    const existingSeller = await Seller.findOne({ email });
    if (existingSeller) {
      return res.status(400).json({ error: 'A seller with this email already exists.' });
    }

    const seller = new Seller({
      companyName,
      contactPerson,
      email,
      phoneNumber,
      country,
      industry,
      products,
      certifications,
      packageType,
    });

    await seller.save();
    res.status(201).json(seller);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all sellers
const getAllSellers = async (req, res) => {
  try {
    const sellers = await Seller.find();
    res.status(200).json(sellers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a seller by ID
const getSellerById = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await Seller.findById(id);
    
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    res.status(200).json(seller);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a seller
const updateSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, contactPerson, email, phoneNumber, country, industry, products, certifications, packageType } = req.body;

    // Check if the email is being changed and if it already exists
    const existingSeller = await Seller.findOne({ email, _id: { $ne: id } });
    if (existingSeller) {
      return res.status(400).json({ error: 'A seller with this email already exists.' });
    }

    const seller = await Seller.findByIdAndUpdate(
      id,
      { companyName, contactPerson, email, phoneNumber, country, industry, products, certifications, packageType },
      { new: true, runValidators: true }
    );

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    res.status(200).json(seller);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a seller
const deleteSeller = async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await Seller.findByIdAndDelete(id);

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    res.status(200).json({ message: 'Seller deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get sellers by industry
const getSellersByIndustry = async (req, res) => {
  try {
    const { industry } = req.params;
    const sellers = await Seller.find({ industry: new RegExp(industry, 'i') });
    res.status(200).json(sellers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a package to a seller
const addPackageToSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { packageName, packageType, purchaseDate, expiryDate, status } = req.body;

    const seller = await Seller.findById(id);
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    const newPackage = {
      packageName,
      packageType,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      status: status || 'Active'
    };

    seller.packages.push(newPackage);
    await seller.save();

    res.status(200).json(seller);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a package for a seller
const updateSellerPackage = async (req, res) => {
  try {
    const { id, packageId } = req.params;
    const { packageName, packageType, purchaseDate, expiryDate, status } = req.body;

    const seller = await Seller.findById(id);
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    const packageIndex = seller.packages.findIndex(pkg => pkg._id.toString() === packageId);
    if (packageIndex === -1) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Update package fields if provided
    if (packageName) seller.packages[packageIndex].packageName = packageName;
    if (packageType) seller.packages[packageIndex].packageType = packageType;
    if (purchaseDate) seller.packages[packageIndex].purchaseDate = new Date(purchaseDate);
    if (expiryDate) seller.packages[packageIndex].expiryDate = new Date(expiryDate);
    if (status) seller.packages[packageIndex].status = status;

    await seller.save();

    res.status(200).json(seller);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Remove a package from a seller
const removeSellerPackage = async (req, res) => {
  try {
    const { id, packageId } = req.params;

    const seller = await Seller.findById(id);
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    seller.packages = seller.packages.filter(pkg => pkg._id.toString() !== packageId);
    await seller.save();

    res.status(200).json(seller);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createSeller,
  getAllSellers,
  getSellerById,
  updateSeller,
  deleteSeller,
  getSellersByIndustry,
  addPackageToSeller,
  updateSellerPackage,
  removeSellerPackage
};