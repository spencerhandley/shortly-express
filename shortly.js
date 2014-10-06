var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var User = require('./app/models/user');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// AUTHENICATION
app.use(cookieParser('shhhh, very secret'));
app.use(session());

app.get('/', util.checkSession,
function(req, res) {
  res.render('index');
});

app.get('/create', util.checkSession,
function(req, res) {
  res.render('index');
});

app.get('/login',
function(req, res) {
  res.render('login');
});

app.post('/login',
function(req, res){
  util.logThemIn(req.body.username, req.body.password, function(bool){
   if (bool){
      req.session.regenerate(function(){
        req.session.user = req.body.username;
        res.redirect('/');
      });
    } else {
      res.redirect('/signup', {
        errMessage: 'Sign in failed, would you like to register an account?'
      });
    }
  });
});

app.get('/logout',
function(req, res) {
  res.render('index');
});

app.get('/signup',
function(req, res) {
  res.render('signup');
});

app.post('/signup',
function(req, res) {
  console.log("in the signup post route")
  util.checkUserExists(req.body.username, function(bool){
    console.log("inside check userexists")
    if (bool){
      console.log("username exists")
      res.render('login',{
        errMessage: 'username already exists'
      });
    } else {
      console.log("the username doesn't exists, going to hash pass")
      util.hashPass(req.body.password, function(hash){
        var user = {
          username: req.body.username,
          hash: hash
        };
        console.log("password hashed, going to create user")
        console.log(User)
        Users.create(user).then(function(user){

          console.log("password hashed, user created", user)
          util.logThemIn(req.body.username, req.body.password, function(bool){
            console.log("user created, going to regenerate session")
            if (bool){
              req.session.regenerate(function(){
                req.session.user = req.body.username;
                console.log("session regened, about to redirect...")
                res.redirect('/');
              });
            }
          });
        });
      });
    }
  });
});


app.get('/links', util.checkSession,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', util.checkSession,
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*',  function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
