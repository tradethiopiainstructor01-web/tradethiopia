const Package = require("../models/Package");

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
  updatePackage,
  deletePackage,
};
