'use strict';

// Based loosely around work by Witold Szczerba - https://github.com/witoldsz/angular-http-auth
angular.module('wcb.auth.security', [
  'wcb.auth.security.service',
  'wcb.auth.security.interceptor',
  'wcb.auth.security.authorization']);