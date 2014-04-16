'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    RTM = mongoose.model('RTM'),
    _ = require('lodash');


/**
 * Find rtm by id
 */
exports.rtm = function(req, res, next, id) {
    RTM.load(id, function(err, rtm) {
        if (err) return next(err);
        if (!rtm) return next(new Error('Failed to load rtm ' + id));
        req.rtm = rtm;
        next();
    });
};

/**
 * Create an rtm
 */
exports.create = function(req, res) {
    var rtm = new RTM(req.body);
	console.log(rtm);

    rtm.save(function(err) {
        if (err) {
			res.json(412, err);
        } else {
            res.jsonp(rtm);
        }
    });
};

/**
 * Update an rtm
 */
exports.update = function(req, res) {
    var rtm = req.rtm;

    rtm = _.extend(rtm, req.body);

    rtm.save(function(err) {
        if (err) {
            return res.send('users/signup', {
                errors: err.errors,
                rtm: rtm
            });
        } else {
            res.jsonp(rtm);
        }
    });
};

/**
 * Delete an rtm
 */
exports.destroy = function(req, res) {
    var rtm = req.rtm;

    rtm.remove(function(err) {
        if (err) {
            return res.send('users/signup', {
                errors: err.errors,
                rtm: rtm
            });
        } else {
            res.jsonp(rtm);
        }
    });
};

/**
 * Show an rtm
 */
exports.show = function(req, res) {
    res.jsonp(req.rtm);
};

/**
 * List of rtms
 */
exports.all = function(req, res) {
	var query;
	query = RTM.find({})
		.populate('team', 'country flag score')
		.sort('_id');
	query.exec(function(err, rtms) {
		if (err) {
			res.json(500);
		} else {
			res.jsonp(rtms);
		}
	});
};

/**
 * List of rtms for select
 */
exports.forSelect = function(req, res) {
	var query;
	query = RTM.find({})
		.populate('team', 'country flag score')
		.sort('_id');
	query.exec(function(err, rtms) {
		if (err) {
			res.json(500);
		} else {
			var rtmsForSelect = [], rtm;
			for (var i=0; i<rtms.length; ++i) {
                rtm = {_id: rtms[i]._id/*, team: rtms[i].team*/, label: ''};
				rtm.label = '[' + rtms[i]._id + ']';
				if (rtms[i].team) {
					rtm.label += ' ' + rtms[i].team.country;
				}
				rtmsForSelect.push(rtm);
			}
			res.jsonp(rtmsForSelect);
		}
	});
};
