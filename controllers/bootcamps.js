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
  let query;
  // our copied version of req.query
  const reqQuery = { ...req.query };
  // Fields to exclude (that we don't want to be matched for filtering)
  const removeFields = ["select", "sort"];
  // Loop over removeFields & delete them from reqQuery
  removeFields.forEach((param) => delete reqQuery[param]);
  // Create out query string
  let queryStr = JSON.stringify(reqQuery);
  // inserting a money sign in front of greater than less than, etc. since $ is needed to make it a mongoose operator
  // in regex "in" searches a list
  // Create operators ($gt, $gte, etc.)
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );
  // Finding resource
  query = Bootcamp.find(JSON.parse(queryStr));
  // Select fields
  if (req.query.select) {
    // turn it into an array and then join them without commas
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }
  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    // descending is the minus sign, and createdAt is from our model
    query = query.sort("-createdAt");
  }
  // express makes it really easy access to query params via req.query
  // console.log(req.query);

  // Executing our query
  const bootcamps = await query;
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
