const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const Camp = require('../models/campModel');
const Review = require('../models/reviewModel');
const apiFeatures = require('../utils/apiFeatures');

exports.setBootcampUserIds = (req, res, next) => {
  // Alow Nested routes
  if (!req.body.tour) {
    req.body.tour = req.params.tourId;
  }
  if (!req.body.user) {
    req.body.user = req.user.id;
    // req.user.id => from protect middleware
  }
  next();
};
/*
@dest    : Get All Reviews
@route   : GET /api/v1/reviews/
@route   : GET /api/v1/bootcamps/:bcampId/reviews
@access  : Public
*/

exports.getAllReviews = catchAsync(async (req, res, next) => {
  if (req.params.bcampId) {
    const reviews = await Review.find({ bootcamp: req.params.bcampId });
    return res.status(200).json({
      status: 'success',
      length: reviews.length,
      data: reviews,
    });
  } else {
    const results = await apiFeatures(
      Review,
      { path: 'bootcamp', select: 'name description' },
      req.query
    )();

    return res.status(200).json(results);
  }
});

/*
@dest    : Get Single Review
@route   : GET /api/v1/reviews/:id
@access  : public
*/
exports.getReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id).populate({
    path: 'bootcamp',
    select: 'name description',
  });
  if (!review) {
    return next(new AppError(`No Review found with id ${req.params.id}`, 404));
  }
  res.status(200).json({
    status: 'success',
    length: reviews.length,
    data: {
      review: review,
    },
  });
});

/*
@dest    : Create Review
@route   : POST /api/v1/reviews/
@route   : POST /api/v1/bootcamps/:bcampId/reviews
@access  : Private/Admin
*/
exports.createReview = catchAsync(async (req, res, next) => {
  req.body.bootcamp = req.params.bcampId;
  req.body.user = req.user.id;
  const bootCamp = await Camp.findById(req.params.bcampId);
  if (!bootCamp) {
    return next(new AppError(`No Bootcamp found with id ${req.params.bcampId}`, 404));
  }

  const review = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { review: review },
  });
});

/*
@dest    : Update Review
@route   : PATCH /api/v1/reviews/:id
@access  : Private/Admin
*/
exports.updateReview = catchAsync(async (req, res, next) => {
  let review = await Review.findById(req.params.id);
  if (!review) {
    return next(new AppError(`No review found with id ${req.params.id}`, 404));
  }

  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new AppError(
        `User with id ${req.params.id} is not authorized to update review for this bootcamp`,
        401
      )
    );
  }
  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: {
      review: review,
    },
  });
});

/*
@dest    : Delete Review
@route   : DELETE /api/v1/reviews/:id
@access  : Private/Admin
*/
exports.deleteReview = catchAsync(async (req, res, next) => {
  await Review.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: 'deleted',
  });
});
