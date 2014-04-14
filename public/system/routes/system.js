'use strict';

//Setting up route
angular.module('wcb.system').config(['$routeProvider',
  function ($routeProvider) {

    $routeProvider.when('/', {
      templateUrl:'/public/system/views/index.html',
      controller:'HomeCtrl'
    });
  }
]);