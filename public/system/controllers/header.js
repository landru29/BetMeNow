'use strict';

angular.module('wcb.system').controller('HeaderCtrl', [
	'$scope',
	'$rootScope',
	'$location',
	'$http',
	'security',
	'i18nNotifications',
	'wcb.locale',
	'localizedMessages',
  function($scope, $rootScope, $location, $http, security, i18nNotifications, locale, localizedMessages) {

  	$scope.user = security.getCurrentUser;
  	$scope.isAuthenticated = security.isAuthenticated;

    $scope.menus = [
			{
				title: localizedMessages.get('menu.title.teams.create'),
				link: '/teams/new',
				show: security.isAdmin()
			}, {
				title: localizedMessages.get('menu.title.teams.list'),
				link: '/teams',
				show: true
			}, {
				title: localizedMessages.get('menu.title.matches.create'),
				link: '/matches/new',
				show: security.isAdmin()
			}, {
				title: localizedMessages.get('menu.title.matches.list'),
				link: '/matches',
				show: true
			}, {
				title: localizedMessages.get('menu.title.pronostics.list'),
				link: '/bets',
				show: security.isAuthenticated()
			}
		];

		$scope.locales = [
			{key: 'en-gb', label: 'English'},
			{key: 'fr-fr', label: 'Français'}
		];
		$scope.locale = locale;

		$scope.changeLocale = function() {
			if (angular.isDefined($scope.locale)) {
				$http.get('/locale/' + $scope.locale)
					.then(function(data) {
						window.location.reload();
					}, function(data) {
						i18nNotifications.pushForCurrentRoute(data.data.message, 'warning');
					});
			}
		};

	  $scope.isActive = function (linkPath) {
	  	var path = $location.path().replace('/', '\/'), re = new RegExp('^' + path);
	    return re.test(linkPath);
	  };

	  $scope.logout = function() {
	  	security.logout();
	  };

	  $scope.login = function() {
	  	security.showLogin();
	  };

	  $scope.register = function() {
	  	security.showSignup();
	  };
  }
]);
