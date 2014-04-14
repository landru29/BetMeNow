'use strict';

angular.element(document).ready(function() {
	//Fixing facebook bug with redirect
	//if (window.location.hash === '#_=_') window.location.hash = '#!';

	//Then init the app
	//angular.bootstrap(document, ['wcb']);

});

// Default modules
var modules = ['ngRoute', 'ngLocale', 'ngCookies', 'ngResource', 'ui.bootstrap', 'wcb.system', 'wcb.auth', 'wcb.matches', 'wcb.teams'];

// Combined modules
angular.module('wcb', modules)
  .config(['$locationProvider', '$routeProvider', function ($locationProvider, $routeProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider.otherwise({redirectTo:'/'});
  }])
  .run(['security', function(security) {
    // Get the current user when the application starts
    // (in case they are still logged in from a previous session)
    security.requestCurrentUser();
  }]);
