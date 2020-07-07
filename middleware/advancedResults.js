const advancedResults = (model, populate) => async (req, res, next) => {
  let query;
  // our copied version of req.query
  const reqQuery = { ...req.query };
  // Fields to exclude (that we don't want to be matched for filtering)
  const removeFields = ["select", "sort", "limit", "page"];
  // Loop over removeFields & delete them from reqQuery
  removeFields.forEach((param) => delete reqQuery[param]);
  // Create out query string
  let queryStr = JSON.stringify(reqQuery);
  // inserting a money sign in front of greater than less than, etc. since $ is needed to make it a mongoose operator
  // in regex "in" searches a list
  // Create operators ($gt, $gte, etc.)
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );
  // Finding resource
  query = model.find(JSON.parse(queryStr));
  // Select fields
  if (req.query.select) {
    // turn it into an array and then join them without commas
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }
  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    // descending is the minus sign, and createdAt is from our model
    query = query.sort("-createdAt");
  }
  // Pagination
  // turning it into a number, and setting radix (base 10) as second param or page 1 as default if not specified
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  // a Mongoose method that lets us count all the documents
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  // express makes it really easy access to query params via req.query
  // console.log(req.query);

  // if something is passed into populate, set the query to be itself populated with whatever is in populate
  if (populate) {
    query = query.populate(populate);
  }

  // Executing our query
  const results = await query;
  // Pagination result
  const pagination = {};
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }
  // creating an object on the response object that we can use within any routes that use this middleware
  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  };
  next();
};

module.exports = advancedResults;
