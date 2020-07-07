const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Please add a course title"],
  },
  description: {
    type: String,
    required: [true, "Please add a description"],
  },
  weeks: {
    type: String,
    required: [true, "Please add number of weeks"],
  },
  tuition: {
    type: Number,
    required: [true, "Please add a tuition cost"],
  },
  minimumSkill: {
    type: String,
    required: [true, "Please add a minimum skill"],
    enum: ["beginner", "intermediate", "advanced"],
  },
  scholarshipAvailable: {
    type: Boolean,
    default: false,
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
});

// in mongoose, have statics (static method) and methods
// statics: call it on the actual model ie. Course.goFish()
// methods: call it on whatever you create/get from the model (basically the query) ie:
/*
const courses = Course.find();
courses.goFish();
*/

// Static method to get average of course tuitions
CourseSchema.statics.getAverageCost = async function (bootcampId) {
  // can call aggregate on the model
  // aggregate returns a promise so have to use await
  // the brackets are called a "pipeline" and there are different steps to a pipeline
  const obj = await this.aggregate([
    {
      // matching the last field of CourseSchema (bootcamp) with the bootcampId
      $match: { bootcamp: bootcampId },
    },
    {
      // the calculated object we want to create
      $group: {
        // these money signs are required by mongoose
        _id: "$bootcamp",
        // average operator => $avg, and we want that calculated on the tuition field
        averageCost: { $avg: "$tuition" },
      },
    },
  ]);
  try {
    // can use the bootcamp model by passing in the name of the model
    await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
      // what we want to update/add:
      // the above obj variable is actually an array with an object in it, and we want access to the aggregate average cost the was calculated, we also don't want a decimal, so running Math.ceil then divide by 10 and multiply by 10 so we get an integer
      averageCost: Math.ceil(obj[0].averageCost / 10) * 10,
    });
  } catch (err) {
    console.error(err);
  }
};

// Middleware for save and remove
// Call a method called getAverageCost after save
CourseSchema.post("save", function () {
  // since getAverageCost is a static method, need to run it on the model, which can be referenced with this (since we're in the model)
  // getAverageCost takes in the bootcamp, and since on save we save the last field of CourseSchema (the bootcamp field) which is just the id of the bootcamp, so we pass it in here
  this.constructor.getAverageCost(this.bootcamp);
});

// Call getAverageCost before remove
CourseSchema.pre("remove", function () {
  this.constructor.getAverageCost(this.bootcamp);
});

module.exports = mongoose.model("Course", CourseSchema);
