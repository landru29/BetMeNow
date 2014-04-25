// updateBets.js
'use strict';

var rootPath = process.cwd(),
    User = require(rootPath + '/server/models/user.js'),
    Bet  = require(rootPath + '/server/models/bet.js');

/**
 * Retrieve the winner of match
 *
 * @param {Match} match - The Match record
 *
 * @return {String|null}
 */
var fetchWinner = function(match) {
  var winner = null;
  if (match.score.home > match.score.away) {
    winner = match.teamHome;
  } else if (match.score.away > match.score.home) {
    winner = match.tezamAway;
  }
  return winner;
};

/**
 * Update user's points and bet's status
 *
 * @param {Bet}    bet    - The Bet record
 * @param {String} winner - The winner of match
 * @param {Object} score  - The score of match
 */
var updateUser = function(bet, winner, score) {
  var pts = 0; // Nb user's points for this bet
  bet.status = 1;
  // Add one point for pronostic on winner or draw
  if (bet.winner === winner || (winner === null && bet.draw === true)) {
    pts += 1;
    bet.status = 2;
  }
  // Add 2 points for pronostic on score OK
  if (bet.score.home === score.home && bet.score.away === score.away) {
    pts += 2;
    bet.status = 2;
  }
  // update user points only if superior at zero
  if (pts > 0) {
    User.update({_id: bet.user._id}, {$inc: {points: pts}}, function(err, nbUpdated) {
      if (err) {
        console.log(err);
      } else if (nbUpdated === 1) {
        console.log('User saved');
      }
    });
  }
  // update bet status
  bet.save(function(err, betSaved, nbUpdated) {
    if (err) {
      console.log(err);
    } else if (nbUpdated === 1) {
      console.log('Bet saved');
    }
  });
};

/**
 * Find bets of match and update them
 *
 * @param {Match} match - The Match record
 */
var updateBets = function(match) {
  var winner = fetchWinner(match);
  Bet.find({match: match._id, status: 0})
    .populate('user')
    .sort('created')
    .exec(function(err, bets) {
      if (err) {
        console.log(err);
        return;
      }
      for (var i = 0; i < bets.length; i++) {
        updateUser(bets[i], winner, match.score);
      }
    });
};

module.exports = function(emitter) {
  emitter.on('save', updateBets);
};
