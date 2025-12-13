const express = require("express");
const multer = require("multer");
const requestController = require("../controllers/requestController");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per attachment
});

router.get("/", requestController.listRequests);
router.post("/", upload.single("attachment"), requestController.createRequest);
router.patch("/:id/status", requestController.updateStatus);

module.exports = router;
