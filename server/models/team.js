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
        trim: true,
        index: true
    },
    shortcountry: {
        type: String,
        default: '',
        trim: true,
        index: true
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
    },
    points: {
        type: Number,
        default: 0
    },
    played: {
        type: Number,
        default: 0
    },
    won: {
        type: Number,
        default: 0
    },
    lost: {
        type: Number,
        default: 0
    },
    draw: {
        type: Number,
        default: 0
    },
    goals: {
        for: {
            type: Number,
            default: 0
        },
        against: {
            type: Number,
            default: 0
        }
    },
    winner: {
        type: Boolean,
        default: false
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

