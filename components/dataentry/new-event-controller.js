
/* global trackerCapture, angular */

var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('EventCreationController',
        function ($scope,
                $modalInstance,
                $timeout,
                $translate,
                $filter,
                removeFuturePeriodFilter,
                DateUtils,
                DHIS2EventFactory,
                OrgUnitFactory,
                NotificationService,
                EventCreationService,
                RegistrationService,
                eventsByStage,
                stage,
                stages,
                allStages,
                tei,
                program,
                orgUnit,
                enrollment,                
                eventCreationAction,
                autoCreate,
                EventUtils,
                events,
                suggestedStage,
                selectedCategories,
                PeriodService,
                ModalService,
                CurrentSelection,
                $rootScope) {
    $scope.selectedOrgUnit = orgUnit;
    $scope.selectedEnrollment = enrollment;      
    $scope.stages = stages;
    $scope.allStages = allStages;
    $scope.events = events;
    $scope.eventCreationAction = eventCreationAction;
    $scope.eventCreationActions = EventCreationService.eventCreationActions;
    $scope.isNewEvent = (eventCreationAction === $scope.eventCreationActions.add);
    $scope.isScheduleEvent = (eventCreationAction === $scope.eventCreationActions.schedule || eventCreationAction === $scope.eventCreationActions.referral);
    $scope.isReferralEvent = (eventCreationAction === $scope.eventCreationActions.referral);
    $scope.model = {selectedStage: stage, dueDateInvalid: false, eventDateInvalid: false};
    $scope.stageSpecifiedOnModalOpen = angular.isObject(stage) ? true : false;
    $scope.suggestedStage = suggestedStage;
    $scope.selectedProgram = program;
    $scope.selectedCategories = selectedCategories;
    $scope.pleaseSelectLabel = $translate.instant('please_select');
    $scope.periodOffset = 0;
    $scope.referenceOffset = 0;
    $scope.periods = [];
    $scope.hasFuturePeriod = false;
    $scope.today = DateUtils.getToday();
    
    if( $scope.isScheduleEvent ){        
        $scope.stages = $filter('filter')(stages, {hideDueDate: false});
    }
    
    if( $scope.isScheduleEvent ){        
        $scope.stages = $filter('filter')(stages, {periodType: 'undefined'});
    }

    var dummyEvent = {};
    
    function prepareEvent(){
        
        dummyEvent = EventUtils.createDummyEvent(eventsByStage[stage.id], tei, program, stage, orgUnit, $scope.selectedEnrollment);
        
        $scope.newEvent = {programStage: stage};
        $scope.dhis2Event = {eventDate: $scope.isScheduleEvent ? '' : DateUtils.getToday(), dueDate: dummyEvent.dueDate, executionDateLabel : dummyEvent.executionDateLabel, name: dummyEvent.name, invalid: true};        

        if ($scope.model.selectedStage.periodType) {
            $scope.dhis2Event.eventDate = dummyEvent.dueDate;
            $scope.dhis2Event.periodName = dummyEvent.periodName;
            $scope.periods = dummyEvent.periods;
            $scope.periodOffset = angular.copy( dummyEvent.periodOffset );
            $scope.referenceOffset = angular.copy( dummyEvent.periodOffset );
            $scope.hasFuturePeriod = angular.copy( dummyEvent.hasFuturePeriod );
            $scope.dhis2Event.selectedPeriod = dummyEvent.periods[0];
            $scope.periods = PeriodService.managePeriods($scope.periods, $scope.isNewEvent);
        }
    };
    
    function suggestStage(){        
        var suggestedStage;
        var events = $scope.events;        
        var allStages = $scope.allStages;
        
        var availableStagesOrdered = $scope.stages.slice();
        availableStagesOrdered.sort(function (a,b){
            return a.sortOrder - b.sortOrder;
        });
        
        var stagesById = [];
        
        if((angular.isUndefined(events) || events.length === 0) && angular.isUndefined($scope.suggestedStage)){
            suggestedStage = availableStagesOrdered[0];
        }
        else{
            angular.forEach(allStages, function(stage){
                stagesById[stage.id] = stage;
            });
            
            var lastStageForEvents;
            
            if(angular.isUndefined($scope.suggestedStage)){
                for(var i = 0; i < events.length; i++){
                    var event = events[i];
                    var eventStage = stagesById[event.programStage];
                        if(i > 0){
                            if(eventStage.sortOrder > lastStageForEvents.sortOrder){
                                lastStageForEvents = eventStage;
                            }
                            else if(eventStage.sortOrder === lastStageForEvents.sortOrder){
                                if(eventStage.id !== lastStageForEvents.id){
                                    if(eventStage.displayName.localeCompare(lastStageForEvents.displayName) > 0){
                                        lastStageForEvents = eventStage;
                                    }
                                }                            
                            }
                        }
                        else {
                            lastStageForEvents = eventStage;
                        }
                }   
            }
            else {
                lastStageForEvents = $scope.suggestedStage;
            }

            
            for(var j = 0; j < availableStagesOrdered.length; j++){
                var availableStage = availableStagesOrdered[j];
                
                if( !availableStage || !availableStage.id ){
                    break;
                }
                
                if(availableStage.id === lastStageForEvents.id){
                    suggestedStage = availableStage;
                    break;
                }
                else if(availableStage.sortOrder === lastStageForEvents.sortOrder){
                    if(availableStage.displayName.localeCompare(lastStageForEvents.displayName) > 0){
                        suggestedStage = availableStage;
                        break;
                    }
                }
                else if(availableStage.sortOrder > lastStageForEvents.sortOrder){
                    suggestedStage = availableStage;
                    break;
                }
            }
            
            if(angular.isUndefined(suggestedStage)){
                suggestedStage = availableStagesOrdered[0];
            }
        }
        
        $scope.model.selectedStage = suggestedStage;
        stage = $scope.model.selectedStage;
    };
    
    if(!$scope.stageSpecifiedOnModalOpen){
        //suggest stage
        suggestStage();        
    }
    
    
    $scope.$watch('model.selectedStage', function(){       
        if(angular.isObject($scope.model.selectedStage)){
            stage = $scope.model.selectedStage;            
            prepareEvent();
            $scope.model.selectedStage.executionDateLabel = $scope.model.selectedStage.executionDateLabel ? $scope.model.selectedStage.executionDateLabel : $translate.instant('report_date');
            //If the caller wants to create right away, go ahead and save.
            if (autoCreate) {
                $scope.save();
            };
        }
    });    

    $scope.getCategoryOptions = function(){
        $scope.selectedOptions = [];
        for (var i = 0; i < $scope.selectedCategories.length; i++) {
            if ($scope.selectedCategories[i].selectedOption && $scope.selectedCategories[i].selectedOption.id) {
                $scope.selectedOptions.push($scope.selectedCategories[i].selectedOption.id);
            }
        }
    };

    $scope.save = function () {

        $scope.getCategoryOptions();
        
        //check for form validity
        $scope.eventCreationForm.submitted = true;        
        if( $scope.eventCreationForm.$invalid ){
            return false;
        }
        
        if($scope.isReferralEvent && !$scope.selectedSearchingOrgUnit){
            $scope.orgUnitError = true;
            return false;
        }        
        
        $scope.orgUnitError =  false;
        
        var newEvents = {events: []};
        var newEvent = {
            trackedEntityInstance: dummyEvent.trackedEntityInstance,
            program: dummyEvent.program,
            programStage: dummyEvent.programStage,
            enrollment: dummyEvent.enrollment,
            orgUnit: dummyEvent.orgUnit,
            notes: [],
            dataValues: [],
            status: 'ACTIVE'
        };
        
        if ($scope.model.selectedStage.periodType) {
            if( $scope.isNewEvent ){
                newEvent.eventDate = DateUtils.formatFromUserToApi( $scope.dhis2Event.selectedPeriod.endDate );
            }
            else{
                newEvent.dueDate = DateUtils.formatFromUserToApi( $scope.dhis2Event.selectedPeriod.endDate );
            }
        }
        else{
            if( $scope.isNewEvent ){
                newEvent.eventDate = DateUtils.formatFromUserToApi($scope.dhis2Event.eventDate);
            }
            else{
                newEvent.dueDate = DateUtils.formatFromUserToApi($scope.dhis2Event.dueDate);
            }
        }

        newEvent.status = newEvent.eventDate ? 'ACTIVE' : 'SCHEDULE';
        
        //for saving category combo
        if ($scope.selectedProgram.categoryCombo && !$scope.selectedProgram.categoryCombo.isDefault) {
            if ($scope.selectedOptions.length !== $scope.selectedCategories.length) {
                NotificationService.showNotifcationDialog($translate.instant("error"), $translate.instant("fill_all_category_options"));
                return;
            }
            newEvent.attributeCategoryOptions = $scope.selectedOptions.join(';');
        }

        newEvents.events.push(newEvent);
        DHIS2EventFactory.create(newEvents).then(function (response) {
            if (response && response.response && response.response.importSummaries[0].status === 'SUCCESS') {
                newEvent.event = response.response.importSummaries[0].reference;
                $modalInstance.close({dummyEvent: dummyEvent, ev: newEvent});
            } else {
                $scope.eventCreationForm.submitted = false;
            }
        });
    };

    //Start referral logic
    $scope.setSelectedSearchingOrgUnit = function(orgUnit){
        $scope.selectedSearchingOrgUnit = orgUnit;
        dummyEvent.orgUnit = orgUnit.id;
        dummyEvent.orgUnitName = orgUnit.displayName;
    };
    
    
    if(angular.isDefined(orgUnit) && angular.isDefined(orgUnit.id) && $scope.isReferralEvent){
        $scope.orgUnitsLoading = true;
        $timeout(function(){
            OrgUnitFactory.get(orgUnit.id).then(function(data){
                    orgUnit = data;
                    var url = generateFieldsUrl();
                    OrgUnitFactory.getOrgUnits(orgUnit.id,url).then(function(data){
                        if(data && data.organisationUnits && data.organisationUnits.length >0){
                            $scope.orgWithParents = data.organisationUnits[0];
                            var org = data.organisationUnits[0];
                            var orgUnitsById ={};
                            orgUnitsById[org.id] = org;
                            while(org.parent){
                                org.parent.childrenLoaded = true;
                                orgUnitsById[org.parent.id] = org.parent;
                                org.parent.show = true;
                                for(var i=0;i<org.parent.children.length;i++){
                                    angular.forEach(org.parent.children[i].children, function(child){
                                       if(!orgUnitsById[child.id]){
                                            orgUnitsById[child.id] =child; 
                                       }
                                    });
                                    if(org.parent.children[i].id===org.id){
                                        org.parent.children[i] = org;
                                        i= org.parent.children.length;
                                    }else{
                                        orgUnitsById[org.parent.children[i].id] = org.parent.children[i];
                                    }
                                }
                                org = org.parent;
                            }
                            $scope.orgUnits = [org];
                        }
                        $scope.orgUnitsLoading = false;
                    });
            });
            
        },350);
    }
    
    function generateFieldsUrl(){
        var fieldUrl = "fields=id,displayName,organisationUnitGroups[shortName],programs[id]";
        var parentStartDefault = ",parent[id,displayName,programs[id],children[id,displayName,programs[id],organisationUnitGroups[shortName],children[id,displayName,programs[id],organisationUnitGroups[shortName]]]";
        var parentEndDefault = "]";
        if(orgUnit.level && orgUnit.level > 1){
            var parentStart = parentStartDefault;
            var parentEnd = parentEndDefault;
            for(var i =0; i< orgUnit.level-2;i++){
                parentStart+= parentStartDefault;
                parentEnd +=parentStartDefault;
            }
            fieldUrl += parentStart;
            fieldUrl += parentEnd;
        }
        return fieldUrl;
    }
    
    $scope.expandCollapse = function(orgUnit) {
        orgUnit.show = !orgUnit.show;
        if(!orgUnit.childrenLoaded){
            OrgUnitFactory.getOrgUnits(orgUnit.id, "fields=id,path,programs[id],children[id,displayName,programs[id],level,children[id]]&paging=false").then(function(data){

                orgUnit.children = data.organisationUnits[0].children;
                orgUnit.childrenLoaded = true;
            });

            /*OrgUnitFactory.getChildren(orgUnit.id).then(function(data){
                orgUnit.children = data.children;
                orgUnit.childrenLoaded = true;
                
            });*/
        }
    };
    //end referral logic
    $scope.cancel = function () {
        $modalInstance.close();
    };
    
    $scope.interacted = function(field) {        
        var status = false;
        if(field){            
            status = $scope.eventCreationForm.submitted || field.$dirty;
        }
        return status;        
    };

    $scope.fetchPeriod = function (period) {
        if( !period ){
            return;
        }
        
        $scope.periodOffset = period === 'NEXT' ? $scope.periodOffset + 1 : $scope.periodOffset - 1;
        $scope.dhis2Event.selectedPeriod = null;
        
        var prds = PeriodService.getPeriods(eventsByStage[stage.id], $scope.model.selectedStage, $scope.selectedEnrollment, $scope.periodOffset);
        $scope.periods = prds && prds.availablePeriods ? prds.availablePeriods : [];
        $scope.dhis2Event.selectedPeriod = $scope.periods[0];
        $scope.hasFuturePeriod = prds.hasFuturePeriod;
        
        $scope.periods = PeriodService.managePeriods($scope.periods, $scope.isNewEvent);
    };

    $scope.onetimeReferral = function(){
        $scope.save();
    };
    
    $scope.movePermanently = function(){
        var modalOptions = {
            headerText: 'move_permanently',
            bodyText: 'are_you_sure_you_want_to_move_permanently'
        };             
        ModalService.showModal({},modalOptions).then(function(){
            $rootScope.$broadcast('changeOrgUnit', {orgUnit: dummyEvent.orgUnit});
           
            $scope.attributesById = CurrentSelection.getAttributesById();
            $scope.optionSets = CurrentSelection.getOptionSets();
            $scope.tei = CurrentSelection.get().tei;

            $scope.tei.orgUnit = dummyEvent.orgUnit;

            RegistrationService.registerOrUpdate($scope.tei, $scope.optionSets, $scope.attributesById).then(function (regResponse) {
                //Ensures that when you go back to "TEI Search" screen that a new search is executed.
                //Is necessary for updating the registring OrgUnit, because otherwise the system uses old cached data.
                var advancedSearchOptions = CurrentSelection.getAdvancedSearchOptions() !== null ? 
                    CurrentSelection.getAdvancedSearchOptions() : {};
                advancedSearchOptions.refresh = true;
                CurrentSelection.setAdvancedSearchOptions(advancedSearchOptions);
                
                $scope.save();
            });
        });
    };

    //Function for checking if a OrgUnit in the OrgUnit tree has the selected program, in that case a referral can be made.
    $scope.hasSelectedProgram = function(orgUnit) {
        if(orgUnit.hasSelectedProgram){
            return true;
        }else if(angular.isDefined(orgUnit.hasSelectedProgram)){
        	return false;
        }
        if(orgUnit.programs) {
            for(var i = 0; i < orgUnit.programs.length; i++) {
                if (orgUnit.programs[i].id === $scope.selectedProgram.id) {
                    orgUnit.hasSelectedProgram = true;
                    return true;
                }
            }
        }
        orgUnit.hasSelectedProgram = false;
        return false;
     };
});
