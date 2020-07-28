const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Review = require("../models/Reviews");
const Bootcamp = require("../models/Bootcamp");

// @desc    Get reviews
// @route   GET /api/v1/reviews
// @route   GET /api/v1/bootcamps/:bootcampId/reviews
// @access  Public (token needed? no)
exports.getReviews = asyncHandler(async (req, res, next) => {
  // need to check to see if bootcamp id in params exists, if it does, just gunna get reviews for that bootcamp, if it doesn't we're gunna get ALL of the reviews
  if (req.params.bootcampId) {
    // attempting to find a bootcamp that matches that id
    const reviews = await Review.find({ bootcamp: req.params.bootcampId });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});
