'use strict';

module.exports = {
    db: process.env.MONGOHQ_URL || 'mongodb://localhost/wcb-dev',
    app: {
        name: 'WCB - World Cup Brazil 2014 - Development'
    }
};
