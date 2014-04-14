'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Bet = mongoose.model('Bet'),
    _ = require('lodash');


/**
 * Find bet by id
 */
exports.bet = function(req, res, next, id) {
  Bet.load(id, function(err, bet) {
    if (err) return next(err);
    if (!bet) return next(new Error('Failed to load bet ' + id));
    req.bet = bet;
    next();
  });
};

/**
 * Create an bet
 */
exports.create = function(req, res) {
  var bet = new Bet(req.body);
  bet.user = req.user;
  console.log(bet);

  bet.save(function(err) {
    if (err) {
      res.json(412, err);
    } else {
        res.jsonp(bet);
    }
  });
};

/**
 * Update an bet
 */
exports.update = function(req, res) {
  var bet = req.bet;

  bet = _.extend(bet, req.body);

  if (req.user._id !== bet.user._id && !req.user.hasRole('admin')) {
    return res.json(412, {message: 'You can update only your bets ;-)'});
  }

  bet.save(function(err) {
    if (err) {
      return res.json(412, {
        errors: err.errors,
        bet: bet
      });
    } else {
      res.jsonp(bet);
    }
  });
};

/**
 * Delete an bet
 */
exports.destroy = function(req, res) {
  var bet = req.bet;
  
  if (req.user._id !== bet.user._id && !req.user.hasRole('admin')) {
    return res.json(412, {message: 'You can update only your bets ;-)'});
  }

  bet.remove(function(err) {
    if (err) {
      return res.json(412, {
        errors: err.errors,
        bet: bet
      });
    } else {
      res.jsonp(bet);
    }
  });
};

/**
 * Show an bet
 */
exports.show = function(req, res) {
  res.jsonp(req.bet);
};

/**
 * List of bets
 */
exports.all = function(req, res) {
  var criteria = {};
  if (req.param('match')) {
    criteria.match = req.param('match');
  }
  if (req.param('user')) {
    criteria.user = req.param('user');
  }
  Bet.find()
    .sort('-created')
    .exec(function(err, bets) {
      if (err) {
        return res.json(500, err);
      }
      var opts = [
        { path: 'winner.team', select: 'country flag points', model: 'Team'}
      ];
      var promise = Bet.populate(bets, opts);
      promise.then(function(data) {
        res.jsonp(data);
      }).end();
    });
};
