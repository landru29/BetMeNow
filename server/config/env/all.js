'use strict';

var path = require('path');
var rootPath = path.normalize(__dirname + '/../../..');

module.exports = {
	root: rootPath,
	port: process.env.PORT || 3000,
	db: process.env.MONGOHQ_URL,
	templateEngine: 'swig',

	// The secret should be set to a non-guessable string that
	// is used to compute a session hash
	sessionSecret: 'l-K|3xm/)n<4bgIzd>8S+q7JX$bDQ._t1gze/#|~z1LTvOiS ?88CP;30Jt%Gv5u',
	// The name of the MongoDB collection to store sessions in
	sessionCollection: 'sessions'
};
