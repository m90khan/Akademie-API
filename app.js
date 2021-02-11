const express = require('express');
const morgan = require('morgan');
const colors = require('colors');
const path = require('path');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const fileupload = require('express-fileupload');
const cors = require('cors');
const AppError = require('./utils/appError');
const errorController = require('./utils/errorController');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

// SET Security HTTP HEADERS
app.use(helmet());
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
//LIMIT REQUESTS: To prevent too many requests , DOS , Brute force attacks
const limiter = rateLimit({
  max: 100, // requests
  windowMs: 10 * 60 * 1000, //time
  message: 'Too many requests from this IP, Please try again in an hour', //error message
});

app.use(cookieParser());

app.use('/api', limiter); // only limiting it to api routes
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // limit body data
// // Data Sanitization against noSQL query Injections  email: {"$gt": ""}
app.use(mongoSanitize());
// // Data Sanitization against Cross Site Scripting attacks - clean html code from js
app.use(xss());
// //preventing parameter pollution
app.use(hpp());
// Enable cors
app.use(cors());

// ROutes
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
