var trackerCapture = angular.module('trackerCapture');

trackerCapture.controller('HomeController',function(
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
    TEIGridService,
    TEIService,
    GridColumnService,
    ProgramWorkingListService,
    TCStorageService,
    orderByFilter,
    TEService,
    AccessUtils) {
        var previousProgram = null;
        $scope.base = {};

        var viewsByType = {
            registration: {
                name: "Register",
                template: "components/registration/registration.html",
                class: "col-lg-10 col-md-12",
                shouldReset: false,
                disabled: true,
                onPostLoad: function(){
                    $rootScope.$broadcast('registrationWidget', {registrationMode: 'REGISTRATION'});
               }
            },
            lists: {
                name: "Lists",
                template: "components/home/lists/lists.html",
                class: "col-xs-12",
                shouldReset: true,
                disabled: false,
            },
            search: {
                name: "Search",
                template: "components/home/search/search.html",
                class: "",
                shouldReset: true,
                disabled: false
            },

        }
        $scope.views = [viewsByType.lists, viewsByType.search, viewsByType.registration];

        var mapOuLevelsToId = function(){
            $scope.base.ouLevelsByLevel = {};
            angular.forEach(ouLevels, function(ouLevel){
                $scope.base.ouLevelsByLevel[ouLevel.level] = ouLevel;
            })
        }

        var ouLevels = CurrentSelection.getOuLevels();
        if(!ouLevels){
            TCStorageService.currentStore.open().done(function(){
                TCStorageService.currentStore.getAll('ouLevels').done(function(response){
                    ouLevels = angular.isObject(response) ? orderByFilter(response, '-level').reverse() : [];
                    CurrentSelection.setOuLevels(orderByFilter(ouLevels, '-level').reverse());
                    mapOuLevelsToId();
                });
            });
        }else{
            mapOuLevelsToId();
        }
        
        var mapOrgUnitToId = function(orgUnit, obj){
            if(orgUnit){
                obj[orgUnit.id] = orgUnit;
                if(orgUnit.children && orgUnit.children.length > 0){
                    angular.forEach(orgUnit.children, function(child){
                        mapOrgUnitToId(child, obj);
                    });
                }
            }
        }

        OrgUnitFactory.getSearchTreeRoot().then(function(response) {
            $scope.orgUnits = response.organisationUnits;
            $scope.base.orgUnitsById = {};
            var byLevel = {};
            angular.forEach($scope.orgUnits, function(ou){
                mapOrgUnitToId(ou, $scope.base.orgUnitsById);
                ou.show = false;
                angular.forEach(ou.children, function(o){
                    o.hasChildren = o.children && o.children.length > 0 ? true : false;
                });
            });
        });



        $scope.$watch('selectedOrgUnit', function(a,b,c) {
            if( angular.isObject($scope.selectedOrgUnit) && !$scope.selectedOrgUnit.loaded){
                loadOrgUnit()
                .then(loadAttributes)
                .then(loadOptionSets)
                .then(loadPrograms)
                .then(loadCachedData);
            }
        });

        var resetView = function(defaultView){
            var viewToSet = defaultView ? defaultView : $scope.views[0];
            viewsByType.registration.disabled = true;
            var loaded = $.grep($scope.views, function(v){ return !v.shouldReset && v.loaded;});
            angular.forEach(loaded, function(v){
                v.loaded = false;
            });
            if($scope.currentView){
                $scope.currentView = null;
                $timeout(function(){ $scope.setCurrentView(viewToSet);});
                return;
            }
            $scope.setCurrentView(viewToSet);

        }

        var loadOrgUnit = function(){
            if($scope.selectedOrgUnit && !$scope.selectedOrgUnit.loaded){
                return OrgUnitFactory.getFromStoreOrServer($scope.selectedOrgUnit.id).then(function(orgUnit){
                    $scope.selectedOrgUnit = orgUnit;
                    $scope.selectedOrgUnit.loaded = true;
                });
            }
            return resolvedEmptyPromise();
        }

        var loadPrograms = function(){
            return ProgramFactory.getProgramsByOu($scope.selectedOrgUnit,true, previousProgram).then(function(response){
                $scope.programs = response.programs;
                $scope.setProgram(response.selectedProgram);
            });
        }

        var loadCachedData = function(){
            var frontPageData = CurrentSelection.getFrontPageData();
            if(frontPageData){
                var view = frontPageData.currentView ? $scope.viewsByType[frontPageData.currentView] : null;
                $scope.setProgram(frontPageData.selectedProgram, view);
            }
        }

        var loadAttributes = function(){
            var attributesById = CurrentSelection.getAttributesById();
            if(!$scope.base.attributesById){
                $scope.base.attributesById = {};
                return MetaDataFactory.getAll('attributes').then(function(atts){
                    angular.forEach(atts, function(att){
                        $scope.base.attributesById[att.id] = att;
                    });
                    CurrentSelection.setAttributesById($scope.base.attributesById);
                });
            }
            return resolvedEmptyPromise();
        }

        
        var resolvedEmptyPromise = function(){
            var deferred = $q.defer();
            deferred.resolve();
            return deferred.promise;
        }

        var loadOptionSets = function(){
            if(!$scope.base.optionSets){
                $scope.base.optionSets = $scope.optionSets = {};
                return MetaDataFactory.getAll('optionSets').then(function(optSets){
                    angular.forEach(optSets, function(optionSet){
                        $scope.base.optionSets[optionSet.id] = $scope.optionSets[optionSet.id] = optionSet;
                    });
                    CurrentSelection.setOptionSets($scope.base.optionSets);
                });
            }
            return resolvedEmptyPromise();
        }

        $scope.setProgram = function(selectedProgram, defaultView){
            previousProgram = $scope.base.selectedProgram;
            $scope.base.selectedProgram = $scope.selectedProgram = selectedProgram;
            resetView(defaultView);
            loadCanRegister();      

        }
        var loadCanRegister = function(){
            if($scope.selectedProgram){
                viewsByType.registration.disabled = !$scope.selectedProgram.access.data.write;
            }            
        }

        $scope.setCurrentView = function(view)
        {
            if(view == null){
                resetView();
                return;
            }
            if(!$scope.currentView || $scope.currentView.name !== view.name){
                $scope.currentView = view;
                if($scope.currentView.onSelected){
                    $scope.currentView.onSelected();
                }
            }
            if(!view.shouldReset){
                view.loaded = true;
            }
            loadCanRegister();
        }

        $scope.goToRegistrationWithData = function(registrationPrefill){
            var regView = $scope.views[2];
            regView.loaded = false;
            //Using timeout to make view reset
            $timeout(function(){
                $scope.registrationPrefill = registrationPrefill;
                $scope.setCurrentView(regView);
            });

        }

        $scope.setFrontPageData = function(viewData){
            CurrentSelection.setFrontPageData({
                viewData: viewData,
                selectedView: viewData.name,
                selectedProgram: $scope.selectedProgram,
                selectedOrgUnit: $scope.selectedOrgUnit
            });
        }

        $scope.base.setFrontPageData = $scope.setFrontPageData;
        $scope.$on('$includeContentLoaded', function(event, target){
            if($scope.currentView && $scope.currentView.template === target){
                if($scope.currentView.onPostLoad) $scope.currentView.onPostLoad();

            }
          });
        
});
