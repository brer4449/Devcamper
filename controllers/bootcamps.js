const path = require("path");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const geocoder = require("../utils/geocode");
const Bootcamp = require("../models/Bootcamp");

// Middleware functions
// Middleware is a function that has access to req, response cycle and runs during that cycle
// Can set req variables, etc.
// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public (token needed? no)
exports.getBootcamps = async (req, res, next) => {
  res.status(200).json(res.advancedResults);
};

// @desc    Get single bootcamp
// @route   GET /api/v1/bootcamps/:id
// @access  Public (token needed? no)
exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  // this checks if the id is formatted correctly but doesn't exist, originally it would still give a status of 200, even if it didn't exist
  if (!bootcamp) {
    // since we have two res.status's we need to return this one since the "headers are all ready sent"
    // return res.status(400).json({ success: false });
    // even though not using multiple res.status, still need to return since it's the header that's the issue
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }
  res.status(200).json({ success: true, data: bootcamp });
});

// @desc    Create new bootcamp
// @route   POST /api/v1/bootcamps
// @access  Private (token needed? yes)
exports.createBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.create(req.body);
  // since we're creating a resource, using 201
  res.status(201).json({
    success: true,
    data: bootcamp,
  });
  // if there's a field that's not in our model, it won't get sent to database, that's how mongoose works!
});

// @desc    Update bootcamp
// @route   PUT /api/v1/bootcamps/:id
// @access  Private (token needed? yes)
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  // 3rd param is options
  const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!bootcamp) {
    // return res.status(400).json({ success: false });
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }
  res.status(200).json({ success: true, data: bootcamp });
});

// @desc    Delete bootcamp
// @route   DELETE /api/v1/bootcamps/:id
// @access  Private (token needed? yes)
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    // return res.status(400).json({ success: false });
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }
  // this remove method will trigger cascade delete middleware
  bootcamp.remove();
  res.status(200).json({ success: true, data: {} });
});

// @desc    Get bootcamps within a radius
// @route   GET /api/v1/bootcamps/radius/:zipcode/:distance // can add /:unit if want in km
// @access  Private (token needed? yes)
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  // coming in from URL
  const { zipcode, distance } = req.params;

  // Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calc radius using radians (unit of measurement of spheres)
  // Divide distance by radius of earth
  // Earth radius= 3,963 mi / 6,378 km
  const radius = distance / 3963;

  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res
    .status(200)
    .json({ success: true, count: bootcamps.length, data: bootcamps });
});

// @desc    Upload photo for bootcamp
// @route   PUT /api/v1/bootcamps/:id/photo
// @access  Private (token needed? yes)
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    // return res.status(400).json({ success: false });
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }
  // Check if file was actually uploaded
  if (!req.files) {
    new ErrorResponse(`Please upload a file`, 400);
  }
  const file = req.files.file;
  // Make sure the image is a photo
  if (!file.mimetype.startsWith("image")) {
    new ErrorResponse(`Please upload an image file`, 400);
  }
  // Check file size
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    new ErrorResponse(
      `Please upload an image less than ${process.env.MAX_FILE_UPLOAD} bytes`,
      400
    );
  }
  // Create custom file name
  // need to use path to bring in the file extension
  file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;
  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload...`, 500));
    }
    // insert file name into DB
    await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });

    res.status(200).json({
      success: true,
      data: file.name,
    });
  });
});
