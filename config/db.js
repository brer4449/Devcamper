const mongoose = require("mongoose");

const connectDB = async () => {
  // first param is URI (which we got from Atlas) second param are options
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    // if we don't add these, will get warnings in console later on
  });
  console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold);
};

module.exports = connectDB;
// Mongoose methods returns a promise!
