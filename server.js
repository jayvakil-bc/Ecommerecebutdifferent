/********************************************************************************
* WEB322 – Assignment 06
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
*
* Name: Prit Jitendrakumar Patel     Student ID: 118975226     Date: 2024-08-15
*
* Published Website: https://worrisome-bat-long-johns.cyclic.app/
*
********************************************************************************/
const legoData = require('./modules/legoSets');
const authData = require('./modules/auth-service');
const clientSessions = require('client-sessions');
const path = require('path');
const express = require('express');
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); 
app.set('view engine', 'ejs');

app.use(
  clientSessions({
    cookieName: "session",
    secret: "secret_string_a6",
    duration: 24 * 60 * 60 * 1000,
    activeDuration: 1000 * 60 * 5,
  })
); 

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

app.get("/", (req, res) => res.render('home'));

app.get("/register", (req, res) => {
  res.render("register", {
    errorMessage: "",
    successMessage: "",
    userName: "",
  });
});

app.post('/register', async (req, res) => {
  try {
    const userData = req.body;
    await authData.registerUser(userData);
    res.render('register', { successMessage: "User created" });
  } catch (error) {
    res.render('register', { errorMessage: error, userName: req.body.userName });
  }
});

app.get("/login", (req, res) => {
  res.render("login", { errorMessage: "", userName: "" });
});

app.post('/login', async (req, res) => {
  try {
    req.body.userAgent = req.get('User-Agent');
    const user = await authData.checkUser(req.body);
    req.session.user = {
      userName: user.userName,
      email: user.email,
      loginHistory: user.loginHistory
    };
    res.redirect('/lego/sets');
  } catch (error) {
    res.render('login', { errorMessage: error, userName: req.body.userName });
  }
});

app.get("/about", (req, res) => res.render('about'));

app.get("/lego/sets/", async (req, res) => {
  const theme = req.query.theme;
  try {
    const sets = theme
      ? await legoData.getSetsByTheme(theme)
      : await legoData.getAllSets();
    if (sets.length === 0) {
      res
        .status(404)
        .render("404", { message: "No sets found for a matching theme" });
    } else {
      res.render("sets", { sets });
    }
  } catch (error) {
    res.status(500).render("500", { message: "Internal Server Error" });
  }
});

app.get("/lego/sets/:num", async (req, res) => {
  try {
    const set = await legoData.getSetByNum(req.params.num);
    if (set) {
      res.render("set", { set });
    } else {
      res
        .status(404)
        .render("404", { message: "The requested Lego set was not found" });
    }
  } catch (error) {
    res.status(500).render("500", { message: "Internal Server Error" });
  }
});

app.get('/lego/addSet', ensureLogin, async (req, res) => {
  try {
    const themes = await legoData.getAllThemes();
    res.render('addSet', { themes });
  } catch (error) {
    console.error('Error fetching themes:', error);
    res.render('500', { message: `I'm sorry, but we have encountered an error: ${error}` });
  }
});

app.post('/lego/addSet', ensureLogin, async (req, res) => {
  try {
    await legoData.addSet(req.body);
    res.redirect('/lego/sets');
  } catch (error) {
    console.error('Error adding set:', error);
    res.render('500', { message: `I'm sorry, but we have encountered an error: ${error}` });
  }
});

app.get('/lego/editSet/:num', ensureLogin, async (req, res) => {
  try {
    const set = await legoData.getSetByNum(req.params.num);
    const themes = await legoData.getAllThemes();
    res.render('editSet', { set, themes });
  } catch (error) {
    console.error('Error fetching set for edit:', error);
    res.status(404).send('Set not found');
  }
});

app.post('/lego/editSet', ensureLogin, async (req, res) => {
  try {
    const setNum = req.body.set_num;
    const setData = req.body;
    await legoData.editSet(setNum, setData);
    res.redirect(`/lego/sets/${setNum}`);
  } catch (error) {
    console.error('Error updating set:', error);
    res.render('500', { message: `An error occurred while updating the set: ${error}` });
  }
});

app.get('/lego/deleteSet/:num', ensureLogin, async (req, res) => {
  try {
    const setNum = req.params.num;
    await legoData.deleteSet(setNum);
    res.redirect('/lego/sets');
  } catch (error) {
    console.error('Error deleting set:', error);
    res.status(500).render('500', { message: `I'm sorry, but we have encountered the following error: ${error}` });
  }
});

app.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});

app.get('/userHistory', ensureLogin, (req, res) => {
  res.render('userHistory', { loginHistory: req.session.user.loginHistory });
});

app.use((req, res) => {
  res.status(404).render("404", { message: "I'm sorry, we're unable to find what you're looking for." });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.status === 404) {
    res.status(404).render("404", { message: "Page not found" });
  } else {
    res.status(500).render("500", { message: "Internal Server Issue" });
  }
});

legoData.initialize().then(authData.initialize).then(()=>{
  app.listen(HTTP_PORT, () => { console.log(`server running on: http://localhost:${HTTP_PORT}`) });
});
module.exports = app;