const Package = require("../models/Package");
const Buyer = require("../models/Buyer");
const Seller = require("../models/Seller");

// Create
const createPackage = async (req, res) => {
  try {
    const { packageNumber, services, price, description } = req.body;
    if (!packageNumber || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ message: "Package number and at least one service are required." });
    }
    const pkg = new Package({ packageNumber, services, price, description });
    const saved = await pkg.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// List
const listPackages = async (_req, res) => {
  try {
    const pkgs = await Package.find().sort({ packageNumber: 1 });
    res.json(pkgs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get package by package number
const getPackageByNumber = async (req, res) => {
  try {
    const { packageNumber } = req.params;
    const pkg = await Package.findOne({ packageNumber: parseInt(packageNumber) });
    if (!pkg) {
      return res.status(404).json({ message: "Package not found" });
    }
    res.json(pkg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get package analytics for dashboard
const getPackageAnalytics = async (_req, res) => {
  try {
    // Get all packages
    const packages = await Package.find().sort({ packageNumber: 1 });
    
    // Get all buyers and sellers to analyze package usage
    const buyers = await Buyer.find({}, 'packageType');
    const sellers = await Seller.find({}, 'packageType');
    
    // Combine all customers
    const allCustomers = [...buyers, ...sellers];
    
    // Count package usage
    const packageCounts = {};
    allCustomers.forEach(customer => {
      if (customer.packageType) {
        packageCounts[customer.packageType] = (packageCounts[customer.packageType] || 0) + 1;
      }
    });
    
    // Create package distribution data
    const packageDistribution = packages.map(pkg => ({
      package: pkg.packageNumber.toString(),
      count: packageCounts[pkg.packageNumber] || 0,
      price: pkg.price
    }));
    
    // Calculate total revenue
    const totalRevenue = packageDistribution.reduce((total, pkg) => {
      return total + (pkg.count * pkg.price);
    }, 0);
    
    // Find most popular package
    const popularPackages = [...packageDistribution]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    res.json({
      packageDistribution,
      totalRevenue,
      popularPackages,
      totalCustomers: allCustomers.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update
const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { packageNumber, services, price, description } = req.body;
    if (!packageNumber || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ message: "Package number and at least one service are required." });
    }
    const updated = await Package.findByIdAndUpdate(
      id,
      { packageNumber, services, price, description },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Package not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete
const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Package.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Package not found" });
    res.json({ message: "Package deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createPackage,
  listPackages,
  getPackageByNumber,
  getPackageAnalytics,
  updatePackage,
  deletePackage,
};