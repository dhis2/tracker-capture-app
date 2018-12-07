/* global trackerCapture, angular */

var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('TEIAddController', 
    function($scope, 
            $rootScope,
            $translate,
            $modalInstance, 
            $location,
            DateUtils,
            CurrentSelection,
            OperatorFactory,
            AttributesFactory,
            EntityQueryFactory,
            OrgUnitFactory,
            ProgramFactory,
            MetaDataFactory,
            TEIService,
            TEIGridService,
            NotificationService,
            Paginator,
            relationshipTypes,
            selectedProgram,
            relatedProgramRelationship,
            selections,
            selectedAttribute,
            existingAssociateUid,
            addingRelationship,
            selectedTei,
            AccessUtils,
            TEService,
            allPrograms
            ){
    var selection = CurrentSelection.get();
   
    $scope.base = {};
    $scope.selectedConstraints = { currentTei: null, related: null};
    $scope.tempSelectedConstraints = { currentTei: null, related: null};
    $scope.attributesById = CurrentSelection.getAttributesById();
    if(!$scope.attributesById){
        $scope.attributesById = [];
        AttributesFactory.getAll().then(function(atts){
            angular.forEach(atts, function(att){
                $scope.attributesById[att.id] = att;
            });
            
            CurrentSelection.setAttributesById($scope.attributesById);
        });
    }    
    
    $scope.optionSets = CurrentSelection.getOptionSets();        
    if(!$scope.optionSets){
        $scope.optionSets = [];
        MetaDataFactory.getAll('optionSets').then(function(optionSets){
            angular.forEach(optionSets, function(optionSet){                        
                $scope.optionSets[optionSet.id] = optionSet;
            });

            CurrentSelection.setOptionSets($scope.optionSets);
        });
    }

    var isValidCurrentTeiConstraint = function(constraint){
        var tetTypeValid = constraint.trackedEntityType.id === $scope.mainTei.trackedEntityType;
        var programValid = (!constraint.program || constraint.program.id === $scope.selectedProgram.id);
        return (tetTypeValid && programValid);
    }

    $scope.updateCurrentTeiConstraint = function(){
        var currentTeiConstraint = $scope.tempSelectedConstraints.currentTei && $scope.relationship.selected[$scope.tempSelectedConstraints.currentTei];
        if(currentTeiConstraint){
            if(!isValidCurrentTeiConstraint(currentTeiConstraint)){
                NotificationService.showNotifcationDialog("current tei constraint not valid", "current tei constraint not valid");
                $scope.tempSelectedConstraints.currentTei = $scope.selectedConstraints.currentTei;
                return;
            }
            $scope.selectedConstraints.currentTei = $scope.tempSelectedConstraints.currentTei;
            $scope.tempSelectedConstraints.related = $scope.selectedConstraints.related = ($scope.selectedConstraints.currentTei === "fromConstraint" ? "toConstraint" : "fromConstraint");
            $scope.resetRelatedView();
        }
    }

    $scope.updateRelatedConstraint = function(){
        $scope.tempSelectedConstraints.currentTei = $scope.selectedConstraints.related === "fromConstraint" ? "toConstraint" : "fromConstraint";
        $scope.updateCurrentTeiConstraint();
    }



    $scope.resetRelatedView = function(){
        $scope.relatedPredefinedProgram = false;
        
        var relatedConstraint = $scope.selectedConstraints.related && $scope.relationship.selected[$scope.selectedConstraints.related];
        if(relatedConstraint){
            if(relatedConstraint.program && relatedConstraint.program.id){
                var program = $scope.programs.find(function(p){
                    return p.id === relatedConstraint.program.id;
                });
                $scope.relatedPredefinedProgram = true;
                $scope.base.selectedProgramForRelative = program;
                $scope.onSelectedProgram(program);
            } else {
                
                $scope.relatedAvailablePrograms = $scope.programs.filter(function(p){
                    return p.trackedEntityType && p.trackedEntityType.id === relatedConstraint.trackedEntityType.id;
                });
                $scope.relatedPredefinedProgram = false;
                $scope.base.selectedProgramForRelative = null;
                $scope.onSelectedProgram($scope.base.selectedProgramForRelative);
            }
        }
    }


    
    $scope.today = DateUtils.getToday();
    $scope.relationshipTypes = relationshipTypes;
    $scope.addingRelationship = addingRelationship;
    $scope.selectedAttribute = selectedAttribute;
    $scope.selectedProgram = selectedProgram;
    $scope.relatedProgramRelationship = relatedProgramRelationship;
    $scope.mainTei = selectedTei;    
    $scope.attributesById = CurrentSelection.getAttributesById();
    $scope.addingTeiAssociate = false;
    
    $scope.searchOuTree = false;
    $scope.orgUnitLabel = $translate.instant('org_unit');
    
    $scope.selectedRelationship = {};
    $scope.relationship = {};
    
    var invalidTeis = $scope.addingRelationship ? [$scope.mainTei.trackedEntityInstance] : [];
    if($scope.mainTei.relationships && $scope.addingRelationship){
        angular.forEach($scope.mainTei.relationships, function(rel){
            invalidTeis.push(rel.trackedEntityInstanceB);
        });
    }


        $scope.selectedOrgUnit = selection.orgUnit;
        $scope.selectedEnrollment = {
            enrollmentDate: $scope.today,
            incidentDate: $scope.today,
            orgUnitName: $scope.selectedOrgUnit.displayName,
            orgUnit: $scope.selectedOrgUnit.id
        };

        //Selections
        $scope.selectedTeiForDisplay = angular.copy($scope.mainTei);
        $scope.ouModes = [{name: 'SELECTED'}, {name: 'CHILDREN'}, {name: 'DESCENDANTS'}, {name: 'ACCESSIBLE'}];
        $scope.selectedOuMode = $scope.ouModes[0];

        //Paging
        $scope.pager = {pageSize: 50, page: 1, toolBarDisplay: 5};

        //Searching
        $scope.showAdvancedSearchDiv = false;
        $scope.searchText = {value: null};
        $scope.emptySearchText = false;
        $scope.searchFilterExists = false;
        $scope.defaultOperators = OperatorFactory.defaultOperators;
        $scope.boolOperators = OperatorFactory.boolOperators;
        $scope.selectedTrackedEntity = null;

        $scope.trackedEntityList = null;
        $scope.enrollment = {programStartDate: '', programEndDate: '', operator: $scope.defaultOperators[0]};

        $scope.searchMode = {listAll: 'LIST_ALL', freeText: 'FREE_TEXT', attributeBased: 'ATTRIBUTE_BASED'};
        $scope.selectedSearchMode = $scope.searchMode.listAll;

        if ($scope.addingRelationship) {
            $scope.teiAddLabel = $translate.instant('add_relationship');
            $scope.programs = AccessUtils.toWritable(allPrograms);
            CurrentSelection.setRelationshipOwner($scope.mainTei);
        }
        else {
            $scope.teiAddLabel = $scope.selectedAttribute && $scope.selectedAttribute.displayName ? $scope.selectedAttribute.displayName : $translate.instant('tracker_associate');
            $scope.addingTeiAssociate = true;
            var programs = allPrograms;
            if ($scope.selectedAttribute && $scope.selectedAttribute.trackedEntityType && $scope.selectedAttribute.trackedEntityType.id) {
                programs = [];
                angular.forEach(allPrograms, function (pr) {
                    if (pr.trackedEntityType && pr.trackedEntityType.id === $scope.selectedAttribute.trackedEntityType.id) {
                        programs.push(pr);
                    }
                });
            }
            $scope.relatedAvailablePrograms = AccessUtils.toWritable(programs);

            if (existingAssociateUid) {
                TEIService.get(existingAssociateUid, $scope.optionSets, $scope.attributesById).then(function (data) {
                    $scope.selectedTeiForDisplay = data;
                });
            }
            else {
                $scope.selectedTeiForDisplay = null;
            }

            CurrentSelection.setRelationshipOwner({});

            if ($scope.selectedAttribute && $scope.selectedAttribute.trackedEntityType && $scope.selectedAttribute.trackedEntityType.id) {
                $scope.selectedTrackedEntity = $scope.selectedAttribute.trackedEntityType;
            }
        }

        if (angular.isObject($scope.programs) && $scope.programs.length === 1) {
            $scope.base.selectedProgramForRelative = $scope.programs[0];
        }

        if ($scope.selectedProgram) {
            if ($scope.selectedProgram.relatedProgram && $scope.relatedProgramRelationship) {
                angular.forEach($scope.programs, function (pr) {
                    if (pr.id === $scope.selectedProgram.relatedProgram.id) {
                        $scope.base.selectedProgramForRelative = pr;
                    }
                });
            }

            if ($scope.selectedProgram.relationshipType) {
                angular.forEach($scope.relationshipTypes, function (rel) {
                    if (rel.id === $scope.selectedProgram.relationshipType.id) {
                        $scope.relationship.selected = rel;
                    }
                });
            }
        }

        //watch for selection of relationship
        $scope.$watch('relationship.selected', function () {
            if (angular.isObject($scope.relationship.selected)) {
                $scope.selectedConstraints.currentTei = "fromConstraint";
                $scope.selectedConstraints.related = "toConstraint";
                $scope.resetRelatedView();
            }
        });

        function resetFields() {

            $scope.teiForRelationship = null;
            $scope.teiFetched = false;
            $scope.emptySearchText = false;
            $scope.emptySearchAttribute = false;
            $scope.showAdvancedSearchDiv = false;
            $scope.showRegistrationDiv = false;
            $scope.showTrackedEntityDiv = false;
            $scope.trackedEntityList = null;
            $scope.teiCount = null;

            $scope.queryUrl = null;
            $scope.programUrl = null;
            $scope.attributeUrl = {url: null, hasValue: false};
            $scope.sortColumn = {};
        }

        //listen for selections
        $scope.$on('relationship', function (event, args) {
            if (args.result === 'SUCCESS') {
                var relationshipInfo = CurrentSelection.getRelationshipInfo();
                $scope.teiForRelationship = relationshipInfo.tei;
                $scope.addRelationship();
            }

            if (args.result === 'CANCEL') {
                $scope.showRegistration();
            }
        });

        //sortGrid
        $scope.sortGrid = function (gridHeader) {
            if ($scope.sortColumn && $scope.sortColumn.id === gridHeader.id) {
                $scope.reverse = !$scope.reverse;
                return;
            }
            $scope.sortColumn = gridHeader;
            if ($scope.sortColumn.valueType === 'date') {
                $scope.reverse = true;
            }
            else {
                $scope.reverse = false;
            }
        };

        $scope.d2Sort = function (tei) {
            if ($scope.sortColumn && $scope.sortColumn.valueType === 'date') {
                var d = tei[$scope.sortColumn.id];
                return DateUtils.getDate(d);
            }
            return tei[$scope.sortColumn.id];
        };

        $scope.search = function (mode) {

            resetFields();

            $scope.selectedSearchMode = mode;

            if ($scope.base.selectedProgramForRelative) {
                $scope.programUrl = 'program=' + $scope.base.selectedProgramForRelative.id;
            }

            //check search mode
            if ($scope.selectedSearchMode === $scope.searchMode.freeText) {

                if (!$scope.searchText.value) {
                    $scope.emptySearchText = true;
                    $scope.teiFetched = false;
                    $scope.teiCount = null;
                    return;
                }

                $scope.queryUrl = 'query=LIKE:' + $scope.searchText.value;
            }

            if ($scope.selectedSearchMode === $scope.searchMode.attributeBased) {
                $scope.searchText.value = null;
                $scope.attributeUrl = EntityQueryFactory.getAttributesQuery($scope.attributes, $scope.enrollment);

                if (!$scope.attributeUrl.hasValue && !$scope.base.selectedProgramForRelative) {
                    $scope.emptySearchAttribute = true;
                    $scope.teiFetched = false;
                    $scope.teiCount = null;
                    return;
                }
            }

            if ($scope.addingTeiAssociate) {
                if (!$scope.selectedProgram.trackedEntityType || !$scope.selectedProgram.trackedEntityType.id) {
                    NotificationService.showNotifcationDialog($translate.instant("searching_error"),
                        $translate.instant("no_entity_for_tracker_associate_attribute"));
                    $scope.teiFetched = true;
                    return;
                }

                //$scope.programUrl = 'trackedEntityType=' + $scope.selectedTrackedEntityType.id;
            }

            $scope.fetchTei();
        };

        $scope.fetchTei = function () {

            //get events for the specified parameters
            TEIService.search($scope.selectedOrgUnit.id,
                $scope.selectedOuMode.name,
                $scope.queryUrl,
                $scope.programUrl,
                $scope.attributeUrl.url,
                $scope.pager,
                true).then(function (data) {
                //$scope.trackedEntityList = data;
                if (data.rows) {
                    $scope.teiCount = data.rows.length;
                }

                if (data.metaData.pager) {
                    $scope.pager = data.metaData.pager;
                    $scope.pager.toolBarDisplay = 5;

                    Paginator.setPage($scope.pager.page);
                    Paginator.setPageCount($scope.pager.pageCount);
                    Paginator.setPageSize($scope.pager.pageSize);
                    Paginator.setItemCount($scope.pager.total);
                }

                //process tei grid

                $scope.trackedEntityList = TEIGridService.format($scope.selectedOrgUnit.id, data, false, $scope.optionSets, invalidTeis);
                $scope.showTrackedEntityDiv = true;
                $scope.teiFetched = true;

                if (!$scope.sortColumn.id) {
                    $scope.sortGrid({
                        id: 'created',
                        name: $translate.instant('registration_date'),
                        valueType: 'date',
                        displayInListNoProgram: false,
                        showFilter: false,
                        show: false
                    });
                }
            });
        };

        $scope.onSelectedProgram = function(program){
            $scope.selectedProgramForRelative = program;
            $scope.base.selectedProgram = program;
            $scope.setAttributesForSearch(program);
            TEService.get(selectedProgram.trackedEntityType.id).then(function(te){
                $scope.canRegister = AccessUtils.isWritable(te) && AccessUtils.isWritable(selectedProgram);

            });

        }
        //set attributes as per selected program
        $scope.setAttributesForSearch = function (program) {

            $scope.base.selectedProgramForRelative = program;
            AttributesFactory.getByProgram($scope.base.selectedProgramForRelative).then(function (atts) {
                $scope.attributes = atts;
                $scope.attributes = AttributesFactory.generateAttributeFilters(atts);
                $scope.gridColumns = TEIGridService.generateGridColumns($scope.attributes, null, false).columns;
            });

            $scope.search($scope.selectedSearchMode);
        };

        $scope.setAttributesForSearch($scope.base.selectedProgramForRelative);

        $scope.jumpToPage = function () {
            if ($scope.pager && $scope.pager.page && $scope.pager.pageCount && $scope.pager.page > $scope.pager.pageCount) {
                $scope.pager.page = $scope.pager.pageCount;
            }

            $scope.search($scope.selectedSearchMode);
        };

        $scope.resetPageSize = function () {
            $scope.pager.page = 1;
            $scope.search($scope.selectedSearchMode);
        };

        $scope.getPage = function (page) {
            $scope.pager.page = page;
            $scope.search($scope.selectedSearchMode);
        };

        //generate grid columns from teilist attributes
        $scope.generateGridColumns = function (attributes) {

            var columns = attributes ? angular.copy(attributes) : [];

            //also add extra columns which are not part of attributes (orgunit for example)
            columns.push({id: 'orgUnitName', name: 'Organisation unit', type: 'TEXT', displayInListNoProgram: false});
            columns.push({id: 'created', name: 'Registration date', type: 'TEXT', displayInListNoProgram: false});

            //generate grid column for the selected program/attributes
            angular.forEach(columns, function (column) {
                if (column.id === 'orgUnitName' && $scope.selectedOuMode.name !== 'SELECTED') {
                    column.show = true;
                }

                if (column.displayInListNoProgram) {
                    column.show = true;
                }

                if (column.type === 'date') {
                    $scope.filterText[column.id] = {start: '', end: ''};
                }
            });
            return columns;
        };

        $scope.showHideSearch = function (simpleSearch) {
            $scope.showAdvancedSearchDiv = simpleSearch ? false : !$scope.showAdvancedSearchDiv;
            $scope.showTrackedEntityDiv = !$scope.showAdvancedSearchDiv;
        };

        $scope.showRegistration = function () {
            $scope.showRegistrationDiv = !$scope.showRegistrationDiv;
            $scope.showTrackedEntityDiv = !$scope.showRegistrationDiv;
        };

        $scope.hideRegistration = function(){
            $scope.showRegistrationDiv = false;
        }

        $scope.close = function () {
            $modalInstance.close($scope.mainTei.relationships ? $scope.mainTei.relationships : []);
            $rootScope.showAddRelationshipDiv = !$rootScope.showAddRelationshipDiv;
        };

        $scope.setRelationshipSides = function (side) {
            if (side === 'A') {
                $scope.selectedRelationship.bIsToA = $scope.selectedRelationship.aIsToB === $scope.relationship.selected.aIsToB ? $scope.relationship.selected.bIsToA : $scope.relationship.selected.aIsToB;
            }
            if (side === 'B') {
                $scope.selectedRelationship.aIsToB = $scope.selectedRelationship.bIsToA === $scope.relationship.selected.bIsToA ? $scope.relationship.selected.aIsToB : $scope.relationship.selected.bIsToA;
            }
        };

        $scope.assignRelationship = function (relativeTei) {
            $scope.teiForRelationship = relativeTei;
            $rootScope.showAddRelationshipDiv = !$rootScope.showAddRelationshipDiv;
        };

        $scope.back = function () {
            $scope.teiForRelationship = null;
            $rootScope.showAddRelationshipDiv = !$rootScope.showAddRelationshipDiv;
        };

        $scope.addRelationship = function () {
            if ($scope.addingRelationship) {
                if ($scope.mainTei && $scope.teiForRelationship && $scope.relationship.selected) {
                    var tei = angular.copy($scope.mainTei);

                    var relationship = { from: {trackedEntityInstance: {} }, to: {trackedEntityInstance: {}}};

                    relationship.relationshipType = $scope.relationship.selected.id;
                    
                    relationship.from.trackedEntityInstance.trackedEntityInstance = $scope.selectedConstraints.currentTei === 'fromConstraint' ? $scope.mainTei.trackedEntityInstance : $scope.teiForRelationship.id;
                    relationship.to.trackedEntityInstance.trackedEntityInstance = $scope.selectedConstraints.currentTei === 'toConstraint' ? $scope.mainTei.trackedEntityInstance : $scope.teiForRelationship.id;

                    tei.relationships.push(relationship);

                    TEIService.update(tei, $scope.optionSets, $scope.attributesById).then(function (response) {
                        var relationshipResponse = response && response.response && response.response.relationships;
                        var importSummary = relationshipResponse && relationshipResponse.importSummaries && relationshipResponse.importSummaries[0];
                        if(!importSummary){
                            NotificationService.showNotifcationDialog($translate.instant("unknown_error"), $translate.instant("unknown_error"));
                            return;
                        }
                        if (importSummary && importSummary.status !== 'SUCCESS') {//update has failed
                            var message = $translate.instant("saving_relationship_failed_conflicts");
                            var conflictMessage = importSummary.conflicts.reduce(function(msg, conflict){
                                msg += "["+conflict.value+"] ";
                                return msg;
                            },"");
                            NotificationService.showNotifcationDialog($translate.instant("saving_relationship_failed"), message +": "+conflictMessage);
                            return;
                        }

                        relationship.relationshipName = $scope.relationship.selected.displayName;
                        relationship.relationship = importSummary.reference;

                        if ($scope.mainTei.relationships) {
                            $scope.mainTei.relationships.push(relationship);
                        }
                        else {
                            $scope.mainTei.relationships = [relationship];
                        }

                        $modalInstance.close($scope.mainTei.relationships);
                    });
                }
                else {
                    NotificationService.showNotifcationDialog($translate.instant("relationship_error"), $translate.instant("selected_tei_is_invalid"));
                    return;
                }
            }
            else {
                if ($scope.teiForRelationship && $scope.teiForRelationship.id) {
                    $modalInstance.close($scope.teiForRelationship);
                }
                else {
                    NotificationService.showNotifcationDialog($translate.instant("tracker_associate_error"), $translate.instant("selected_tei_is_invalid"));
                    return;
                }

            }
        };

        //Get orgunits for the logged in user
        OrgUnitFactory.getSearchTreeRoot().then(function (response) {
            $scope.orgUnits = response.organisationUnits;
            angular.forEach($scope.orgUnits, function (ou) {
                ou.show = true;
                angular.forEach(ou.children, function (o) {
                    o.hasChildren = o.children && o.children.length > 0 ? true : false;
                });
            });
        });

        //expand/collapse of search orgunit tree
        $scope.expandCollapse = function (orgUnit) {
            if (orgUnit.hasChildren) {
                //Get children for the selected orgUnit
                OrgUnitFactory.get(orgUnit.id).then(function (ou) {
                    orgUnit.show = !orgUnit.show;
                    orgUnit.hasChildren = false;
                    orgUnit.children = ou.organisationUnits[0].children;
                    angular.forEach(orgUnit.children, function (ou) {
                        ou.hasChildren = ou.children && ou.children.length > 0 ? true : false;
                    });
                });
            }
            else {
                orgUnit.show = !orgUnit.show;
            }
        };

        //load programs for the selected orgunit (from tree)
        $scope.setSelectedSearchingOrgUnit = function (orgUnit) {
            $scope.selectedSearchingOrgUnit = orgUnit;
        };
})

