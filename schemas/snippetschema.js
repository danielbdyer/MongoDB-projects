const mongoose = require("mongoose");
const Tag = require("./tagschema.js");

// definining the schema for the user
let tagSchema = mongoose.Schema({
  name: String
});

let snippetSchema = mongoose.Schema({
  title: String,
  body: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  tags: [tagSchema]
});

// creating the model for the user
// This will allow the mongodb to create the users collection
// with the name users (plural and lower case)
module.exports = mongoose.model("Snippet", snippetSchema);
