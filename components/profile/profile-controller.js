/* global trackerCapture, angular */

var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('ProfileController',
        function($rootScope,
                $scope,
                $timeout,
                CurrentSelection) {
    $scope.editingDisabled = true;
    $scope.enrollmentEditing = false;
    $scope.isInDashboard = true;

    $scope.allAttributes = [];
    $scope.widget = $rootScope.getCurrentWidget($scope);
    if($scope.widget){
        $scope.widgetTitle = $scope.widget.title;
        $scope.widget.getTopBarFields = function(){
            var fields = [];
            angular.forEach($scope.allAttributes, function(attr){
                fields.push({ name: attr.displayName, id: attr.id})
            });
            return fields;
        };
    }

    $scope.topBarFilter = function(attr){
        if($scope.widget && $scope.widget.topBarFields[attr.id] && $scope.widget.topBarFields[attr.id].show && $scope.selectedTei[attr.id]) return true;
        return false;
    }

    $scope.topBarOrder = function(attr){
        return $scope.widget.topBarFields[attr.id].order;
    }



    
    //listen for the selected entity
    var selections = {};
    $scope.$on('dashboardWidgets', function(event, args) {        
        listenToBroadCast();
    });
    
    //listen to changes in profile
    $scope.$on('profileWidget', function(event, args){
        listenToBroadCast();
    });

    $scope.$watch('widget.useAsTopBar', function(event, args){
        listenToBroadCast();
    });
    
    //listen to changes in enrollment editing
    $scope.$on('enrollmentEditing', function(event, args){
        $scope.enrollmentEditing = args.enrollmentEditing;
    });
    
    var listenToBroadCast = function(){
        $scope.editingDisabled = true;
        selections = CurrentSelection.get();
        $scope.attributes
        $scope.selectedTei = angular.copy(selections.tei);
        $scope.trackedEntityType = selections.te;
        $scope.selectedProgram = selections.pr;   
        $scope.selectedEnrollment = selections.selectedEnrollment;
        $scope.optionSets = selections.optionSets;
        $scope.selectedOrgUnit = selections.orgUnit;
        $scope.trackedEntityForm = null;
        $scope.customForm = null;
        $scope.attributesById = CurrentSelection.getAttributesById();
        var attributeKeys = Object.keys($scope.attributesById);
        $scope.allAttributes = [];
        angular.forEach(attributeKeys, function(key){
            $scope.allAttributes.push($scope.attributesById[key]);
        });
        
        //display only those attributes that belong to the selected program
        //if no program, display attributesInNoProgram     
        if($scope.selectedTei){
            angular.forEach($scope.selectedTei.attributes, function(att){
                $scope.selectedTei[att.attribute] = att.value;
            });
        }
        $timeout(function() { 
            $rootScope.$broadcast('registrationWidget', {registrationMode: 'PROFILE', selectedTei: $scope.selectedTei, enrollment: $scope.selectedEnrollment});
        });
    };
    
    $scope.enableEdit = function(){
        $scope.teiOriginal = angular.copy($scope.selectedTei);
        $scope.editingDisabled = !$scope.editingDisabled; 
        $rootScope.profileWidget.expand = true;
    };
    
    $scope.cancel = function(){
        $scope.selectedTei = $scope.teiOriginal;  
        $scope.editingDisabled = !$scope.editingDisabled;
        $timeout(function() { 
            $rootScope.$broadcast('registrationWidget', {registrationMode: 'PROFILE', selectedTei: $scope.selectedTei, enrollment: $scope.selectedEnrollment});
        }, 600);
    };
});