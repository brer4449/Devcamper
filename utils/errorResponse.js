// anything that isn't middleware and a helper or a utility put in this folder
class ErrorResponse extends Error {
  // constructor is a method that runs when we instantiate an object from the class
  // takes in a message so we can send out an error message and a statusCode that we can customize
  constructor(message, statusCode) {
    // super calls the class we're extending from, their constructor and pass in our message (overwrite their message property?)
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ErrorResponse;
