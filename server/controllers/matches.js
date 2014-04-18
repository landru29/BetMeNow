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

/**
 * List of matches
 */
exports.all = function(req, res) {
	var query;
	if (req.param('group')) {
		query = Match.aggregate(
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
            $push: /* Version 2.6 => '$$ROOT' */ {
              level: '$level',
              date: '$date',
              stadium: '$stadium',
              city: '$city',
              teamHome: '$teamHome',
              teamAway: '$teamAway',
              'score.away': '$score.away',
              'score.home': '$score.home'
            }
          }
        }
      },
			{
        $group: {
          _id: '$level',
          matches: { $push: {
            _id: '$_id',
            matches: '$$ROOT.matches'
          } }
        }
      }, {
        $project: {
          _id: 0,
          level: '$_id',
          matchesByDate: '$matches'
        }
      })
			.sort('-level');
	} else {
		query = Match.find({})
			.populate('teamHome', 'team')
			.populate('teamAway', 'team')
			.sort('date');
	}
	query.exec(function(err, levels) {
		if (err) {
			res.json(500, {message: err});
		} else {
			if (levels.length > 0 && levels[0].hasOwnProperty('matchesByDate')) {
        // return res.json(levels);
				// populate teams
				Team.find({}, function(err, teams) {
					if (err) {
						res.json(500, {message: err});
					} else {
						RTM.find({}, function(err, rtms) {
              if (err) {
								return res.json(500, {message: err});
							}
							var getTeam = function(rtmId) {
								for (var r=0; r<rtms.length; ++r) {
									if (rtmId === rtms[r]._id && rtms[r].team) {
										for (var i=0; i<teams.length; ++i) {
											if (teams[i]._id.toString() === rtms[r].team.toString()) {
												return teams[i];
											}
										}
									}
								}
								return null;
							};
							var group, level;
							for (var l=0; l < levels.length; ++l) {
                for (var i = 0; i < levels[l].matchesByDate.length; i++) {
								  group = levels[l].matchesByDate[i];
                  group._id = new Date(group._id.year, group._id.month - 1, group._id.day);
  								for (var j=0; j < group.matches.length; ++j) {
  									// Find teams
  									var teamHomeId = group.matches[j].teamHome;
  									var teamAwayId = group.matches[j].teamAway;
  									group.matches[j].teamA = getTeam(teamHomeId);
  									group.matches[j].teamB = getTeam(teamAwayId);
  								}
                }
                levels[l].matchesByDate.sort(function(a, b) {
                  return (a._id === b._id) ? 0 : (a._id < b._id) ? -1 : 1;
                });
							}
							res.jsonp(levels);

						});
					}
				});
			} else {
				res.jsonp(levels);
			}
		}
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