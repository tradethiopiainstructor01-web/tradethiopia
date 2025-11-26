const express = require("express");
const {
  createTrainingFollowup,
  getTrainingFollowups,
  updateTrainingFollowup,
  deleteTrainingFollowup,
} = require("../controllers/trainingFollowupController");

const router = express.Router();

router.get("/", getTrainingFollowups);
router.post("/", createTrainingFollowup);
router.put("/:id", updateTrainingFollowup);
router.delete("/:id", deleteTrainingFollowup);

module.exports = router;
