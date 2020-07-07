const mongoose = require("mongoose");
const slugify = require("slugify");
const geocoder = require("../utils/geocode");

const BootcampSchema = new mongoose.Schema({
  name: {
    type: String,
    // can just do required: true but if you want a message, put it in [] and add message
    required: [true, "Please add a name"],
    unique: true,
    trim: true,
    maxlength: [50, "Name cannot be more than 50 characters"],
  },
  // a slug is a URL friendly version of the name
  // for the frontend ie. name = Devcentral Bootcamp would be devcentral-bootcamp
  // middleware called slugify that does this for us
  slug: String,
  description: {
    type: String,
    required: [true, "Please add a description"],
    maxlength: [500, "Description cannot be longer than 500 characters"],
  },
  website: {
    type: String,
    // match: [
    // // couldn't get this to be a regex....
    // /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*), "Please use a valid URL with HTTP or HTTPS"
    // ],
  },
  phone: {
    type: String,
    maxlength: [20, "Phone number cannot be longer than 20 characters"],
  },
  email: {
    type: String,
    match: [
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please add a valid email",
    ],
  },
  address: {
    type: String,
    required: [true, "Please add an address"],
  },
  location: {
    // GeoJSON Point
    type: {
      type: String,
      enum: "Point", // location.point must be "Point"
      // required: true,
    },
    coordinates: {
      // type is an array containing numbers
      type: [Number],
      // required: true,
      index: "2dsphere",
    },
    formattedAddress: String,
    street: String,
    city: String,
    state: String,
    zipcode: String,
    country: String,
  },
  careers: {
    // Array of strings
    type: [String],
    required: true,
    // only available values it can have
    enum: [
      "Web Development",
      "Mobile Development",
      "UI/UX",
      "Data Science",
      "Business",
      "Other",
    ],
  },
  averageRating: {
    type: Number,
    min: [1, "Rating must be at least 1"],
    max: [10, "Rating cannot be more than 10"],
  },
  averageCost: Number,
  photo: {
    // the file name
    type: String,
    default: "no-photo.jpg",
  },
  housing: {
    type: Boolean,
    default: false,
  },
  jobAssistance: {
    type: Boolean,
    default: false,
  },
  jobGuarantee: {
    type: Boolean,
    default: false,
  },
  acceptGi: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create bootcamp slug from the name
// .pre and .post and those are executed either before or after the operation (the save in this case)
BootcampSchema.pre("save", function (next) {
  // can access any schema field when we save a bootcamp (a document)
  // setting the slug field equal to the name field after it's been slugified
  // object passed in are options (lower: true means all lower case)
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Geocode & create location field
BootcampSchema.pre("save", async function (next) {
  // can access any of the schema fields using the this keyword
  const loc = await geocoder.geocode(this.address);
  // type and coordinates are the two required fields to have a geo json point
  // all of this can be found in the docs. the reason we're doing loc[0] is it's an array of an object, and we want the first one
  this.location = {
    type: "Point",
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    street: loc[0].streetName,
    city: loc[0].city,
    state: loc[0].stateCode,
    zipcode: loc[0].zipcode,
    country: loc[0].countryCode,
  };
  // Do not save address in DB
  this.address = undefined;
  next();
});

module.exports = mongoose.model("Bootcamp", BootcampSchema);
