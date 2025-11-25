const express = require("express");
const followupController = require("../controllers/followupController.js");

const router = express.Router();

// Get customer report for customer service users
router.get("/report", followupController.getCustomerReport);

// Get customer stats (must come before /:id)
router.get("/stats", followupController.getCustomerStats);

// Get all B2B customers that are not yet in follow-up system
router.get("/b2b-pending", followupController.getPendingB2BCustomers);

// Import B2B customers to follow-up system
router.post("/import-b2b", followupController.importB2BCustomers);

// Get all follow-ups
router.get("/", followupController.getFollowups);

// Create a new follow-up
router.post("/", followupController.createFollowup);

// Update a follow-up
router.put("/:id", followupController.updateFollowup);

// Delete a follow-up
router.delete("/:id", followupController.deleteFollowup);

// Add a note to a follow-up
router.post("/:id/notes", followupController.addNote);

// Update lastCalled for a specific follow-up
router.patch("/:id/lastCalled", followupController.updateLastCalled);

// Update Service Provided and Service Not Provided
router.patch("/:id/services", followupController.updateServices);

// Edit customer information
router.patch("/:id/edit", followupController.editCustomer);

// Get a follow-up by ID (must come last)
router.get("/:id", followupController.getFollowupById);

module.exports = router;