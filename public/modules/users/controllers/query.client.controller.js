'use strict';

angular.module('users').controller('UserQueryController', ['$scope', '$stateParams', '$location', 'Authentication', 'Users',
    function($scope, $stateParams, $location, Authentication, Users) {

        $scope.authentication = Authentication;
        var _this = this;
        

        this.fillForm = function(userID, username) {
            _this.state = true;
            _this.userID = userID;
            _this.username = username;
        }


        $scope.submitSearch = function() {
            var search = $scope.search;
            $scope.search = "";
            $location.path("users").search({
                query: search
            });
        };


        $scope.find = function() {
            Users.query($location.search(), 
            	function(res){
            		$scope.users = res;
            	}
            		);
        };

        $scope.findOne = function() {
            $scope.article = Users.get({
                articleId: $stateParams.articleId
            });
        };
    }
]);


angular.module('bets').controller('ModalDemoCtrl', function($scope, $modal, $log) {


    $scope.open = function(size, templateUrl, controller, obj) {

        var modalInstance = $modal.open({
            templateUrl: templateUrl,
            controller: controller,
            size: size,
            resolve: {
                obj: function() {
                    return obj;
                }
            }
        });

        modalInstance.result.then(function(selectedItem) {
            $scope.selected = selectedItem;
        }, function() {
            $log.info('Modal dismissed at: ' + new Date());
        });
    };
});

// Please note that $modalInstance represents a modal window (instance) dependency.
// It is not the same as the $modal service used above.

angular.module('bets').controller('ModalInstanceCtrl', function($scope, $modalInstance, $location, obj, Bets, $stateParams, Authentication, Socket) {

    $scope.notification = obj;
    $scope.notification.isSeen = true;
    $scope.notification.$update(function(response) {
    });

    $scope.ok = function() {
        $modalInstance.close($scope.selected.item);
    };

    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };
});
