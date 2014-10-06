var request = require('request');
var User = require('../app/models/user');
var bcrypt = require('bcrypt-nodejs');

exports.getUrlTitle = function(url, cb) {
  request(url, function(err, res, html) {
    if (err) {
      console.log('Error reading url heading: ', err);
      return cb(err);
    } else {
      var tag = /<title>(.*)<\/title>/;
      var match = html.match(tag);
      var title = match ? match[1] : url;
      return cb(err, title);
    }
  });
};

var rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

exports.isValidUrl = function(url) {
  return url.match(rValidUrl);
};

/************************************************************/
// Add additional utility functions below
/************************************************************/


// exports.comparePass = comparePass = function(userHash, hashFromDB, cb){

//   var user = {};

//   var salt = bcrypt.genSalt(10,function(err, salt){
//     if (err) throw err;
//     bcrypt.hash(userInput.password, salt, function(err, hash){
//       if(err) throw err;
//       user.password = hash

//     });
//   });

// // query database

// // return true or false

// }

exports.checkUserExists = function(username, callback){
  new User({username: username})
  .fetch()
  .then(function(model){
    console.log("inside then", model)

    if(model === null) {
      callback(false)
    } else {
      callback(true)
    }
  });
};


exports.hashPass = hashPass = function(password, callback) {
  bcrypt.genSalt(10, function(err,salt){
    if (err) {
      throw err;
    } else {
      bcrypt.hash(password, salt, null, function(err,hash){
        if (err) {
          throw err;
        } else {
          callback(hash);
        }
      });
    }
  });
};

exports.logThemIn = function (username, pass, callback) {
  new User({username:username})
    .fetch()
    .then(function(user){
      console.log("user exists,", user)
      bcrypt.compare(pass, user.attributes.hash, function(err, res) {
        if(res){
          callback(true)
        } else {
          callback(false)
        }
      });
    });
}

exports.checkSession = function(req,res,next) {
  if (req.session.user) {
    next()
  } else {
    req.session.error = "Access Denied!";
    res.redirect('/login');
  }
}





