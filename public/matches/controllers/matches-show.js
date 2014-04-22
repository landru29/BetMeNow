'use strict';

angular.module('wcb.matches')
  .controller('MatchesShowCtrl', [
    '$scope',
    '$location',
    '$http',
    '$modal',
    'security',
    'securityAuthorization',
    'Matches',
    'match',
    'bets',
    function ($scope, $location, $http, $modal, security, securityAuthorization, Matches, match, bets) {
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
          templateUrl: '/public/bets/views/edit.html',
          controller: 'BetsEditCtrl',
          resolve: {
            currentUser: securityAuthorization.requireAuthenticatedUser,
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
  ]);
