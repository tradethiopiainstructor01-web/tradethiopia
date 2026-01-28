const ContentTrackerEntry = require('../models/ContentTrackerEntry');

const ALLOWED_TYPES = new Set(['Video', 'Graphics', 'Live Session', 'Testimonial']);

exports.getEntries = async (req, res) => {
  try {
    const query = {};
    if (req.query.type && ALLOWED_TYPES.has(req.query.type)) {
      query.type = req.query.type;
    }

    if (req.query.approved === 'true' || req.query.approved === 'false') {
      query.approved = req.query.approved === 'true';
    }

    if (req.query.date) {
      const parsedDate = new Date(req.query.date);
      if (!isNaN(parsedDate.getTime())) {
        const startOfDay = new Date(parsedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(parsedDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.date = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    const entries = await ContentTrackerEntry.find(query)
      .sort({ date: -1 })
      .populate('createdBy', 'firstName lastName email');

    res.json({ success: true, data: entries });
  } catch (error) {
    console.error('ContentTrackerController.getEntries', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEntryById = async (req, res) => {
  try {
    const entry = await ContentTrackerEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Content entry not found' });
    }
    res.json({ success: true, data: entry });
  } catch (error) {
    console.error('ContentTrackerController.getEntryById', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createEntry = async (req, res) => {
  try {
    const { title, description = '', type = 'Video', link = '', approved = false, date } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    if (type && !ALLOWED_TYPES.has(type)) {
      return res.status(400).json({ success: false, message: `Type must be one of ${Array.from(ALLOWED_TYPES).join(', ')}` });
    }

    const entry = await ContentTrackerEntry.create({
      title,
      description,
      type,
      link,
      approved,
      date: date ? new Date(date) : undefined,
      createdBy: req.user ? req.user._id : undefined,
    });

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    console.error('ContentTrackerController.createEntry', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEntry = async (req, res) => {
  try {
    const entry = await ContentTrackerEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Content entry not found' });
    }

    const updatableFields = ['title', 'description', 'type', 'link', 'approved', 'date'];
    updatableFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        if (field === 'type' && req.body.type && !ALLOWED_TYPES.has(req.body.type)) {
          throw new Error(`Type must be one of ${Array.from(ALLOWED_TYPES).join(', ')}`);
        }
        entry[field] = req.body[field];
      }
    });

    await entry.save();
    res.json({ success: true, data: entry });
  } catch (error) {
    console.error('ContentTrackerController.updateEntry', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update entry' });
  }
};

exports.deleteEntry = async (req, res) => {
  try {
    const entry = await ContentTrackerEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Content entry not found' });
    }

    await entry.remove();
    res.json({ success: true, message: 'Entry deleted' });
  } catch (error) {
    console.error('ContentTrackerController.deleteEntry', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
