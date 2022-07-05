const express = require("express");
const req = require("express/lib/request");
const res = require("express/lib/response");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { Template } = require("ejs");
const bcrypt = require('bcryptjs');

/////////////////////////////////////////////////////////////////
/////// Middleware
/////////////////////////////////////////////////////////////////

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");

/////////////////////////////////////////////////////////////////
/////// Helper functions
/////////////////////////////////////////////////////////////////

// function to generate 6 random alphanumeric characters
function generateRandomString(site) {
  let result = "";
  const characters = "0123456789abcdefghijklmnopqrstuvwxyz";
  let newSite = site.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * newSite));
  }
  return result;
}

//Helper function for looping through users via email.
const searchUsers = function(emailofuser) {
  for (let user in users) {
    let email = users[user].email;
    if (emailofuser === email) {
      return true;
    }
  }
  return false;
};
//Helper function to access user by user ID.
const getUserByID = function(id) {
  for (let user in users) {
    let userId = users[user].id;
    if (userId === id) {
      return users[user];
    }
  }
  return false;
};

//Helper function to access user Id by given email.
const getIdFromEmail = function(email) {
  for (let user in users) {
    let userEmail = users[user].email;
    if (userEmail === email) {
      return users[user].id;
    }
  }
  return false;
};
//Check to see if user is logged in
const isUserLoggedIn = function(req) {
  const userId = req.cookies["userID"];
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

const users = {

};
// Variable to store short and long URL's
const urlDatabase = {
  // "b2xVn2": "http://www.lighthouselabs.ca",
  // "9sm5xK": "http://www.google.com"
};


/////////////////////////////////////////////////////////////////
/////// Listener
/////////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

/////////////////////////////////////////////////////////////////
/////// Routes
/////////////////////////////////////////////////////////////////

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Route handler to pass the URL data to the template.
app.get("/urls", (req, res) => {
  const getUser = getUserByID(req.cookies.userID);
  const urlVars = { urls: urlDatabase, email: getUser.email };
  res.render("urls_index", urlVars);
});

app.get("/urls/new", (req, res) => {
  // check if user is logged in
  if (!isUserLoggedIn(req)) {
    return res.redirect("/login");
  }
  const urlVars = { urls: urlDatabase, email: req.cookies["email"] };
  res.render("urls_new", urlVars);
});

app.get("/urls/:id", (req, res) => {
  console.log("params:", req.params.id);
  console.log("URLDatabase;", urlDatabase);
  const userUrls = urlsForUser(req.cookies["userID"]);
  let longShortURLs;
  if (req.params.id in userUrls) {
    console.log("URLS", userUrls);
    longShortURLs = {
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      email: req.cookies["email"]
    };

  }
  res.render("urls_show", longShortURLs);
});


app.post("/urls", (req, res) => {
  //call generateRandomString and save the value to a variable
  const shortURLs = generateRandomString(req.body.longURL);
  const longURL = req.body.longURL;
  const userID = req.cookies["userID"];
  urlDatabase[shortURLs] = { longURL: longURL, userID: userID };
  // console.log("LONGURL:", longURL);
  // console.log("URLDATA:", urlDatabase);
  if (!isUserLoggedIn(req)) {
    res.status(404).send("Please login");
  } else {
    res.redirect(`/urls/${shortURLs}`);
  }
});

// EDIT? - still need to figure out how to not allow user to edit if id does not match
app.get("/u/:shortURL", (req, res) => {
  // const userUrls = urlsForUser(req.cookies["userID"]);
  const shortURL = req.params.shortURL;
  const urlObject = urlDatabase[shortURL];
  if (!urlObject) {
    res.status(404).send("Page not Found");
  }
  res.redirect(urlObject.longURL);
});

// DELETE
app.post("/urls/:shortURL/delete", (req, res) => {
  const userUrls = urlsForUser(req.cookies["userID"]);
  if (req.params.id in userUrls) {
    delete urlDatabase[req.params.shortURL];
  } else {
    return res.status(403).send("Requested URL does not belong to user");
  }
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const urlVars = {
    email: req.cookies["email"],
    password: req.cookies["password"],
  };
  res.render("user_login", urlVars);
});


app.post("/login", (req, res) => {
  let userEmail = req.body.email;
  let userPassword = req.body.password;
  const checkEmail = searchUsers(userEmail);
  let checkPassword = checkPasswordByEmail(userEmail, userPassword);
  let userID = getIdFromEmail(userEmail);

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
    res.cookie("userID", userID);
  }

  res.redirect("/urls");
});

// Clears cookies when user has logged out.
app.post("/logout", (req, res) => {
  res.clearCookie("userID");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const urlVars = {
    email: req.cookies["email"],
  };
  res.render("urls_register", urlVars);
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
  res.cookie("userID", userID);
  res.redirect("/urls");
  console.log("USERS", users);
});

