'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Match = mongoose.model('Match'),
  	Team = mongoose.model('Team'),
  	RTM = mongoose.model('RTM'),
    Bet = mongoose.model('Bet'),
    _ = require('lodash');


/**
 * Find match by id
 */
exports.match = function(req, res, next, id) {
    Match.load(id, function(err, match) {
        if (err) return next(err);
        if (!match) return next(new Error('Failed to load match ' + id));
        req.match = match;
        next();
    });
};

/**
 * Create an match
 */
exports.create = function(req, res) {
    var match = new Match(req.body);
	console.log(match);

    match.save(function(err) {
        if (err) {
			res.json(412, err);
        } else {
            res.jsonp(match);
        }
    });
};

/**
 * Update an match
 */
exports.update = function(req, res) {
    var match = req.match;

    match = _.extend(match, req.body);

    match.save(function(err) {
        if (err) {
            return res.send('users/signup', {
                errors: err.errors,
                match: match
            });
        } else {
            res.jsonp(match);
        }
    });
};

/**
 * Delete an match
 */
exports.destroy = function(req, res) {
    var match = req.match;

    match.remove(function(err) {
        if (err) {
            return res.send('users/signup', {
                errors: err.errors,
                match: match
            });
        } else {
            res.jsonp(match);
        }
    });
};

/**
 * Show an match
 */
exports.show = function(req, res) {
	var opts = [
        { path: 'teamHome.team', select: 'country flag points group', model: 'Team'},
        { path: 'teamAway.team', select: 'country flag points group', model: 'Team'}
	];
	Match.populate(req.match, opts, function(err, data) {
		res.jsonp(data);
	});
};

exports.levels = function(req, res) {
  Match.aggregate(
    {$match: {}},
    {
      $group: {
        _id: {
          level: '$level'
        },
        dates: { $addToSet: {
          year : { $year : '$date' },
          month : { $month : '$date' },
          day : { $dayOfMonth : '$date' }
        }}
      }
    },{
      $project: {
        _id: 0,
        level: '$_id.level',
        dates: '$dates'
      }
    })
    .sort('-level dates')
    .exec(function(err, levels) {
      if (err) {
        res.json(500, {message: err});
      } else {
        for (var i = 0; i < levels.length; i++) {
          for (var j = 0; j < levels[i].dates.length; j++) {
            levels[i].dates[j] = new Date(levels[i].dates[j].year, levels[i].dates[j].month-1, levels[i].dates[j].day);
          }
          levels[i].dates.sort(function(a, b) {
            return (a === b) ? 0 : (a < b) ? -1 : 1;
          });
        }
        res.jsonp(levels);
      }
    });
};

var sortMatchesDate = function(a, b) {
  return (a._id === b._id) ? 0 : (a._id < b._id) ? -1 : 1;
};

/**
 * Populate matches's teams
 */
var populateMatch = function(group, getTeam) {
  group._id = new Date(group._id.year, group._id.month - 1, group._id.day);
  for (var m = 0; m < group.matches.length; ++m) {
    // Find teams
    var teamHomeId = group.matches[m].teamHome;
    var teamAwayId = group.matches[m].teamAway;
    group.matches[m].teamA = getTeam(teamHomeId);
    group.matches[m].teamB = getTeam(teamAwayId);
  }
  return group;
};

/**
 * Matches grouped by levels and date
 */
var groupedByLevel = function(req, res) {
  Match.aggregate(
    {$match: {}},
    {
      $group: {
        _id: {
          year : { $year : '$date' },
          month : { $month : '$date' },
          day : { $dayOfMonth : '$date' },
        },
        level: {$max: '$level'},
        matches: {
          $push: '$$ROOT'
        }
      }
    },
    {
      $group: {
        _id: '$level',
        matches: { $push: {
          _id: '$_id',
          matches: '$matches'
        } }
      }
    }, {
      $project: {
        _id: 0,
        level: '$_id',
        matchesByDate: '$matches'
      }
    })
    .sort('-level')
    .exec(function(err, levels) {
      if (err) {
        console.log(err);
        return res.json(500, {message: err});
      }
      if (levels.length <= 0) {
        return res.json(200, levels);
      }
      // populate teams
      Team.find({}, function(err, teams) {
        if (err) {
          console.log(err);
          return res.json(500, {message: err});
        }
        RTM.find({}, function(err, rtms) {
          if (err) {
            console.log(err);
            return res.json(500, {message: err});
          }
          var getTeam = function(rtmId) {
            for (var r = 0; r < rtms.length; ++r) {
              if (rtmId === rtms[r]._id && rtms[r].team) {
                for (var i = 0; i < teams.length; ++i) {
                  if (teams[i]._id.toString() === rtms[r].team.toString()) {
                    return teams[i];
                  }
                }
              }
            }
            return null;
          };
          for (var l=0; l < levels.length; ++l) {
            for (var i = 0; i < levels[l].matchesByDate.length; i++) {
              levels[l].matchesByDate[i] = populateMatch(levels[l].matchesByDate[i], getTeam);
            }
            levels[l].matchesByDate.sort(sortMatchesDate);
          }
          res.jsonp(levels);
        });
      });
    });
};

/**
 * List of matches
 */
exports.all = function(req, res) {
  if (req.param('group')) {
    return groupedByLevel(req, res);
  }
  var criteria = req.param('query') ? JSON.parse(req.param('query')) : {};
  var sort = req.param('sort') ? req.param('sort') : 'date';
  var limit = req.param('limit') ? parseInt(req.param('limit'), 10) : null;
	var query = Match.find(criteria)
		.populate('teamHome', 'team')
		.populate('teamAway', 'team')
		.sort(sort);
    if (limit) {
      query.limit(limit);
    }
	query.exec(function(err, matches) {
		if (err) {
      console.log(err);
			return res.json(500, {message: err});
		}
    var opts = [
      { path: 'teamHome.team', select: 'shortcountry country flag points group', model: 'Team'},
      { path: 'teamAway.team', select: 'shortcountry country flag points group', model: 'Team'}
    ];
    Match.populate(matches, opts, function(err, data) {
      if (err) {
        console.log(err);
        return res.json(500, {message: err});
      }
      res.jsonp(data);
    });
	});
};

/**
 * Return the bets of match
 */
module.exports.bets = function(req, res) {
  Bet.aggregate(
    {$match: {match: req.match._id}},
    {
      $group: {
        _id: '$winner',
        count: {$sum: 1},
        bets: {
          $push: {
            _id: '$_id',
            winner: '$winner',
            user: '$user',
            score: '$score',
            created: '$created'
          }
        }
      }
    })
    .sort('bets.created')
    .exec(function(err, results) {
      if (err) {
        console.log(err);
        results = [];
      }
      res.json(200, results);
    });
};