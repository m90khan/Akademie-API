const geocoder = require('../utils/geoCoder');
const Camp = require('../models/campModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.filterBootCamps = catchAsync(async (req, res, next) => {
  let query;
  let queryString = JSON.stringify({ ...req.query });
  queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  next();
});

exports.getAllBootCamps = catchAsync(async (req, res, next) => {
  let query;
  const reqQuery = { ...req.query };
  //exclude fields
  const excludeFields = ['page', 'sort', 'limit', 'fields'];

  excludeFields.forEach((field) => delete reqQuery[field]);
  // create operators lt gt gte in ggt  => $
  let queryString = JSON.stringify(reqQuery);
  queryString = queryString.replace(/\b(gte|gt|lte|lt|in)\b/g, (match) => `$${match}`);
  // console.log(reqQuery);

  query = Camp.find(JSON.parse(queryString));

  // Select limited fields
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v');
  }
  //sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }
  // pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Camp.countDocuments();
  query = query.skip(startIndex).limit(limit);

  //execute query
  const bootCamps = await query.populate('courses');

  const pagination = {};
  if (endIndex < total) {
    pagination.next = {
      page: page + 1, // current page +1 => next page
      limit,
    };
  }
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1, // current page -1 => prev page
      limit,
    };
  }
  if (!bootCamps) next(new AppError(`No Bootcamps found`, 404));

  res.status(200).json({
    status: 'success',
    length: bootCamps.length,
    pagination,
    data: bootCamps,
  });
});

exports.createBootCamp = catchAsync(async (req, res, next) => {
  const bootCamp = await Camp.create(req.body);

  res.status(201).json({
    status: 'success',
    data: bootCamp,
  });
});

exports.getBootCamp = catchAsync(async (req, res, next) => {
  const bootCamp = await Camp.findById(req.params.id);
  // formatted id but not in database
  if (!bootCamp) {
    return next(new AppError(`No Bootcamp found with id ${req.params.id}`, 404));
  }
  res.status(200).json({
    status: 'success',
    data: bootCamp,
  });
});
exports.patchBootCamp = catchAsync(async (req, res, next) => {
  const bootCamp = await Camp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!bootCamp) {
    return next(new AppError(`No Bootcamp found with id ${req.params.id}`, 404));
  }
  res.status(200).json({
    status: 'success',
    data: bootCamp,
  });
});

exports.deleteBootCamp = catchAsync(async (req, res, next) => {
  const bootCamp = await Camp.findById(req.params.id);
  if (!bootCamp) {
    return next(new AppError(`No Bootcamp found with id ${req.params.id}`, 404));
  }

  await bootCamp.remove(); // to trigger the remove middleware
  res.status(204).json({
    status: 'success',
    data: 'deleted',
  });
});

exports.getBootCampswithin = catchAsync(async (req, res, next) => {
  const { zipcode, distance, unit } = req.params;
  //Get lng/lat from geocoder

  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  const bootcamps = await Camp.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: bootcamps.length,
    data: {
      data: bootcamps,
    },
  });
});

// Get BootCamps with in a radius
// /api/v1/bootcamps/radius/:zipcode/:distance/:unit
