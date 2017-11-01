//Controller for the dashboard widgets
var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('DashboardWidgetsController', 
    function($scope, 
            $modalInstance){


    $scope.close = function () {
        $modalInstance.close();
    };       
});