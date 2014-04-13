'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


/**
 * RTM Schema
 */
var RTMSchema = new Schema({
    created: {
        type: Date,
        default: Date.now
    },
	_id: {
        type: String,
		default: '',
		trim: true,
		match: /^([1-2][A-H]|[A-HLW]\d+)$/,
		index: true,
		unique: true
	},
    team: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
		null: true,
		index: true
    }
});

/**
 * Statics
 */
RTMSchema.statics.load = function(id, cb) {
    this.findOne({_id: id})
		.populate('team', 'country group flag')
		.exec(cb);
};

module.exports = mongoose.model('RTM', RTMSchema, 'teams_matches');