.controller('TEIRegistrationController', 
        function($rootScope,
                $scope,
                $timeout,
                $translate,
                AttributesFactory,
                MetaDataFactory,
                TrackerRulesFactory,
                CustomFormService,
                TEService,
                EnrollmentService,
                NotificationService,
                CurrentSelection,
                DateUtils,
                EventUtils,
                DHIS2EventFactory,
                RegistrationService,
                SessionStorageService,
                TrackerRulesExecutionService,
                TEIGridService,
                AttributeUtils) {
    $scope.selectedOrgUnit = SessionStorageService.get('SELECTED_OU');
    $scope.enrollment = {enrollmentDate: '', incidentDate: ''};    
    $scope.attributesById = CurrentSelection.getAttributesById();
    $scope.today = DateUtils.getToday();
    $scope.trackedEntityForm = null;
    $scope.customRegistrationForm = null;
    $scope.selectedTei = {};
    $scope.teiOriginal = {};
    $scope.tei = {};
    $scope.hiddenFields = {};
    $scope.assignedFields= {};
    $scope.editingDisabled = false;
    $scope.model={autoGeneratedAttFailed: false};
    
    var selections = CurrentSelection.get();
    $scope.selectedOrgUnit = selections.orgUnit;

    $scope.attributesById = CurrentSelection.getAttributesById();
    if(!$scope.attributesById){
        $scope.attributesById = [];
        AttributesFactory.getAll().then(function(atts){
            angular.forEach(atts, function(att){
                $scope.attributesById[att.id] = att;
            });
            
            CurrentSelection.setAttributesById($scope.attributesById);
        });
    }    
    
    $scope.optionSets = CurrentSelection.getOptionSets();        
    if(!$scope.optionSets){
        $scope.optionSets = [];
        MetaDataFactory.getAll('optionSets').then(function(optionSets){
            angular.forEach(optionSets, function(optionSet){                        
                $scope.optionSets[optionSet.id] = optionSet;
            });

            CurrentSelection.setOptionSets($scope.optionSets);
        });
    }
    
    var assignInheritance = function(){        
        $scope.selectedTei = {};
        if($scope.addingRelationship){
            var t = angular.copy( CurrentSelection.getRelationshipOwner() );
            angular.forEach(t.attributes, function(att){
                t[att.attribute] = att.value;
            });
            
            angular.forEach($scope.attributes, function(att){
                if(att.inherit && t[att.id]){
                    $scope.selectedTei[att.id] = t[att.id];
                }
            });
            t = {};
        }
    };
    
    var getRules = function(){
        $scope.allProgramRules = {constants: [], programIndicators: {}, programVariables: [], programRules: []};
        if( angular.isObject($scope.base.selectedProgramForRelative) && $scope.base.selectedProgramForRelative.id ){
            TrackerRulesFactory.getRules($scope.base.selectedProgramForRelative.id).then(function(rules){                    
                $scope.allProgramRules = rules;
                $scope.executeRules();
            });
        }
    };

    var fetchGeneratedAttributes = function() {
        angular.forEach($scope.attributes, function(att) {
            if (att.generated && !$scope.selectedTei[att.id]) {
                AttributeUtils.generateUniqueValue(att.id, $scope.selectedTei, $scope.selectedProgram, $scope.selectedOrgUnit).then(function (data) {
                    if (data && data.status === "ERROR") {
                        NotificationService.showNotifcationDialog($translate.instant("error"), data.message);
                        $scope.model.autoGeneratedAttFailed = true;
                    } else {
                        if (att.valueType === "NUMBER") {
                            $scope.selectedTei[att.id] = Number(data);
                        } else {
                            $scope.selectedTei[att.id] = data;
                        }
                        $scope.model.autoGeneratedAttFailed = false;
                    }
                });
            }
        });
    };
    
    //watch for selection of program
    $scope.$watch('base.selectedProgramForRelative', function() {        
        $scope.trackedEntityForm = null;
        $scope.customRegistrationForm = null;
        $scope.customFormExists = false;        
        AttributesFactory.getByProgram($scope.base.selectedProgramForRelative).then(function(atts){
            $scope.attributes = TEIGridService.generateGridColumns(atts, null,false).columns;                      
            if($scope.base.selectedProgramForRelative && $scope.base.selectedProgramForRelative.id && $scope.base.selectedProgramForRelative.dataEntryForm && $scope.base.selectedProgramForRelative.dataEntryForm.htmlCode){
                $scope.customFormExists = true;
                $scope.trackedEntityForm = $scope.base.selectedProgramForRelative.dataEntryForm;  
                $scope.trackedEntityForm.attributes = $scope.attributes;
                $scope.trackedEntityForm.selectIncidentDatesInFuture = $scope.base.selectedProgramForRelative.selectIncidentDatesInFuture;
                $scope.trackedEntityForm.selectEnrollmentDatesInFuture = $scope.base.selectedProgramForRelative.selectEnrollmentDatesInFuture;
                $scope.trackedEntityForm.displayIncidentDate = $scope.base.selectedProgramForRelative.displayIncidentDate;
                $scope.customRegistrationForm = CustomFormService.getForTrackedEntity($scope.trackedEntityForm, 'RELATIONSHIP');
            }
            assignInheritance();
            fetchGeneratedAttributes(); 
            getRules();                
        });
    }); 

    $scope.attributeFieldDisabled = function(attribute){
        if($scope.selectedTei && $scope.selectedTei.programOwnersById && $scope.selectedProgram && $scope.selectedTei.programOwnersById[$scope.selectedProgram.id] != $scope.selectedOrgUnit.id) return true;
        if($scope.isDisabled(attribute)) return true;
        if($scope.selectedOrgUnit.closedStatus) return true;
        if(!$scope.hasTeiWrite()) return true;
        return false;
    }

    $scope.isDisabled = function(attribute) {
        return attribute.generated || $scope.assignedFields[attribute.id] || $scope.editingDisabled;
    };

    $scope.hasTeiWrite = function(){
        return $scope.trackedEntityTypes && $scope.trackedEntityTypes.selected && $scope.trackedEntityTypes.selected.access.data.write;
    }
            
    $scope.trackedEntityTypes = {available: []};
    TEService.getAll().then(function(entities){
        $scope.trackedEntityTypes.available = entities;   
        $scope.trackedEntityTypes.selected = $scope.trackedEntityTypes.available[0];
    });
    
    $scope.registerEntity = function(){
        
        //check for form validity
        $scope.outerForm.submitted = true;
        if( $scope.outerForm.$invalid ){
            return false;
        }
        
        //form is valid, continue the registration
        //get selected entity
        var selectedTrackedEntity = $scope.trackedEntityTypes.selected.id; 
        if($scope.base.selectedProgramForRelative){
            selectedTrackedEntity = $scope.base.selectedProgramForRelative.trackedEntityType.id;
        }
        
        //get tei attributes and their values
        //but there could be a case where attributes are non-mandatory and
        //registration form comes empty, in this case enforce at least one value
        $scope.selectedTei.trackedEntityType = $scope.tei.trackedEntityType = selectedTrackedEntity; 
        $scope.selectedTei.orgUnit = $scope.tei.orgUnit = $scope.selectedOrgUnit.id;
        $scope.selectedTei.attributes = $scope.tei.attributes = [];
        
        var result = RegistrationService.processForm($scope.tei, $scope.selectedTei, $scope.teiOriginal, $scope.attributesById);
        $scope.formEmpty = result.formEmpty;
        $scope.tei = result.tei;
                
        if($scope.formEmpty){//registration form is empty
            return false;
        }
        
        RegistrationService.registerOrUpdate($scope.tei, $scope.optionSets, $scope.attributesById).then(function(registrationResponse){
            var reg = registrationResponse.response ? registrationResponse.response : {};
            if (reg.importSummaries[0].reference && reg.status === 'SUCCESS'){                
                $scope.tei.trackedEntityInstance = $scope.tei.id = reg.importSummaries[0].reference; 
                
                //registration is successful and check for enrollment
                if($scope.base.selectedProgramForRelative){    
                    //enroll TEI
                    var enrollment = {};
                    enrollment.trackedEntityInstance = $scope.tei.trackedEntityInstance;
                    enrollment.program = $scope.base.selectedProgramForRelative.id;
                    enrollment.status = 'ACTIVE';
                    enrollment.orgUnit = $scope.selectedOrgUnit.id;
                    enrollment.enrollmentDate = $scope.selectedEnrollment.enrollmentDate;
                    enrollment.incidentDate = $scope.selectedEnrollment.incidentDate === '' ? $scope.selectedEnrollment.enrollmentDate : $scope.selectedEnrollment.incidentDate;
                    EnrollmentService.enroll(enrollment).then(function(enrollmentResponse){
                        if(enrollmentResponse) {
                            var en = enrollmentResponse.response && enrollmentResponse.response.importSummaries && enrollmentResponse.response.importSummaries[0] ? enrollmentResponse.response.importSummaries[0] : {};
                            if (en.reference && en.status === 'SUCCESS') {
                                enrollment.enrollment = en.reference;
                                $scope.selectedEnrollment = enrollment;
                                var dhis2Events = EventUtils.autoGenerateEvents($scope.tei.trackedEntityInstance, $scope.base.selectedProgramForRelative, $scope.selectedOrgUnit, enrollment, null);
                                if (dhis2Events.events.length > 0) {
                                    DHIS2EventFactory.create(dhis2Events);
                                }
                            }
                            else {
                                //enrollment has failed
                                NotificationService.showNotifcationDialog($translate.instant("enrollment_error"), enrollmentResponse.message);
                                return;
                            }
                        }
                    });
                }
            }
            else{
                //registration has failed
                NotificationService.showNotifcationDialog($translate.instant("registration_error"), enrollmentResponse.message);
                return;
            }
            
            $timeout(function(){
                $scope.selectedEnrollment.enrollmentDate = '';
                $scope.selectedEnrollment.incidentDate =  '';
                $scope.outerForm.submitted = false; 
                $scope.broadCastSelections();                
            }, 100);        
            
        });
    };
    
    $scope.broadCastSelections = function(){
        if($scope.tei){
            angular.forEach($scope.tei.attributes, function(att){
                $scope.tei[att.attribute] = att.value;
            });

            $scope.tei.orgUnitName = $scope.selectedOrgUnit.displayName;
            $scope.tei.created = DateUtils.formatFromApiToUser(new Date());
            
            CurrentSelection.setRelationshipInfo({tei: $scope.tei});
            
            $timeout(function() { 
                $rootScope.$broadcast('relationship', {result: 'SUCCESS'});
            }, 100);
        }        
    };
    
    $scope.executeRules = function () {
        var flag = {debug: true, verbose: false};
        
        //repopulate attributes with updated values
        $scope.selectedTei.attributes = [];        
        angular.forEach($scope.attributes, function(metaAttribute){
            var newAttributeInArray = {attribute:metaAttribute.id,
                code:metaAttribute.code,
                displayName:metaAttribute.displayName,
                type:metaAttribute.valueType
            };
            if($scope.selectedTei[newAttributeInArray.attribute]){
                newAttributeInArray.value = $scope.selectedTei[newAttributeInArray.attribute];
            }
            
           $scope.selectedTei.attributes.push(newAttributeInArray);
        });
        
        if($scope.base.selectedProgramForRelative && $scope.base.selectedProgramForRelative.id){
            TrackerRulesExecutionService.executeRules($scope.allProgramRules, 'registrationRelationship', null, null, null, $scope.selectedTei, $scope.selectedEnrollment, null, flag);
        }        
    };
    
    //check if field is hidden
    $scope.isHidden = function (id) {
        //In case the field contains a value, we cant hide it. 
        //If we hid a field with a value, it would falsely seem the user was aware that the value was entered in the UI.        
        return $scope.selectedTei[id] ? false : $scope.hiddenFields[id];
    };
    
    $scope.teiValueUpdated = function(tei, field){
        $scope.executeRules();
    };
    
    //listen for rule effect changes
    $scope.$on('ruleeffectsupdated', function(){
        $scope.warningMessages = [];
        var effectResult = TrackerRulesExecutionService.processRuleEffectAttribute('registrationRelationship', $scope.selectedTei, $scope.tei,null,null,null, $scope.attributesById, null, $scope.optionSets,$scope.optionGroupsById);
        $scope.selectedTei = effectResult.selectedTei;
        $scope.hiddenFields = effectResult.hiddenFields;
        $scope.assignedFields = effectResult.assignedFields;
        $scope.warningMessages = effectResult.warningMessages;
    });
    
    $scope.interacted = function(field) {
        var status = false;
        if(field){            
            status = $scope.outerForm.submitted || field.$dirty;
        }
        return status;        
    };
});
