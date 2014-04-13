'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


/**
 * Match Schema
 */
var MatchSchema = new Schema({
    created: {
        type: Date,
        default: Date.now
    },
    level: {
        type: Number,
        default: 32,
        trim: true
    },
	date: {
        type: Date
	},
	stadium: {
        type: String,
		default: '',
		trim: true
	},
	city: {
        type: String,
		default: '',
		trim: true
	},
    teamHome: {
        type: String,
        ref: 'RTM',
		null: true,
		index: true
    },
    teamAway: {
        type: String,
        ref: 'RTM',
		null: true,
		index: true
    },
	score: {
		type: String,
		default: ''
	}
});

/**
 * Validations
 */
MatchSchema.path('stadium').validate(function(stadium) {
    return stadium.length;
}, 'Stadium cannot be blank');
MatchSchema.path('city').validate(function(city) {
    return city.length;
}, 'City cannot be blank');
MatchSchema.path('level').validate(function(level) {
	return ([1,2,4,8,16,32].indexOf(level) >= 0);
}, 'Level must be one of: 32 - 16 - 8 - 4 - 2 - 1');
MatchSchema.path('date').validate(function(date) {
	var now = new Date();
    return date > now;
}, 'Date must be in the future');
MatchSchema.path('score').validate(function(score) {
	if (score.length > 0)
		return /^([0-9]+-[0-9]+|null)$/.test(score);
	return true;
}, 'Score must have the format X-X or null');

/**
 * Statics
 */
MatchSchema.statics.load = function(id, cb) {
    this.findOne({_id: id})
		.populate('teamHome')
		.populate('teamAway')
		.exec(cb);
};

module.exports = mongoose.model('Match', MatchSchema, 'matches');
