const ITTask = require('../models/ITTask');
const ITReport = require('../models/ITReport');

// Create new IT task
const createTask = async (req, res) => {
  try {
    const data = req.body;
    // Handle multiple assignees
    if (data.assignedTo && typeof data.assignedTo === 'string') {
      data.assignedTo = [data.assignedTo];
    }
    
    // Ensure status defaults to 'pending' if not provided
    if (!data.status) {
      data.status = 'pending';
    }
    
    // Handle category for external tasks (ensure it's a string)
    if (data.projectType === 'external' && data.category) {
      // If category is an array, join it into a comma-separated string
      if (Array.isArray(data.category)) {
        data.category = data.category.join(', ');
      }
      // Ensure category is a string
      data.category = String(data.category);
    }
    
    // Handle platform for internal tasks (ensure it's a string)
    if (data.projectType === 'internal' && data.platform) {
      // If platform is an array, join it into a comma-separated string
      if (Array.isArray(data.platform)) {
        data.platform = data.platform.join(', ');
      }
      // Ensure platform is a string
      data.platform = String(data.platform);
    }
    
    // Handle actionType for both internal and external tasks
    if (data.actionType) {
      if (data.projectType === 'internal') {
        // Always store internal action types as a comma separated string
        const actionValues = Array.isArray(data.actionType)
          ? data.actionType
          : data.actionType.split(',').map(item => item.trim());
        data.actionType = actionValues.filter(Boolean).join(', ');
      } else {
        // For external tasks keep only the first selection
        if (Array.isArray(data.actionType)) {
          data.actionType = data.actionType[0] || '';
        } else {
          data.actionType = String(data.actionType);
        }
      }
    }
    
    // Handle featureCount
    if (data.featureCount !== undefined) {
      data.featureCount = Number(data.featureCount);
    }
    
    const task = new ITTask({ ...data, createdBy: req.user && req.user.id });
    await task.save();
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error('createTask error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get tasks (optional query: projectType=internal|external)
const getTasks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.projectType) filter.projectType = req.query.projectType;
    const tasks = await ITTask.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('getTasks error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await ITTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('getTaskById error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    // Handle featureCount if present in request body
    const updateData = { ...req.body };
    if (updateData.featureCount !== undefined) {
      updateData.featureCount = Number(updateData.featureCount);
    }

    if (updateData.actionType !== undefined) {
      if (Array.isArray(updateData.actionType)) {
        if (updateData.projectType === 'external') {
          updateData.actionType = updateData.actionType[0] || '';
        } else {
          updateData.actionType = updateData.actionType.filter(Boolean).join(', ');
        }
      } else if (typeof updateData.actionType === 'string') {
        if (updateData.projectType === 'external') {
          updateData.actionType = updateData.actionType.trim();
        } else {
          updateData.actionType = updateData.actionType
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
            .join(', ');
        }
      } else {
        updateData.actionType = String(updateData.actionType);
      }
    }
    
    const updated = await ITTask.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Task not found' });

    // If status changed to Completed, generate report
    if (req.body.status && req.body.status === 'done') {
      try {
        const report = new ITReport({
          projectName: updated.projectType === 'internal' ? updated.platform || updated.client : updated.client || updated.category,
          projectType: updated.projectType,
          actionType: updated.actionType,
          taskName: updated.taskName,
          description: updated.description,
          attachments: updated.attachments,
          startDate: updated.startDate,
          endDate: updated.endDate,
          status: updated.status,
          completionDate: new Date(),
          personnelName: updated.assignedTo, // Use assignedTo for personnel names
          taskRef: updated._id,
          points: updated.featureCount || 1 // Use featureCount as points, default to 1 if not set
        });
        await report.save();
      } catch (err) {
        console.error('report generation failed', err);
      }
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('updateTask error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const deleted = await ITTask.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    console.error('deleteTask error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reports
const getReports = async (req, res) => {
  try {
    const q = {};
    if (req.query.projectType) q.projectType = req.query.projectType;
    const reports = await ITReport.find(q).sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('getReports error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getReportById = async (req, res) => {
  try {
    const report = await ITReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('getReportById error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateReport = async (req, res) => {
  try {
    const updateData = { ...req.body };
    // Handle points if present in request body
    if (updateData.points !== undefined) {
      updateData.points = Number(updateData.points);
    }
    
    // Try to find by _id first, then by reportId
    let updated = await ITReport.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) {
      // If not found by _id, try by reportId
      updated = await ITReport.findOneAndUpdate({ reportId: req.params.id }, updateData, { new: true });
    }
    if (!updated) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('updateReport error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new IT report
const createReport = async (req, res) => {
  try {
    const data = req.body;
    // Handle personnelName as array if it's a string
    if (data.personnelName && typeof data.personnelName === 'string') {
      data.personnelName = [data.personnelName];
    }
    
    const report = new ITReport(data);
    await report.save();
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    console.error('createReport error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getReports,
  getReportById,
  updateReport,
  createReport
};
