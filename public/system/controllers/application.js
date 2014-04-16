'use strict';

angular.module('wcb.system')
  .controller('AppCtrl', ['$scope', '$rootScope', 'security', 'i18nNotifications', 'I18N.MESSAGES', 'localizedMessages',
    function($scope, $rootScope, security, i18nNotifications, i18nMessages, localizedMessages) {

      $scope.notifications = i18nNotifications;
      $scope.user = security.getCurrentUser;
      $scope.isAuthenticated = security.isAuthenticated;
      var keys = Object.keys(i18nMessages);
      var messages = {};
      angular.forEach(keys, function(key) {
        messages[key] = localizedMessages.get(key);
      });
      $rootScope.messages = messages;

      $scope.removeNotification = function (notification) {
        i18nNotifications.remove(notification);
      };

      $rootScope.$on('$routeChangeError', function (event, current, previous, rejection) {
        i18nNotifications.pushForCurrentRoute('errors.route.changeError', 'error', {}, {rejection: rejection});
      });
    }
  ]);