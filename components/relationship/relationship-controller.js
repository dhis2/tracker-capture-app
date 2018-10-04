/* global trackerCapture, angular */

var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('RelationshipController',
        function($scope,
                $rootScope,
                $modal,                
                $location,
                TEIService,
                AttributesFactory,
                CurrentSelection,
                RelationshipFactory,
                OrgUnitFactory,
                ProgramFactory,
                EnrollmentService,
                ModalService,
                CommonUtils) {
    $rootScope.showAddRelationshipDiv = false;
    $scope.relatedProgramRelationship = false;
    var ENTITYNAME = "TRACKED_ENTITY_INSTANCE";
    var allPrograms = [];

    ProgramFactory.getAll().then(function(result) {
        allPrograms = result.programs;
    });
    
    //listen for the selected entity       
    $scope.$on('dashboardWidgets', function(event, args) { 
        $scope.relationshipTypes = []; 
        $scope.relationships = [];
        $scope.relatedTeis = [];
        $scope.selections = CurrentSelection.get();
        $scope.optionSets = $scope.selections.optionSets;
        $scope.selectedTei = angular.copy($scope.selections.tei);        
        $scope.attributesById = CurrentSelection.getAttributesById();

        $scope.relationshipPrograms = [];
        
        $scope.attributes = [];
        for(var key in $scope.attributesById){
            if($scope.attributesById.hasOwnProperty(key)){
                $scope.attributes.push($scope.attributesById[key]);
            }            
        }
        
        $scope.trackedEntityType = $scope.selections.te;
        $scope.selectedEnrollment = $scope.selections.selectedEnrollment;
        $scope.selectedProgram = $scope.selections.pr;
        $scope.programs = $scope.selections.prs;
        $scope.programsById = {};
        angular.forEach($scope.programs, function(program){
            $scope.programsById[program.id] = program;
        });
        
        RelationshipFactory.getAll().then(function(relTypes){
            //Supports only TEI-TEI of same type. Filter away fromConstraint from other programs
            $scope.relationshipTypes = relTypes.filter(function(relType){
                return relType.fromConstraint && relType.fromConstraint.relationshipEntity === ENTITYNAME
                    && relType.toConstraint.relationshipEntity === ENTITYNAME
                    && relType.fromConstraint.trackedEntityType && relType.fromConstraint.trackedEntityType.id === $scope.trackedEntityType.id
                    && (!relType.fromConstraint.program || relType.fromConstraint.program.id === $scope.selectedProgram.id);                
            });

            angular.forEach($scope.relationshipTypes, function(rel){
                $scope.relationships[rel.id] = rel;
            });

            TEIService.getRelationships($scope.selectedTei.trackedEntityInstance).then(function(relationships){
                $scope.selectedTei.relationships = relationships;
                setRelationships();
            });
        });
        $scope.selectedOrgUnit = $scope.selections.orgUnit;
    });
    
    $scope.showAddRelationship = function(related) {
        $scope.relatedProgramRelationship = related;
        $rootScope.showAddRelationshipDiv = !$rootScope.showAddRelationshipDiv;
       
        if($rootScope.showAddRelationshipDiv){
            var modalInstance = $modal.open({
                templateUrl: 'components/teiadd/tei-add.html',
                controller: 'TEIAddController',
                windowClass: 'modal-full-window',
                resolve: {
                    relationshipTypes: function () {
                        return $scope.relationshipTypes;
                    },
                    selectedAttribute: function(){
                        return null;
                    },
                    existingAssociateUid: function(){
                        return null;
                    },
                    addingRelationship: function(){
                        return true;
                    },
                    selections: function () {
                        return $scope.selections;
                    },
                    selectedTei: function(){
                        return $scope.selectedTei;
                    },
                    selectedProgram: function(){
                        return $scope.selectedProgram;
                    },
                    relatedProgramRelationship: function(){
                        return $scope.relatedProgramRelationship;
                    },
                    allPrograms: function(){
                        return allPrograms;
                    }
                }
            });

            modalInstance.result.then(function (relationships) {
                $scope.selectedTei.relationships = relationships;                
                setRelationships();
            });
        }
    };
    
    $scope.removeRelationship = function(rel){
        
        var modalOptions = {
            closeButtonText: 'cancel',
            actionButtonText: 'delete',
            headerText: 'delete',
            bodyText: 'are_you_sure_to_delete_relationship'
        };

        ModalService.showModal({}, modalOptions).then(function(result){
            
            var index = -1;
            for(var i=0; i<$scope.selectedTei.relationships.length; i++){
                if($scope.selectedTei.relationships[i].relationship === rel.relId){
                    index = i;
                    break;
                }
            }

            if( index !== -1 ){
                $scope.selectedTei.relationships.splice(index,1);
                var trimmedTei = angular.copy($scope.selectedTei);
                angular.forEach(trimmedTei.relationships, function(rel){
                    delete rel.relative;
                });
                TEIService.update(trimmedTei, $scope.optionSets, $scope.attributesById).then(function(response){
                    if(!response || response.response && response.response.status !== 'SUCCESS'){//update has failed
                        return;
                    }
                    setRelationships();
                });
            }
        });        
    };
    
    $scope.showDashboard = function(teiId, program){    
        $location.path('/dashboard').search({tei: teiId, program: program, ou: $scope.selectedOrgUnit.id});
    };
    
    var setRelationships = function(){
        $scope.relatedTeis = [];
        $scope.relationshipPrograms = [];
        //Loop through all relationships.      
        angular.forEach($scope.selectedTei.relationships, function(rel){
            var teiPrograms = [];

            if(rel.to && rel.to.trackedEntityInstance){  
                var teiId = rel.to.trackedEntityInstance.trackedEntityInstance;
                var relName = rel.relationshipName;      
                TEIService.get(teiId, $scope.optionSets, $scope.attributesById).then(function(tei){
                    var relative = {trackedEntityInstance: teiId, relName: relName, relId: rel.relationship, attributes: getRelativeAttributes(tei.attributes), programs: teiPrograms};            
                    $scope.relatedTeis.push(relative);
                });
            }
        });

        var selections = CurrentSelection.get();
        CurrentSelection.set({tei: $scope.selectedTei, te: $scope.trackedEntityType, prs: selections.prs, pr: $scope.selectedProgram, prNames: selections.prNames, prStNames: selections.prStNames, enrollments: selections.enrollments, selectedEnrollment: $scope.selectedEnrollment, optionSets: selections.optionSets, orgUnit:selections.orgUnit});
    };
    
    var getRelativeAttributes = function(teiAttributes){
        var attributes = {};
        teiAttributes.forEach(function(attr){
            if(attr.attribute && $scope.attributesById[attr.attribute]){
                attr.value = CommonUtils.formatDataValue(null, attr.value, $scope.attributesById[attr.attribute], $scope.optionSets, 'USER');
            }
            attributes[attr.attribute] = attr.value;
        });
        return attributes;
    };

    //Function for getting all attributeIDs that a specific program has.
    var getProgramAttributes = function(attributeArray) {
        var programAttributes = [];

        angular.forEach(attributeArray, function(attribute){
            programAttributes.push(attribute.trackedEntityAttribute.id);
        });

        return programAttributes;
    };
});