'use strict';

angular.module('wcb.teams').controller('TeamsListCtrl', [
  '$scope',
  '$location',
  'Teams',
  'teams',
  function ($scope, $location, Teams, teams) {

    $scope.teams = teams;

    $scope.remove = function(team) {
      if (team) {
        team.$remove();

        for (var i in $scope.teams) {
          if ($scope.teams[i] === team) {
            $scope.teams.splice(i, 1);
          }
        }
      }
      else {
        $scope.team.$remove();
        $location.path('teams');
      }
    };
  }
]);
