const Item = require("../models/Item.js");
const path = require("path");
// Note: asyncWrapper is not available in CommonJS, so we'll remove it
// const { asyncWrapper } = require("../middleware/asyncWrapper.js");

// Get all items
const getItems = async (req, res) => {
  try {
    const items = await Item.find();
    res.status(200).json({ items });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// Add a new item
const addItem = async (req, res) => {
  try {
    const { name } = req.body;
    const file = req.file.path;
    const item = await Item.create({ name, file });
    res.status(201).json({ item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Download a file associated with an item
const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ error: "No item found" });
    }
    const file = item.file;
    const filePath = path.join(__dirname, `../${file}`);
    res.download(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getItems, addItem, downloadFile };