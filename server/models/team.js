'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


/**
 * Team Schema
 */
var TeamSchema = new Schema({
    created: {
        type: Date,
        default: Date.now
    },
    country: {
        type: String,
        default: '',
        trim: true
    },
	points: {
		type: Number,
		default: 0
	},
	group: {
		type: String,
		default: '',
		trim: true
	},
    flag: {
        type: String,
		default: '',
		trim: true
    }
});

/**
 * Validations
 */
TeamSchema.path('country').validate(function(country) {
    return country.length;
}, 'Country cannot be blank');
TeamSchema.path('points').validate(function(points) {
    return points >= 0;
}, 'Points must be greater or equals to zero');
TeamSchema.path('group').validate(function(group) {
    return /^[A-H]$/.test(group);
}, 'Group must be between A and H');
TeamSchema.path('flag').validate(function(flag) {
    return flag.length;
}, 'Flag cannot be blank');

/**
 * Statics
 */
TeamSchema.statics.load = function(id, cb) {
    this.findOne({_id: id}, cb);
};

module.exports = mongoose.model('Team', TeamSchema, 'teams');
