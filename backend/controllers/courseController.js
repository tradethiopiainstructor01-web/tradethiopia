const asyncHandler = require('express-async-handler');
const Course = require('../models/Course');

// Fallback seed in case DB is empty to keep frontend dropdowns populated
const fallbackCourses = [
  { name: 'International Trade Import Export', price: 6917, category: 'Business', level: 'Intermediate' },
  { name: 'Stock Market Trading', price: 5500, category: 'Finance', level: 'Intermediate' },
  { name: 'Data Science', price: 2000, category: 'Technology', level: 'Beginner' },
  { name: 'Coffee Cupping', price: 29000, category: 'Food & Beverage', level: 'Intermediate' },
  { name: 'UI/UX Design', price: 1000, category: 'Design', level: 'Beginner' },
  { name: 'Digital Marketing', price: 800, category: 'Marketing', level: 'Beginner' },
  { name: 'Cybersecurity', price: 1800, category: 'Technology', level: 'Intermediate' },
  { name: 'DevOps Engineering', price: 2200, category: 'Technology', level: 'Intermediate' },
  { name: 'Cloud Computing', price: 2100, category: 'Technology', level: 'Intermediate' },
];

// GET /api/courses
const getCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ isActive: true }).sort({ createdAt: -1 });

  if (!courses || courses.length === 0) {
    return res.json(fallbackCourses.map((c, idx) => ({
      ...c,
      _id: `seed-${idx}`
    })));
  }

  res.json(courses);
});

// POST /api/courses
const createCourse = asyncHandler(async (req, res) => {
  const { name, description, price, category, level, duration, tags, isActive } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  const course = new Course({
    name,
    description,
    price,
    category,
    level,
    duration,
    tags,
    isActive
  });

  const created = await course.save();
  res.status(201).json(created);
});

// PUT /api/courses/:id
const updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const course = await Course.findById(id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  const fields = ['name', 'description', 'price', 'category', 'level', 'duration', 'tags', 'isActive'];
  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      course[field] = req.body[field];
    }
  });

  const updated = await course.save();
  res.json(updated);
});

// DELETE /api/courses/:id
const deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const course = await Course.findById(id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  await course.deleteOne();
  res.json({ message: 'Course removed' });
});

module.exports = {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse
};
