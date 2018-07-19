var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('TeiAuditController', 
    function($scope, $modalInstance,$q,$translate, tei,program, auditCancelledSettings){
        $scope.auditMessage = null;
        
        var trackedEntityTypeName = "Tracked entity instance";
        $scope.header = trackedEntityTypeName+' '+$translate.instant('belongs_to_another_organisation_unit');
        $scope.description = $translate.instant('this') 
                            + ' '+trackedEntityTypeName.toLowerCase()+' '
                            +$translate.instant('belongs_to_another_organisation_unit')+'. '
                            +$translate.instant('please_fill_in_a_reason_for_accessing')+'. '
                            +$translate.instant('your_action_is_being_monitored')+'.';

        $scope.addAuditMessage = function(){
            $modalInstance.close({ auditMessage: $scope.auditMessage });
        }

        $scope.cancel = function(){
            var data = {
                auditDismissed: true
            }
            if(auditCancelledSettings && auditCancelledSettings.preAuditCancelled){
                return $q.when(auditCancelledSettings.preAuditCancelled()).then(function(){
                    $modalInstance.dismiss(data);
                    if(auditCancelledSettings.postAuditCancelled){
                        return $q.when(auditCancelledSettings.postAuditCancelled());
                    }
                }, function(){
                });
            }
            $modalInstance.dismiss(data);
            if(auditCancelledSettings && auditCancelledSettings.postAuditCancelled){
                return $q.when(auditCancelledSettings.postAuditCancelled());
            }
            return $q.when({});
        }



    }
);