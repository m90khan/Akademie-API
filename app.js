const express = require('express');
const morgan = require('morgan');
const colors = require('colors');
const path = require('path');

const fileupload = require('express-fileupload');
const app = express();
const AppError = require('./utils/appError');
const errorController = require('./utils/errorController');
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.json({ limit: '10kb' })); // limit body data
app.use(express.static(path.join(__dirname, 'public')));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
console.log(process.env.NODE_ENV);

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.requestTime);
  next();
});
//file upload
app.use(fileupload());

app.use('/api/v1/bootcamps', require('./routes/campRouter'));
app.use('/api/v1/courses', require('./routes/courseRouter'));
app.use('/api/v1/reviews', require('./routes/reviewRouter'));
app.use('/api/v1/auth', require('./routes/authRouter'));
app.use('/api/v1/users', require('./routes/userRouter'));

app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on the server`, 404));
});

app.use(errorController);

module.exports = app;
