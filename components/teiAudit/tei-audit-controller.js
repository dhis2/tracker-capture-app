var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('TeiAuditController', 
    function($scope, $modalInstance, tei,program){
        $scope.auditMessage = null;

        $scope.addAuditMessage = function(){
            $modalInstance.close({ auditMessage: $scope.auditMessage });
        }

        $scope.cancel = function(){
            $modalInstance.dismiss();
        }



    }
);