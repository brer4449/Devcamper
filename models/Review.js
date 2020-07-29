const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Please add a title for the review"],
    maxlength: 100,
  },
  text: {
    type: String,
    required: [true, "Please add some text"],
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: [true, "Please add a rating between 1 and 10"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bootcamp: {
    // special mongoose specific type of objectID
    type: mongoose.Schema.ObjectId,
    // needs to know which model we're referencing
    ref: "Bootcamp",
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
});

// adding index so user can only add 1 review per bootcamp
// Prevent user from submitting more than 1 review per bootcamp
ReviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

// Static method to get average rating of bootcamp and save
ReviewSchema.statics.getAverageRating = async function (bootcampId) {
  // can call aggregate on the model
  // aggregate returns a promise so have to use await
  // the brackets are called a "pipeline" and there are different steps to a pipeline
  const obj = await this.aggregate([
    {
      // matching the last field of ReviewSchema (bootcamp) with the bootcampId
      $match: { bootcamp: bootcampId },
    },
    {
      // the calculated object we want to create
      $group: {
        // these money signs are required by mongoose
        _id: "$bootcamp",
        // average operator => $avg, and we want that calculated on the rating field
        averageRating: { $avg: "$rating" },
      },
    },
  ]);
  try {
    // can use the bootcamp model by passing in the name of the model
    await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
      // what we want to update/add:
      // the above obj variable is actually an array with an object in it, and we want access to the aggregate average cost the was calculated, we also don't want a decimal, so running Math.ceil then divide by 10 and multiply by 10 so we get an integer
      averageRating: obj[0].averageRating,
    });
  } catch (err) {
    console.error(err);
  }
};

// Middleware for save and remove
// Call a method called getAverageRating after save
ReviewSchema.post("save", function () {
  // since getAverageRating is a static method, need to run it on the model, which can be referenced with this (since we're in the model)
  // getAverageRating takes in the bootcamp, and since on save we save the last field of ReviewSchema (the bootcamp field) which is just the id of the bootcamp, so we pass it in here
  this.constructor.getAverageRating(this.bootcamp);
});

// Call getAverageRating before remove
ReviewSchema.pre("remove", function () {
  this.constructor.getAverageRating(this.bootcamp);
});

module.exports = mongoose.model("Review", ReviewSchema);
