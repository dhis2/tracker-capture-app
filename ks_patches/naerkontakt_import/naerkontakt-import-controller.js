var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('NaerkontaktImportController',
    function($scope,
             $rootScope,
             $translate,
             $modal,
             $modalInstance,
             $location,
             DateUtils,
             CurrentSelection,
             OperatorFactory,
             AttributesFactory,
             EntityQueryFactory,
             OrgUnitFactory,
             ProgramFactory,
             MetaDataFactory,
             TEIService,
             TEIGridService,
             NotificationService,
             Paginator,
             relationshipTypes,
             selectedProgram,
             relatedProgramRelationship,
             selections,
             selectedAttribute,
             existingAssociateUid,
             addingRelationship,
             selectedTei,
             AccessUtils,
             TEService,
             allPrograms
    ) {
        var stageNr = 1;
        $scope.file = 'none';
        $scope.getStageNr = function() {
            return stageNr;
        }

        $scope.upload = function (event) {
            stageNr = 2;
        }

        $scope.add = function () {
            stageNr = 3;
        }

        $scope.close = function () {
            $modalInstance.close();
        }


});