'use strict';

//Setting up route
angular.module('wcb.matches')
  .config(['crudRouteProvider', 'securityAuthorizationProvider', 
    function (crudRouteProvider, securityAuthorizationProvider) {

      crudRouteProvider.routesFor('Matches')
        .whenList({
          matches: ['Matches', function(Matches) { return Matches.query({group: true}); }]
        })
        .whenNew({
          currentUser: securityAuthorizationProvider.requireAdminUser,
          match: ['Matches', function(Matches) { return new Matches(); }],
          rtms: ['$http', function($http) {
            return $http.get('/api/rtms/forSelect').then(function(data) {
              return data.data;
            });
          }]
        })
        .whenEdit({
          currentUser: securityAuthorizationProvider.requireAdminUser,
          match: ['$route', 'Matches', function($route, Matches) {
            return Matches.get({matchId: $route.current.params.itemId})
              .$promise.then(function(match) {
                 return match;
              });
          }],
          rtms: ['$http', function($http) {
            return $http.get('/api/rtms/forSelect').then(function(data) {
              return data.data;
            });
          }]
        })
        .whenShow({
          match: ['$route', 'Matches', function($route, Matches) {
            return Matches.get({matchId: $route.current.params.itemId})
              .$promise.then(function(match) {
                 return match;
              });
          }],
          bets: ['$route', '$http', function($route, $http) {
            return $http.get('/api/matches/' + $route.current.params.itemId + '/bets')
              .then(function(data) {
                return data.data;
              });
          }]
        });
    }
]);
