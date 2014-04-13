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

    app.get('/rtms', rtms.all);
    app.get('/rtms/forSelect', rtms.forSelect);
    app.get('/rtms/:rtmId', rtms.show);
    app.post('/rtms', authorization.requiresLogin, hasAuthorization, rtms.create);
    app.put('/rtms/:rtmId', authorization.requiresLogin, hasAuthorization, rtms.update);
    app.del('/rtms/:rtmId', authorization.requiresLogin, hasAuthorization, rtms.destroy);

    // Finish with setting up the rtmId param
    app.param('rtmId', rtms.rtm);

};
