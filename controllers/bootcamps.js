const Bootcamp = require("../models/Bootcamp");

// Middleware functions
// Middleware is a function that has access to req, response cycle and runs during that cycle
// Can set req variables, etc.
// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public (token needed? no)
exports.getBootcamps = async (req, res, next) => {
  try {
    const bootcamps = await Bootcamp.find();
    res
      .status(200)
      .json({ success: true, count: bootcamps.length, data: bootcamps });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc    Get single bootcamp
// @route   GET /api/v1/bootcamps/:id
// @access  Public (token needed? no)
exports.getBootcamp = async (req, res, next) => {
  try {
    const bootcamp = await Bootcamp.findById(req.params.id);

    // this checks if the id is formatted correctly but doesn't exist, originally it would still give a status of 200, even if it didn't exist
    if (!bootcamp) {
      // since we have two res.status's we need to return this one since the "headers are all ready sent"
      return res.status(400).json({ success: false });
    }
    res.status(200).json({ success: true, data: bootcamp });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc    Create new bootcamp
// @route   POST /api/v1/bootcamps
// @access  Private (token needed? yes)
exports.createBootcamp = async (req, res, next) => {
  try {
    const bootcamp = await Bootcamp.create(req.body);
    // since we're creating a resource, using 201
    res.status(201).json({
      success: true,
      data: bootcamp,
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
  // if there's a field that's not in our model, it won't get sent to database, that's how mongoose works!
};

// @desc    Update bootcamp
// @route   PUT /api/v1/bootcamps/:id
// @access  Private (token needed? yes)
exports.updateBootcamp = async (req, res, next) => {
  try {
    // 3rd param is options
    const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!bootcamp) {
      return res.status(400).json({ success: false });
    }

    res.status(200).json({ success: true, data: bootcamp });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc    Delete bootcamp
// @route   DELETE /api/v1/bootcamps/:id
// @access  Private (token needed? yes)
exports.deleteBootcamp = async (req, res, next) => {
  try {
    const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);

    if (!bootcamp) {
      return res.status(400).json({ success: false });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};
