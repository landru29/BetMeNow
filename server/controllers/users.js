'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Bet = mongoose.model('Bet');

/**
 * Auth callback
 */
 exports.authCallback = function(req, res) {
  res.redirect('/');
};

/**
 * Show login form
 */
 exports.signin = function(req, res) {
  if(req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.redirect('#!/login');
};

/**
 * Logout
 */
 exports.signout = function(req, res) {
  req.logout();
  res.redirect('/');
};

/**
 * Create user
 */
exports.create = function(req, res, next) {
  var user = new User(req.body);

  // because we set our user.provider to local our models/user.js validation will always be true
  req.assert('email', 'You must enter a valid email address').isEmail();
  req.assert('password', 'Password must be between 8-20 characters long').len(8, 20);
  req.assert('username', 'Username cannot be more than 20 characters').len(1,20);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  var errors = req.validationErrors();
  if (errors) {
    return res.status(400).send(errors);
  }

  // Hard coded for now. Will address this with the user permissions system in v0.3.5
  user.roles = ['authenticated'];
  user.save(function(err) {
    if (err) {
      switch (err.code) {
        case 11000:
        case 11001:
        res.status(400).send('Username already taken');
        break;
        default:
        res.status(400).send('Please fill all the required fields');
      }

      return res.status(400);
    }
    req.logIn(user, function(err) {
      if (err) return next(err);
      return res.redirect('/');
    });
    res.status(201);
  });
};
/**
 * Send User
 */
 exports.me = function(req, res) {
  res.jsonp(req.user || null);
};

/**
 * Find user by id
 */
exports.user = function(req, res, next, id) {
  if (id === 'me') {
    req.profile = req.user || null;
    next();
  } else {
    User.findOne({_id: id})
    .exec(function(err, user) {
      if (err) return next(err);
      if (!user) return next(new Error('Failed to load User ' + id));
      req.profile = user;
      next();
    });
  }
};

exports.bets = function(req, res) {
  if (req.profile === null) {
    return res.json(403, {message: 'You must be authenticated for get your bets'});
  }
  var criteria = {user: req.profile._id};
  if (req.param('match')) {
    criteria.match = req.param('match');
  }
  console.log(criteria);
  Bet.find(criteria)
    .sort('-created')
    .populate('winner')
    .exec(function(err, bets) {
      if (err) {
        return res.json(500, err);
      }
      console.log(bets);
      var opts = [
        { path: 'winner.team', select: 'country flag points', model: 'Team'}
      ];
      Bet.populate(bets, opts, function(err, data) {
        res.json(data);
      });
    });
};

exports.all = function(req, res) {
  var criteria = req.param('query') ? JSON.parse(req.param('query')) : {};
  var sort = req.param('sort') ? req.param('sort') : 'date';
  var limit = req.param('limit') ? parseInt(req.param('limit'), 10) : null;
  var query = User.find(criteria, 'created username').sort(sort);
  if (limit) {
    query.limit(limit);
  }
  query.exec(function(err, users) {
    if (err) {
      return res.json(500, {message: err});
    }
    res.json(200, users);
  });
};