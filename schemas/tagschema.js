const mongoose = require("mongoose");

// definining the schema for the user
let tagSchema = mongoose.Schema({
  name: String
});

// creating the model for the user
// This will allow the mongodb to create the users collection
// with the name users (plural and lower case)
module.exports = mongoose.model("Tag", tagSchema);
