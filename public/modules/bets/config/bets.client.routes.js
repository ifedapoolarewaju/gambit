'use strict';

// Setting up route
angular.module('bets').config(['$stateProvider',
	function($stateProvider) {
		// Articles state routing
		$stateProvider.
		state('listBets', {
			url: '/bets',
			templateUrl: 'modules/bets/views/list-bets.client.view.html'
		}).
		state('createBet', {
			url: '/bets/create',
			templateUrl: 'modules/bets/views/create-bet.client.view.html'
		}).
		state('editBet', {
			url: '/bets/:betId/edit',
			templateUrl: 'modules/bets/views/edit-bet.client.view.html'
		});
	}
]);