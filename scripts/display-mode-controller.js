//Controller for column show/hide
var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('DisplayModeController',
        function($scope, $modalInstance) {
    
    $scope.close = function () {
      $modalInstance.close($scope.gridColumns);
    };
});