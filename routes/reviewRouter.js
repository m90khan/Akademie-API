const reviewRouter = require('express').Router({ mergeParams: true });
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');
reviewRouter.use(authController.protect);

//* Review Routes

//
// reviewRouter.get('/:userId/my-reviews', reviewController.getSingleUserReviews);

//- get all reviews

reviewRouter
  .route('/')
  .get(reviewController.getAllReviews)

  // .get(reviewController.reviewFilter, reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    reviewController.createReview
  );

reviewRouter
  .route('/:id')
  .get(reviewController.getReview)
  .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
  .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview);

module.exports = reviewRouter;
