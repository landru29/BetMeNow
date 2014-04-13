'use strict';

// Teams service used for teams REST endpoint
angular.module('wcb.teams').factory('Teams', ['$resource', function($resource) {
    return $resource('teams/:teamId', {
        teamId: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}]);
