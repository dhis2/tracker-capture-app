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
                CommonUtils,
                TEService,
                DHIS2EventFactory,
                DateUtils) {
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
        $scope.allProgramNames = {};
        ProgramFactory.getAllAccesses().then(function(data) {
            $scope.allProgramNames = data.programIdNameMap;
            $scope.accessByProgramId = data.programsById;
        });
        angular.forEach($scope.programs, function(program){
            $scope.programsById[program.id] = program;
        });
        
        RelationshipFactory.getAll().then(function(relTypes){
            $scope.relationshipTypes = relTypes.filter(function(relType){
                return (relType.fromConstraint.trackedEntityType && relType.fromConstraint.trackedEntityType.id === $scope.trackedEntityType.id)
                       || (relType.toConstraint.trackedEntityType && relType.toConstraint.trackedEntityType.id === $scope.trackedEntityType.id);  
            });

            angular.forEach($scope.relationshipTypes, function(rel){
                $scope.relationships[rel.id] = rel;
            });

            setRelationships();
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
                var relationshipToDelete = $scope.selectedTei.relationships.splice(index,1);
                RelationshipFactory.delete(rel.relId).then(function(response){
                    setRelationships();
                }, function(error) {
                    $scope.selectedTei.relationships.splice(index, 0, relationshipToDelete[0]);
                });
            }
        });        
    };

    $scope.returnUrl;
    if ( $location.search().returnUrl ) {
        $scope.returnUrl = $location.search().returnUrl;
    }
    
    $scope.showDashboard = function(teiId, program){    
        var path = {tei: teiId, program: program, ou: $scope.selectedOrgUnit.id};
        if($scope.returnUrl) {
            path.returnUrl = $scope.returnUrl;
        }
        $location.path('/dashboard').search(path);
    };

    $scope.showEventInCaptureApp = function(eventId){
        location.href = '../dhis-web-capture/index.html#/viewEvent/' + eventId;
    };
    
    var setRelationships = function(){
        $scope.relatedTeis = [];
        $scope.relatedEvents = [];
        $scope.relationshipPrograms = [];
        $scope.relationshipAttributes = [];
        var relationshipProgram = {};
        var relationshipType = {};

        TEService.getAll().then(function(teiTypes){
            //Loop through all relationships.      
            angular.forEach($scope.selectedTei.relationships, function(rel){
                if(rel.to && rel.to.trackedEntityInstance && rel.to.trackedEntityInstance.trackedEntityInstance !== $scope.selectedTei.trackedEntityInstance){  
                    var teiId = rel.to.trackedEntityInstance.trackedEntityInstance;
                    TEIService.get(teiId, $scope.optionSets, $scope.attributesById).then(function(tei){
                        relationshipType = $scope.relationshipTypes.find(function(relType) { return relType.id === rel.relationshipType });
                        var relName = relationshipType.fromToName;

                        if(relationshipType && teiTypes.filter(function(teiType) { return teiType.id === tei.trackedEntityType ; }).length > 0) {
                            var teiType = teiTypes.find(function(teiType) { return teiType.id === tei.trackedEntityType ; });
                            angular.forEach(teiType.trackedEntityTypeAttributes, function(attribute){
                                if($scope.relationshipAttributes.length > 0 && $scope.relationshipAttributes.filter(function(att) { return att.id === attribute.id ; }).length === 0) {
                                    $scope.relationshipAttributes.push(attribute);
                                } else if($scope.relationshipAttributes.length === 0) {
                                    $scope.relationshipAttributes.push(attribute);
                                }
                            });
                        }

                        relationshipProgram = relationshipType.toConstraint.program;

                        if(!relationshipProgram && $scope.selectedProgram) {
                            relationshipProgram = {id: $scope.selectedProgram.id};
                        }

                        var relative = {trackedEntityInstance: teiId, relName: relName, relId: rel.relationship, attributes: getRelativeAttributes(tei.attributes), relationshipProgramConstraint: relationshipProgram, relationshipType: relationshipType};            
                        $scope.relatedTeis.push(relative);
                    });
                } else if(rel.from && rel.bidirectional && rel.from.trackedEntityInstance && rel.from.trackedEntityInstance.trackedEntityInstance !== $scope.selectedTei.trackedEntityInstance){  
                    var teiId = rel.from.trackedEntityInstance.trackedEntityInstance;
                    TEIService.get(teiId, $scope.optionSets, $scope.attributesById).then(function(tei){
                        relationshipType = $scope.relationshipTypes.find(function(relType) { return relType.id === rel.relationshipType });
                        var relName = relationshipType.toFromName;

                        if(relationshipType && teiTypes.filter(function(teiType) { return teiType.id === tei.trackedEntityType ; }).length > 0) {
                            var teiType = teiTypes.find(function(teiType) { return teiType.id === tei.trackedEntityType ; });
                            angular.forEach(teiType.trackedEntityTypeAttributes, function(attribute){
                                if($scope.relationshipAttributes.length > 0 && $scope.relationshipAttributes.filter(function(att) { return att.id === attribute.id ; }).length === 0) {
                                    $scope.relationshipAttributes.push(attribute);
                                } else if($scope.relationshipAttributes.length === 0) {
                                    $scope.relationshipAttributes.push(attribute);
                                }
                            });
                        }

                        relationshipProgram = relationshipType.fromConstraint.program;

                        if(!relationshipProgram && $scope.selectedProgram) {
                            relationshipProgram = {id: $scope.selectedProgram.id};
                        }

                        var relative = {trackedEntityInstance: teiId, relName: relName, relId: rel.relationship, attributes: getRelativeAttributes(tei.attributes), relationshipProgramConstraint: relationshipProgram, relationshipType: relationshipType};            
                        $scope.relatedTeis.push(relative);
                    });
                } else if(rel.from && rel.bidirectional && rel.from.event && rel.from.event.event) {
                    var event = null;
                    DHIS2EventFactory.getEventWithoutRegistration(rel.from.event.event).then(function(e){
                        event = e;

                        relationshipType = $scope.relationshipTypes.find(function(relType) { return relType.id === rel.relationshipType });
                        var relName = relationshipType.toFromName;

                        relationshipProgram = relationshipType.fromConstraint.program;

                        if(!relationshipProgram && $scope.selectedProgram) {
                            relationshipProgram = {id: $scope.selectedProgram.id};
                        }

                        var convertedEventDate = DateUtils.formatFromApiToUser(event.eventDate);
                        var isDeleteable = !$scope.selectedTei.inactive && relationshipType.access.data.write && $scope.trackedEntityType.access.data.write && $scope.accessByProgramId[event.program].data.write;

                        var eventToDisplay = {
                            eventId: rel.from.event.event,
                            eventDate: convertedEventDate,
                            program: $scope.allProgramNames[event.program],
                            status: event.status,
                            orgUnit: event.orgUnitName,
                            relName: relName,
                            relId: rel.relationship,
                            relationshipProgramConstraint: relationshipProgram,
                            relationshipType: relationshipType,
                            isDeleteable: isDeleteable
                        };            
                        $scope.relatedEvents.push(eventToDisplay);
                    });
                }
            });
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