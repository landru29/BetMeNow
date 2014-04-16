'use strict';

angular.module('wcb.matches')
	.controller('MatchesEditCtrl', [
		'$scope',
		'$location',
		'notifications',
		'Matches',
    'match',
		'rtms',
		function ($scope, $location, notifications, Matches, match, rtms) {
			$scope.levels = [
				{key: 16, value: 'GROUPS'},
				{key: 8, value: 'ROUND OF 16'},
				{key: 4, value: 'QUARTER-FINALS'},
				{key: 2, value: 'SEMI-FINALS'},
				{key: 1, value: 'PLAY-OFF FOR THIRD PLACE'},
				{key: 0, value: 'FINAL'}
			];
			$scope.match = match;
			$scope.action = $scope.update;
			$scope.rtms = rtms;
			$scope.minDate = new Date(2014, 5, 12, 18, 0);
			$scope.maxDate = new Date(2014, 6, 13, 21, 0);
			$scope.submit = true;
			// Si il s'agit d'un nouvel enregistrement
			if (!angular.isDefined(match._id)) {
				$scope.action = $scope.create;
				// On initialise la date du match
				$scope.match.date = new Date(Date.now());
				if ($scope.match.date.getTime() < $scope.minDate.getTime()) {
					$scope.match.date = new Date($scope.minDate.getTime());
				}
			} else {
				for (var i=0; i<$scope.length; ++i) {
					if ($scope.levels[i].key === match.level) {
						$scope.match.level = $scope.levels[i];
						break;
					}
				}
				var home = false, away=false;
				for (var r=0; r<$scope.rtms.length; ++r) {
					if (match.teamHome._id === $scope.rtms[r]._id) {
						$scope.match.teamHome = $scope.rtms[r]._id;
						home = true;
					}
					if (match.teamAway._id === $scope.rtms[r]._id) {
						$scope.match.teamAway = $scope.rtms[r]._id;
						away = true;
					}
					if (home && away) {
						break;
					}
				}
			}

			$scope.save = function() {
				if (!angular.isDefined($scope.match._id)) {
					$scope.create();
				} else {
					$scope.update();
				}
			};

			$scope.create = function() {
				if (!$scope.submit) {
					// Envoyer une notification
					return false;
				}
				this.date.setHours(this.time.getHours());
				this.date.setMinutes(this.time.getMinutes());
				var match = new Matches({
					level: this.level,
					date: this.date,
					stadium: this.stadium,
					city: this.city,
					teamHome: this.teamHome,
					teamAway: this.teamAway
				});
				match.$save(function(response) {
					notifications.pushForNextRoute({message: 'Match saved successfully', type: 'success'});
					$location.path('/matches/show/' + response._id);
					//$location.path('matches/create');
				}, function(response) {
					$scope.errors = response.data.errors;
				});
				$scope.stadium = '';
				$scope.city = '';
				$scope.teamA = '';
				$scope.teamB = '';
				$scope.home = '';
				$scope.away = '';
			};

			$scope.remove = function(match) {
				if (match) {
					match.$remove();

					for (var i in $scope.matches) {
						if ($scope.matches[i] === match) {
							$scope.matches.splice(i, 1);
						}
					}
				}
				else {
					$scope.match.$remove();
					$location.path('matches');
				}
			};

			$scope.update = function() {
				if (!$scope.submit) {
					// Envoyer une notification
					return false;
				}
				var match = $scope.match;
				if (!match.updated) {
					match.updated = [];
				}
				match.updated.push(new Date().getTime());

				match.$update(function() {
					notifications.pushForNextRoute({message: 'Match saved successfully', type: 'success'});
					$location.path('matches/show/' + match._id);
				});
			};

			$scope.changeTeams = function() {
				if (!angular.isDefined($scope.teamHome) || !angular.isDefined($scope.teamAway)) {
					return;
				}
				if ($scope.errors) {
					if ($scope.errors.teamHome) {
						delete($scope.errors.teamHome);
						delete($scope.errors.teamAway);
					}
				}
				var submit = true;
				var reGroup = new RegExp('^[A-H]');
				var reRound16 = new RegExp('^[1-2]');
				var reWinner = new RegExp('^[WL]');
				// On vérifie que les équipes choisies correspondent au même niveau de jeu
				if ((reGroup.test($scope.teamHome) && !reGroup.test($scope.teamAway)) ||
					(reGroup.test($scope.teamAway) && !reGroup.test($scope.teamHome)) ||
					(reRound16.test($scope.teamHome) && !reRound16.test($scope.teamAway)) ||
					(reRound16.test($scope.teamAway) && !reRound16.test($scope.teamHome)) ||
					(reWinner.test($scope.teamHome) && !reWinner.test($scope.teamAway)) ||
                    (reWinner.test($scope.teamAway) && !reWinner.test($scope.teamHome)))
				{
					$scope.errors = {
						teamHome: {
							message: 'The selection of teams is incorrect'
						},
						teamAway: {
							message: 'The selection of teams is incorrect'
						}
					};
					submit = false;
				}
				$scope.submit = submit;
			};
			var getRtmsForLevel = function(reg) {
				var newRtms = [];
				for (var i=0; i<$scope.old_rtms.length; ++i) {
					if (reg.test($scope.old_rtms[i]._id)) {
						newRtms.push($scope.old_rtms[i]);
					}
				}
				return newRtms;
			};
			$scope.changeLevelaa = function() {
				var level = parseInt($scope.match.level, 10);
				if (!angular.isDefined($scope.old_rtms)) {
					$scope.old_rtms = $scope.rtms;
				}
				if (16 === level) {
          $scope.rtms = getRtmsForLevel(new RegExp('^[A-H][1-4]$'));
				} else if (8 === level) {
          $scope.rtms = getRtmsForLevel(new RegExp('^[1-2][A-H]$'));
				} else if (4 === level || 2 === level) {
          $scope.rtms = getRtmsForLevel(new RegExp('^W([4-5][0-9]|60)$'));
				} else if (1 === level) {
          $scope.rtms = getRtmsForLevel(new RegExp('^L6[12]$'));
				} else if (0 === level) {
          $scope.rtms = getRtmsForLevel(new RegExp('^W6[12]$'));
				}
			};
		}
	]);
