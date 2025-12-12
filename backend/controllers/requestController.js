const Request = require("../models/Request");
const Notification = require("../models/Notification");
const User = require("../models/user.model");

const ALLOWED_STATUSES = ["Pending", "Approved", "Completed"];
const ALLOWED_PRIORITIES = ["High", "Medium", "Low"];

const buildAttachmentPayload = (file) => {
  if (!file) return undefined;
  const base64Data = file.buffer ? file.buffer.toString("base64") : null;
  const url = base64Data ? `data:${file.mimetype};base64,${base64Data}` : undefined;
  return {
    filename: file.filename || file.originalname,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    url,
  };
};

const sanitizeStatus = (value) => {
  if (!value) return undefined;
  const candidate = value.toString().trim();
  if (ALLOWED_STATUSES.includes(candidate)) return candidate;
  return undefined;
};

const sanitizePriority = (value) => {
  if (!value) return undefined;
  const candidate = value.toString().trim();
  if (ALLOWED_PRIORITIES.includes(candidate)) return candidate;
  return undefined;
};

const escapeRegexValue = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const resolveRequestOwnerId = async (request) => {
  if (!request) return null;
  if (request.createdById) return request.createdById;
  const fallbackValue = (request.createdBy || "").trim();
  if (!fallbackValue) return null;
  const searchValue = escapeRegexValue(fallbackValue);
  const user = await User.findOne({
    $or: [
      { email: new RegExp(`^${searchValue}$`, "i") },
      { username: new RegExp(`^${searchValue}$`, "i") },
    ],
  }).select("_id");
  return user?._id || null;
};

const notifyStatuses = new Set(["Approved", "Completed"]);

const buildNotificationText = (request, status) => {
  const normalizedStatus = status.toLowerCase();
  const department = request.department || "request";
  return `Finance has ${normalizedStatus} your ${department} request.`;
};

const notifyRequestCreator = async (req, request, newStatus, previousStatus) => {
  if (!request || !notifyStatuses.has(newStatus)) return;
  if (previousStatus === newStatus) return;
  const ownerId = await resolveRequestOwnerId(request);
  if (!ownerId) return;

  const text = buildNotificationText(request, newStatus);

  try {
    const notification = new Notification({
      user: ownerId,
      text,
      type: "general",
      targetId: request._id,
    });
    await notification.save();

    const io = req.app.get("io");
    const connectedUsers = req.app.get("connectedUsers");
    const socketId = connectedUsers?.get?.(ownerId.toString());
    if (io && socketId) {
      io.to(socketId).emit("newNotification", {
        id: notification._id,
        text: notification.text,
        read: notification.read,
        type: notification.type,
        targetId: notification.targetId,
        createdAt: notification.createdAt,
      });
    }
  } catch (error) {
    console.error("Failed to notify request creator:", error);
  }
};

const parseDateValue = (value) => {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

exports.createRequest = async (req, res) => {
  try {
    const { department, details, priority, date, createdBy, createdById } = req.body;
    const normalizedDepartment = department?.toString().trim();
    const normalizedDetails = details?.toString().trim();
    const normalizedCreatedBy = createdBy?.toString().trim();
    if (!normalizedDepartment || !normalizedDetails || !normalizedCreatedBy) {
      return res
        .status(400)
        .json({ message: "Department, details, and submitted by fields are required." });
    }
    const payload = {
      department: normalizedDepartment,
      details: normalizedDetails,
      priority: sanitizePriority(priority) || "Medium",
      date: parseDateValue(date),
      createdBy: normalizedCreatedBy,
      createdById,
      status: sanitizeStatus(req.body.status) || "Pending",
      attachment: buildAttachmentPayload(req.file),
    };
    const request = await Request.create(payload);
    return res.status(201).json({ data: request });
  } catch (err) {
    console.error("createRequest failed:", err);
    return res.status(500).json({ message: "Failed to create request", error: err.message });
  }
};

exports.listRequests = async (req, res) => {
  try {
    const { department, priority, status, fromDate, toDate, createdBy } = req.query;
    const filter = {};
    if (department) filter.department = { $regex: new RegExp(`^${department.trim()}$`, "i") };
    if (priority && ALLOWED_PRIORITIES.includes(priority.trim())) {
      filter.priority = priority.trim();
    }
    if (status && ALLOWED_STATUSES.includes(status.trim())) {
      filter.status = status.trim();
    }
    if (createdBy) {
      filter.createdBy = { $regex: new RegExp(createdBy.trim(), "i") };
    }
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) {
        const parsedFrom = new Date(fromDate);
        if (!Number.isNaN(parsedFrom.getTime())) {
          filter.date.$gte = parsedFrom;
        }
      }
      if (toDate) {
        const parsedTo = new Date(toDate);
        if (!Number.isNaN(parsedTo.getTime())) {
          filter.date.$lte = parsedTo;
        }
      }
      if (Object.keys(filter.date).length === 0) {
        delete filter.date;
      }
    }
    const requests = await Request.find(filter).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ data: requests });
  } catch (err) {
    console.error("listRequests failed:", err);
    return res.status(500).json({ message: "Failed to list requests", error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const sanitizedStatus = sanitizeStatus(status);
    if (!sanitizedStatus) {
      return res.status(400).json({ message: "Invalid status provided" });
    }

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const previousStatus = request.status;
    if (previousStatus === sanitizedStatus) {
      return res.status(200).json({ data: request });
    }

    request.status = sanitizedStatus;
    const updated = await request.save();

    await notifyRequestCreator(req, updated, sanitizedStatus, previousStatus);

    return res.status(200).json({ data: updated });
  } catch (err) {
    console.error("updateStatus failed:", err);
    return res.status(500).json({ message: "Failed to update status", error: err.message });
  }
};
