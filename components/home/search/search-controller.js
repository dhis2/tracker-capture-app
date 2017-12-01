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
    TEService) {

        $scope.trackedEntityTypes = {};
        $scope.searchGroups = [];



        $scope.$watch('base.selectedProgram', function() {
            loadTrackedEntityTypes()
            .then(initSearch);
        });

        var initSearch = function(){
            if($scope.base.selectedProgram && $scope.base.selectedProgram.trackedEntity){
                var result = $.grep($scope.trackedEntityTypes.all, function(type){ return type.id === $scope.base.selectedProgram.trackedEntity.id; });
                if(result.length != -1){
                    $scope.trackedEntityTypes.selected = result[0];
                    $scope.searchGroups = $scope.base.selectedProgram.searchGroups;
                }
            }
            return emptyPromise();
        }

        $scope.selectedTrackedEntityType = function(trackedEntity){
            if(!$scope.selectedProgram){
                $scope.searchGroups = trackedEntity.searchGroups;
            }
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

        $scope.search = function(searchGroups){
            //if form invalid or searchGroup number of fields required not met, show error

            //Find tei. Show in popup or below?
        }
});
