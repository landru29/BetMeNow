'use strict';

angular.module('wcb.matches')
  .controller('MatchesListCtrl', [
    '$scope',
    '$location',
    'Global',
    'Matches',
    'matches',
    function ($scope, $location, Global, Matches, matches) {
      $scope.global = Global;
      $scope.matches = matches;

      $scope.find = function() {
        Matches.query({group: true}, function(matches) {
          $scope.matches = matches;
        });
      };

      $scope.viewMatch = function(match) {
        $location.path('/matches/show/' + match._id);
      };

    }
  ]);