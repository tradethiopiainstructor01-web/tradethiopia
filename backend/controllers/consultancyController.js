const Consultancy = require("../models/Consultancy");

const normalizeDocuments = (documents = {}) => ({
  businessPlan: Boolean(documents.businessPlan),
  financialStatements: Boolean(documents.financialStatements),
  companyProfile: Boolean(documents.companyProfile),
  licenses: Boolean(documents.licenses),
  productCatalog: Boolean(documents.productCatalog),
});

const normalizePayload = (payload = {}) => {
  const normalized = { ...payload };

  if (payload.employeeCount !== undefined && payload.employeeCount !== "") {
    const parsed = Number(payload.employeeCount);
    normalized.employeeCount = Number.isFinite(parsed) ? parsed : 0;
  } else {
    normalized.employeeCount = 0;
  }

  if (payload.startDate) {
    const parsedDate = new Date(payload.startDate);
    normalized.startDate = Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
  } else {
    normalized.startDate = undefined;
  }

  normalized.documents = normalizeDocuments(payload.documents);

  return normalized;
};

// Create Consultancy
const createConsultancy = async (req, res) => {
  try {
    const payload = normalizePayload(req.body);
    const doc = await Consultancy.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get consultancies
const getConsultancies = async (req, res) => {
  try {
    const {
      q,
      businessType,
      packageType,
      isOperational,
      sort = "desc",
      limit,
    } = req.query;

    const filter = {};

    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [
        { companyName: regex },
        { contactPerson: regex },
        { businessLocation: regex },
        { businessType: regex },
      ];
    }

    if (businessType) {
      filter.businessType = businessType;
    }

    if (packageType) {
      filter.packageType = packageType;
    }

    if (isOperational !== undefined) {
      if (isOperational === "true" || isOperational === "false") {
        filter.isOperational = isOperational === "true";
      }
    }

    const sortDir = sort === "asc" ? 1 : -1;
    const docs = Consultancy.find(filter).sort({ createdAt: sortDir });

    if (limit && Number(limit) > 0) {
      docs.limit(Number(limit));
    }

    const consultancies = await docs.lean();
    res.json(consultancies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update consultancy
const updateConsultancy = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = normalizePayload(req.body);
    const updated = await Consultancy.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ message: "Consultancy record not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete consultancy
const deleteConsultancy = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Consultancy.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Consultancy record not found" });
    }
    res.json({ message: "Consultancy record deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createConsultancy,
  getConsultancies,
  updateConsultancy,
  deleteConsultancy,
};
