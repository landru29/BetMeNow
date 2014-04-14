'use strict';

// Matches service used for matches REST endpoint
angular.module('wcb.matches').factory('Matches', ['$resource', function($resource) {
  return $resource('/api/matches/:matchId', {
    matchId: '@_id'
  }, {
    update: {
      method: 'PUT'
    }
  });
}]);
