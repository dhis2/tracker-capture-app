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
              selectedTei,
              $cookies
    ) {
        $scope.uploadResult = undefined;
        $scope.file = undefined;
        $scope.stage = 'start';
        $scope.errorCode = undefined;
        $scope.errorMsg = undefined;
        $scope.peopleDuplikat = [];
        $scope.peopleServerError = [];
        $scope.peopleInputError = [];
        $scope.peopleImportExisting = [];
        $scope.peopleImportNew = [];
        $scope.peopleAllreadyInGroup = [];

        $scope.getCurrentKommuneNr = function () {
            return CurrentSelection.currentSelection.orgUnit.code;
        }
        $scope.uploadAndVerify = function (file) {
            $scope.file = file.files[0];
            $scope.stage = 'uploadingImportTest';

            $scope.uploadFile('validerFil').then(response => {
                $scope.uploadResult = response.data;
                $scope.savePeopleInCategories(response.data);
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
                $scope.savePeopleInCategories(response.data);
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

        $scope.getImportResultCategory = function (person) {
            switch (person.status.operasjon) {
                case "MANUELL":
                    return "DUPLIKAT";
                case "FEIL":
                    return "INPUT_ERROR";
                case "NY_RELASJON":
                case "NY_RELASJON_KOMMUNEINFO":
                case "NY_ENROLLMENT":
                case "OPPDATER_ENROLLMENT":
                    return "IMPORT_EXISTING";
                case "NY_TEI":
                    return "IMPORT_NEW";
                case "INFOMELDING":
                    return "ALLREADY_IN_GROUP";
                case "SERVER_ERROR":
                default:
                    return "OTHER_ERROR";
            }
        };

        $scope.getPeopleInCategory = function (category, people) {
            return people && people.filter((person) =>
                $scope.getImportResultCategory(person) === category
            );
        }

        $scope.savePeopleInCategories = function (people) {
            $scope.peopleServerError = $scope.getPeopleInCategory('OTHER_ERROR', people.importNotPossible);
            $scope.peopleDuplikat = $scope.getPeopleInCategory('DUPLIKAT', people.importNotPossible);
            $scope.peopleInputError = $scope.getPeopleInCategory('INPUT_ERROR', people.importNotPossible);
            $scope.peopleImportExisting = $scope.getPeopleInCategory('IMPORT_EXISTING', people.importOk);
            $scope.peopleImportNew = $scope.getPeopleInCategory('IMPORT_NEW', people.importOk);
            $scope.peopleAllreadyInGroup = $scope.getPeopleInCategory('ALLREADY_IN_GROUP', people.importOk);
        }

        $scope.uploadFile = function (uploadType) {
            var url = `/api/import/${uploadType}/${selectedTei.trackedEntityInstance}/${$scope.getCurrentKommuneNr()}`;

            var formData = new FormData();
            formData.append('file', $scope.file);
            return $http({
                url,
                data: formData,
                method: "POST",
                headers: {"Content-Type": undefined, "ingress-csrf": $cookies['ingress-csrf']}
            });
        }
    });
