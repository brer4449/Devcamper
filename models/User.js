const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    match: [
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please add a valid email",
    ],
  },
  role: {
    type: String,
    enum: ["user", "publisher"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: 6,
    // when we get a user through our API, it won't show the password
    select: false,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt
UserSchema.pre("save", async function (next) {
  // having this middleware should hash our password
  // need to generate a salt to use that to hash the password
  // gensalt is a method on bcrypt object, which returns a promise, thus using await, takes in a number of rounds, the higher the rounds the more secure, but the heavier it is on your system, 10 is recommend in docs...
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Mongoose method
// since it's a method and not a static, calling it on the actual user, so we have access to that user's id
// this keyword pertains to the current user
// Sign JSON Web Token and return
// JWT have 3 parts to them, first is algorithm and token type, next is the payload data (whatever we want sent in the token (user id, issuedAt etc.)), and last part is the verify signature
// want the user id so that when a user sends a request with the token, we know which user is
// if we want the logged in user's profile, we can look at the token and get the data part (of the token) and pull out the user id and use that in a mongoose query to get that correct user
UserSchema.methods.getSignedJwtToken = function () {
  // the jwt sign method takes in the payload, next param is the secret, last param is any options we want
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

module.exports = mongoose.model("User", UserSchema);
