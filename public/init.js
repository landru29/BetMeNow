'use strict';

angular.element(document).ready(function() {
	//Fixing facebook bug with redirect
	if (window.location.hash === '#_=_') window.location.hash = '#!';

	//Then init the app
	angular.bootstrap(document, ['wcb']);

});

// Default modules
var modules = ['ngCookies', 'ngResource', 'ui.bootstrap', 'ui.router', 'wcb.system', 'wcb.articles', 'wcb.auth'];

// Combined modules
angular.module('wcb', modules);
