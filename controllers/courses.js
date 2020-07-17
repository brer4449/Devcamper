const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Course = require("../models/Course");
const Bootcamp = require("../models/Bootcamp");

// @desc    Get courses
// @route   GET /api/v1/courses
// @route   GET /api/v1/bootcamps/:bootcampId/courses
// @access  Public (token needed? no)
exports.getCourses = asyncHandler(async (req, res, next) => {
  // need to check to see if bootcamp id in params exists, if it does, just gunna get courses for that bootcamp, if it doesn't we're gunna get ALL of the courses
  if (req.params.bootcampId) {
    // attempting to find a bootcamp that matches that id
    const courses = await Course.find({ bootcamp: req.params.bootcampId });

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get a single course
// @route   GET /api/v1/courses/:id
// @access  Public (token needed? no)
exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await (await Course.findById(req.params.id)).populate({
    path: "bootcamp",
    select: "name description",
  });

  if (!course) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`),
      404
    );
  }

  res.status(200).json({
    success: true,
    data: course,
  });
});

// @desc    Add course
// @route   POST /api/v1/bootcamps/:bootcampId/courses
// @access  Private (only a logged in user should have access to it)
exports.addCourse = asyncHandler(async (req, res, next) => {
  // get bootcamp id which is in req.params.bootcampId
  // need to submit that as body field, so set the body of bootcamp field to the id that's in the URL
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`No bootcamp with the id of ${req.params.bootcampId}`),
      404
    );
  }

  // Make sure user is bootcamp owner
  // bootcamp.user is going to give an object with an id in it, need to compare it to req.user.id which is a string, so need to convert bootcamp.user into a string
  // also checking that the logged in user is not an admin, cuz if they are an admin they should be able to update regardless of ownership
  if (bootcamp.user.toString() != req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User with id ${req.user.id} is not authorized to add course to bootcamp ${bootcamp._id}`,
        401
      )
    );
  }

  // Create a new course
  const course = await Course.create(req.body);

  res.status(200).json({
    success: true,
    data: course,
  });
});

// @desc    Update course
// @route   PUT /api/v1/courses/:id
// @access  Private (only a logged in user should have access to it)
exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`),
      404
    );
  }

  // Make sure user is course owner
  // course.user is going to give an object with an id in it, need to compare it to req.user.id which is a string, so need to convert course.user into a string
  // also checking that the logged in user is not an admin, cuz if they are an admin they should be able to update regardless of ownership
  if (course.user.toString() != req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User with id ${req.user.id} is not authorized to update course ${course._id}`,
        401
      )
    );
  }

  // Update a course
  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: course,
  });
});

// @desc    Delete course
// @route   DELETE /api/v1/courses/:id
// @access  Private (only a logged in user should have access to it)
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`),
      404
    );
  }

  // Make sure user is course owner
  // course.user is going to give an object with an id in it, need to compare it to req.user.id which is a string, so need to convert course.user into a string
  // also checking that the logged in user is not an admin, cuz if they are an admin they should be able to update regardless of ownership
  if (course.user.toString() != req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User with id ${req.user.id} is not authorized to delete course ${course._id}`,
        401
      )
    );
  }

  // Delete a course
  await course.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});
