const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../models/User");

// @desc    Register User
// @route   GET /api/v1/auth/register
// @access  Public (token needed? no)
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Create user
  const user = await User.create({ name, email, password, role });

  // Create token
  // LOWER CASE U, important since this is a method and NOT a static, so calling it on what we get from the model
  const token = user.getSignedJwtToken();

  res.status(200).json({ success: true, token });
});
