'use strict';

//Global service for global variables
angular.module('wcb.system').factory('Global', [
    function() {
        var _this = this;
        _this._data = {
            user: window.user,
            authenticated: !! window.user,
            roles: window.roles,
            hasRole: function(role) {
              console.log(role, this.roles);
              return this.roles.indexOf(role);
            }
        };
        return _this._data;
    }
]);
