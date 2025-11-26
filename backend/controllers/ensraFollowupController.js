const EnsraFollowup = require("../models/EnsraFollowup");

// Create ENSRA follow-up
const createEnsraFollowup = async (req, res) => {
  try {
    const payload = { ...req.body };

    // Normalize comma-separated fields into arrays if strings are sent
    if (typeof payload.positionsOffered === "string") {
      payload.positionsOffered = payload.positionsOffered
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (typeof payload.jobSeekerSkills === "string") {
      payload.jobSeekerSkills = payload.jobSeekerSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const doc = await EnsraFollowup.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get ENSRA follow-ups with filtering/sorting
const getEnsraFollowups = async (req, res) => {
  try {
    const { q, type, sort = "asc" } = req.query;
    const filter = {};

    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [
        { companyName: regex },
        { jobSeekerName: regex },
      ];
    }

    if (type && type !== "all") {
      filter.type = type;
    }

    const sortDir = sort === "desc" ? -1 : 1;
    const followups = await EnsraFollowup.find(filter)
      .sort({ companyName: sortDir, jobSeekerName: sortDir })
      .lean();

    res.json(followups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update ENSRA follow-up
const updateEnsraFollowup = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };

    if (typeof payload.positionsOffered === "string") {
      payload.positionsOffered = payload.positionsOffered
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (typeof payload.jobSeekerSkills === "string") {
      payload.jobSeekerSkills = payload.jobSeekerSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const updated = await EnsraFollowup.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "ENSRA follow-up not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete ENSRA follow-up
const deleteEnsraFollowup = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await EnsraFollowup.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "ENSRA follow-up not found" });
    res.json({ message: "ENSRA follow-up deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createEnsraFollowup,
  getEnsraFollowups,
  updateEnsraFollowup,
  deleteEnsraFollowup,
};
