const express = require("express");
const req = require("express/lib/request");
const res = require("express/lib/response");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

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
  const urlVars = { urls: urlDatabase };
  res.render("urls_index", urlVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//accessing urlDatabase variable
app.get("/urls/:shortURL", (req, res) => {
  const longShortURLs = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", longShortURLs);
});

//defines the route that will match the POST request and handle it. logs the request body and gives a dummy response.
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

// function to generate 6 random alphanumeric characters
function generateRandomString(site) {
  let result = "";
  const characters = '0123456789abcdefghijklmnopqrstuvwxyz';
  let newSite = site.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * newSite));
  }
return result;
};

console.log(generateRandomString('www.blahblah.com'));