'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('../errors'),
	User = mongoose.model('User'),
	_ = require('lodash');



/**
 * Show the current user
 */
exports.read = function(req, res) {
	res.jsonp(req.unloggedUser);
};




exports.update = function(req, res) {
	var user = req.unloggedUser;

	user = _.extend(user, req.body);
	
	user.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(user);
		}
	});
};







/**
 * List of Users
 */
exports.list = function(req, res) {
	var regEx = new RegExp(req.query.query, 'i');
	User.find({username : regEx}).sort('-points').limit(20).exec(function(err, users) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(users);
		}
	});
};



/**
 * User middleware
 */
exports.userByID = function(req, res, next, id) {
	User.findById(id).exec(function(err, user) {
		if (err) return next(err);
		if (!user) return next(new Error('Failed to load user ' + id));
		req.unloggedUser = user;
		next();
	});
};
