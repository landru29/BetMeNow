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
      bets.$promise.then(function(data) {
        var now = new Date(Date.now());
        for (var i = 0; i < data.length; i++) {
          if (data[i].match.date > now) {
            $scope.bets.forthcoming.push(data[i]);
          } else {
            $scope.bets.forthcoming.push(data[i]);
          }
        };
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