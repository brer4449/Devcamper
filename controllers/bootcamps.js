const Bootcamp = require("../models/Bootcamp");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

// Middleware functions
// Middleware is a function that has access to req, response cycle and runs during that cycle
// Can set req variables, etc.
// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public (token needed? no)
exports.getBootcamps = async (req, res, next) => {
  const bootcamps = await Bootcamp.find();
  res
    .status(200)
    .json({ success: true, count: bootcamps.length, data: bootcamps });
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
  const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);

  if (!bootcamp) {
    // return res.status(400).json({ success: false });
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }
  res.status(200).json({ success: true, data: {} });
});
