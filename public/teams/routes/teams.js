'use strict';

//Setting up route
angular.module('wcb.teams')
  .config(['crudRouteProvider', 'securityAuthorizationProvider', 
    function (crudRouteProvider, securityAuthorizationProvider) {

      crudRouteProvider.routesFor('Teams')
        .whenList({
          teams: ['Teams', function(Teams) { return Teams.query({group: true}); }]
        })
        .whenNew({
          currentUser: securityAuthorizationProvider.requireAdminUser,
          team: ['Teams', function(Teams) { return new Teams(); }]
        })
        .whenEdit({
          currentUser: securityAuthorizationProvider.requireAdminUser,
          team: ['$route', 'Teams', function($route, Teams) {
            return Teams.get({teamId: $route.current.params.itemId});
          }]
        })
        .whenShow({
          team: ['$route', 'Teams', function($route, Teams) {
            return Teams.get({teamId: $route.current.params.itemId});
          }]
        });
    }
]);