const crypto = require("crypto");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");

// @desc    Register User
// @route   POST /api/v1/auth/register
// @access  Public (token needed? no)
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Create user
  const user = await User.create({ name, email, password, role });

  // Create token
  sendTokenResponse(user, 200, res);
});

// @desc    Login User
// @route   POST /api/v1/auth/login
// @access  Public (token needed? no)
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email and password
  if (!email || !password) {
    return next(new ErrorResponse("Please provide email and password", 400));
  }

  // Check for user
  // since we made it so password can NOT be selected in our model, need to select it manually here
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  // Check if password matches
  // using await since bcrypt.match returns a promise
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  // Create token
  sendTokenResponse(user, 200, res);
});

// @desc    Log user out/clear cookie
// @route   GET  /api/v1/auth/logout
// @access  Private (token needed? YES)

exports.logout = asyncHandler(async (req, res, next) => {
  // we have access to this cuz the cookie parser middleware
  res.cookie("token", "none", {
    expire: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Current logged in user
// @route   POST /api/v1/auth/me
// @access  Private (token needed? YES)

exports.getMe = asyncHandler(async (req, res, next) => {
  // since we're using protect route, will always have access to req.user which will always be current user
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private (token needed? YES)

exports.updateDetails = asyncHandler(async (req, res, next) => {
  // don't want to just pass in req.body to findByIdAndUpdate because we don't want any user field that's in the model to be updated ie. password, or role, etc.
  // this should just be for the name and email
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  };

  // since we're using protect route, will always have access to req.user which will always be current user
  // the logged in user's ID, and what we want to update
  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private (token needed? YES)

exports.updatePassword = asyncHandler(async (req, res, next) => {
  // they're gunna send their current password and a new password in the body
  // we also want the password which by default is select: false
  // since we're using protect route, will always have access to req.user which will always be current user
  const user = await User.findById(req.user.id).select("+password");
  // Check current password (make sure that's true)
  // match password method is asynchronous so it returns a promise, hence the await
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse("Password is incorrect", 401));
  }

  // setting the password to the new password
  user.password = req.body.newPassword;
  await user.save();

  // if they change the password, want the token to be sent back (just like when they reset the password)
  sendTokenResponse(user, 200, res);
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public (token needed? NO)

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse(`There is no user with that email`, 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  // save the user, don't want to run any validators (like check name, etc.)
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Token",
      message,
    });
    res.status(200).json({ success: true, data: "Email sent" });
  } catch (err) {
    console.error(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse("Email could not be sent", 500));
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Reset Password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public (token needed? no)

exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  // grabbing the resettoken from the url and hashing it so it matches what's in the DB and then digesting it
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  // hiccup somewhere around video 56/57.... not sure why resets password, but get error in CL
  // IT WORKS THOOOOOO ugh
  // find the user by id
  const user = await User.findOne({
    resetPasswordToken,
    // comparing that the expiration has not passed
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse("Invalid Token", 400));
  }

  // Set the new password
  user.password = req.body.password;
  // Set these two fields to undefined (when a field is set to undefined it just goes away)
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendTokenResponse(user, 200, res);
});

// Custom function that will get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  // Create cookie
  const options = {
    // calculation is 30 days, since cookie-parser makes us pass in an int
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // so that way when we're in production, the secure flag will be on our cookie
  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res
    .status(statusCode)
    // takes in 3 things, the key which we're calling token, the value which is going to be the token itself, and the options
    .cookie("token", token, options)
    .json({ success: true, token });
};
