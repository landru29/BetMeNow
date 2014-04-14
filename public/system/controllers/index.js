'use strict';

angular.module('wcb.system').controller('HomeCtrl', ['$scope', 'Global', function ($scope, Global) {
    $scope.global = Global;
}]);
