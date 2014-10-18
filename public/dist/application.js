'use strict';
// Init the application configuration module for AngularJS application
var ApplicationConfiguration = function () {
    // Init module configuration options
    var applicationModuleName = 'gambit';
    var applicationModuleVendorDependencies = [
        'ngResource',
        'ngCookies',
        'ngAnimate',
        'ngTouch',
        'ngSanitize',
        'ui.router',
        'ui.bootstrap',
        'ui.utils',
        'btford.socket-io'
      ];
    // Add a new vertical module
    var registerModule = function (moduleName, dependencies) {
      // Create angular module
      angular.module(moduleName, dependencies || []);
      // Add the module to the AngularJS configuration file
      angular.module(applicationModuleName).requires.push(moduleName);
    };
    return {
      applicationModuleName: applicationModuleName,
      applicationModuleVendorDependencies: applicationModuleVendorDependencies,
      registerModule: registerModule
    };
  }();'use strict';
//Start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);
// Setting HTML5 Location Mode
angular.module(ApplicationConfiguration.applicationModuleName).config([
  '$locationProvider',
  function ($locationProvider) {
    $locationProvider.hashPrefix('!');
  }
]);
//Then define the init function for starting up the application
angular.element(document).ready(function () {
  //Fixing facebook bug with redirect
  if (window.location.hash === '#_=_')
    window.location.hash = '#!';
  //Then init the app
  angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});'use strict';
// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('bets');'use strict';
// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('core');'use strict';
// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('users');// 'use strict';
// // Configuring the Bets module
// angular.module('bets').run(['Menus',
// 	function(Menus) {
// 		// Set top bar menu items
// 		Menus.addMenuItem('topbar', 'Bets', 'bets', 'dropdown', '/bets(/create)?');
// 		Menus.addSubMenuItem('topbar', 'bets', 'List Bets', 'bets');
// 		Menus.addSubMenuItem('topbar', 'bets', 'New Bet', 'bets/create');
// 	}
// ]);
'use strict';
// Setting up route
angular.module('bets').config([
  '$stateProvider',
  function ($stateProvider) {
    // Articles state routing
    $stateProvider.state('listBets', {
      url: '/bets',
      templateUrl: 'modules/bets/views/list-bets.client.view.html'
    }).state('createBet', {
      url: '/bets/create',
      templateUrl: 'modules/bets/views/create-bet.client.view.html'
    }).state('editBet', {
      url: '/bets/:betId/edit',
      templateUrl: 'modules/bets/views/edit-bet.client.view.html'
    });
  }
]);'use strict';
angular.module('bets').controller('BetsController', [
  '$scope',
  '$stateParams',
  '$location',
  'Authentication',
  'Bets',
  'Socket',
  '$timeout',
  function ($scope, $stateParams, $location, Authentication, Bets, Socket, $timeout) {
    $scope.authentication = Authentication;
    $scope.betNotifications = [];
    var betsCtrl = this;
    Bets.query({
      challengee: Authentication.user._id,
      isSeen: false
    }, function (response) {
      $scope.betNotifications = response;
    });
    $scope.acceptedBets = [];
    betsCtrl.fillForm = function (user) {
      betsCtrl.challengee = user;
      betsCtrl.formState = true;
    };
    Socket.on('bet.created', function (bet) {
      if (bet.challengee === Authentication.user._id) {
        Bets.get({ betId: bet._id }, function (res) {
          $scope.betNotifications.push(res);
        });
      }
    });
    Socket.on('bet.accepted', function (bet) {
      if (bet.challenger._id === Authentication.user._id) {
        Bets.get({ betId: bet._id }, function (res) {
          $scope.acceptedBets.push(res);
        });
      }
    });
    betsCtrl.showAlert = false;
    $scope.setVal = function () {
      betsCtrl.showAlert = !betsCtrl.showAlert;
    };
    $scope.showFeedback = function (msg) {
      $scope.setVal();
      betsCtrl.message = msg;
      $timeout($scope.setVal, 3000);
    };
    //creates bet
    betsCtrl.create = function () {
      if (betsCtrl.title.trim() === '' || isNaN(parseInt(betsCtrl.stake, 10))) {
        $scope.showFeedback('invalid user input');
        return;
      }
      var bet = new Bets({
          title: betsCtrl.title,
          challengee: betsCtrl.challengee._id,
          stake: parseInt(betsCtrl.stake)
        });
      betsCtrl.title = null;
      betsCtrl.stake = null;
      bet.$save(function (response) {
        betsCtrl.formState = false;
        $scope.showFeedback('Bet Challenge Created...');
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };
  }
]);
// $scope.create();
angular.module('bets').controller('BetGameController', [
  '$scope',
  '$stateParams',
  '$location',
  'Authentication',
  'Socket',
  'Bets',
  '$timeout',
  'obj',
  'Users',
  function ($scope, $stateParams, $location, Authentication, Socket, Bets, $timeout, obj, Users) {
    $scope.showPane = false;
    $scope.postGenerationTime = 100;
    $scope.countdownNum = 60;
    $scope.bet = obj;
    $scope.wonBet = null;
    Socket.on('bet.begun', function (bet) {
      {
        $scope.isOnline = bet.isBegun;
      }
    });
    Socket.on('bet.scored', function (bet) {
      {
        // $scope.isScored = true;
        $scope.scoredBet = bet;
        $scope.getWinner();
      }
    });
    $scope.startGame = function () {
      //this should display the game pane
      $scope.user = Users.get({ userId: Authentication.user._id }, function (res) {
        res.points -= $scope.bet.stake;
        res.stakedPoints += $scope.bet.stake;
        res.$update();
      });
      if ($scope.bet.challenger._id === Authentication.user._id) {
        $scope.player = 'challenger';
        $scope.bet.isBegun = true;
        $scope.bet.$update(function (res) {
          //if game ended
          if ($scope.bet.isEnded) {
          } else {
            $scope.showCountdown = false;
            $scope.showGameEnv = true;
          }
        });
        return;
      } else if ($scope.bet.challengee._id === Authentication.user._id) {
        $scope.player = 'challengee';
        $scope.bet.isAccepted = true;
        $scope.bet.$update(function (res) {
        });
      }
      $scope.showCountdown = true;
      $scope.countdown();
    };
    $scope.countdown = function () {
      $scope.countdownNum--;
      if ($scope.countdownNum <= 0) {
        //delete bet...no dont do that...the other player wont b able to refer to it.
        //jus nullify the bet instead...i.e isEnded = true and do nothing else
        $scope.gameCancelled = true;
        // dont know the use of this variable yet
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
    };
    $scope.generateDiceNumber = function () {
      $scope.diceNumber = Math.floor(Math.random() * 100);
      $scope.showNumberGenerationIllusion = true;
      $scope.managePostDiceNumberGenerationDelay();
    };
    $scope.managePostDiceNumberGenerationDelay = function () {
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
    };
    $scope.tweakDiceNumber = function () {
      if ($scope.diceNumber >= 30) {
        $scope.diceNumber -= 10;
      } else if ($scope.diceNumber < 30) {
        $scope.diceNumber += 10;
      }
    };
    $scope.recordScore = function () {
      //record player input or generated number
      Bets.get({ betId: $scope.bet._id }, function (res) {
        $scope.bet = res;
        $scope.bet[$scope.player + 'Score'] = $scope.diceNumber;
        $scope.bet.$update(function (res) {
          console.log('recordScore is working', res);
        });
      });
    };
    $scope.getWinner = function () {
      if (Math.max($scope.scoredBet.challengeeScore, $scope.scoredBet.challengerScore) !== $scope.scoredBet[$scope.player + 'Score']) {
        $scope.winnerMsg = 'You Lost!!!';
        $scope.user.points -= $scope.scoredBet.stake;
        $scope.user.stakedPoints -= $scope.scoredBet.stake;
      } else {
        $scope.winnerMsg = 'You Won!!!';
        $scope.user.points += $scope.scoredBet.stake * 2;
        $scope.user.stakedPoints -= $scope.scoredBet.stake;
      }
      $scope.user.update(function (res) {
      });
      $scope.showWinner = true;
    };
    $scope.startGame();
  }
]);'use strict';
//Bets service used for communicating with the articles REST endpoints
angular.module('bets').factory('Bets', [
  '$resource',
  function ($resource) {
    return $resource('bets/:betId', { betId: '@_id' }, { update: { method: 'PUT' } });
  }
]);'use strict';
// Setting up route
angular.module('core').config([
  '$stateProvider',
  '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {
    // Redirect to home view when route not found
    $urlRouterProvider.otherwise('/');
    // Home state routing
    $stateProvider.state('home', {
      url: '/',
      templateUrl: 'modules/core/views/home.client.view.html'
    });
  }
]);'use strict';
angular.module('core').controller('HeaderController', [
  '$scope',
  'Authentication',
  'Menus',
  function ($scope, Authentication, Menus) {
    $scope.authentication = Authentication;
    $scope.isCollapsed = false;
    $scope.menu = Menus.getMenu('topbar');
    $scope.toggleCollapsibleMenu = function () {
      $scope.isCollapsed = !$scope.isCollapsed;
    };
    // Collapsing the menu after navigation
    $scope.$on('$stateChangeSuccess', function () {
      $scope.isCollapsed = false;
    });
  }
]);'use strict';
angular.module('core').controller('HomeController', [
  '$scope',
  'Authentication',
  function ($scope, Authentication) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
  }
]);'use strict';
//Menu service used for managing  menus
angular.module('core').service('Menus', [function () {
    // Define a set of default roles
    this.defaultRoles = ['*'];
    // Define the menus object
    this.menus = {};
    // A private function for rendering decision 
    var shouldRender = function (user) {
      if (user) {
        if (!!~this.roles.indexOf('*')) {
          return true;
        } else {
          for (var userRoleIndex in user.roles) {
            for (var roleIndex in this.roles) {
              if (this.roles[roleIndex] === user.roles[userRoleIndex]) {
                return true;
              }
            }
          }
        }
      } else {
        return this.isPublic;
      }
      return false;
    };
    // Validate menu existance
    this.validateMenuExistance = function (menuId) {
      if (menuId && menuId.length) {
        if (this.menus[menuId]) {
          return true;
        } else {
          throw new Error('Menu does not exists');
        }
      } else {
        throw new Error('MenuId was not provided');
      }
      return false;
    };
    // Get the menu object by menu id
    this.getMenu = function (menuId) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Return the menu object
      return this.menus[menuId];
    };
    // Add new menu object by menu id
    this.addMenu = function (menuId, isPublic, roles) {
      // Create the new menu
      this.menus[menuId] = {
        isPublic: isPublic || false,
        roles: roles || this.defaultRoles,
        items: [],
        shouldRender: shouldRender
      };
      // Return the menu object
      return this.menus[menuId];
    };
    // Remove existing menu object by menu id
    this.removeMenu = function (menuId) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Return the menu object
      delete this.menus[menuId];
    };
    // Add menu item object
    this.addMenuItem = function (menuId, menuItemTitle, menuItemURL, menuItemType, menuItemUIRoute, isPublic, roles, position) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Push new menu item
      this.menus[menuId].items.push({
        title: menuItemTitle,
        link: menuItemURL,
        menuItemType: menuItemType || 'item',
        menuItemClass: menuItemType,
        uiRoute: menuItemUIRoute || '/' + menuItemURL,
        isPublic: isPublic === null || typeof isPublic === 'undefined' ? this.menus[menuId].isPublic : isPublic,
        roles: roles === null || typeof roles === 'undefined' ? this.menus[menuId].roles : roles,
        position: position || 0,
        items: [],
        shouldRender: shouldRender
      });
      // Return the menu object
      return this.menus[menuId];
    };
    // Add submenu item object
    this.addSubMenuItem = function (menuId, rootMenuItemURL, menuItemTitle, menuItemURL, menuItemUIRoute, isPublic, roles, position) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Search for menu item
      for (var itemIndex in this.menus[menuId].items) {
        if (this.menus[menuId].items[itemIndex].link === rootMenuItemURL) {
          // Push new submenu item
          this.menus[menuId].items[itemIndex].items.push({
            title: menuItemTitle,
            link: menuItemURL,
            uiRoute: menuItemUIRoute || '/' + menuItemURL,
            isPublic: isPublic === null || typeof isPublic === 'undefined' ? this.menus[menuId].items[itemIndex].isPublic : isPublic,
            roles: roles === null || typeof roles === 'undefined' ? this.menus[menuId].items[itemIndex].roles : roles,
            position: position || 0,
            shouldRender: shouldRender
          });
        }
      }
      // Return the menu object
      return this.menus[menuId];
    };
    // Remove existing menu object by menu id
    this.removeMenuItem = function (menuId, menuItemURL) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Search for menu item to remove
      for (var itemIndex in this.menus[menuId].items) {
        if (this.menus[menuId].items[itemIndex].link === menuItemURL) {
          this.menus[menuId].items.splice(itemIndex, 1);
        }
      }
      // Return the menu object
      return this.menus[menuId];
    };
    // Remove existing menu object by menu id
    this.removeSubMenuItem = function (menuId, submenuItemURL) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Search for menu item to remove
      for (var itemIndex in this.menus[menuId].items) {
        for (var subitemIndex in this.menus[menuId].items[itemIndex].items) {
          if (this.menus[menuId].items[itemIndex].items[subitemIndex].link === submenuItemURL) {
            this.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
          }
        }
      }
      // Return the menu object
      return this.menus[menuId];
    };
    //Adding the topbar menu
    this.addMenu('topbar');
  }]);'use strict';
