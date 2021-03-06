'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Bet = mongoose.model('Bet'),
    Match = mongoose.model('Match'),
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
  var errors = [];
  if (!req.param('match')) {
    errors.push({field: 'match', message: 'The field match is required'});
  }
  if (!req.param('winner')) {
    errors.push({field: 'winner', message: 'The field winner is required'});
  }
  if (errors.length) {
    return res.json(412, errors);
  }
  // TODO: Check if a bet exists
  Bet.findOne({user: req.user, match: req.param('match')}, function(err, bet) {
    if (err) {
      console.log(err);
      return res.json(500, err);
    }
    if (bet) {
      return res.json(401, {message: 'Bet for this match already exists.'});
    }
    Match.findOne({_id: req.param('match')}, function(err, match) {
      if (err) {
        console.log(err);
        return res.json(500, err);
      }
      // Check the date of match is not passed
      var now = new Date();
      if (match.date.getTime() < now.getTime()) {
        return res.json(412, [{message: 'The match has already begun. It\'s too late.'}]);
      }
      bet = new Bet(req.body);
      bet.user = req.user;

      bet.save(function(err) {
        if (err) {
          res.json(412, err);
        } else {
            res.jsonp(bet);
        }
      });
    });
  });
};

/**
 * Update an bet
 */
exports.update = function(req, res) {
  var bet = req.bet;

  // Check that the bet belongs to user
  if (req.param('bet.user') &&
    // The user param is different of the user authenticated
    (req.param('bet.user') !== req.user._id.toString() ||
    // The user param is different of the bet's user
    (req.param('bet.user') !== bet.user._id.toString())) &&
    !req.user.hasRole('admin'))
  {
    return res.json(412, {message: 'You can update only your bets ;-)'});
  }

  bet = _.extend(bet, req.body);

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
    return res.json(412, {message: 'You can remove only your bets ;-)'});
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
  if (req.bet.user._id !== req.user_.id && !req.user.hasRole('admin')) {
    return res.json(403, {message: 'This bet is not for you'});
  }
  res.jsonp(req.bet);
};

/**
 * List of bets
 */
exports.all = function(req, res) {
  var criteria = req.param('query') ? JSON.parse(req.param('query')) : {};
  if (req.param('match')) {
    criteria.match = req.param('match');
  }
  if (req.param('user')) {
    criteria.user = req.param('user');
  }
  var sort = req.param('sort') ? req.param('sort') : '-created';
  var limit = req.param('limit') ? parseInt(req.param('limit'), 10) : null;
  var query = Bet.find(criteria)
    .populate('match')
    .populate('winner')
    .populate('user', 'username')
    .sort(sort);
  if (limit) {
    query.limit(limit);
  }
  query.exec(function(err, bets) {
      if (err) {
        return res.json(500, err);
      }
      var opts = [
        { path: 'winner.team', select: 'country flag points group', model: 'Team'}
      ];
      Bet.populate(bets, opts, function(err, data) {
        if (err) {
          return res.json(500, err);
        }
        res.jsonp(data);
      });
    });
};

exports.myBets = function(req, res) {
  var criteria = {user: req.user._id};
  if (req.param('match')) {
    criteria.match = req.param('match');
  }
  Bet.find(criteria)
    .sort('-created')
    .populate('match')
    .exec(function(err, bets) {
      if (err) {
        return res.json(500, err);
      }
      var opts = [
        { path: 'winner.team', select: 'country flag group', model: 'Team'},
        { path: 'match.teamAway', select: 'team', model: 'RTM'},
        { path: 'match.teamHome', select: 'team', model: 'RTM'}
      ];
      Bet.populate(bets, opts, function(err, data) {
        if (err) {
          return res.json(500, err);
        }
        var opts = [
          { path: 'match.teamAway.team', select: 'country flag group', model: 'Team'},
          { path: 'match.teamHome.team', select: 'country flag group', model: 'Team'}
        ];
        Bet.populate(data, opts, function(err, newData) {
          if (err) {
            return res.json(500, err);
          }
          res.json(data);
        });
      });
    });
};