var trackerCapture = angular.module('trackerCapture');

trackerCapture.controller('SearchController',function(
    $rootScope,
    $scope,
    $modal,
    $location,
    $filter,
    $translate,
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
            var nrOfSetAttributes = 0;
            for(var key in searchGroup){
                var attr = $scope.base.attributesById[key];
                if(attr){
                    if(attr.valueType === "TEXT" && searchGroup[key] && searchGroup[key].value !== "") nrOfSetAttributes++;
                    else if(attr.valueType !== "TEXT" && attr.valueType === "TRUE_ONLY") nrOfSetAttributes++;
                    else if(attr.valueType !== "TEXT" && attr.valueType !== "TRUE_ONLY" && searchGroup[key]) nrOfSetAttributes++;
                }
            }
            if(searchGroup.requiredNumberOfSetAttributes > nrOfSetAttributes){
                searchGroup.error = true;
                return;
            }
            return SearchGroupService.search(searchGroup, $scope.base.selectedProgram, $scope.selectedOrgUnit).then(function(res){
                    return showResultModal(res, searchGroup);
            });
        }

        var openTei = function(tei){
            $location.path('/dashboard').search({tei: tei.id,
                program: $scope.base.selectedProgram ? $scope.base.selectedProgram.id: null,
                ou: $scope.selectedOrgUnit.id});
        }

        var translateWithTETName = function(text, nameToLower){
            var trackedEntityTypeName = $scope.base.selectedProgram ? 
                $scope.base.selectedProgram.trackedEntityType.displayName : 
                ($scope.trackedEntityTypes.selected ? $scope.trackedEntityTypes.selected.displayName : "tracked entity instance");

            if(nameToLower) trackedEntityTypeName = trackedEntityTypeName.toLowerCase();
            var translated = $translate.instant(text);

            return translated.replace("{trackedEntityTypeName}", trackedEntityTypeName);
        }

        var translateWithOULevelName = function(text,orgUnitId, nameToLower){
            var translated = $translate.instant(text);
            var name = "Organisation unit";
            if(orgUnitId){
                var orgUnit = $scope.base.orgUnitsById[orgUnitId];
                
                if(orgUnit){
                    var level = $scope.base.ouLevelsByLevel[orgUnit.level];
                    if(level && level.displayName){
                        name = level.displayName;
                    }
                }
            }
            if(nameToLower) name = name.toLowerCase();
            return translated.replace("{orgUnitLevelName}", name);
        }


        

        var showResultModal = function(res, searchGroup){
            var internalService = {
                translateWithOULevelName: translateWithOULevelName,
                translateWithTETName: translateWithTETName,
                base: $scope.base
            }


            return $modal.open({
                templateUrl: 'components/home/search/result-modal.html',
                controller: function($scope,$modalInstance, TEIGridService,OrgUnitFactory, orgUnit, res, refetchDataFn, internalService)
                {
                    $scope.gridData = null;
                    $scope.isUnique = false;
                    var loadData =  function(){
                        if(res.status !== "NOMATCH"){
                            $scope.gridData = TEIGridService.format(orgUnit.id, res.data, false, null, null);
                        }
                        $scope.pager = res.data && res.data.metaData ? res.data.metaData.pager : null;
    
                        if(res.status === "UNIQUE"){
                            $scope.isUnique = true;
                            var orgUnitId = $scope.gridData.rows.own[0].orgUnit;
                            if(!internalService.base.orgUnitsById[orgUnitId]){
                                $scope.orgUnitLoading = true;
                                OrgUnitFactory.get(orgUnitId).then(function(ou){
                                    internalService.base.orgUnitsById[ou.id] = ou;
                                    $scope.orgUnitLoading = false;
                                });
                            }
                        }
                    }
                    loadData();

                    $scope.translateWithTETName = internalService.translateWithTETName;
                    $scope.translateWithOULevelName = internalService.translateWithOULevelName; 

                    $scope.openRegistration = function(tei){
                        $modalInstance.close({action: "OPENREGISTRATION"});
                    }

                    $scope.openTei = function(tei){
                        $modalInstance.close({ action: "OPENTEI", tei: tei});
                    }
                    $scope.cancel = function(){
                        $modalInstance.close({ action: "CANCEL"});
                    }

                    $scope.refetchData = function(pager, sortColumn){
                        refetchDataFn(pager, sortColumn).then(function(newRes)
                        {
                            res = newRes;
                            loadData();
                        });
                    }
                },
                resolve: {
                    refetchDataFn: function(){
                        return function(pager,sortColumn){ return SearchGroupService.search(searchGroup, $scope.base.selectedProgram,$scope.selectedOrgUnit, pager); }
                    },

                    orgUnit: function(){
                        return $scope.selectedOrgUnit;
                    },
                    res: function(){
                        return res;
                    },
                    internalService: function(){
                        return internalService;
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
        $scope.expandCollapseOrgUnitTree = function(orgUnit) {
            if( orgUnit.hasChildren ){
                //Get children for the selected orgUnit
                OrgUnitFactory.getChildren(orgUnit.id).then(function(ou) {
                    orgUnit.show = !orgUnit.show;
                    orgUnit.hasChildren = false;
                    orgUnit.children = ou.children;
                    angular.forEach(orgUnit.children, function(ou){
                        ou.hasChildren = ou.children && ou.children.length > 0 ? true : false;
                    });
                });
            }
            else{
                orgUnit.show = !orgUnit.show;
            }
        };

        $scope.setSelectedOrgUnit = function(orgUnit, searchGroup){
            if(searchGroup.orgUnit && searchGroup.orgUnit.id === orgUnit.id){
                searchGroup.orgUnit = null;
                searchGroup.ouMode = {name: "ALL"};
                return;
            }
            searchGroup.orgUnit = orgUnit;
            if(searchGroup.ouMode && searchGroup.ouMode.name === "ALL"){
                searchGroup.ouMode = { name: "SELECTED" };
            }
        }

        $scope.setOuModeAll = function(searchGroup){
            searchGroup.orgUnit = null;
        }

        var getRegistrationPrefill = function(searchGroup){
            var prefill = {};
            for(var key in searchGroup){
                if($scope.base.attributesById[key]){
                    var val = searchGroup[key];
                    if(angular.isDefined(val.value)){
                        prefill[key] = val.value;
                    }else if(angular.isDefined(val.exactValue)){
                        prefill[key] = val.exactValue;
                    }else if(angular.isDefined(val.startValue)){
                        prefill[key] = val.startValue;
                    }else if(angular.isDefined(val.endValue))
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
