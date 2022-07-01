const express = require("express");
const req = require("express/lib/request");
const res = require("express/lib/response");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const { Template } = require("ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

// function to generate 6 random alphanumeric characters
function generateRandomString(site) {
  let result = "";
  const characters = '0123456789abcdefghijklmnopqrstuvwxyz';
  let newSite = site.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * newSite));
  }
  return result;
}

// variable assigned to an empty object to store user info
const users = {

};

// helper function for looping through users
const searchUsers = function(emailofuser) {
  for (let user in users) {
    let email = users[user].email;
    if (emailofuser === email) {
      return true;
    }
  }
  return false;
};

const getUserByID = function(id) {
  for (let user in users) {
    let userId = users[user].id;
    if (userId === id) {
      return users[user];
    }
  }
  return false;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// '/' registers a handler on the root path
app.get('/', (req, res) => {
  res.send("Hello!");
});

// PORT listener
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});
//html added to webpage
app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

// added route handler to pass the URL data to template
app.get("/urls", (req, res) => {
  const getUser = getUserByID(req.cookies.userID);
  const urlVars =
  { urls: urlDatabase,
    email: getUser.email
  };
  res.render("urls_index", urlVars);
});

app.get("/urls/new", (req, res) => {
  const urlVars =
  { urls: urlDatabase,
    email: req.cookies['email']
  };
  res.render("urls_new", urlVars);
});

//accessing urlDatabase variable
app.get("/urls/:shortURL", (req, res) => {
  const longShortURLs = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], email: req.cookies['email']};
  res.render("urls_show", longShortURLs);
});

//defines the route that will match the POST request and handle it. logs the request body and gives a dummy response.
app.post("/urls", (req, res) => {
  // call generateRandomString function and save the value to a variable
  const shortURLs = generateRandomString(req.body.longURL);
  const longURL = req.body.longURL;
  urlDatabase[shortURLs] = longURL;
  res.redirect(`/urls/${shortURLs}`);
});

// Complete the code so that requests to the endpoint "/u/:shortURL" will redirect to its longURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  if (!longURL) {
    res.status(404).send("Page not Found");
  }
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls");
});


app.post("/login", (req, res) => {
  let userEmail = req.body.email;
  let userPassword = req.body.password;
  // let userID;
  const checkEmail = searchUsers(userEmail);
  if (!checkEmail) {
    return res.status(403).send("e-mail cannot be found");
  } else if (checkEmail && !userPassword) {
    //needs to also check if password is incorrect, only checking if there or not
    return res.status(403).send("Password incorrect");
  } else if (checkEmail && userPassword) {
    for (let user in users) {
      let email = users[user].email;
      if (userEmail === email) {
        if (users[user].password === userPassword) {
          res.cookie("userID", users[user].id);
        }
      }
    }
  }
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('email');
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const urlVars = {
    email: req.cookies['email']
  };
  res.render("urls_register", urlVars);
});

app.post("/register", (req, res) => {

  let userID = generateRandomString(req.body.email);
  let userEmail = req.body.email;
  let userPassword = req.body.password;
  // add new user to user object

  if (searchUsers(userEmail)) {
    return res.status(400).send("email already in use");
  } else if (!userEmail || !userPassword) {
    return res.status(400).send("Enter email and password");
  }
  users[userID] = {id: userID, email: userEmail, password: userPassword};
  //set cookie
  res.cookie("userID", userID);
  res.redirect("/urls");
  console.log(users);
});

app.get("/login", (req, res) => {
  const urlVars = {
    email: req.cookies['email'],
    password: req.cookies['password']
  };
  res.render("user_login", urlVars);
});




