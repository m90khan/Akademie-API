const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

/*
@dest    : Register User
@route   : Get /api/v1/auth/register
@access  : public
*/

exports.registerUser = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm, role } = req.body;
  const user = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    role,
  });
  res.status(200).json({
    status: 'success',
    token: token,
    data: {
      data: user,
    },
  });
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      // req.user is passed from the previous middleware authCotroller.protect
      return next(new APPError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
