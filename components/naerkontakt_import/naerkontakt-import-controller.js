var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('NaerkontaktImportController',
    function ($scope,
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
              RelationshipCallbackService,
              OrgUnitFactory,
              ProgramFactory,
              MetaDataFactory,
              TEIService,
              selectedTei
    ) {
        $scope.uploadResult = undefined;
        $scope.file = undefined;
        $scope.stage = 'start';
        $scope.errorCode = undefined;
        $scope.errorMsg = undefined;


        $scope.getCurrentKommuneNr = function () {
            return CurrentSelection.currentSelection.orgUnit.code;
        }
        $scope.uploadAndVerify = function (file) {
            $scope.file = file.files[0];
            $scope.stage = 'uploadingImportTest';

            $scope.uploadFile('validerFil').then(response => {
                $scope.uploadResult = response.data;
                $scope.stage = 'importTestSuccess';
            }, error => {
                $scope.stage = 'importFailed';
                $scope.setError(error);
            });
        }

        $scope.uploadAndImport = function () {
            $scope.stage = 'uploadingImport';

            $scope.uploadFile('lagreFil').then(response => {
                $scope.uploadResult = response.data;
                $scope.stage = 'importSuccess';
                TEIService.getRelationships(selectedTei.trackedEntityInstance).then(response => {
                    RelationshipCallbackService.runCallbackFunctions(response);
                });
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

        $scope.uploadFile = function (uploadType) {
            var url = `/api/v1/import/${uploadType}/${selectedTei.trackedEntityInstance}/${$scope.getCurrentKommuneNr()}`;

            var formData = new FormData();
            formData.append('file', $scope.file);

            return $http({url, data: formData, method: "POST", headers: {"Content-Type": undefined, 'ingress-csrf': $cookies['ingress-csrf']}});
        }
    });
