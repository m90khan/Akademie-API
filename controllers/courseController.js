const Course = require('../models/courseModel');
const Camp = require('../models/campModel');

const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const apiFeatures = require('../utils/apiFeatures');

exports.getAllCourses = catchAsync(async (req, res, next) => {
  // const results = await apiFeatures(
  //   Course,
  //   { path: 'bootcamp', select: 'name description' },
  //   req.query
  // )();

  // return res.status(200).json(results);
  if (req.params.bcampId) {
    const courses = await Course.find({ bootcamp: req.params.bcampId });
    return res.status(200).json({
      status: 'success',
      length: courses.length,
      data: courses,
    });
  } else {
    const results = await apiFeatures(
      Course,
      { path: 'bootcamp', select: 'name description' },
      req.query
    )();

    return res.status(200).json(results);
  }
});

// /api/v1/bootcamps/5d713995b721c3bb38c1f5d0/courses  (from campRouter)= gives the course

exports.createCourse = catchAsync(async (req, res, next) => {
  if (req.params.bcampId) {
    req.body.bootcamp = req.params.bcampId;
    const bootcamp = await Camp.findById(req.params.bcampId);
    if (!bootcamp) {
      return next(new AppError(`No Bootcamp found with id ${req.params.bcampId}`, 404));
    }
  }
  const course = await Course.create(req.body);

  res.status(201).json({
    status: 'success',
    data: course,
  });
});
exports.getCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  // formatted id but not in database
  if (!course) {
    return next(new AppError(`No Course found with id ${req.params.id}`, 404));
  }
  res.status(200).json({
    status: 'success',
    data: course,
  });
});
exports.patchCourse = catchAsync(async (req, res, next) => {
  let course = await Course.findById(req.params.id);
  if (!course) {
    return next(new AppError(`No Course found with id ${req.params.id}`, 404));
  }
  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: course,
  });
});
exports.deleteCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return next(new AppError(`No Course found with id ${req.params.id}`, 404));
  }

  await course.remove();

  res.status(204).json({
    status: 'success',
    data: 'deleted',
  });
});
