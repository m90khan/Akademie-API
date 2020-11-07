const AppError = require('./appError');
const colors = require('colors');

// Development Errors
const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    console.log(err.stack.bgRed.white);
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // B) RENDERED WEBSITE
  console.log('Error: Yes', err.stack.bgRed.white);

  return res.status(err.statusCode).json({
    title: 'Something went wrong!',
    msg: err.message,
  });
};

// Production errors
const handleCastErrorDB = (err) => {
  // CastError- 1- wrong id (when mongoose unable to convert or find id)
  const message = `Resource not found with id ${err.path}: ${err.value} `;
  return new AppError(message, 404);
};

const handleDuplicateFieldsDB = (err) => {
  // ErrorCode :11000  => 2- duplicate creation error
  // use regex to extract the duplicate field between "" marks in error.errmsg
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value:${value} please use another value`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  // loop over the error arrays and return errors
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `invalid input data: ${errors.join('.')}`;
  return new AppError(message, 400);
};
const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });

      // Programming or other unknown error: don't leak error details
    }
    // 1) Log error
    console.error('ERROR 😱', err.bgRed.black);

    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  // B) RENDERED WEBSITE
  // A) Operational, trusted error: send message to client
  //   if (err.isOperational) {
  //     return res.status(err.statusCode).render('error', {
  //       title: 'Something went wrong!',
  //       msg: err.message,
  //     });
  //   }
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error('ERROR 😱', err.bgRed.black);
  // 2) Send generic message
  //   return res.status(err.statusCode).render('error', {
  //     title: 'Something went wrong!',
  //     msg: 'Please try again later.',
  //   });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (error.name === 'CasteError') {
      error = handleCastErrorDB(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }
    sendErrorProd(error, req, res);
  }
};
