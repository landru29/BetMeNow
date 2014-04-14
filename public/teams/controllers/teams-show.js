'use strict';

angular.module('wcb.teams').controller('TeamsShowCtrl', [
  '$scope',
  '$location',
  'Teams',
  'team',
  function ($scope, $location, Teams, team) {

    $scope.team = team;

    $scope.remove = function() {
      $scope.team.$remove();
      $location.path('/teams');
    };

    $scope.update = function() {
      var team = $scope.team;
      if (!team.updated) {
        team.updated = [];
      }
      team.updated.push(new Date().getTime());

      team.$update(function() {
        $location.path('/teams/' + team._id);
      });
    };
  }
]);
