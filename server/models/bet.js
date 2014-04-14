'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


/**
 * Bet Schema
 */
var BetSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  winner: {
    type: String,
    ref: 'RTM',
    index: true
  },
  draw: { type: Boolean, default: false },
  score: {
    away: { type: Number, null: true },
    home: { type: Number, null: true }
  },
  user: { type: Schema.Types.ObjectId, ref: 'User', 'null': false, require: true },
  match: { type: Schema.Types.ObjectId, ref: 'Match', 'null': false, require: true }
});

/**
 * Validations
 */
BetSchema.path('score.away').validate(function(score) {
  if (score !== null)
    return score >= 0;
  return true;
}, 'Score Away must be greater at zero');
BetSchema.path('score.home').validate(function(score) {
  if (score !== null)
    return score >= 0;
  return true;
}, 'Score Home must be greater at zero');

/**
 * Statics
 */
BetSchema.statics.load = function(id, cb) {
    this.findOne({_id: id})
    .populate('winner')
    .populate('user')
    .populate('match')
    .exec(cb);
};

module.exports = mongoose.model('Bet', BetSchema, 'bets');
