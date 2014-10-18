'use strict';

//Bets service used for communicating with the articles REST endpoints
angular.module('bets').factory('Bets', ['$resource',
	function($resource) {
		return $resource('bets/:betId', {
			betId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);