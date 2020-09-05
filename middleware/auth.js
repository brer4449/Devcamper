const jwt = require("jsonwebtoken");
const asyncHandler = require("./async");
const errorResponse = require("../utils/errorResponse");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");

// Protect Routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // check the headers for authorization
  // convention to have all authorization headers have the value of "Bearer" and then the token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Set token from Bearer token in header
    // turning the authorization header into an array since it's "Bearer tokenHere", and since we only want the token, taking the second item in the array
    token = req.headers.authorization.split(" ")[1];
  }
  // // Set token from cookie
  // else if (req.cookies.token) {
  //   token = req.cookies.token;
  // }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse("Not Authorized to access this route", 401));
  }

  try {
    // verify token
    // going to extract payload from token, it will contain a user id, issued at (iat), and the expiration (exp)
    // jwt verify method takes in the token itself and the secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    // whatever id is in that token which the user got by logging in with correct credentials, will be passed in here and will be set
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return next(new ErrorResponse("Not Authorized to access this route", 401));
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // seeing if the role that is passed in matches authorized ones
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
