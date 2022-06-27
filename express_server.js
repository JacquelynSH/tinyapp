const express = require("express");
const req = require("express/lib/request");
const res = require("express/lib/response");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));

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
  // call generateRandomString function and save the value to a variable
  const shortURLs = generateRandomString(req.body.longURL);
  const longURL = req.body.longURL;
  urlDatabase[shortURLs] = longURL;
  res.redirect(`/urls/${shortURLs}`);
});

// Complete the code so that requests to the endpoint "/u/:shortURL" will redirect to its longURL
app.get("/u/:shortURL", (req, res) => {
  // const longURL = req.body.longURL
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

  // const user = {
  //   name: "ian"
  // }

  // const field = "name"
  // user[field] = "john"
