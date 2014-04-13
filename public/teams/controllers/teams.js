'use strict';

angular.module('wcb.teams').controller('TeamsController', [
	'$scope',
	'$stateParams',
	'$location',
	'Global',
	'Teams',
	function ($scope, $stateParams, $location, Global, Teams) {
		$scope.global = Global;

		$scope.create = function() {
			var team = new Teams({
				title: this.title,
				country: this.country,
				flag: this.flag
			});
			team.$save(function(response) {
				$location.path('teams/' + response._id);
			}, function(response) {
				console.log(response.data);
				$scope.errors = response.data.errors;
			});

			this.title = '';
			this.content = '';
		};

		$scope.remove = function(team) {
			if (team) {
				team.$remove();

				for (var i in $scope.teams) {
					if ($scope.teams[i] === team) {
						$scope.teams.splice(i, 1);
					}
				}
			}
			else {
				$scope.team.$remove();
				$location.path('teams');
			}
		};

		$scope.update = function() {
			var team = $scope.team;
			if (!team.updated) {
				team.updated = [];
			}
			team.updated.push(new Date().getTime());

			team.$update(function() {
				$location.path('teams/' + team._id);
			});
		};

		$scope.find = function() {
			Teams.query({group: true}, function(teams) {
				$scope.teams = teams;
			});
		};

		$scope.findOne = function() {
			Teams.get({
				teamId: $stateParams.teamId
			}, function(team) {
				$scope.team = team;
			});
		};
	}
]);
