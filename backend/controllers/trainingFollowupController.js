const TrainingFollowup = require("../models/TrainingFollowup");

// Create Training follow-up
const createTrainingFollowup = async (req, res) => {
  try {
    const doc = await TrainingFollowup.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get Training follow-ups with basic filtering/sorting
const getTrainingFollowups = async (req, res) => {
  try {
    const { q, progress, sort = "asc" } = req.query;
    const filter = {};

    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [
        { customerName: regex },
        { agentName: regex },
        { email: regex },
      ];
    }

    if (progress && progress !== "all") {
      filter.progress = progress;
    }

    const sortDir = sort === "desc" ? -1 : 1;

    const followups = await TrainingFollowup.find(filter)
      .sort({ customerName: sortDir })
      .lean();

    res.json(followups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Training follow-up
const updateTrainingFollowup = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await TrainingFollowup.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Training follow-up not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete Training follow-up
const deleteTrainingFollowup = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await TrainingFollowup.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Training follow-up not found" });
    res.json({ message: "Training follow-up deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createTrainingFollowup,
  getTrainingFollowups,
  updateTrainingFollowup,
  deleteTrainingFollowup,
};
