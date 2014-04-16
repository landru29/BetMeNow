'use strict';

var index = require('../controllers/index');

module.exports = function(app) {
    app.get('/', index.render);
    app.get('/locale/:locale', function(req, res) {
      console.log('param locale: ' + /^\w{2}-\w{2}$/.test(req.param('locale')));
      if (req.param('locale') === '' || !/^\w{2}-\w{2}$/.test(req.param('locale'))) {
        return res.json(412, {message: 'Locale format incorrect'});
      }
      req.session.locale = req.param('locale');
      res.json(200, {message: 'locale changed'});
    });
};
