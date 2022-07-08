const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require("cookie-session");
const getIdFromEmail = require('./helpers.js');

/////////////////////////////////////////////////////////////////
/////// Middleware
/////////////////////////////////////////////////////////////////

const MS_IN_A_DAY = 24 * 60 * 60 * 1000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['secret-keys'],
  maxAge: MS_IN_A_DAY
}));

app.set("view engine", "ejs");

/////////////////////////////////////////////////////////////////
/////// Helper functions
/////////////////////////////////////////////////////////////////

// function to generate 6 random alphanumeric characters
function generateRandomString(site) {
  let result = "";
  const characters = "0123456789abcdefghijklmnopqrstuvwxyz";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * site.length));
  }
  return result;
}

//Helper function for looping through users via email.
const searchUsers = function(userEmail) {
  for (let user in users) {
    if (userEmail === users[user].email) {
      return true;
    }
  }
  return false;
};
//Helper function to access user by user ID.
const getUserByID = function(id) {
  for (let user in users) {
    if (users[user].id === id) {
      return users[user];
    }
  }
  return false;
};

//Check to see if user is logged in
const isUserLoggedIn = function(req) {
  const userId = req.session["userID"];
  const user = users[userId];
  if (user) {
    return true;
  }
  return false;
};

const urlsForUser = function(id) {
  const userUrls = {};
  for (let shortUrl in urlDatabase) {
    let userId = urlDatabase[shortUrl].userID;
    if (userId === id) {
      userUrls[shortUrl] = urlDatabase[shortUrl];
    }
  }
  return userUrls;
};

// Helper function to compare given email and password.
const checkPasswordByEmail = function(email, password) {
  for (let user in users) {
    let userEmail = users[user].email;
    if (userEmail === email) {
      return bcrypt.compareSync(password, users[user].password);
    }
  }
  return false;
};

/////////////////////////////////////////////////////////////////
/////// Database
/////////////////////////////////////////////////////////////////

const users = {};

// Variable to store short and long URL's
const urlDatabase = {};

/////////////////////////////////////////////////////////////////
/////// Routes
/////////////////////////////////////////////////////////////////


//Route handler to pass the URL data to the template.
app.get("/urls", (req, res) => {
  const getUser = getUserByID(req.session.userID);
  const urlVars = { urls: urlsForUser(req.session.userID), email: getUser.email };
  res.render("urls_index", urlVars);
});

app.get("/urls/new", (req, res) => {
  if (!isUserLoggedIn(req)) {
    return res.redirect("/login");
  }
  const getUser = getUserByID(req.session.userID);
  const urlVars = { urls: urlDatabase, email: getUser.email };
  res.render("urls_new", urlVars);
});


app.get("/urls/:id", (req, res) => {
  const userUrls = urlsForUser(req.session["userID"]);
  let longShortURLs;
  console.log("REQ", req.params.id)
  if (req.params.id in userUrls) {
    longShortURLs = {
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      email: getUserByID(req.session.userID).email
    };
    res.render("urls_show", longShortURLs);
  }
  res.status(404).send("Please login");
}); // ERROR THROWING here

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const urlObject = urlDatabase[shortURL];
  if (!urlObject) {
    res.status(404).send("Page not Found");
  }
  res.redirect(urlObject.longURL);
});

app.get("/login", (req, res) => {
  const urlVars = {
    email: req.session["email"],
    password: req.session["password"],
  };
  res.render("user_login", urlVars);
});

// Clears cookies when user has logged out.
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const urlVars = {
    email: req.session["email"],
  };
  res.render("urls_register", urlVars);
});

app.post("/urls", (req, res) => {
  if (!isUserLoggedIn(req)) {
    return res.redirect("/login");
  }
  //call generateRandomString and save the value to a variable
  const shortURLs = generateRandomString(req.body.longURL);
  const longURL = req.body.longURL;
  const userID = req.session["userID"];
  urlDatabase[shortURLs] = { longURL: longURL, userID: userID };
  if (!isUserLoggedIn(req)) {
    res.status(404).send("Please login");
  } else {
    res.redirect(`/urls/${shortURLs}`);
  }
});

// DELETE route
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = urlDatabase[req.params.shortURL];
  if (shortURL.userID === req.session["userID"]) {
    delete urlDatabase[req.params.shortURL];
  } else {
    return res.status(403).send("Requested URL does not belong to user");
  }
  res.redirect("/urls");

});

app.post("/urls/:shortURL", (req, res) => {
  if (!isUserLoggedIn(req)) {
    return res.redirect("/login");
  } if (urlDatabase[req.params.shortURL].userID !== req.session.userID) {
    return res.redirect("/login");
  }
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  let userEmail = req.body.email;
  let userPassword = req.body.password;
  const checkEmail = searchUsers(userEmail);
  const userDatabase = users;
  let checkPassword = checkPasswordByEmail(userEmail, userPassword);
  let userID = getIdFromEmail(userEmail, userDatabase);
  // condition checking if no password or email entered.
  if (!checkEmail && !userPassword) {
    return res.status(400).send("Enter email and password");
    // checking if email exists in users object.
  } else if (!checkEmail) {
    return res.status(403).send("e-mail cannot be found");
    // checking if given password matches given email.
  } else if (checkEmail && !checkPassword) {
    return res.status(403).send("Password incorrect");
    // stores cookies if email and password are correct/exist.
  } else if (checkEmail && checkPassword) {
    // res.cookie("userID", userID);
    req.session.userID = userID;
  }
  res.redirect("/urls");
});

// Registering a new user.
app.post("/register", (req, res) => {
  let userID = generateRandomString(req.body.email);
  let userEmail = req.body.email;
  let userPassword = req.body.password;
  //hash password
  const hashedPassword = bcrypt.hashSync(userPassword, 10);
  // Checks if email is already in use.
  if (searchUsers(userEmail)) {
    return res.status(400).send("email already in use");
    // check if fields are not blank.
  } else if (!userEmail || !userPassword) {
    return res.status(400).send("Enter email and password");
  }
  // Add new user to the users object.
  users[userID] = { id: userID, email: userEmail, password: hashedPassword };
  //set cookie
  req.session.userID = userID;
  res.redirect("/urls");
  console.log(users)
});

/////////////////////////////////////////////////////////////////
/////// Listener
/////////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});