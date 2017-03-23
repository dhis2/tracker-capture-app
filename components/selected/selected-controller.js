/* global trackerCapture */

var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('SelectedInfoController',
        function($scope,
                CurrentSelection,
                OrgUnitFactory,
                $location) {
    //listen for the selected items
    $scope.$on('selectedItems', function(event, args) {
       
        var selections = CurrentSelection.get();
        $scope.selectedEntity = selections.tei;
        $scope.selectedProgram = selections.pr;

        OrgUnitFactory.getOrgUnit(($location.search()).ou).then(function(orgUnit) {
            $scope.selectedOrgUnit = orgUnit;
            $scope.selections = [];

            $scope.selections.push({title: 'org_unit', value: $scope.selectedOrgUnit ? $scope.selectedOrgUnit.displayName : 'not_selected'});
            $scope.selections.push({title: 'program', value: $scope.selectedProgram ? $scope.selectedProgram.displayName : 'not_selected'});
        });
    });
});