const campRouter = require('express').Router();
const campController = require('../controllers/campController');

//include other resource routers
const courseRouter = require('./courseRouter');
// {{URL}}/api/v1/bootcamps/5d713995b721c3bb38c1f5d0/courses
campRouter.use('/:bcampId/courses', courseRouter);

campRouter
  .route('/')
  .get(campController.filterBootCamps, campController.getAllBootCamps)
  .post(campController.createBootCamp);

campRouter
  .route('/:id')
  .get(campController.getBootCamp)
  .patch(campController.patchBootCamp)
  .delete(campController.deleteBootCamp);

campRouter
  .route('/radius/:zipcode/:distance/:unit')
  .get(campController.getBootCampswithin);

module.exports = campRouter;
