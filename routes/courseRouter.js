const courseRouter = require('express').Router({ mergeParams: true });

const courseController = require('../controllers/courseController');

// /api/v1/bootcamps/5d713995b721c3bb38c1f5d0/courses  (from campRouter)= gives the course
courseRouter
  .route('/')
  .get(courseController.getAllCourses)
  .post(courseController.createCourse);

courseRouter
  .route('/:id')
  .get(courseController.getCourse)
  .patch(courseController.patchCourse)
  .delete(courseController.deleteCourse);

module.exports = courseRouter;
