const Request = require("../models/Request");
const Notification = require("../models/Notification");
const User = require("../models/user.model");

const ALLOWED_STATUSES = ["Pending", "Approved", "Completed"];
const ALLOWED_PRIORITIES = ["High", "Medium", "Low"];
const EXEMPT_ROLE_SET = new Set(["finance", "admin"]);

const ROLE_DEPARTMENT_MAP = {
  admin: "Admin",
  finance: "Finance",
  hr: "HR",
  sales: "Sales",
  salesmanager: "Sales",
  salessupervisor: "Sales",
  customerservice: "Customer Success",
  customersuccess: "Customer Success",
  customersuccessmanager: "Customer Success",
  socialmediamanager: "Social Media",
  socialmedia: "Social Media",
  it: "IT",
  tetv: "TradexTV",
  tradex: "TradexTV",
  tradextv: "TradexTV",
  coo: "Operations",
  instructor: "Training",
  eventmanager: "Events",
};

const ROLE_DEPARTMENT_PATTERNS = [
  { regex: /finance/, department: "Finance" },
  { regex: /admin/, department: "Admin" },
  { regex: /sales/, department: "Sales" },
  { regex: /tradex/, department: "TradexTV" },
  { regex: /social/, department: "Social Media" },
  { regex: /customer/, department: "Customer Success" },
  { regex: /success/, department: "Customer Success" },
  { regex: /it/, department: "IT" },
  { regex: /hr/, department: "HR" },
];

const normalizeText = (value) => {
  const text = value?.toString().trim();
  return text || null;
};

const formatDepartmentFromTokens = (value) => {
  if (!value) return null;
  return value
    .split(/[\s_-]+/)
    .map((segment) => {
      const cleaned = segment.toLowerCase();
      return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : "";
    })
    .filter(Boolean)
    .join(" ");
};

const mapRoleToDepartment = (role) => {
  const normalizedRole = normalizeText(role)?.toLowerCase();
  if (!normalizedRole) return null;
  if (ROLE_DEPARTMENT_MAP[normalizedRole]) {
    return ROLE_DEPARTMENT_MAP[normalizedRole];
  }
  for (const entry of ROLE_DEPARTMENT_PATTERNS) {
    if (entry.regex.test(normalizedRole)) {
      return entry.department;
    }
  }
  return formatDepartmentFromTokens(normalizedRole) || null;
};

const getUserDepartment = (user) => {
  if (!user) return null;
  const profileDept = normalizeText(user.department);
  if (profileDept) return profileDept;
  const fallbackFromRole = mapRoleToDepartment(user.role);
  if (fallbackFromRole) return fallbackFromRole;
  if (user.jobTitle) {
    return formatDepartmentFromTokens(user.jobTitle);
  }
  return null;
};

const isFinanceOrAdmin = (user) => {
  const normalizedRole = normalizeText(user?.role)?.toLowerCase();
  return normalizedRole ? EXEMPT_ROLE_SET.has(normalizedRole) : false;
};

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
    const { details, priority, date } = req.body;
    const normalizedDetails = details?.toString().trim();
    if (!normalizedDetails) {
      return res.status(400).json({ message: "Details are required." });
    }
    const userDepartment = getUserDepartment(req.user);
    if (!userDepartment) {
      return res.status(400).json({ message: "Unable to determine your department." });
    }
    const payload = {
      department: userDepartment,
      details: normalizedDetails,
      priority: sanitizePriority(priority) || "Medium",
      date: parseDateValue(date),
      createdBy: req.user?.fullName || req.user?.username || req.user?.email || "Unknown user",
      createdById: req.user?._id || null,
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
    const userDepartment = getUserDepartment(req.user);
    const userIsPrivileged = isFinanceOrAdmin(req.user);
    if (!userIsPrivileged) {
      if (!userDepartment) {
        return res.status(403).json({ message: "Unable to determine your department." });
      }
      filter.department = { $regex: new RegExp(`^${escapeRegexValue(userDepartment)}$`, "i") };
    } else if (department) {
      filter.department = { $regex: new RegExp(`^${department.trim()}$`, "i") };
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
