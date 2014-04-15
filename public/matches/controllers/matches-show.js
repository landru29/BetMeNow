'use strict';

angular.module('wcb.matches')
  .controller('MatchesShowCtrl', [
    '$scope',
    '$location',
    '$http',
    '$modal',
    'security',
    'Matches',
    'match',
    'bets',
    function ($scope, $location, $http, $modal, security, Matches, match, bets) {
      $scope.betGroups = bets;
      $scope.bets = [];
      $scope.averageBets = {};

      var concatBets = function() {
        angular.forEach($scope.betGroups, function(group){
          $scope.bets = $scope.bets.concat(group.bets);
        });
      }
      var calculAverageBets = function() {
        var average = {}, total = $scope.bets.length;
        angular.forEach($scope.betGroups, function(group) {
          average[group._id] = Math.round((group.count * 100) / total);
        });
        return average;
      };

      var now = new Date();
      match.$promise.then(function(match) {
        $scope.match = match;
        $scope.match.date = new Date(match.date);
        $scope.pronosticsOpen = $scope.match.date.getTime() > now.getTime();
        if (bets.length <= 0) {
          console.log(match);
          $scope.averageBets[match.teamHome._id] = 0;
          $scope.averageBets[match.teamAway._id] = 0;
        } else {
          concatBets();
          $scope.averageBets = calculAverageBets();
        }
      });

      $scope.getStyle = function(rtmId) {
        return {width: $scope.averageBets[rtmId] + '%' };
      };

      $scope.makePronostic = function() {
        $modal.open({
          templateUrl: '/public/matches/views/bet.html',
          controller: 'BetEditCtrl',
          resolve: {
            match: function() { return $scope.match; },
            bet: function() {
              return $http.get('/api/users/me/bets?match=' + $scope.match._id)
                .then(function(data) {
                  if (data.data.length > 0) {
                    return data.data[0];
                  }
                  return null;
                });
            }
          }
        });
      };
    }
  ])
  .controller('BetEditCtrl', [
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
      $scope.bet = bet;
      console.log('bet', bet);
      $scope.modalInstance = $modalInstance;

      $scope.cancelBet = function() {
        $scope.modalInstance.close(false);
      };

      $scope.setWinner = function(rtmId) {
        console.log(rtmId);
        $scope.bet.winner = rtmId;
      };

      $scope.saveBet = function() {
        var score = $scope.bet.score;
        $scope.error = null;
        if (score.home !== 0 && score.away !== 0 && score.home === score.away) {
          $scope.error = 'Draw is impossible!';
          return;
        }
        if ($scope.bet.winner === null && score.away === 0 && score.home === 0) {
          $scope.error = 'Please, select your winner';
          return;
        } else if ($scope.bet.winner === null) {
          if (score.away > score.home) {
            $scope.bet.winner = $scope.match.teamAway._id;
          } else {
            $scope.bet.winner = $scope.match.teamHome._id;
          }
        } else {
          if ((score.away > score.home && $scope.bet.winner !== $scope.match.teamAway._id) ||
            (score.away < score.home && $scope.bet.winner !== $scope.match.teamHome._id))
          {
            $scope.error = 'Your pronostic is not correct.';
            return;
          }
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
          console.error(data);
        });
      };
    }
  ]);
