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
        $scope.stage = 'start';
        $scope.errorCode = undefined;
        $scope.errorMsg = undefined;


        $scope.uploadTry = function (file) {
            console.log(file);
            $scope.file = file.files[0];
            console.log($scope.file);
            console.log(selectedTei.trackedEntityInstance);
            $scope.stage = 'uploadingImportTest';


            var url = `/api/v1/import/validerFil/${selectedTei.trackedEntityInstance}`;

            var formData = new FormData();
            formData.append('file', $scope.file);

            $http({url, data: formData, method: "POST", headers: {"Content-Type": undefined }}).then(response => {
                 console.log(response);
                 $scope.uploadResult = response.data;
                 $scope.stage = 'importTestSuccess';
            }, error => {
                $scope.stage = 'importFailed';
                $scope.setError(error);
            });
        }

        $scope.upload = function () {
            $scope.stage = 'uploadingImport';
            var formData = new FormData();

            var url = `/api/v1/import/validerFil/${selectedTei.trackedEntityInstance}`;
            formData.append('file', $scope.file);

            $http({url, data: formData, method: "POST", headers: {"Content-Type": undefined }}).then(response => {
                 console.log(response);
                 $scope.uploadResult = response.data;
                 $scope.stage = 'importSuccess';
             }, error => {
                 $scope.stage = 'importFailed';
                 $scope.setError(error);
             });
        }

        $scope.close = function () {
            $modalInstance.close();
        }

        $scope.setError = function (error) {
            $scope.errorCode = error.status;
            $scope.errorMsg = error.data;
        }

        $scope.reset = function () {
            $scope.errorCode = undefined;
            $scope.errorMsg = undefined;
            $scope.uploadResult = undefined;
            $scope.file = undefined;
            $scope.stage = 'start';
        }


});