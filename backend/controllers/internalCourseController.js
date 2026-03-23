const asyncHandler = require('express-async-handler');
const InternalCourse = require('../models/InternalCourse');

const getInternalCourses = asyncHandler(async (_req, res) => {
  const courses = await InternalCourse.find().sort({ createdAt: -1 });
  res.json(courses);
});

const createInternalCourse = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    overview,
    price,
    category,
    level,
    duration,
    tags,
    isActive
  } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  const created = await InternalCourse.create({
    name,
    description,
    overview,
    price,
    category,
    level,
    duration,
    tags,
    isActive
  });

  res.status(201).json(created);
});

const updateInternalCourse = asyncHandler(async (req, res) => {
  const course = await InternalCourse.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ message: 'Internal course not found' });
  }

  [
    'name',
    'description',
    'overview',
    'price',
    'category',
    'level',
    'duration',
    'tags',
    'isActive'
  ].forEach((field) => {
    if (req.body[field] !== undefined) {
      course[field] = req.body[field];
    }
  });

  const updated = await course.save();
  res.json(updated);
});

const deleteInternalCourse = asyncHandler(async (req, res) => {
  const course = await InternalCourse.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ message: 'Internal course not found' });
  }

  await course.deleteOne();
  res.json({ message: 'Internal course removed' });
});

module.exports = {
  getInternalCourses,
  createInternalCourse,
  updateInternalCourse,
  deleteInternalCourse
};
