'use strict';

angular.module('wcb.system')
  .controller('HomeCtrl', [
    '$scope',
    '$location',
    'Bets',
    'matches',
    'users',
    'bets',
    function ($scope, $location, Bets, matches, users, bets) {
      $scope.matches = matches;
      $scope.users = users;
      $scope.bets = bets;
      $scope.betsOfLastMatches = {};
      matches.$promise.then(function (data) {
        var ids= [];
        for (var i = 0; i < data.length; i++) {
          ids.push({match: data[i]._id});
        }
        console.log(ids);
        var query = JSON.stringify({'$or': ids});
        console.log(query);
        Bets.query({query: query}, function(match_bets) {
          for (var i = 0; i < match_bets.length; i++) {
            if (angular.isUndefined($scope.betsOfLastMatches[match_bets[i].match._id])) {
              $scope.betsOfLastMatches[match_bets[i].match._id] = 0;
            }
            $scope.betsOfLastMatches[match_bets[i].match._id]++;
          };
        });
      });
      $scope.showMatch = function (match) {
        $location.path('/matches/show/' + match._id);
      };
    }
  ]);
