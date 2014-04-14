'use strict';

angular.module('wcb.system')
  .controller('AppCtrl', ['$scope', '$rootScope', 'notifications',
    function($scope, $rootScope, notifications) {

      $scope.notifications = notifications;
      
      $scope.removeNotification = function (notification) {
        notifications.remove(notification);
      };

      $rootScope.$on('$routeChangeError', function (event, current, previous, rejection) {
        notifications.pushForCurrentRoute({message: 'errors.route.changeError', type: 'error'});
      });
    }
  ]);