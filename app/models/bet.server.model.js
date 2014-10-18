'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Bet Schema
 */
var BetSchema = new Schema({
	created: {
		type: Date,
		default: Date.now
	},
	title: {
		type: String,
		default: '',
		trim: true,
		// required: 'Title cannot be blank'
	},
	stake: {
		type: Number,
		default: 0,
		trim: true,
	},

	isSeen: {
		type: Boolean,
		default: false,
		trim: true
	},

	isAccepted: {
		type: Boolean,
		default: false,
		trim: true
	},

	isBegun: {
		type: Boolean,
		default: false,
		trim: true
	},

	isEnded: {
		type: Boolean,
		default: false,
		trim: true
	},

	challengerScore: {
		type: Number,
		default: null
	},


	challengeeScore: {
		type: Number,
		default: null
	},


	challengee: {
		type: Schema.ObjectId,
		ref: 'User'
	},

	challenger: {
		type: Schema.ObjectId,
		ref: 'User'
	}
});

mongoose.model('Bet', BetSchema);