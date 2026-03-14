const asyncHandler = require('express-async-handler');
const Course = require('../models/Course');
const { storage } = require('../config/appwriteClient');
const { File } = require('node-fetch-native-with-agent');

const appwriteBucketId = process.env.APPWRITE_BUCKET_ID || '68de2cd2000edc9d02c9';
const appwriteProjectId = process.env.APPWRITE_PROJECT_ID || '66fa8216001614a2f7cd';

const buildAppwriteViewUrl = (fileId) =>
  `https://cloud.appwrite.io/v1/storage/buckets/${appwriteBucketId}/files/${fileId}/view?project=${appwriteProjectId}`;

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
  const {
    name,
    description,
    overview,
    price,
    passPercentage,
    category,
    level,
    duration,
    tags,
    isActive,
    status,
    draftSavedAt,
    publishedAt
  } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  const course = new Course({
    name,
    description,
    overview,
    price,
    passPercentage,
    category,
    level,
    duration,
    tags,
    isActive,
    status: status || 'draft',
    draftSavedAt: draftSavedAt || (status !== 'published' ? new Date() : null),
    publishedAt: status === 'published' ? (publishedAt || new Date()) : null
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

  const fields = [
    'name',
    'description',
    'overview',
    'price',
    'passPercentage',
    'category',
    'level',
    'duration',
    'tags',
    'isActive',
    'status',
    'draftSavedAt',
    'publishedAt'
  ];
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

// POST /api/courses/slide-image
const uploadCourseSlideImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Slide image is required' });
  }

  const fileName = `${Date.now()}-${req.file.originalname}`;
  const file = new File([req.file.buffer], fileName, { type: req.file.mimetype });
  const uploadedFile = await storage.createFile({
    bucketId: appwriteBucketId,
    fileId: 'unique()',
    file
  });

  res.status(201).json({
    fileId: uploadedFile.$id,
    imageUrl: buildAppwriteViewUrl(uploadedFile.$id)
  });
});

// POST /api/courses/:id/slides
const addCourseSlide = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, body, materialUrl, imageUrl, imageFileId } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Slide title is required' });
  }

  const course = await Course.findById(id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  let resolvedImageUrl = imageUrl || '';
  let resolvedImageFileId = imageFileId || '';

  if (req.file) {
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const file = new File([req.file.buffer], fileName, { type: req.file.mimetype });
    const uploadedFile = await storage.createFile({
      bucketId: appwriteBucketId,
      fileId: 'unique()',
      file
    });

    resolvedImageUrl = buildAppwriteViewUrl(uploadedFile.$id);
    resolvedImageFileId = uploadedFile.$id;
  }

  if (!resolvedImageUrl) {
    return res.status(400).json({ message: 'Slide image is required' });
  }

  const slideNumber = course.slides.length + 1;

  course.slides.push({
    slideNumber,
    title,
    body: body || '',
    materialUrl: materialUrl || '',
    imageFileId: resolvedImageFileId,
    imageUrl: resolvedImageUrl
  });

  await course.save();

  res.status(201).json({
    message: 'Slide added successfully',
    course
  });
});

// PUT /api/courses/:id/slides/:slideId
const updateCourseSlide = asyncHandler(async (req, res) => {
  const { id, slideId } = req.params;
  const { title, body, materialUrl, imageUrl, imageFileId } = req.body;

  const course = await Course.findById(id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  const slide = course.slides.id(slideId);
  if (!slide) {
    return res.status(404).json({ message: 'Slide not found' });
  }

  if (title !== undefined) {
    slide.title = title;
  }
  if (body !== undefined) {
    slide.body = body || '';
  }
  if (materialUrl !== undefined) {
    slide.materialUrl = materialUrl || '';
  }
  if (imageUrl !== undefined && imageUrl) {
    slide.imageUrl = imageUrl;
  }
  if (imageFileId !== undefined && imageFileId) {
    slide.imageFileId = imageFileId;
  }

  await course.save();

  res.json({
    message: 'Slide updated successfully',
    course
  });
});

// POST /api/courses/:id/questions
const addCourseQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { question, options, correctAnswer, explanation } = req.body;

  if (!question) {
    return res.status(400).json({ message: 'Question is required' });
  }

  const normalizedOptions = Array.isArray(options) ? options.filter((option) => option !== undefined && option !== null && String(option).trim()) : [];
  if (normalizedOptions.length < 2) {
    return res.status(400).json({ message: 'At least two options are required' });
  }

  const course = await Course.findById(id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  course.quizQuestions.push({
    questionNumber: course.quizQuestions.length + 1,
    question,
    options: normalizedOptions,
    correctAnswer: Number(correctAnswer) || 0,
    explanation: explanation || ''
  });

  await course.save();

  res.status(201).json({
    message: 'Question added successfully',
    course
  });
});

// PUT /api/courses/:id/questions/:questionId
const updateCourseQuestion = asyncHandler(async (req, res) => {
  const { id, questionId } = req.params;
  const { question, options, correctAnswer, explanation } = req.body;

  const course = await Course.findById(id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  const quizQuestion = course.quizQuestions.id(questionId);
  if (!quizQuestion) {
    return res.status(404).json({ message: 'Question not found' });
  }

  const normalizedOptions = Array.isArray(options) ? options.filter((option) => option !== undefined && option !== null && String(option).trim()) : [];
  if (question !== undefined) {
    quizQuestion.question = question;
  }
  if (normalizedOptions.length >= 2) {
    quizQuestion.options = normalizedOptions;
  }
  if (correctAnswer !== undefined) {
    quizQuestion.correctAnswer = Number(correctAnswer) || 0;
  }
  if (explanation !== undefined) {
    quizQuestion.explanation = explanation || '';
  }

  await course.save();

  res.json({
    message: 'Question updated successfully',
    course
  });
});

// DELETE /api/courses/:id/questions/:questionId
const deleteCourseQuestion = asyncHandler(async (req, res) => {
  const { id, questionId } = req.params;
  const course = await Course.findById(id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  const quizQuestion = course.quizQuestions.id(questionId);
  if (!quizQuestion) {
    return res.status(404).json({ message: 'Question not found' });
  }

  quizQuestion.deleteOne();
  course.quizQuestions.forEach((item, index) => {
    item.questionNumber = index + 1;
  });
  await course.save();

  res.json({
    message: 'Question deleted successfully',
    course
  });
});

module.exports = {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  uploadCourseSlideImage,
  addCourseSlide,
  updateCourseSlide,
  addCourseQuestion,
  updateCourseQuestion,
  deleteCourseQuestion
};
