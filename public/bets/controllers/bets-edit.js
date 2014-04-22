// bets-edit.js
'use strict';

angular.module('wcb.bets')
  .controller('BetsEditCtrl', [
    '$scope',
    '$modalInstance',
    '$http',
    '$route',
    'notifications',
    'match',
    'bet',
    function ($scope, $modalInstance, $http, $route, notifications, match, bet) {
      $scope.match = match;
      if (bet === null) {
        bet = {
          score: {home: 0, away: 0},
          winner: null,
          match: match._id
        };
      } else {
        bet.winner = bet.winner._id;
      }
      $scope.title = (angular.isDefined(bet._id) ? 'Edit your pronostic' : 'Make a pronostic');
      $scope.bet = bet;
      $scope.modalInstance = $modalInstance;

      $scope.cancelBet = function() {
        $scope.modalInstance.close(false);
      };

      $scope.setWinner = function(rtmId) {
        $scope.bet.draw = false;
        $scope.bet.winner = rtmId;
      };

      $scope.saveBet = function() {
        var score = $scope.bet.score;
        $scope.error = null;
        if ($scope.match.level < 16 && (score.home !== 0 && score.away !== 0 && score.home === score.away)) {
          $scope.error = 'Draw is impossible!';
          return;
        }
        if ($scope.bet.draw === false && $scope.bet.winner === null &&
          score.away === 0 && score.home === 0)
        {
          $scope.error = 'Please, select your winner';
          return;
        } else if ($scope.bet.winner === null && $scope.bet.draw === false) {
          if (score.away > score.home) {
            $scope.bet.winner = $scope.match.teamAway._id;
          } else {
            $scope.bet.winner = $scope.match.teamHome._id;
          }
        } else if ($scope.bet.draw === false &&
            ((score.away > score.home && $scope.bet.winner !== $scope.match.teamAway._id) ||
            (score.away < score.home && $scope.bet.winner !== $scope.match.teamHome._id)))
        {
          $scope.error = 'Your pronostic is not correct.';
          return;
        }
        var promise;
        if ($scope.bet._id) {
          promise = $http.put('/api/bets/' + $scope.bet._id, $scope.bet);
        } else {
          promise = $http.post('/api/bets', $scope.bet);
        }
        promise.then(function(data) {
          notifications.pushForNextRoute({message: 'Your pronostic saved successfull', type: 'success'});
          $modalInstance.close();
          $route.reload();
        }, function(data) {
          if (data.status === 412) {
            var errors = [];
            angular.forEach(data.data, function(value) {
              errors.push(value.message);
            });
            $scope.error = errors.join('\n');
          } else {
            $scope.error = data.data.message;
          }
        });
      };
    }
  ]);