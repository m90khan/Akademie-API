const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const apiFeatures = require('../utils/apiFeatures');

/*
@dest    : Get All User
@route   : GET /api/v1/users/
@access  : Private/Admin
*/

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const results = await apiFeatures(User, '', req.query)();
  res.status(200).json(results);
});

/*
@dest    : Get Single User
@route   : GET /api/v1/users/:id
@access  : Private/Admin
*/
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  // formatted id but not in database
  if (!user) {
    return next(new AppError(`No User found with id ${req.params.id}`, 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      user: user,
    },
  });
});

/*
@dest    : Create User
@route   : POST /api/v1/users/
@access  : Private/Admin
*/
exports.createUser = catchAsync(async (req, res, next) => {
  const user = await User.create(req.body);
  // formatted id but not in database
  if (!user) {
    return next(new AppError(`No User found with id ${req.params.id}`, 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      user: user,
    },
  });
});

/*
@dest    : Update User
@route   : PATCH /api/v1/users/:id
@access  : Private/Admin
*/
exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: user,
    },
  });
});

/*
@dest    : Delete User
@route   : DELETE /api/v1/users/:id
@access  : Private/Admin
*/
exports.deleteUser = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: 'deleted',
  });
});
