const asyncHandler = require('express-async-handler');
const ExternalCourse = require('../models/ExternalCourse');

const fallbackExternalCourses = [
  { name: 'Coffee Cupping', price: 0, category: 'External', isActive: true },
  { name: 'International Trade Import Export', price: 0, category: 'External', isActive: true },
  { name: 'TradeEthiopia Business TV & Radio', price: 0, category: 'External', isActive: true },
  { name: 'Digital Marketing for International Trade', price: 0, category: 'External', isActive: true },
  { name: 'International Trade Brokerage', price: 0, category: 'External', isActive: true },
];

const getExternalCourses = asyncHandler(async (_req, res) => {
  const courses = await ExternalCourse.find().sort({ createdAt: -1 });
  if (!courses.length) {
    return res.json(
      fallbackExternalCourses.map((course, index) => ({
        ...course,
        _id: `external-seed-${index}`
      }))
    );
  }
  res.json(courses);
});

const createExternalCourse = asyncHandler(async (req, res) => {
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

  const created = await ExternalCourse.create({
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

const updateExternalCourse = asyncHandler(async (req, res) => {
  const course = await ExternalCourse.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ message: 'External course not found' });
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

const deleteExternalCourse = asyncHandler(async (req, res) => {
  const course = await ExternalCourse.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ message: 'External course not found' });
  }

  await course.deleteOne();
  res.json({ message: 'External course removed' });
});

module.exports = {
  getExternalCourses,
  createExternalCourse,
  updateExternalCourse,
  deleteExternalCourse
};
