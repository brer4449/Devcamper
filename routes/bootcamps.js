const express = require("express");

const {
  getBootcamp,
  getBootcamps,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getBootcampsInRadius,
  bootcampPhotoUpload,
} = require("../controllers/bootcamps");

// bring in bootcamp model (needs to be passed in)
const Bootcamp = require("../models/Bootcamp");
// bring in middlware
const advancedResults = require("../middleware/advancedResults");
// wherever we want to use advancedResults, need to pass it in with the method

// Include other resource routers
const courseRouter = require("./courses");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

// Re-route into other resource routers
// anything that will have /:bootcampId/courses included as a param should be mounted into courseRouter
// passes on to the courseRouter (rather than bringing in getCourses into this router)
// can view this as forwarding the route to courseRouter
router.use("/:bootcampId/courses", courseRouter);

router.route("/radius/:zipcode/:distance").get(getBootcampsInRadius);

// authorize has to be after protect, since we're using req.user which is set in the protect middleware
router
  .route("/:id/photo")
  .put(protect, authorize("publisher", "admin"), bootcampPhotoUpload);

router
  .route("/")
  .get(advancedResults(Bootcamp, "courses"), getBootcamps)
  .post(protect, authorize("publisher", "admin"), createBootcamp);

router
  .route("/:id")
  .get(getBootcamp)
  .put(protect, authorize("publisher", "admin"), updateBootcamp)
  .delete(protect, authorize("publisher", "admin"), deleteBootcamp);

module.exports = router;
