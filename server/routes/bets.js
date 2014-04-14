'use strict';

// RTMs routes use bets controller
var bets = require('../controllers/bets');
var authorization = require('./middlewares/authorization');

// RTM authorization helpers
var hasAuthorization = function(req, res, next) {
  if (! req.user.hasRole('manager') && ! req.user.hasRole('admin')) {
        return res.send(401, 'User is not authorized');
    }
    next();
};

module.exports = function(app) {

    app.get('/api/bets', authorization.requiresLogin, bets.all);
    app.get('/api/bets/:betId', authorization.requiresLogin, bets.show);
    app.post('/api/bets', authorization.requiresLogin, bets.create);
    app.put('/api/bets/:betId', authorization.requiresLogin, bets.update);
    app.del('/api/bets/:betId', authorization.requiresLogin, bets.destroy);

    // Finish with setting up the betId param
    app.param('betId', bets.bet);

};
