'use strict';

// Bets service used for bets REST endpoint
angular.module('wcb.bets').factory('Bets', ['$resource', function($resource) {
  return $resource('/api/bets/:betId', {
    matchId: '@_id'
  }, {
    update: {
      method: 'PUT'
    }
  });
}]);
