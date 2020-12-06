const campRouter = require('express').Router();
const campController = require('../controllers/campController');
const authController = require('../controllers/authController');
//include other resource routers
const courseRouter = require('./courseRouter');
const reviewRouter = require('./reviewRouter');
// {{URL}}/api/v1/bootcamps/5d713995b721c3bb38c1f5d0/courses
campRouter.use('/:bcampId/courses', courseRouter);
campRouter.use('/:bcampId/reviews', reviewRouter);

campRouter
  .route('/')
  .get(campController.getAllBootCamps)
  .post(
    authController.protect,
    authController.restrictTo('publisher', 'admin'),
    campController.createBootCamp
  );

campRouter
  .route('/:id')
  .get(campController.getBootCamp)
  .patch(
    authController.protect,
    authController.restrictTo('publisher', 'admin'),
    campController.patchBootCamp
  )
  .delete(
    authController.protect,
    authController.restrictTo('publisher', 'admin'),
    campController.deleteBootCamp
  );

// Photo Upload
campRouter
  .route('/:id/photo')
  .put(
    authController.protect,
    authController.restrictTo('publisher', 'admin'),
    campController.campPhotoUpload
  );

campRouter
  .route('/radius/:zipcode/:distance/:unit')
  .get(campController.getBootCampswithin);

module.exports = campRouter;
