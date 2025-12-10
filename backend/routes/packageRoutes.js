const express = require("express");
const { createPackage, listPackages, getPackageByNumber, getPackageAnalytics, updatePackage, deletePackage } = require("../controllers/packageController");

const router = express.Router();

router.get("/", listPackages);
router.get("/analytics", getPackageAnalytics);
router.get("/:packageNumber", getPackageByNumber);
router.post("/", createPackage);
router.put("/:id", updatePackage);
router.delete("/:id", deletePackage);

module.exports = router;