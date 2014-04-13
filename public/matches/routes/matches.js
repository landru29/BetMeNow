'use strict';

//Setting up route
angular.module('wcb.matches')
	.config(['$stateProvider', '$urlRouterProvider',
		function($stateProvider, $urlRouterProvider) {

			//================================================
			// Check if the user is connected
			//================================================
			var checkLoggedin = function($q, $timeout, $http, $location) {
				// Initialize a new promise
				var deferred = $q.defer();

				// Make an AJAX call to check if the user is logged in
				$http.get('/loggedin').success(function(user) {
					// Authenticated
					if (user !== '0')
						$timeout(deferred.resolve, 0);

					// Not Authenticated
					else {
						$timeout(function() {
							deferred.reject();
						}, 0);
						$location.url('/login');
					}
				});

				return deferred.promise;
			};
			//================================================
			// Check if the user is not conntect
			//================================================
			var checkLoggedOut = function($q, $timeout, $http, $location) {
				// Initialize a new promise
				var deferred = $q.defer();

				// Make an AJAX call to check if the user is logged in
				$http.get('/loggedin').success(function(user) {
					// Authenticated
					if (user !== '0') {
						$timeout(function() {
							deferred.reject();
						}, 0);
						$location.url('/login');

					}

					// Not Authenticated
					else {
						$timeout(deferred.resolve, 0);

					}
				});

				return deferred.promise;
			};
			//================================================


			// states for my app
			$stateProvider
				.state('all matches', {
					url: '/matches',
					templateUrl: 'public/matches/views/list.html',
					controller: 'MatchesListCtrl',
					resolve: {
						matches: ['Matches', function(Matches) {
							return Matches.query({group: true}, function(matches) {
								return matches;
							});
						}]
					}
				})
				.state('create match', {
					url: '/matches/create',
					templateUrl: 'public/matches/views/edit.html',
					controller: 'MatchesEditCtrl',
					resolve: {
						loggedin: checkLoggedin,
						rtms: ['$http', function($http) {
                            return $http.get('/rtms/forSelect').then(function(data) {
								console.log(data);
								return data.data;
							});
						}],
						match: ['Matches', function(Matches) {
							return new Matches();
						}]
					}
				})
				.state('edit match', {
					url: '/matches/:matchId/edit',
					templateUrl: 'public/matches/views/edit.html',
					controller: 'MatchesEditCtrl',
					resolve: {
						loggedin: checkLoggedin,
						rtms: ['$http', function($http) {
                            return $http.get('/rtms/forSelect').then(function(data) {
								console.log(data);
								return data.data;
							});
						}],
						match: ['$stateParams', 'Matches', function($stateParams, Matches) {
							return Matches.get({
								matchId: $stateParams.matchId
							}, function(match) {
								return match;
							});
						}]
					}
				})
				.state('match by id', {
					url: '/matches/:matchId',
					templateUrl: 'public/matches/views/view.html',
					controller: 'MatchesEditCtrl',
					resolve: {
						match: ['$stateParams', 'Matches', function($stateParams, Matches) {
							return Matches.get({
								matchId: $stateParams.matchId
							}, function(match) {
								return match;
							});
						}],
						rtms: function() {
							return [];
						}
					}
				});
		}
]);
