const express = require("express");
const dotenv = require("dotenv");
// const logger = require("./middleware/logger");
const morgan = require("morgan");
const connectDB = require("./config/db");

// Load env vars (config file)
dotenv.config({ path: "./config/config.env" });

// Connect to db
connectDB();

// Route files
const bootcamps = require("./routes/bootcamps");

const app = express();

// Custom logger to demo what middleware does
// app.use(logger);
// Dev logging middleware (only want to run if in dev environment)
if (process.env.NODE_ENV === "development") {
  // can pass different params, different params will log different things
  app.use(morgan("dev"));
}

// Mount routers
app.use("/api/v1/bootcamps", bootcamps);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server and exit process
  server.close(() => {
    // want it to exit with failure so pass in 1 in order to do that
    process.exit(1);
  });
});
