'use strict';

// RTMs routes use rtms controller
var rtms = require('../controllers/rtms');
var authorization = require('./middlewares/authorization');

// RTM authorization helpers
var hasAuthorization = function(req, res, next) {
	if (! req.user.hasRole('manager') && ! req.user.hasRole('admin')) {
        return res.send(401, 'User is not authorized');
    }
    next();
};

module.exports = function(app) {

    app.get('/api/rtms', rtms.all);
    app.get('/api/rtms/forSelect', rtms.forSelect);
    app.get('/api/rtms/:rtmId', rtms.show);
    app.post('/api/rtms', authorization.requiresLogin, hasAuthorization, rtms.create);
    app.put('/api/rtms/:rtmId', authorization.requiresLogin, hasAuthorization, rtms.update);
    app.del('/api/rtms/:rtmId', authorization.requiresLogin, hasAuthorization, rtms.destroy);

    // Finish with setting up the rtmId param
    app.param('rtmId', rtms.rtm);

};
