const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Course = require("../models/Course");

// @desc    Get courses
// @route   GET /api/v1/courses
// @route   GET /api/v1/bootcamps/:bootcampId/courses
// @access  Public (token needed? no)
exports.getCourses = asyncHandler(async (req, res, next) => {
  // need to check to see if bootcamp id in params exists, if it does, just gunna get courses for that bootcamp, if it doesn't we're gunna get ALL of the courses
  let query;

  if (req.params.bootcampId) {
    // attempting to find a bootcamp that matches that id
    query = Course.find({ bootcamp: req.params.bootcampId });
  } else {
    // adding .populate replaces bootcamp id with all the data relating to that bootcamp
    query = Course.find().populate({
      path: "bootcamp",
      // returns only these fields instead of ALL of the data of that bootcamp
      select: "name description",
    });
  }

  const courses = await query;
  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses,
  });
});
