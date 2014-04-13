'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Match = mongoose.model('Match'),
	Team = mongoose.model('Team'),
	RTM = mongoose.model('RTM'),
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
        { path: 'teamHome.team', select: 'country flag points', model: 'Team'},
        { path: 'teamAway.team', select: 'country flag points', model: 'Team'}
	];
	var promise = Match.populate(req.match, opts);
	promise.then(function(data) {
		res.jsonp(data);
	}).end();
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
					matches: {
						$push: {
							_id: '$_id',
							date: '$date',
							stadium: '$stadium',
							city: '$city',
							level: '$level',
							teamHome: '$teamHome',
							teamAway: '$teamAway',
							score: '$score'
						}
					}
				}
			})
			.sort('_id');
	} else {
		query = Match.find({})
			.populate('teamHome', 'team')
			.populate('teamAway', 'team')
			.sort('date');
	}
	query.exec(function(err, matches) {
		if (err) {
			res.json(500);
		} else {
			if (matches.length > 0 && matches[0].hasOwnProperty('matches')) {
				// populate teams
				Team.find({}, function(err, teams) {
					if (err) {
						res.json(500);
					} else {
						RTM.find({}, function(err, rtms) {
                            if (err) {
								return res.json(500);
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
							var group;
							for (var i=0; i < matches.length; ++i) {
								group = matches[i];
								matches[i]._id = new Date(group._id.year, group._id.month - 1, group._id.day);
								for (var j=0; j < group.matches.length; ++j) {
									// Find teams
									var teamHomeId = group.matches[j].teamHome;
									var teamAwayId = group.matches[j].teamAway;
									group.matches[j].teamA = getTeam(teamHomeId);
									group.matches[j].teamB = getTeam(teamAwayId);
								}
							}
							res.jsonp(matches);

						});
					}
				});
			} else {
				res.jsonp(matches);
			}
		}
	});
};
