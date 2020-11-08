const courseRouter = require('express').Router({ mergeParams: true });

const courseController = require('../controllers/courseController');
const authController = require('../controllers/authController');

// /api/v1/bootcamps/5d713995b721c3bb38c1f5d0/courses  (from campRouter)= gives the course
courseRouter
  .route('/')
  .get(courseController.getAllCourses)
  .post(
    authController.protect,
    authController.restrictTo('publisher', 'admin'),
    courseController.createCourse
  );

courseRouter
  .route('/:id')
  .get(courseController.getCourse)
  .patch(
    authController.protect,
    authController.restrictTo('publisher', 'admin'),
    courseController.patchCourse
  )
  .delete(
    authController.protect,
    authController.restrictTo('publisher', 'admin'),
    courseController.deleteCourse
  );

module.exports = courseRouter;
