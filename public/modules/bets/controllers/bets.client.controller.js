'use strict';

angular.module('bets').controller('BetsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Bets', 'Socket', '$timeout',
    function($scope, $stateParams, $location, Authentication, Bets, Socket, $timeout) {

        $scope.authentication = Authentication;
        $scope.betNotifications = [];

        var betsCtrl = this;

        Bets.query({
            challengee: Authentication.user._id,
            isSeen: false
        }, function(response) {
            $scope.betNotifications = response;
        });



        $scope.acceptedBets = [];

        betsCtrl.fillForm = function(user){
        	betsCtrl.challengee = user;
        	betsCtrl.formState = true;
        }

        Socket.on('bet.created', function(bet) {
            if (bet.challengee === Authentication.user._id) {
            	Bets.get({betId: bet._id}, function(res){
            		$scope.betNotifications.push(res);	
            	})
                
                
            }
        });


        Socket.on('bet.accepted', function(bet) {
            if (bet.challenger._id === Authentication.user._id) {
                Bets.get({betId: bet._id}, function(res){
            		$scope.acceptedBets.push(res);
            	})
                
            }
        });

        betsCtrl.showAlert = false;

        $scope.setVal = function(){
        	betsCtrl.showAlert = !betsCtrl.showAlert;
        }


        $scope.showFeedback = function(msg)
        {
        	$scope.setVal();
            betsCtrl.message = msg;
            $timeout($scope.setVal, 3000);
        }


        //creates bet
        betsCtrl.create = function() {
        	if(betsCtrl.title.trim()==='' || isNaN(parseInt(betsCtrl.stake, 10))){
        		$scope.showFeedback("invalid user input");
        		return;
        	}
            var bet = new Bets({
                title: betsCtrl.title,
                challengee: betsCtrl.challengee._id,
                stake: parseInt(betsCtrl.stake),

            });
            betsCtrl.title = null;
            betsCtrl.stake = null;
            bet.$save(function(response) {
                betsCtrl.formState = false;
         		$scope.showFeedback("Bet Challenge Created...");

            }, function(errorResponse) {
                $scope.error = errorResponse.data.message;
            });
        };

    }]);    // $scope.create();



angular.module('bets').controller('BetGameController', ['$scope', '$stateParams', '$location', 'Authentication', 'Socket', 'Bets', '$timeout', 'obj', 'Users',
    function($scope, $stateParams, $location, Authentication, Socket, Bets, $timeout, obj, Users) {
        $scope.showPane = false;
        $scope.postGenerationTime = 100;
        $scope.countdownNum = 60;
        $scope.bet = obj;
        $scope.wonBet = null;

        Socket.on('bet.begun', function(bet) {
            {
                $scope.isOnline = bet.isBegun;
            }
        });



        Socket.on('bet.scored', function(bet) {
            {
                // $scope.isScored = true;
                $scope.scoredBet = bet;
                $scope.getWinner();
            }
        });

        $scope.startGame = function() {
            //this should display the game pane
            $scope.user = Users.get({userId: Authentication.user._id}, function(res){
            	res.points -= $scope.bet.stake;
				res.stakedPoints += $scope.bet.stake;
				res.$update();  
            })

            if ($scope.bet.challenger._id === Authentication.user._id) {
                $scope.player = "challenger";
                $scope.bet.isBegun = true;
                $scope.bet.$update(function(res) {
                    //if game ended
                    if ($scope.bet.isEnded) {
                        //show ended pane
                    } else {
                        $scope.showCountdown = false;
                        $scope.showGameEnv = true;
                    }
                });
                return;
            } else if ($scope.bet.challengee._id === Authentication.user._id) {
                $scope.player = "challengee";
                $scope.bet.isAccepted = true;
                $scope.bet.$update(function(res) {});



            }

            $scope.showCountdown = true;

            $scope.countdown();

        };


        $scope.countdown = function() {
            $scope.countdownNum--;
            if ($scope.countdownNum <= 0) {
                //delete bet...no dont do that...the other player wont b able to refer to it.
                //jus nullify the bet instead...i.e isEnded = true and do nothing else
                $scope.gameCancelled = true; // dont know the use of this variable yet

                return;
            }

            //if user==online, set bet to begun and break from loop
            if ($scope.isOnline) {
                $scope.showCountdown = false;
                $scope.showGameEnv = true;

                //show game environment
                return;
            }
            $timeout($scope.countdown, 1000);
        }




        $scope.generateDiceNumber = function() {
            $scope.diceNumber = Math.floor(Math.random() * 100);
            $scope.showNumberGenerationIllusion = true;
            $scope.managePostDiceNumberGenerationDelay();
        }




        $scope.managePostDiceNumberGenerationDelay = function() {
            $scope.postGenerationTime--;
            $scope.illusiveNumber = Math.floor(Math.random() * 100);
            if ($scope.postGenerationTime <= 0) {
                $scope.showNumberGenerationIllusion = false;

                //show dice number
                $scope.showDiceNumber = true;
                //record score
                $scope.recordScore();
                //...myt av to set a timer on d server side...wat if the server gets restarted
                //wait for player 2 or not...show winner, close pane

                //end game
                // $scope.endGame();
                return;
            }

            if ($scope.tweaked) {
                $scope.postGenerationTime = 200;
                $scope.tweaked = false;
                //do tweaking
                $scope.tweakDiceNumber();
            }

            $timeout($scope.managePostDiceNumberGenerationDelay, 100);
        }

        $scope.tweakDiceNumber = function() {
            if ($scope.diceNumber >= 30) {
                $scope.diceNumber -= 10;
            } else if ($scope.diceNumber < 30) {
                $scope.diceNumber += 10;
            }
        }

        $scope.recordScore = function() {
            //record player input or generated number
            Bets.get({betId:$scope.bet._id}, function(res){
            	$scope.bet = res;
            	$scope.bet[$scope.player + "Score"] = $scope.diceNumber;
            	$scope.bet.$update(function(res) {console.log("recordScore is working", res)});
            })
            
        };

        $scope.getWinner = function(){
        	if (Math.max($scope.scoredBet.challengeeScore, $scope.scoredBet.challengerScore) 
        		!== $scope.scoredBet[$scope.player + "Score"])
        	{
        		$scope.winnerMsg = "You Lost!!!";

        		$scope.user.points -= $scope.scoredBet.stake;
        		$scope.user.stakedPoints -= $scope.scoredBet.stake;
        	}
        	else{
        		$scope.winnerMsg = "You Won!!!"	;

        		$scope.user.points += $scope.scoredBet.stake * 2;
        		$scope.user.stakedPoints -= $scope.scoredBet.stake;
        	}
        	$scope.user.update(function(res){});

        	$scope.showWinner = true;
        }

        $scope.startGame();

    }
]);
