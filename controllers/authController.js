const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Get token from model and create and send cookie res

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // if token exists
  if (!token) {
    return next(new AppError('You are not logged in! Please login to get access.', 401));
  }

  try {
    //verify TOKEn : extract the payload and verify
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError(
          'The user belongs to this token does no longer exists, Please create a new account ',
          401
        )
      );
    }

    req.user = currentUser;
    next();
  } catch (err) {
    return next(new AppError('You are not logged in! Please login to get access.', 401));
  }
});

//Grant access to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      // req.user is passed from the previous middleware authCotroller.protect
      return next(
        new AppError(
          `You do not have permission to perform this action as ${req.user.role}`,
          403
        )
      );
    }
    next();
  };
};

const createSendToken = (user, statusCode, res) => {
  const token = user.getSignedjwtToken();

  const cookieOptions = {
    expires: new Date(
      // convert to miliseconds
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure: true, // https
    httpOnly: true, // cookie cannot be accessed by browser
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('token', token, cookieOptions);
  //remove password property from response object output
  user.password = undefined;
  //3-send token to client
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};

/*
@dest    : Register User
@route   : POST /api/v1/auth/register
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
  //Create JWT TOKEN
  createSendToken(user, 200, res);
});

/*
@dest    : Login User
@route   : POST /api/v1/auth/login
@access  : public
*/
exports.loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //validate email and model
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // check if user exists
  const user = await User.findOne({ email: email }).select('+password');
  if (!user) {
    return next(new AppError('Invalid Credentials', 401));
  }
  // check if password matched
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new AppError('Invalid Credentials', 401));
  }
  //Create JWT TOKEN
  createSendToken(user, 200, res);
});

/*
@dest    : Forgot Password
@route   : POST /api/v1/auth/forgotpassword
@access  : public
*/
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    next(new AppError('There is no user with that email', 404));
  }
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); // validateBeforeSave: false => de-validate all the validator in the schema

  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/resetpassword/${resetToken}`;
  const message = `You can reset your password using this code. Please make a PUT request \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Your Password reset token (valid for 15 minutes)`,
      message,
    });
    res.status(200).json({
      status: 'success',
      data: {
        message: 'Reset token send to your email successfully',
      },
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    console.log(err);
    await user.save({ validateBeforeSave: false }); // validateBeforeSave: false => devalidate all the validator in the schema
    return next(new AppError('There was an error sending email, Try again later', 500));
  }
  res.status(200).json({
    status: 'success',
    data: {
      user: user,
    },
  });
});

/*
@dest    : Get Current Logged in User
@route   : Patch /api/v1/auth/resetpassword/:token
@access  : public
*/
exports.resetPassword = catchAsync(async (req, res, next) => {
  // get hashed token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
});

//-- DASHBOARD

/*
@dest    : Get Current Logged in User
@route   : POST /api/v1/auth/me
@access  : private
*/
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    status: 'success',
    data: {
      user: user,
    },
  });
});

/*
@dest    : Log out current User / clear cookie
@route   : GET /api/v1/auth/logout
@access  : private
*/
exports.logout = catchAsync(async (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
});
/*
  @dest    : Update User Details
  @route   : PATCH /api/v1/auth/updateme
  @access  : private
  */
exports.updateMe = catchAsync(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  };
  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
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
  @dest    : Update User Password
  @route   : PATCH /api/v1/auth/updatemypassword
  @access  : private
  */
exports.updateMyPassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new AppError('Password is incorrect', 401));
  }
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();
  createSendToken(user, 200, res);
});
