'use strict';

angular.module('wcb.system')
  .controller('AppCtrl', ['$scope', '$rootScope', 'notifications', 'security',
    function($scope, $rootScope, notifications, security) {

      $scope.notifications = notifications;
      $scope.user = security.getCurrentUser;
      $scope.isAuthenticated = security.isAuthenticated;
      
      $scope.removeNotification = function (notification) {
        notifications.remove(notification);
      };

      $rootScope.$on('$routeChangeError', function (event, current, previous, rejection) {
        notifications.pushForCurrentRoute({message: 'errors.route.changeError', type: 'error'});
      });
    }
  ]);