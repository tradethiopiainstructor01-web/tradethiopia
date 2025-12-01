const express = require("express");
const { createPackage, listPackages, updatePackage, deletePackage } = require("../controllers/packageController");

const router = express.Router();

router.get("/", listPackages);
router.post("/", createPackage);
router.put("/:id", updatePackage);
router.delete("/:id", deletePackage);

module.exports = router;
