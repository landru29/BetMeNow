// bets-list.js
'use strict';

angular.module('wcb.bets')
  .controller('BetsListCtrl', [
    '$scope',
    '$location',
    '$modal',
    'securityAuthorization',
    'Bets',
    'bets',
    function ($scope, $location, $modal, securityAuthorization, Bets, bets) {
      $scope.bets = {forthcoming: [], elapsed: []};
      $scope.forthcoming = true;
      $scope.elapsed = false;
      $scope.totalBets = 0;
      $scope.betsWon = 0;
      $scope.betsAvgWon = 0;
      $scope.betsWonScore = 0;

      var scoreWon = function(bet) {
        if (bet.status === 2 &&
          bet.score.home === bet.match.score.home && bet.score.away === bet.match.score.away)
        {
          return true;
        }
        return false;
      };

      bets.$promise.then(function(data) {
        var now = new Date(Date.now());
        for (var i = 0; i < data.length; i++) {
          if (data[i].status === 2) {
            $scope.betsWon++;
          }
          if (scoreWon(data[i])) {
            $scope.betsWonScore++;
          }
          if (data[i].match.date > now) {
            $scope.bets.forthcoming.push(data[i]);
          } else {
            $scope.bets.forthcoming.push(data[i]);
          }
        }
        $scope.totalBets = data.length;
        if (data.length > 0) {
          $scope.betsAvgWon = Math.round(($scope.betsWon * 100) / data.length);
        }
      });

      $scope.viewMatch = function(match) {
        $location.path('/matches/show/' + match._id);
      };

      $scope.editPronostic = function(bet) {
        $modal.open({
          templateUrl: '/public/bets/views/edit.html',
          controller: 'BetsEditCtrl',
          resolve: {
            currentUser: securityAuthorization.requireAuthenticatedUser,
            match: function() { return bet.match; },
            bet: function() { return bet; }
          }
        });
      };
    }
  ]);