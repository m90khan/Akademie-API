const geocoder = require('../utils/geoCoder');
const Camp = require('../models/campModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const path = require('path');
const apiFeatures = require('../utils/apiFeatures');

exports.getAllBootCamps = catchAsync(async (req, res, next) => {
  const results = await apiFeatures(Camp, 'courses', req.query)();
  res.status(200).json(results);
});

exports.createBootCamp = catchAsync(async (req, res, next) => {
  //add user to body
  req.body.user = req.user.id;
  //check for published bootcamps
  const publishedBootCamp = await Camp.findOne({ user: req.user.id });
  // only allow one bootcamp for publisher

  if (publishedBootCamp && req.user.role !== 'admin') {
    return next(
      new AppError(
        `The user with id ${req.user.id} has already published a bootcamp`,
        404
      )
    );
  }
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
  let bootCamp = await Camp.findById(req.params.id);
  if (!bootCamp) {
    return next(new AppError(`No Bootcamp found with id ${req.params.id}`, 404));
  }
  // check if current user is the bootcamp owner
  if (bootCamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new AppError(`User with id ${req.params.id} is not authorized to update`, 401)
    );
  }
  bootCamp = await Camp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      bootcamp: bootCamp,
    },
  });
});

exports.deleteBootCamp = catchAsync(async (req, res, next) => {
  const bootCamp = await Camp.findById(req.params.id);
  if (!bootCamp) {
    return next(new AppError(`No Bootcamp found with id ${req.params.id}`, 404));
  }
  // check if current user is the bootcamp owner
  if (bootCamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new AppError(`User with id ${req.params.id} is not authorized to delete`, 401)
    );
  }
  await bootCamp.remove(); // to trigger the remove middleware
  res.status(204).json({
    status: 'success',
    data: 'deleted',
  });
});
// Get BootCamps with in a radius
// /api/v1/bootcamps/radius/:zipcode/:distance/:unit
exports.getBootCampswithin = catchAsync(async (req, res, next) => {
  const { zipcode, distance, unit } = req.params;
  //Get lng/lat from geocoder

  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  const bootCamps = await Camp.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: bootCamps.length,
    data: {
      data: bootCamps,
    },
  });
});

// Upload photo

exports.campPhotoUpload = catchAsync(async (req, res, next) => {
  const bootCamp = await Camp.findById(req.params.id);
  if (!bootCamp) {
    return next(new AppError(`No Bootcamp found with id ${req.params.id}`, 404));
  }

  if (!req.files) {
    return next(new AppError(`Please upload photo `, 400));
  }
  console.log(req.files.file);
  const file = req.files.file;
  // check if image is photo
  if (!file.mimetype.startsWith('image')) {
    return next(new AppError(`Please upload an image file `, 400));
  }
  // check file size
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new AppError(
        `Please upload image with size less than ${process.env.MAX_FILE_UPLOAD} bytes `,
        400
      )
    );
  }
  //create custom filename
  file.name = `photo_${bootCamp._id}${path.parse(file.name).ext}`;
  console.log(file.name);
  //upload the file
  // Use the mv() method to place the file somewhere on your server
  file.mv(`${process.env.File_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.error(err);
      return next(new AppError(`Problem with file upload `, 500));
    }
    await Camp.findByIdAndUpdate(req.params.id, {
      photo: file.name,
    });
    res.status(200).json({
      status: 'success',
      data: {
        data: 'File Uploaded Successfully',
      },
    });
  });
});
