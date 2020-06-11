// @desc    Logs request to console
const logger = (req, res, next) => {
  // set value on req obj that we can access on any routes that come after this middleware
  // have access to hello variable in our routes
  // req.hello = "Hello World";
  console.log(
    `${req.method} ${req.protocol}://${req.get("host")}${req.originalUrl}`
  );
  // console.log("Middleware ran");
  // in every piece of middleware we create, NEED to call next() so it knows to move on to the next piece of middleware in the cycle
  next();
};
// Morgan is 3rd party logger

module.exports = logger;
