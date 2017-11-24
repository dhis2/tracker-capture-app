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
            selectedTei){
    var selection = CurrentSelection.get();
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
            $scope.programs = selections.prs;
            CurrentSelection.setRelationshipOwner($scope.mainTei);
        }
        else {
            $scope.teiAddLabel = $scope.selectedAttribute && $scope.selectedAttribute.displayName ? $scope.selectedAttribute.displayName : $translate.instant('tracker_associate');
            $scope.addingTeiAssociate = true;
            ProgramFactory.getProgramsByOu($scope.selectedOrgUnit, $scope.selectedProgram).then(function (response) {
                $scope.programs = response.programs;
                if ($scope.selectedAttribute && $scope.selectedAttribute.trackedEntity && $scope.selectedAttribute.trackedEntity.id) {
                    $scope.programs = [];
                    angular.forEach(response.programs, function (pr) {
                        if (pr.trackedEntity && pr.trackedEntity.id === $scope.selectedAttribute.trackedEntity.id) {
                            $scope.programs.push(pr);
                        }
                    });
                }
                $scope.selectedProgram = response.selectedProgram;
            });

            if (existingAssociateUid) {
                TEIService.get(existingAssociateUid, $scope.optionSets, $scope.attributesById).then(function (data) {
                    $scope.selectedTeiForDisplay = data;
                });
            }
            else {
                $scope.selectedTeiForDisplay = null;
            }

            CurrentSelection.setRelationshipOwner({});

            if ($scope.selectedAttribute && $scope.selectedAttribute.trackedEntity && $scope.selectedAttribute.trackedEntity.id) {
                $scope.selectedTrackedEntity = $scope.selectedAttribute.trackedEntity;
            }
        }

        if (angular.isObject($scope.programs) && $scope.programs.length === 1) {
            $scope.selectedProgramForRelative = $scope.programs[0];
        }

        if ($scope.selectedProgram) {
            if ($scope.selectedProgram.relatedProgram && $scope.relatedProgramRelationship) {
                angular.forEach($scope.programs, function (pr) {
                    if (pr.id === $scope.selectedProgram.relatedProgram.id) {
                        $scope.selectedProgramForRelative = pr;
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
                $scope.selectedRelationship = {
                    aIsToB: $scope.relationship.selected.aIsToB,
                    bIsToA: $scope.relationship.selected.bIsToA
                };
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

            if ($scope.selectedProgramForRelative) {
                $scope.programUrl = 'program=' + $scope.selectedProgramForRelative.id;
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

                if (!$scope.attributeUrl.hasValue && !$scope.selectedProgramForRelative) {
                    $scope.emptySearchAttribute = true;
                    $scope.teiFetched = false;
                    $scope.teiCount = null;
                    return;
                }
            }

            if ($scope.addingTeiAssociate) {
                if (!$scope.selectedTrackedEntity || !$scope.selectedTrackedEntity.id) {
                    NotificationService.showNotifcationDialog($translate.instant("searching_error"),
                        $translate.instant("no_entity_for_tracker_associate_attribute"));
                    $scope.teiFetched = true;
                    return;
                }

                //$scope.programUrl = 'trackedEntity=' + $scope.selectedTrackedEntity.id;
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

        //set attributes as per selected program
        $scope.setAttributesForSearch = function (program) {

            $scope.selectedProgramForRelative = program;
            AttributesFactory.getByProgram($scope.selectedProgramForRelative).then(function (atts) {
                $scope.attributes = atts;
                $scope.attributes = AttributesFactory.generateAttributeFilters(atts);
                $scope.gridColumns = TEIGridService.generateGridColumns($scope.attributes, null, false).columns;
            });

            $scope.search($scope.selectedSearchMode);
        };

        $scope.setAttributesForSearch($scope.selectedProgramForRelative);

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
                    var relationship = {};
                    relationship.relationship = $scope.relationship.selected.id;
                    relationship.displayName = $scope.relationship.selected.displayName;
                    relationship.relative = {};

                    relationship.trackedEntityInstanceA = $scope.selectedRelationship.aIsToB === $scope.relationship.selected.aIsToB ? $scope.mainTei.trackedEntityInstance : $scope.teiForRelationship.id;
                    relationship.trackedEntityInstanceB = $scope.selectedRelationship.bIsToA === $scope.relationship.selected.bIsToA ? $scope.teiForRelationship.id : $scope.mainTei.trackedEntityInstance;

                    tei.relationships = [];
                    angular.forEach($scope.mainTei.relationships, function (rel) {
                        tei.relationships.push({
                            relationship: rel.relationship,
                            displayName: rel.displayName,
                            trackedEntityInstanceA: rel.trackedEntityInstanceA,
                            trackedEntityInstanceB: rel.trackedEntityInstanceB
                        });
                    });
                    tei.relationships.push(relationship);

                    TEIService.update(tei, $scope.optionSets, $scope.attributesById).then(function (response) {
                        if (!response || response.response && response.response.status !== 'SUCCESS') {//update has failed
                            return;
                        }

                        relationship.relative.processed = true;
                        relationship.relative.attributes = $scope.teiForRelationship;

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
                TEIGridService) {
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
    $scope.editingDisabled = false;
    
    var selections = CurrentSelection.get();
    $scope.programs = selections.prs;
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
        if( angular.isObject($scope.selectedProgramForRelative) && $scope.selectedProgramForRelative.id ){
            TrackerRulesFactory.getRules($scope.selectedProgramForRelative.id).then(function(rules){                    
                $scope.allProgramRules = rules;
            });
        }
    };
  
    
    if(angular.isObject($scope.programs) && $scope.programs.length === 1){
        $scope.selectedProgramForRelative = $scope.programs[0];
        AttributesFactory.getByProgram($scope.selectedProgramForRelative).then(function(atts){
            $scope.attributes = TEIGridService.generateGridColumns(atts, null,false).columns;
            assignInheritance();
            getRules();
        });
    }
    
    //watch for selection of program
    $scope.$watch('selectedProgramForRelative', function() {        
        $scope.trackedEntityForm = null;
        $scope.customRegistrationForm = null;
        $scope.customFormExists = false;        
        AttributesFactory.getByProgram($scope.selectedProgramForRelative).then(function(atts){
            $scope.attributes = TEIGridService.generateGridColumns(atts, null,false).columns;                       
            if($scope.selectedProgramForRelative && $scope.selectedProgramForRelative.id && $scope.selectedProgramForRelative.dataEntryForm && $scope.selectedProgramForRelative.dataEntryForm.htmlCode){
                $scope.customFormExists = true;
                $scope.trackedEntityForm = $scope.selectedProgramForRelative.dataEntryForm;  
                $scope.trackedEntityForm.attributes = $scope.attributes;
                $scope.trackedEntityForm.selectIncidentDatesInFuture = $scope.selectedProgramForRelative.selectIncidentDatesInFuture;
                $scope.trackedEntityForm.selectEnrollmentDatesInFuture = $scope.selectedProgramForRelative.selectEnrollmentDatesInFuture;
                $scope.trackedEntityForm.displayIncidentDate = $scope.selectedProgramForRelative.displayIncidentDate;
                $scope.customRegistrationForm = CustomFormService.getForTrackedEntity($scope.trackedEntityForm, 'RELATIONSHIP');
            }
            assignInheritance();
            getRules();                
        });
        
    }); 
            
    $scope.trackedEntities = {available: []};
    TEService.getAll().then(function(entities){
        $scope.trackedEntities.available = entities;   
        $scope.trackedEntities.selected = $scope.trackedEntities.available[0];
    });
    
    $scope.registerEntity = function(){
        
        //check for form validity
        $scope.outerForm.submitted = true;
        if( $scope.outerForm.$invalid ){
            return false;
        }
        
        //form is valid, continue the registration
        //get selected entity
        var selectedTrackedEntity = $scope.trackedEntities.selected.id; 
        if($scope.selectedProgramForRelative){
            selectedTrackedEntity = $scope.selectedProgramForRelative.trackedEntity.id;
        }
        
        //get tei attributes and their values
        //but there could be a case where attributes are non-mandatory and
        //registration form comes empty, in this case enforce at least one value
        $scope.selectedTei.trackedEntity = $scope.tei.trackedEntity = selectedTrackedEntity; 
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
                if($scope.selectedProgramForRelative){    
                    //enroll TEI
                    var enrollment = {};
                    enrollment.trackedEntityInstance = $scope.tei.trackedEntityInstance;
                    enrollment.program = $scope.selectedProgramForRelative.id;
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
                                var dhis2Events = EventUtils.autoGenerateEvents($scope.tei.trackedEntityInstance, $scope.selectedProgramForRelative, $scope.selectedOrgUnit, enrollment, null);
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
        
        if($scope.selectedProgram && $scope.selectedProgram.id){
            TrackerRulesExecutionService.executeRules($scope.allProgramRules, 'registration', null, null, null, $scope.selectedTei, $scope.selectedEnrollment, null, flag);
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
        var effectResult = TrackerRulesExecutionService.processRuleEffectAttribute('registration', $scope.selectedTei, $scope.tei, $scope.attributesById, $scope.hiddenFields, $scope.warningMessages);
        $scope.selectedTei = effectResult.selectedTei;
        $scope.hiddenFields = effectResult.hiddenFields;
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
