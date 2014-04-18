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
      $scope.levels = matches;
      $scope.levelLabs = {
        '16': 'GROUP STAGE',
        '8': 'ROUND OF 16',
        '4': 'QUARTER-FINALS',
        '2': 'SEMI-FINALS',
        '1': 'PLAY-OFF FOR THIRD PLACE',
        '0': 'FINAL'
      };

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