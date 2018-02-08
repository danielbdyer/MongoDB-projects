// configure express
const express = require("express");
const app = express();
const passport = require("passport");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const mustacheExpress = require("mustache-express");

const User = require("./schemas/userschema");
const Snippet = require("./schemas/snippetschema");

app.use(
  require("express-session")({
    secret: "cat",
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride("_method"));

app.engine("mustache", mustacheExpress());
app.set("views", "./views");
app.set("view engine", "mustache");

passport.use(
  "local-register",
  new LocalStrategy(function(username, password, done) {
    process.nextTick(function() {
      User.findOne({ username: username }, function(err, user) {
        if (err) {
          console.log("stop 1");
          return done(err);
        }
        if (user) {
          console.log("stop 2");
          return done(null, false, {
            message: "That email is already in use."
          });
        } else {
          console.log("stop 3");
          var newUser = new User({ username: username, password: password });
          newUser.save(function(err) {
            if (err) throw err;
            return done(null, newUser);
          });
        }
      });
    });
  })
);

passport.use(
  "local-login",
  new LocalStrategy(function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
      if (err) {
        console.log("stop 1");
        return done(err);
      }
      if (!user) {
        console.log("stop 2");
        return done(null, false, { message: "No user found." });
      } else {
        user.comparePassword(password, function(err, isMatch) {
          if (err) throw err;
          if (isMatch) {
            return done(null, username);
          } else {
            return done(null, false, { message: "Wrong password." });
          }
        });
      }
    });
  })
);

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

mongoose.connect("mongodb://localhost/codesnippet");
let db = mongoose.connection; // get the connection object
db.once("open", function() {
  // on connection fire the following event
  console.log("connected");
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

app.post(
  "/register",
  passport.authenticate("local-register", {
    failureRedirect: "/register",
    successRedirect: "/login"
  })
);

app.post(
  "/login",
  passport.authenticate("local-login", {
    failureRedirect: "/login",
    successRedirect: "/"
  })
);

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/dashboard", isLoggedIn, function(req, res) {
  res.render("dashboard", { user: req.user });
});

app.get("/snippets/json", isLoggedIn, function(req, res) {
  Snippet.find(function(error, snippets) {
    res.json(snippets);
  }).select("-__v");
});

// get all users
app.get("/", function(req, res) {
  Snippet.find({ author: req.user }, function(error, snippets) {
    res.render("snippets", { snippets: snippets });
  });
});

app.get("/update/:id", function(req, res) {
  Snippet.findById(req.params.id, function(error, snippet) {
    if (error) {
      res.status(500).send(error);
    } else {
      res.render("update", { snippetupdate: snippet });
    }
  });
});

// adding a new user
app.post("/snippets", isLoggedIn, function(req, res) {
  User.findOne({ username: req.user }, function(error, user) {
    if (error) throw error;

    let title = req.body.title;
    let snippetbody = req.body.snippetbody;

    let tags = req.body.tags
      .replace(/\s/g, "")
      .split(",")
      .map(function(tag) {
        return { tags: tag };
      });

    // save the user in the mongodb database
    let snippet = new Snippet({
      title: req.body.title,
      body: req.body.snippetbody,
      author: user._id,
      tags: tags
    });

    snippet.save(function(error, newSnippet) {
      if (error) {
        console.log(error);
        res.status(500).send(error);
      } else {
        console.log(newSnippet);
        res.redirect("/");
      }
    });
  });
});

app.delete("/snippets/:id", function(req, res) {
  Snippet.findByIdAndRemove(req.params.id, function(error) {
    if (error) {
      console.log(error);
      res.status(500).send(error);
    } else {
      res.redirect("/");
    }
  });
});

app.put("/snippets/:id", function(req, res) {
  Snippet.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        title: req.body.title,
        snippetbody: req.body.snippetbody,
        tag: req.body.tag
      }
    },
    function(error) {
      if (error) {
        console.log(error);
        res.status(500).send(error);
      } else {
        res.redirect("/");
      }
    }
  );
});

//let user = new User({name : 'Albert Doe', age : 56, cohort :"2018"})
//console.log(user)

// fetch all users from the database
/*
User.findOne({
  name : 'John Doe'
},function(error,user){
  console.log(user)
}) */

/*
User.find(function(error,users){
  console.log(users)
}).select('-__v')  // select will get rid of the __v column
*/

// save the user in the mongodb database
/*
user.save(function(error,newUser){

  // if there is error then print out the error
  if(error) {
    console.log(error)
    return
  }

  // if everything is good then print out the new saved user
  console.log(newUser)

}) */

app.listen(3001, function() {
  console.log("Server started....");
});
