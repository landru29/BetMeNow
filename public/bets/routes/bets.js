'use strict';

//Setting up route
angular.module('wcb.bets')
  .config(['crudRouteProvider', 'securityAuthorizationProvider',
    function (crudRouteProvider, securityAuthorizationProvider) {

      crudRouteProvider.routesFor('Bets')
        .whenList({
          bets: ['Bets', function(Bets) { return Bets.query({betId: 'me'}); }]
        })
        /*.whenNew({
          currentUser: securityAuthorizationProvider.requireAdminUser,
          bet: ['Bets', function(Bets) { return new Bets(); }],
          rtms: ['$http', function($http) {
            return $http.get('/api/rtms/forSelect').then(function(data) {
              return data.data;
            });
          }]
        })
        .whenEdit({
          currentUser: securityAuthorizationProvider.requireAdminUser,
          bet: ['$route', 'Bets', function($route, Bets) {
            return Bets.get({matchId: $route.current.params.itemId})
              .$promise.then(function(bet) {
                 return bet;
              });
          }],
          rtms: ['$http', function($http) {
            return $http.get('/api/rtms/forSelect').then(function(data) {
              return data.data;
            });
          }]
        })
        .whenShow({
          bet: ['$route', 'Bets', function($route, Bets) {
            return Bets.get({matchId: $route.current.params.itemId})
              .$promise.then(function(bet) {
                 return bet;
              });
          }],
          bets: ['$route', '$http', function($route, $http) {
            return $http.get('/api/bets/' + $route.current.params.itemId + '/bets')
              .then(function(data) {
                return data.data;
              });
          }]
        })*/;
    }
]);
