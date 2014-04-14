'use strict';

// matches routes use matches controller
var matches = require('../controllers/matches');
var authorization = require('./middlewares/authorization');

// Match authorization helpers
var hasAuthorization = function(req, res, next) {
	if (! req.user.hasRole('manager') && ! req.user.hasRole('admin')) {
        return res.send(401, 'User is not authorized');
    }
    next();
};

module.exports = function(app) {

    app.get('/api/matches', matches.all);
    app.post('/api/matches', authorization.requiresLogin, hasAuthorization, matches.create);
    app.get('/api/matches/:matchId', matches.show);
    app.put('/api/matches/:matchId', authorization.requiresLogin, hasAuthorization, matches.update);
    app.del('/api/matches/:matchId', authorization.requiresLogin, hasAuthorization, matches.destroy);

    // Finish with setting up the matchId param
    app.param('matchId', matches.match);

};
