var trackerCapture = angular.module('trackerCapture');

trackerCapture.controller('SearchController',function(
    $rootScope,
    $scope,
    $modal,
    $location,
    $filter,
    $timeout,
    $q,
    Paginator,
    MetaDataFactory,
    DateUtils,
    OrgUnitFactory,
    ProgramFactory,
    AttributesFactory,
    EntityQueryFactory,
    CurrentSelection,
    TEService,
    SearchGroupService,
    OperatorFactory) {

        $scope.trackedEntityTypes = {};
        $scope.searchConfig = {};
        $scope.defaultOperators = OperatorFactory.defaultOperators;



        $scope.$watch('base.selectedProgram', function() {
            loadTrackedEntityTypes()
            .then(loadForProgram);
        });

        var loadForProgram = function(){
            if($scope.base.selectedProgram){
                return SearchGroupService.getSearchConfigForProgram($scope.base.selectedProgram).then(function(searchConfig)
                {
                    $scope.searchConfig = searchConfig;
                });
            }
            return emptyPromise();
        }

        $scope.setTrackedEntityType = function(){
            if(!$scope.selectedProgram && $scope.trackedEntityTypes.selected){
                return SearchGroupService.getSearchConfigForTrackedEntityType($scope.trackedEntityTypes.selected).then(function(searchConfig)
                {
                    $scope.searchConfig = searchConfig;
                });
            }
            return emptyPromise();
        }

        var loadTrackedEntityTypes = function(){
            if(!$scope.trackedEntityTypes.all){
                return TEService.getAll().then(function(trackedEntityTypes){
                    $scope.trackedEntityTypes.all = trackedEntityTypes;
                });
            }
            return emptyPromise();
        }

        var emptyPromise = function(){
            var deferred = $q.defer();
            deferred.resolve();
            return deferred.promise;
        }

        

        $scope.search = function(searchGroup){
            return SearchGroupService.search(searchGroup, $scope.base.selectedProgram, $scope.selectedOrgUnit).then(function(res){
                    return showResultModal(res, searchGroup);
            });
        }

        var openTei = function(tei){
            $location.path('/dashboard').search({tei: tei.id,
                program: $scope.base.selectedProgram ? $scope.base.selectedProgram.id: null,
                ou: $scope.selectedOrgUnit.id});
        }

        

        var showResultModal = function(res, searchGroup){
            return $modal.open({
                templateUrl: 'components/home/search/result-modal.html',
                controller: function($scope,$modalInstance, TEIGridService, orgUnit, res)
                {
                    $scope.gridData = null;
                    $scope.isUnique = false;
                    if(res.status !== "NOMATCH"){
                        $scope.gridData = TEIGridService.format(orgUnit.id, res.data, false, null, null);
                    }

                    if(res.status === "UNIQUE") $scope.isUnique = true;
                    
                    $scope.openRegistration = function(tei){
                        $modalInstance.close({action: "OPENREGISTRATION"});
                    }

                    $scope.openTei = function(tei){
                        $modalInstance.close({ action: "OPENTEI", tei: tei});
                    }
                    $scope.cancel = function(){
                        $modalInstance.close({ action: "CANCEL"});
                    }
                },
                resolve: {
                    orgUnit: function(){
                        return $scope.selectedOrgUnit;
                    },
                    res: function(){
                        return res;
                    }
                }
            }).result.then(function(res){
                var def = $q.defer();
                def.resolve();
                if(res.action === "OPENTEI"){
                    openTei(res.tei);
                }else if(res.action === "OPENREGISTRATION")
                {
                    var registrationPrefill = getRegistrationPrefill(searchGroup);
                    $scope.goToRegistrationWithData(registrationPrefill);
                }
                return def.promise;
            });
        }

        var getRegistrationPrefill = function(searchGroup){
            var prefill = {};
            for(var key in searchGroup){
                if($scope.base.attributesById[key]){
                    var val = searchGroup[key];
                    if(val.value){
                        prefill[key] = val.value;
                    }else if(val.exactValue){
                        prefill[key] = val.exactValue;
                    }else if(val.startValue){
                        prefill[key] = val.startValue;
                    }else if(val.endValue)
                    {
                        prefill[key] = val.endValue;
                    }else{
                        prefill[key] = val;
                    }

                }
            }
            return prefill;


        }
});
