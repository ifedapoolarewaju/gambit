'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors'),
	Bet = mongoose.model('Bet'),
	User = mongoose.model('User'),
	_ = require('lodash');

/**
 * Create a bet
 */
exports.create = function(req, res) {
	var bet = new Bet(req.body);
	bet.challenger = req.user;
	if(req.user.points < bet.stake || bet.challengee.points < bet.stake)
	{
		return res.status(403).send({
			message: "You don't have enough points or Your opponent hasn't enough points"
		});
	}
	bet.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			var socketio = req.app.get('socketio'); // tacke out socket instance from the app container

			socketio.sockets.emit('bet.created', bet); // emit an event for all connected clients
			res.jsonp(bet);
		}
	});
};

/**
 * Show the current bet
 */
exports.read = function(req, res) {
	res.jsonp(req.bet);
};

/**
 * Update a bet
 */
exports.update = function(req, res) {
	var bet = req.bet;
	var initialIsAccpeted = req.bet.isAccepted;
	var initialIsBegun = req.bet.isBegun;
	var initialChallengerScore = req.bet.challengerScore;
	var initialChallengeeScore = req.bet.challengeeScore;

	bet = _.extend(bet, req.body);
	
	bet.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			var socketio = req.app.get('socketio'); // tacke out socket instance from the app container
			
			if(!initialIsAccpeted && bet.isAccepted){
				socketio.sockets.emit('bet.accepted', req.bet); // emit an event for all connected clients
			}

			if(!initialIsBegun && bet.isBegun)
			{
				socketio.sockets.emit('bet.begun', req.bet); // emit an event for all connected clients
			}

			if((initialChallengeeScore === null || initialChallengerScore === null) && 
				(bet.challengeeScore !==null && bet.challengerScore !==null))
			{
				socketio.sockets.emit('bet.scored', req.bet); // emit an event for all connected clients	
			}

			res.jsonp(bet);
		}
	});
};

/**
 * Delete a bet
 */
exports.delete = function(req, res) {
	var bet = req.bet;

	bet.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(bet);
		}
	});
};

/**
 * List of Bets
 */
exports.list = function(req, res) {
	//this doesnt feel right though...it looks hacker prone
	Bet.find(req.query).sort('-created').populate('challenger', 'displayName').populate('challengee', 'displayName').exec(function(err, bets) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(bets);
		}
	});
};



/**
 * Bet middleware
 */
exports.betByID = function(req, res, next, id) {
	Bet.findById(id).populate('challenger', 'displayName').populate('challengee', 'displayName').exec(function(err, bet) {
		if (err) return next(err);
		if (!bet) return next(new Error('Failed to load bet ' + id));
		req.bet = bet;
		next();
	});
};

/**
 * Bet authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.bet.user.id !== req.user.id) {
		return res.status(403).send({
			message: 'User is not authorized'
		});
	}
	next();
};