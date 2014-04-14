'use strict';

angular.module('wcb.teams').controller('TeamsEditCtrl', [
	'$scope',
	'$location',
	'Teams',
	'team',
	function ($scope, $location, Teams, team) {

		$scope.team = team;
		$scope.action = $scope.update;

		if (!angular.isDefined(team._id)) {
			$scope.action = $scope.create;
		}

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

		$scope.remove = function() {
			$scope.team.$remove();
			$location.path('/teams');
		};

		$scope.update = function() {
			var team = $scope.team;
			if (!team.updated) {
				team.updated = [];
			}
			team.updated.push(new Date().getTime());

			team.$update(function() {
				$location.path('/teams/' + team._id);
			});
		};
	}
]);
