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
    ProgramWorkingListService) {
        var previousProgram = null;
        $scope.base = {};

        $scope.views = [
            {
                name: "Lists",
                template: "../components/home/lists/lists.html",
                class: "col-xs-12"
            },
            {
                name: "Search",
                template: "../components/home/search/search.html",
                class: "",
            },
            {
                name: "Register",
                template: "../components/registration/registration.html",
                class: "col-lg-6 col-md-8",
                onPostLoad: function(){
                    $rootScope.$broadcast('registrationWidget', {registrationMode: 'REGISTRATION'});
               }
            }
        ];

        OrgUnitFactory.getSearchTreeRoot().then(function(response) {
            $scope.orgUnits = response.organisationUnits;
            angular.forEach($scope.orgUnits, function(ou){
                ou.show = true;
                angular.forEach(ou.children, function(o){
                    o.hasChildren = o.children && o.children.length > 0 ? true : false;
                });
            });
        });

        $scope.$watch('selectedOrgUnit', function() {
            if( angular.isObject($scope.selectedOrgUnit)){
                loadAttributes()
                .then(loadOptionSets)
                .then(loadPrograms);
            }
        });

        var resetView = function(){
            if($scope.currentView){
                $scope.currentView = null;
                $timeout(function(){ $scope.setCurrentView($scope.views[0]);});
                return;
            }
            $scope.setCurrentView($scope.views[0]);

        }

        var loadPrograms = function(){
            return ProgramFactory.getProgramsByOu($scope.selectedOrgUnit, previousProgram).then(function(response){
                $scope.programs = response.programs;
                $scope.setProgram(response.selectedProgram);
            });
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
                $scope.base.optionSets = {};
                return MetaDataFactory.getAll('optionSets').then(function(optSets){
                    angular.forEach(optSets, function(optionSet){
                        $scope.base.optionSets[optionSet.id] = optionSet;
                    });
                    CurrentSelection.setOptionSets($scope.base.optionSets);
                });
            }
            return resolvedEmptyPromise();
        }

        $scope.setProgram = function(selectedProgram){
            previousProgram = $scope.base.selectedProgram;
            $scope.base.selectedProgram = $scope.selectedProgram = selectedProgram;
            resetView();
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

        }
        $scope.$on('$includeContentLoaded', function(event, target){
            if($scope.currentView && $scope.currentView.template === target){
                if($scope.currentView.onPostLoad) $scope.currentView.onPostLoad();
            }
          });

        
});
