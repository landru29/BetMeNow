'use strict';

angular.module('wcb.matches')
  .controller('MatchesShowCtrl', [
    '$scope',
    '$location',
    'Global',
    'Matches',
    'match',
    function ($scope, $location, Global, Matches, match) {
      $scope.global = Global;
      $scope.match = match;
    }
  ]);
