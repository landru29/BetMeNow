'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Team = mongoose.model('Team'),
    Match = mongoose.model('Match'),
    RTM = mongoose.model('RTM'),
    _ = require('lodash');


/**
 * Find team by id
 */
exports.team = function(req, res, next, id) {
  Team.load(id, function(err, team) {
    if (err) return next(err);
    if (!team) return next(new Error('Failed to load team ' + id));
    req.team = team;
    next();
  });
};

/**
 * Create an team
 */
exports.create = function(req, res) {
  var team = new Team(req.body);
  team.user = req.user;
  team.group = team.title[0];

  team.save(function(err) {
    if (err) {
      if (err.hasOwnProperty('code') && err.code === 11000) {
        err.errors = {title: {message: 'Title already exists'}};
      }
      res.json(412, err);
    } else {
      res.jsonp(team);
    }
  });
};

/**
 * Update an team
 */
exports.update = function(req, res) {
  var team = req.team;

  team = _.extend(team, req.body);

  team.save(function(err) {
    if (err) {
      return res.send('users/signup', {
        errors: err.errors,
        team: team
      });
    } else {
      res.jsonp(team);
    }
  });
};

/**
 * Delete an team
 */
exports.destroy = function(req, res) {
  var team = req.team;

  team.remove(function(err) {
    if (err) {
      return res.send('users/signup', {
        errors: err.errors,
        team: team
      });
    } else {
      res.jsonp(team);
    }
  });
};

/**
 * Show an team
 */
exports.show = function(req, res) {
  var team = req.team;
  RTM.find({team: team}, function(err, rtms) {
    team = team.toJSON();
    if (err) {
      console.log(err);
      team.matches = [];
      return res.jsonp(team);
    }
    var criteria = [];
    for (var i=0; i<rtms.length; ++i) {
      criteria.push({teamHome: rtms[i]._id});
      criteria.push({teamAway: rtms[i]._id});
    }
    Match.find({$or: criteria})
      .populate('teamHome')
      .populate('teamAway')
      .sort('date')
      .exec(function(err, matches) {
        if (err) {
          console.log(err);
          matches = [];
        }
        var opts = [
              { path: 'teamHome.team', select: 'country flag points', model: 'Team'},
              { path: 'teamAway.team', select: 'country flag points', model: 'Team'}
        ];
        Match.populate(matches, opts, function(err, matchesP) {
          if (err) {
            console.log(err);
          }
          console.log(matchesP);
          team.matches = matchesP;
          res.jsonp(team);
        });
      });

  });
};

/**
 * List of Teams
 */
exports.all = function(req, res) {
  var query;
  if (req.param('group')) {
    query = Team.aggregate(
      {$match: {}},
      {
        $group: {
          _id: '$group',
          teams: {
            $push: '$$ROOT'
          }
        }
      })
      .sort('_id');
  } else {
    query = Team.find({})
      .sort('title');
  }
  query.exec(function(err, teams) {
      if (err) {
        res.render('error', {
          status: 500
        });
      } else {
        res.jsonp(teams);
      }
    });
};
