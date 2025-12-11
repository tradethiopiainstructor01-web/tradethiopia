const express = require("express");
const router = express.Router();
const socialRequestController = require("../controllers/socialRequestController");

router.get("/", socialRequestController.listRequests);
router.post("/", socialRequestController.createRequest);

module.exports = router;
