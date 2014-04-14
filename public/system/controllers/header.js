'use strict';

angular.module('wcb.system').controller('HeaderCtrl', ['$scope', '$rootScope', '$location', 'security',
    function($scope, $rootScope, $location, security) {

    	$scope.user = security.getCurrentUser;
    	$scope.isAuthenticated = security.isAuthenticated;
        
        $scope.menus = [
					{
						title: 'Create New Team',
						link: '/teams/new',
						show: security.isAdmin()
					}, {
						title: 'Teams',
						link: '/teams',
						show: true
					}, {
						title: 'Create New Match',
						link: '/matches/new',
						show: security.isAdmin()
					}, {
						title: 'Matches',
						link: '/matches',
						show: true
					}, {
						title: 'Bets',
						link: '/bets',
						show: $scope.isAuthenticated
					}
				];			

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
