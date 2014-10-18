'use strict';

/**
 * Module dependencies.
 */
var users = require('../../app/controllers/users'),
	bets = require('../../app/controllers/bets');

module.exports = function(app) {
	// Bet Routes
	app.route('/bets')
		.get(bets.list)
		.post(users.requiresLogin, bets.create);

	app.route('/bets/:betId')
		.get(bets.read)
		.put(bets.update)
		.delete(users.requiresLogin, bets.hasAuthorization, bets.delete);

	// Finish by binding the bet middleware
	app.param('betId', bets.betByID);


	app.param('userId', users.userByID);
};