//socket factory that provides the socket service
angular.module('core').factory('Socket', [
  'socketFactory',
  function (socketFactory) {
    return socketFactory({
      prefix: '',
      ioSocket: io.connect('http://localhost:3000')
    });
  }
]);'use strict';
// Config HTTP Error Handling
angular.module('users').config([
  '$httpProvider',
  function ($httpProvider) {
    // Set the httpProvider "not authorized" interceptor
    $httpProvider.interceptors.push([
      '$q',
      '$location',
      'Authentication',
      function ($q, $location, Authentication) {
        return {
          responseError: function (rejection) {
            switch (rejection.status) {
            case 401:
              // Deauthenticate the global user
              Authentication.user = null;
              // Redirect to signin page
              $location.path('signin');
              break;
            case 403:
              // Add unauthorized behaviour 
              break;
            }
            return $q.reject(rejection);
          }
        };
      }
    ]);
  }
]);  // angular.module('users').factory('Bets', ['$resource',
     // 	function($resource) {
     // 		return $resource('users/:userId', {
     // 			userId: '@_id'
     // 		}, {
     // 			update: {
     // 				method: 'PUT'
     // 			}
     // 		});
     // 	}
     // ]);
'use strict';
// Setting up route
angular.module('users').config([
  '$stateProvider',
  function ($stateProvider) {
    // Users state routing
    $stateProvider.state('profile', {
      url: '/settings/profile',
      templateUrl: 'modules/users/views/settings/edit-profile.client.view.html'
    }).state('password', {
      url: '/settings/password',
      templateUrl: 'modules/users/views/settings/change-password.client.view.html'
    }).state('accounts', {
      url: '/settings/accounts',
      templateUrl: 'modules/users/views/settings/social-accounts.client.view.html'
    }).state('signup', {
      url: '/signup',
      templateUrl: 'modules/users/views/authentication/signup.client.view.html'
    }).state('signin', {
      url: '/signin',
      templateUrl: 'modules/users/views/authentication/signin.client.view.html'
    }).state('forgot', {
      url: '/password/forgot',
      templateUrl: 'modules/users/views/password/forgot-password.client.view.html'
    }).state('reset-invlaid', {
      url: '/password/reset/invalid',
      templateUrl: 'modules/users/views/password/reset-password-invalid.client.view.html'
    }).state('reset-success', {
      url: '/password/reset/success',
      templateUrl: 'modules/users/views/password/reset-password-success.client.view.html'
    }).state('reset', {
      url: '/password/reset/:token',
      templateUrl: 'modules/users/views/password/reset-password.client.view.html'
    }).state('users', {
      url: '/users',
      templateUrl: 'modules/users/views/users.client.view.html'
    });
  }
]);'use strict';
angular.module('users').controller('AuthenticationController', [
  '$scope',
  '$http',
  '$location',
  'Authentication',
  function ($scope, $http, $location, Authentication) {
    $scope.authentication = Authentication;
    // If user is signed in then redirect back home
    if ($scope.authentication.user)
      $location.path('/');
    $scope.signup = function () {
      $http.post('/auth/signup', $scope.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;
        // And redirect to the index page
        $location.path('/');
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
    $scope.signin = function () {
      $http.post('/auth/signin', $scope.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;
        // And redirect to the index page
        $location.path('/');
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);'use strict';
angular.module('users').controller('PasswordController', [
  '$scope',
  '$stateParams',
  '$http',
  '$location',
  'Authentication',
  function ($scope, $stateParams, $http, $location, Authentication) {
    $scope.authentication = Authentication;
    //If user is signed in then redirect back home
    if ($scope.authentication.user)
      $location.path('/');
    // Submit forgotten password account id
    $scope.askForPasswordReset = function () {
      $scope.success = $scope.error = null;
      $http.post('/auth/forgot', $scope.credentials).success(function (response) {
        // Show user success message and clear form
        $scope.credentials = null;
        $scope.success = response.message;
      }).error(function (response) {
        // Show user error message and clear form
        $scope.credentials = null;
        $scope.error = response.message;
      });
    };
    // Change user password
    $scope.resetUserPassword = function () {
      $scope.success = $scope.error = null;
      $http.post('/auth/reset/' + $stateParams.token, $scope.passwordDetails).success(function (response) {
        // If successful show success message and clear form
        $scope.passwordDetails = null;
        // Attach user profile
        Authentication.user = response;
        // And redirect to the index page
        $location.path('/password/reset/success');
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);'use strict';
angular.module('users').controller('SettingsController', [
  '$scope',
  '$http',
  '$location',
  'Users',
  'Authentication',
  function ($scope, $http, $location, Users, Authentication) {
    $scope.user = Authentication.user;
    // If user is not signed in then redirect back home
    if (!$scope.user)
      $location.path('/');
    // Check if there are additional accounts 
    $scope.hasConnectedAdditionalSocialAccounts = function (provider) {
      for (var i in $scope.user.additionalProvidersData) {
        return true;
      }
      return false;
    };
    // Check if provider is already in use with current user
    $scope.isConnectedSocialAccount = function (provider) {
      return $scope.user.provider === provider || $scope.user.additionalProvidersData && $scope.user.additionalProvidersData[provider];
    };
    // Remove a user social account
    $scope.removeUserSocialAccount = function (provider) {
      $scope.success = $scope.error = null;
      $http.delete('/users/accounts', { params: { provider: provider } }).success(function (response) {
        // If successful show success message and clear form
        $scope.success = true;
        $scope.user = Authentication.user = response;
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
    // Update a user profile
    $scope.updateUserProfile = function (isValid) {
      if (isValid) {
        $scope.success = $scope.error = null;
        var user = new Users($scope.user);
        user.$update(function (response) {
          $scope.success = true;
          Authentication.user = response;
        }, function (response) {
          $scope.error = response.data.message;
        });
      } else {
        $scope.submitted = true;
      }
    };
    // Change user password
    $scope.changeUserPassword = function () {
      $scope.success = $scope.error = null;
      $http.post('/users/password', $scope.passwordDetails).success(function (response) {
        // If successful show success message and clear form
        $scope.success = true;
        $scope.passwordDetails = null;
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);'use strict';
angular.module('users').controller('UserQueryController', [
  '$scope',
  '$stateParams',
  '$location',
  'Authentication',
  'Users',
  function ($scope, $stateParams, $location, Authentication, Users) {
    $scope.authentication = Authentication;
    var _this = this;
    this.fillForm = function (userID, username) {
      _this.state = true;
      _this.userID = userID;
      _this.username = username;
    };
    $scope.submitSearch = function () {
      var search = $scope.search;
      $scope.search = '';
      if ($location.path() === '/users') {
        $location.search({ query: search });
        $scope.find();
      } else {
        $location.path('users').search({ query: search });
      }
    };
    $scope.find = function () {
      Users.query($location.search(), function (res) {
        $scope.users = res;
      });
    };
    $scope.findOne = function () {
      $scope.article = Users.get({ articleId: $stateParams.articleId });
    };
  }
]);
angular.module('bets').controller('ModalDemoCtrl', [
  '$scope',
  '$modal',
  '$log',
  function ($scope, $modal, $log) {
    $scope.open = function (size, templateUrl, controller, obj) {
      var modalInstance = $modal.open({
          templateUrl: templateUrl,
          controller: controller,
          size: size,
          resolve: {
            obj: function () {
              return obj;
            }
          }
        });
      modalInstance.result.then(function (selectedItem) {
        $scope.selected = selectedItem;
      }, function () {
        $log.info('Modal dismissed at: ' + new Date());
      });
    };
  }
]);
// Please note that $modalInstance represents a modal window (instance) dependency.
// It is not the same as the $modal service used above.
angular.module('bets').controller('ModalInstanceCtrl', [
  '$scope',
  '$modalInstance',
  '$location',
  'obj',
  'Bets',
  '$stateParams',
  'Authentication',
  'Socket',
  function ($scope, $modalInstance, $location, obj, Bets, $stateParams, Authentication, Socket) {
    $scope.notification = obj;
    $scope.notification.isSeen = true;
    $scope.notification.$update(function (response) {
    });
    $scope.ok = function () {
      $modalInstance.close($scope.selected.item);
    };
    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }
]);'use strict';
// Authentication service for user variables
angular.module('users').factory('Authentication', [function () {
    var _this = this;
    _this._data = { user: window.user };
    return _this._data;
  }]);'use strict';
// Users service used for communicating with the users REST endpoint
angular.module('users').factory('Users', [
  '$resource',
  function ($resource) {
    return $resource('users/:userId', { userId: '@_id' }, { update: { method: 'PUT' } });
  }
]);