const SocialRequest = require("../models/SocialRequest");

const DEFAULT_DEPARTMENT = "Social Media";

const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

exports.createRequest = async (req, res) => {
  try {
  const {
    title,
    platform,
    requestType,
    priority,
    details,
    dueDate,
    requestedBy,
    requestedById,
    department,
  } = req.body;

  const normalizedDepartment = (department || DEFAULT_DEPARTMENT).trim();
  const normalizedTitle = title?.trim();

  if (!normalizedTitle || !normalizedDepartment) {
    return res.status(400).json({ message: "Title and department are required" });
  }

  const referenceDate = dueDate ? new Date(dueDate) : new Date();
  const weekNumber = getWeekNumber(referenceDate);
  const year = referenceDate.getFullYear();
  const month = referenceDate.toLocaleString("en-US", { month: "short" });

  const payload = {
    title: normalizedTitle,
    platform,
    department: normalizedDepartment,
    requestType: requestType || "General",
    priority: priority || "Medium",
    details,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    requestedBy,
    requestedById,
    weekNumber,
    month,
    year,
  };

    const request = await SocialRequest.create(payload);
    return res.status(201).json({ data: request });
  } catch (err) {
    console.error("Failed to create social request:", err);
    return res.status(500).json({ message: "Failed to create social request", error: err.message });
  }
};

exports.listRequests = async (_req, res) => {
  try {
    const filter = {};
    const { department, month, year } = req.query;
    if (department) {
      const normalized = department.trim();
      if (normalized) {
        filter.department = { $regex: new RegExp(`^${normalized}$`, "i") };
      }
    }
    if (month) filter.month = month;
    if (year) filter.year = Number(year);
    const requests = await SocialRequest.find(filter).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ data: requests });
  } catch (err) {
    console.error("Failed to list social requests:", err);
    return res.status(500).json({ message: "Failed to list social requests", error: err.message });
  }
};
