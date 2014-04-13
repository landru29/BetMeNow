'use strict';

angular.module('wcb.system').controller('HeaderController', ['$scope', '$rootScope', 'Global',
    function($scope, $rootScope, Global) {
        $scope.global = Global;
        $scope.menus = [
			{
				'roles': [''],
				'title': 'Teams',
				'link': 'all teams'
			}, {
				'roles': ['manager', 'admin'],
				'title': 'Create New Team',
				'link': 'create team'
			}, {
				'roles': [''],
				'title': 'Matches',
				'link': 'all matches'
			}, {
				'roles': ['manager', 'admin'],
				'title': 'Create New Match',
				'link': 'create match'
			}
		];
    }
]);
