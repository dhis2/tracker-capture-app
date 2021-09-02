var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('NaerkontaktImportController',
    function($scope,
             $rootScope,
             $translate,
             $modal,
             $modalInstance,
             $http,
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
        $scope.uploadResult = undefined;
        $scope.file = undefined;
        $scope.stageNr = 1;

        $scope.uploadTry = function (file) {
            console.log(file.name);
            $scope.file = file;
            $scope.stageNr = 1.5;
            $http.post('/api/naerkontakt/uploadTest', $scope.file).then(response => {
                console.log(response);
                $scope.uploadResult = response.data;
                $scope.stageNr = 2;
            });
        }

        $scope.upload = function () {
            $scope.stageNr = 2.5;
             $http.post('/api/naerkontakt/upload', $scope.file).then(response => {
                console.log(response);

                $scope.uploadResult = response.data;
                $scope.stageNr = 3;
            });
        }

        $scope.close = function () {
            $modalInstance.close();
        }


});