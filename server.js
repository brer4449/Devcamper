const express = require("express");
const dotenv = require("dotenv");
// const logger = require("./middleware/logger");
const morgan = require("morgan");
const colors = require("colors");
const errorHandler = require("./middleware/error");
const connectDB = require("./config/db");

// Load env vars (config file)
dotenv.config({ path: "./config/config.env" });

// Connect to db
connectDB();

// Route files
const bootcamps = require("./routes/bootcamps");
const courses = require("./routes/courses");

const app = express();

// req.body parser
app.use(express.json());

// Custom logger to demo what middleware does
// app.use(logger);
// Dev logging middleware (only want to run if in dev environment)
if (process.env.NODE_ENV === "development") {
  // can pass different params, different params will log different things
  app.use(morgan("dev"));
}

// Mount routers
app.use("/api/v1/bootcamps", bootcamps);
app.use("/api/v1/courses", courses);

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
