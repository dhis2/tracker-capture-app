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
        
        $scope.trackedEntity = $scope.selections.te;
        $scope.selectedEnrollment = $scope.selections.selectedEnrollment;
        $scope.selectedProgram = $scope.selections.pr;
        $scope.programs = $scope.selections.prs;
        $scope.programsById = {};
        angular.forEach($scope.programs, function(program){
            $scope.programsById[program.id] = program;
        });
        
        RelationshipFactory.getAll().then(function(rels){
            $scope.relationshipTypes = rels;    
            angular.forEach(rels, function(rel){
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
                if($scope.selectedTei.relationships[i].trackedEntityInstanceB === rel.trackedEntityInstance){
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
            var teiId = rel.trackedEntityInstanceA;
            var relName = $scope.relationships[rel.relationship].aIsToB;
            //A temp array that contains all the programs a tei is enrolled in.
            var teiPrograms = [];
            if($scope.selectedTei.trackedEntityInstance === rel.trackedEntityInstanceA){
                teiId = rel.trackedEntityInstanceB;
                relName = $scope.relationships[rel.relationship].bIsToA;
            }
            
            EnrollmentService.getByEntity(rel.trackedEntityInstanceB).then(function(response){
                //Loop through all enrollments for a related tei.
                angular.forEach(response.enrollments, function(en){
                    //Here an array with all programs for all teis constructed.
                    var existing = $scope.relationshipPrograms.filter(function(program){
                        return program.id === en.program;
                    });
                    //Check that the program is not already in the array.
                    if (existing.length === 0) {
                        var program = {displayName: $scope.programsById[en.program].displayName, displayShortName: $scope.programsById[en.program].displayShortName, id: $scope.programsById[en.program].id, programAttributes: getProgramAttributes($scope.programsById[en.program].programTrackedEntityAttributes)}
                        $scope.relationshipPrograms.push(program);
                    }
                    teiPrograms.push(en.program);
                });

                var relative = {trackedEntityInstance: teiId, relName: relName, relId: rel.relationship, attributes: getRelativeAttributes(rel), programs: teiPrograms};            
                $scope.relatedTeis.push(relative);
            });
        });

        //Debug prints, can be removed.
        console.log($scope.relationshipPrograms);
        console.log($scope.relatedTeis);

        var selections = CurrentSelection.get();
        CurrentSelection.set({tei: $scope.selectedTei, te: $scope.selectedTei.trackedEntity, prs: selections.prs, pr: $scope.selectedProgram, prNames: selections.prNames, prStNames: selections.prStNames, enrollments: selections.enrollments, selectedEnrollment: $scope.selectedEnrollment, optionSets: selections.optionSets, orgUnit:selections.orgUnit});
    };
    
    var getRelativeAttributes = function(tei){
        
        var attributes = {};
        
        if(tei && tei.relative && tei.relative.attributes && !tei.relative.processed){
            angular.forEach(tei.relative.attributes, function(att){                
                if( att.attribute && $scope.attributesById[att.attribute] ){
                    att.value = CommonUtils.formatDataValue(null, att.value, $scope.attributesById[att.attribute], $scope.optionSets, 'USER');                
                }                
                attributes[att.attribute] = att.value;
            });
        }
        
        if(tei && tei.relative && tei.relative.processed){
            attributes = tei.relative.attributes;
        }
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