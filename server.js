const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
// const logger = require("./middleware/logger");
const morgan = require("morgan");
const colors = require("colors");
const fileupload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const errorHandler = require("./middleware/error");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const connectDB = require("./config/db");

// Load env vars (config file)
dotenv.config({ path: "./config/config.env" });

// Connect to db
connectDB();

// Route files
const bootcamps = require("./routes/bootcamps");
const courses = require("./routes/courses");
const auth = require("./routes/auth");
const users = require("./routes/users");
const reviews = require("./routes/reviews");

const app = express();

// Body parser
// req.body parser
app.use(express.json());

// Cookie parser
// req.cookies
app.use(cookieParser());

// Custom logger to demo what middleware does
// app.use(logger);
// Dev logging middleware (only want to run if in dev environment)
if (process.env.NODE_ENV === "development") {
  // can pass different params, different params will log different things
  app.use(morgan("dev"));
}

// File uploading
app.use(fileupload());

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100,
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Mount routers
app.use("/api/v1/bootcamps", bootcamps);
app.use("/api/v1/courses", courses);
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);
app.use("/api/v1/reviews", reviews);

/*
https://www.youtube.com/watch?v=H9BQkVeRVQw
https://www.youtube.com/watch?v=jrdjfl_nVUM
https://www.youtube.com/watch?v=G3R8bJcKBZI
https://www.youtube.com/watch?v=T58t0jZV3Ec
https://www.youtube.com/watch?v=R5eedh5tLIo
*/

// If we want to be able to use error middleware in the bootcamps controller methods, it HAS to be AFTER the above line, since middleware is run in a linear order
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

// Global handler for all unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server and exit process
  // want it to exit with failure so pass in 1 in order to do that
  server.close(() => process.exit(1));
});
