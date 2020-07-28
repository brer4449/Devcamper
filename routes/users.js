const express = require("express");

const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/users");

const User = require("../models/User");

// merging the url params
const router = express.Router({ mergeParams: true });

const advancedResults = require("../middleware/advancedResults");
// user has to be logged in in order to access these protected routes
const { protect, authorize } = require("../middleware/auth");

// any route below this uses the protect and authorize middleware
router.use(protect);
router.use(authorize("admin"));

//advancedResults takes in a model and any populate we want (but we don't want to rn)
router.route("/").get(advancedResults(User), getUsers).post(createUser);

router.route("/:id").get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;
