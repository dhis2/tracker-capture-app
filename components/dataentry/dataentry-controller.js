/* global angular, trackerCapture */

var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('DataEntryController',
        function ($rootScope,
                $scope,
                $modal,
                $filter,
                $log,
                $timeout,
                $translate,
                $window,
                $q,
                $parse,
                $location,
                CommonUtils,                
                DateUtils,
                EventUtils,
                orderByFilter,
                SessionStorageService,
                EnrollmentService,
                DHIS2EventFactory,
                ModalService,
                NotificationService,
                CurrentSelection,
                TrackerRulesExecutionService,
                CustomFormService,
                PeriodService,
                OptionSetService,
                AttributesFactory,
                TrackerRulesFactory,
                EventCreationService,
                AuthorityService) {
    
    //Unique instance id for the controller:
    $scope.instanceId = Math.floor(Math.random() * 1000000000);
    $scope.printForm = false;
    $scope.printEmptyForm = false;
    $scope.eventPageSize = 4;
    $scope.maxOptionSize = 30;
    $scope.eventPagingStart = 0;
    $scope.eventPagingEnd = $scope.eventPageSize;
    $scope.showAttributeCategoryOptions = false;
    
    //Data entry form
    $scope.outerDataEntryForm = {longitude: {}, latitude: {}};
    $scope.displayCustomForm = false;
    $scope.currentElement = {};
    $scope.schedulingEnabled = false;
    $scope.eventPeriods = [];
    $scope.currentPeriod = [];
    $scope.showEventsAsTables = false;
    //variable is set while looping through the program stages later.
    $scope.stagesCanBeShownAsTable = false;
    $scope.hiddenFields = [];
    $scope.assignedFields = [];
    $scope.errorMessages = {};
    $scope.warningMessages = {};
    $scope.hiddenSections = {};
    $scope.stagesNotShowingInStageTasks = {};
    $scope.tabularEntryStages = [];
    $scope.tableMaxNumberOfDataElements = 15;
    $scope.xVisitScheduleDataElement = false;
    $scope.reSortStageEvents = true;
    $scope.eventsLoaded = false;
    $scope.dashBoardWidgetFirstRun = true;
    $scope.showSelf = true;
    $scope.orgUnitNames = {};
    $scope.originalDate = '';
    
    var eventLockEnabled = false;
    var eventLockHours = 8; //Number of hours before event is locked after completing.

    $scope.useMainMenu = false;
    $scope.mainMenuStages = [];
    $scope.useBottomLine = false; 
    
    //hideTopLineEventsForFormTypes is only used with main menu
    $scope.hideTopLineEventsForFormTypes = {TABLE: true, COMPARE: true};
    $scope.timelineDataEntryModes = { DATAENTRYFORM: 1, COMPAREPREVIOUSDATAENTRYFORM: 2,COMPAREALLDATAENTRYFORM: 3, TABLEDATAENTRYFORM: 4};
    $scope.compareDataEntryFormModes = { PREVIOUS: 1, ALL: 2};
    $scope.visibleWidgetsInMainMenu = {enrollment: true, dataentry: true, close_file: true};    
    $rootScope.$broadcast('DataEntryMainMenuVisibilitySet', {visible: $scope.useMainMenu, visibleItems: $scope.visibleWidgetsInMainMenu});
    
    $scope.attributesById = CurrentSelection.getAttributesById();

    $scope.userAuthority = AuthorityService.getUserAuthorities(SessionStorageService.get('USER_PROFILE'));

    if(!$scope.attributesById){
        $scope.attributesById = [];
        AttributesFactory.getAll().then(function(atts){
            angular.forEach(atts, function(att){
                $scope.attributesById[att.id] = att;
            });
            
            CurrentSelection.setAttributesById($scope.attributesById);
        });
    }

    var modalCompleteIncompleteActions = { complete: 'complete', completeAndExit: 'completeandexit', completeEnrollment: 'completeenrollment', edit: 'edit'};

    //Labels
    $scope.dataElementLabel = $translate.instant('data_element');
    $scope.valueLabel = $translate.instant('value');
    $scope.providedElsewhereLabel = $translate.instant('provided_elsewhere');
    
    $scope.EVENTSTATUSCOMPLETELABEL = "COMPLETED";
    $scope.EVENTSTATUSSKIPPEDLABEL = "SKIPPED";
    $scope.EVENTSTATUSVISITEDLABEL = "VISITED";
    $scope.EVENTSTATUSACTIVELABEL = "ACTIVE";
    $scope.EVENTSTATUSSCHEDULELABEL = "SCHEDULE";
    $scope.validatedDateSetForEvent = {};
    $scope.eventCreationActions = EventCreationService.eventCreationActions;
    
    var userProfile = SessionStorageService.get('USER_PROFILE');
    var storedBy = userProfile && userProfile.username ? userProfile.username : '';

    var today = DateUtils.getToday();
    $scope.invalidDate = false;

    //note
    $scope.note = {};    
    
    $scope.eventStyles = [
        {color: 'custom-tracker-complete', description: 'completed', showInStageLegend: true, showInEventLegend: true},
        {color: 'alert-warning', description: 'executed', showInStageLegend: true, showInEventLegend: true},        
        {color: 'alert-success', description: 'ontime', showInStageLegend: true, showInEventLegend: true},
        {color: 'alert-danger', description: 'overdue', showInStageLegend: true, showInEventLegend: true},        
        {color: 'alert-default', description: 'skipped', showInStageLegend: false, showInEventLegend: true}/*,
        {color: '', description: 'empty', showInStageLegend: true, showInEventLegend: false}*/
    ];
 
    $scope.model= {};
    $scope.model.showLegend = false;
    $scope.model.showEventSearch = false;
    $scope.model.eventSearchText = '';
    
    $scope.filterLegend = function(){
        if($scope.mainMenuStageSelected()){
            return {showInEventLegend: true};
        }
        else {
            return {showInStageLegend: true};
        }
    };
    
    $scope.getLegendText = function(description){
        var useInStage = true;
        if($scope.mainMenuStageSelected()){
            useInStage = false;            
        }
        return $scope.getDescriptionTextForDescription(description, $scope.descriptionTypes.full, useInStage);
    };

    $scope.verifyExpiryDate = function(eventDateStr) {
        var dateGetter = $parse(eventDateStr);
        var dateSetter = dateGetter.assign;
        var date = dateGetter($scope);

        var modalOptions = {
            headerText: 'warning',
            bodyText: 'no_blank_date'
        };
        
        if(!date) {
            if(!$scope.originalDate) {
                $scope.currentEvent.eventDate = $scope.currentEventOriginal.eventDate;
            } else {
                $scope.currentEvent.eventDate = $scope.originalDate;
            }
            ModalService.showModal({}, modalOptions);
            return;
        } else {
            $scope.originalDate = eventDateStr;
        }

        if($scope.selectedProgram.expiryPeriodType && $scope.selectedProgram.expiryDays) {
            if (!DateUtils.verifyExpiryDate(date, $scope.selectedProgram.expiryPeriodType, $scope.selectedProgram.expiryDays)) {
                dateSetter($scope, null);
            }
        }
    };
    
    
    //listen for new events created
    $scope.$on('eventcreated', function (event, args) {
        //TODO: Sort this out:
        $scope.addNewEvent(args.event);
    });
    
    $scope.$on('teiupdated', function(event, args){
        var selections = CurrentSelection.get();        
        $scope.selectedTei = selections.tei;
        $scope.executeRules();
    });

    //listen for rule effect changes
    $scope.$on('ruleeffectsupdated', function (event, args) {
        if ($rootScope.ruleeffects[args.event]) {
            processRuleEffect(args.event, args.callerId);
        }
    });
    $scope.useReferral = false;
    $scope.showReferral = false;
    //Check if user is allowed to make referrals
    if($scope.useReferral){        
        $scope.showReferral = $scope.userAuthority.canSearchTeiAcrossAll;        
    }
    
    $scope.$watch("model.eventSearchText", function(newValue, oldValue){        
        if($scope.model.eventSearchText !== ''){
            $scope.currentEvent = null;
        }
    });
            
    $scope.print = function(divName){
        $scope.printForm = true;
        $scope.printEmptyForm = true;
        var printContents = document.getElementById(divName).innerHTML;
        var popupWin = window.open('', '_blank', 'fullscreen=1');
        popupWin.document.open();
        popupWin.document.write('<html>\n\
                                        <head>\n\
                                                <link rel="stylesheet" type="text/css" href="../dhis-web-commons/bootstrap/css/bootstrap.min.css" />\n\
                                                <link type="text/css" rel="stylesheet" href="../dhis-web-commons/javascripts/angular/plugins/select.css">\n\
                                                <link type="text/css" rel="stylesheet" href="../dhis-web-commons/javascripts/angular/plugins/select2.css">\n\
                                                <link rel="stylesheet" type="text/css" href="styles/style.css" />\n\
                                                <link rel="stylesheet" type="text/css" href="styles/print.css" />\n\
                                        </head>\n\
                                        <body onload="window.print()">' + printContents + 
                                '</html>');
        popupWin.document.close();
        $scope.printForm = false;
        $scope.printEmptyForm = false;
    };

    $scope.toggleCompForm = function() {
        if($scope.currentStage.timelineDataEntryMode !== $scope.timelineDataEntryModes.COMPAREALLDATAENTRYFORM) {
            $scope.currentStage.timelineDataEntryMode = $scope.timelineDataEntryModes.COMPAREALLDATAENTRYFORM;
        } else {
            $scope.currentStage.timelineDataEntryMode = $scope.timelineDataEntryModes.DATAENTRYFORM;
        }
        $scope.getDataEntryForm();
    };

    var processRuleEffect = function(event, callerId){
        //Establish which event was affected:
        var affectedEvent = $scope.currentEvent;
        if (!affectedEvent || !affectedEvent.event) {
            //The data entry widget does not have an event selected. 
            //Therefore applying rule effects from registration instead.
            affectedEvent = 'registration';
            return;
        }
        else if(event === 'registration' || event === 'dataEntryInit') {
           //The data entry widget is associated with an event, 
           //and therefore we do not want to process rule effects from the registration form
           return;
        }

        //In most cases the updated effects apply to the current event. In case the affected event is not the current event, fetch the correct event to affect:
        if (event !== affectedEvent.event) {
            angular.forEach($scope.allEventsSorted, function (searchedEvent) {
                if (searchedEvent.event === event) {
                    affectedEvent = searchedEvent;
                }
            });
        }

        $scope.assignedFields[event] = [];
        $scope.hiddenSections[event] = [];
        $scope.warningMessages[event] = [];
        $scope.errorMessages[event] = [];
        $scope.hiddenFields[event] = [];
        
        angular.forEach($rootScope.ruleeffects[event], function (effect) {
            //in the data entry controller we only care about the "hidefield", showerror and showwarning actions
            if (effect.action === "HIDEFIELD") {                    
                if (effect.dataElement) {

                    if(affectedEvent.status !== 'SCHEDULE' &&
                        affectedEvent.status !== 'SKIPPED' &&
                        !affectedEvent.editingNotAllowed) {
                        if (effect.ineffect && affectedEvent[effect.dataElement.id]) {
                            //If a field is going to be hidden, but contains a value, we need to take action;
                            if (effect.content) {
                                //TODO: Alerts is going to be replaced with a proper display mecanism.
                                alert(effect.content);
                            }
                            else {
                                //TODO: Alerts is going to be replaced with a proper display mecanism.
                                alert($scope.prStDes[effect.dataElement.id].dataElement.displayFormName + " was blanked out and hidden by your last action");
                            }

                            //Blank out the value:
                            affectedEvent[effect.dataElement.id] = "";
                            $scope.saveDataValueForEvent($scope.prStDes[effect.dataElement.id], null, affectedEvent, true);
                        }
                    }

                    if(effect.ineffect) {
                        $scope.hiddenFields[event][effect.dataElement.id] = true;
                    } 
                    else if( !$scope.hiddenFields[event][effect.dataElement.id]) {
                        $scope.hiddenFields[event][effect.dataElement.id] = false;
                    }
                    
                }
                else {
                    $log.warn("ProgramRuleAction " + effect.id + " is of type HIDEFIELD, bot does not have a dataelement defined");
                }
            } else if (effect.action === "SHOWERROR" 
                    || effect.action === "ERRORONCOMPLETE") {
                if (effect.ineffect) {
                    var message = effect.content + (effect.data ? effect.data : "");
                        
                    if(effect.dataElement && $scope.prStDes[effect.dataElement.id]) {
                        if(effect.action === "SHOWERROR") {
                            //only SHOWERROR messages is going to be shown in the form as the user works
                            $scope.errorMessages[event][effect.dataElement.id] = message;
                        }
                        $scope.errorMessages[event].push($translate.instant($scope.prStDes[effect.dataElement.id].dataElement.displayName) + ": " + message);
                    }
                    else
                    {
                        $scope.errorMessages[event].push(message);
                    }
                }
            } else if (effect.action === "SHOWWARNING" 
                    || effect.action === "WARNINGONCOMPLETE") {
                if (effect.ineffect) {
                    var message = effect.content + (effect.data ? effect.data : "");
                        
                    if(effect.dataElement && $scope.prStDes[effect.dataElement.id]) {
                        if(effect.action === "SHOWWARNING") {
                            //only SHOWWARNING messages is going to show up in the form as the user works
                            $scope.warningMessages[event][effect.dataElement.id] = message;
                        }
                        $scope.warningMessages[event].push($translate.instant($scope.prStDes[effect.dataElement.id].dataElement.displayName) + ": " + message);
                    } else {
                        $scope.warningMessages[event].push(message);
                    }
                }
            } else if (effect.action === "HIDESECTION"){                    
                if(effect.programStageSection){
                    if(effect.ineffect){
                        $scope.hiddenSections[event][effect.programStageSection] = true;
                    } else if (!$scope.hiddenSections[event][effect.programStageSection]) {
                        $scope.hiddenSections[event][effect.programStageSection] = false;
                    }
                }
                else {
                    $log.warn("ProgramRuleAction " + effect.id + " is of type HIDESECTION, bot does not have a section defined");
                }
            } else if (effect.action === "ASSIGN") {
                if(affectedEvent.status !== 'SCHEDULE' &&
                        affectedEvent.status !== 'SKIPPED' &&
                        !affectedEvent.editingNotAllowed) {
                    if(effect.ineffect && effect.dataElement) {
                        //For "ASSIGN" actions where we have a dataelement, we save the calculated value to the dataelement:
                        //Blank out the value:
                        var processedValue = $filter('trimquotes')(effect.data);

                        if($scope.prStDes[effect.dataElement.id].dataElement.optionSet) {
                            processedValue = OptionSetService.getName(
                                    $scope.optionSets[$scope.prStDes[effect.dataElement.id].dataElement.optionSet.id].options, processedValue);
                        }

                        processedValue = processedValue === "true" ? true : processedValue;
                        processedValue = processedValue === "false" ? false : processedValue;

                        affectedEvent[effect.dataElement.id] = processedValue;
                        $scope.assignedFields[event][effect.dataElement.id] = true;
                        
                        if(callerId === $scope.instanceId) {
                            $scope.saveDataValueForEvent($scope.prStDes[effect.dataElement.id], null, affectedEvent, true);
                        }
                    }
                }
            }
            else if (effect.action === "HIDEPROGRAMSTAGE") {
                if (effect.programStage) {
                    if($scope.stagesNotShowingInStageTasks[effect.programStage.id] !== effect.ineffect )
                    {
                        $scope.stagesNotShowingInStageTasks[effect.programStage.id] = effect.ineffect;
                    }
                }
                else {
                    $log.warn("ProgramRuleAction " + effect.id + " is of type HIDEPROGRAMSTAGE, bot does not have a stage defined");
                }
            }
        });
        
        updateTabularEntryStages();
    };
    
    function updateTabularEntryStages() {
        $scope.tabularEntryStages = [];
        angular.forEach($scope.programStages, function(programStage){
            if(!$scope.stagesNotShowingInStageTasks[programStage.id]
                    || ($scope.eventsByStage[programStage.id] && 
                    $scope.eventsByStage[programStage.id].length > 0)) {
                $scope.tabularEntryStages.push(programStage);
            }
        });
        $scope.tabularEntryStages = orderByFilter($scope.tabularEntryStages, '-sortOrder').reverse();
    };
    
    $scope.mainMenuStageSelected = function(){
        if(angular.isDefined($scope.selectedMainMenuStage) && !angular.equals({}, $scope.selectedMainMenuStage)){
            return true;
        }
        return false;
    };
    
    $scope.buildMainMenuStages = function(){
        $scope.mainMenuStages = [];
        angular.forEach($scope.programStages, function(stage){
            if((angular.isUndefined($scope.neverShowItems) || angular.isUndefined($scope.neverShowItems[stage.id]) || $scope.neverShowItems[stage.id] === false) &&
               (angular.isUndefined($scope.headerCombineStages) || angular.isUndefined($scope.headerCombineStages[stage.id]))){
                    $scope.mainMenuStages.push(stage);                    
               }
        });
    };
    
    $scope.openStageFromMenu = function(stage){    
        
        $scope.deSelectCurrentEvent();        
        $scope.selectedMainMenuStage = stage;
        var timelineFilter = stage.id;
        
        if(angular.isDefined($scope.headerCombineStages)){
            for(var key in $scope.headerCombineStages){
                if(key === stage.id){
                    timelineFilter += "," + $scope.headerCombineStages[key];
                }
                else if($scope.headerCombineStages[key] === stage.id){
                    timelineFilter += "," + key;
                }
            }
        }
        
        $scope.openStageEventFromMenu(stage, timelineFilter);
        
        $rootScope.$broadcast('DataEntryMainMenuItemSelected');
        
        $rootScope.$broadcast('DataEntryMainMenuVisibilitySet', {visible: false});
    };
    
    $scope.$on('DashboardBackClicked', function(event){
        $scope.backToMainMenu();
    });
    
    
    $scope.backToMainMenu = function(){
        $scope.selectedMainMenuStage = {};
        $scope.deSelectCurrentEvent();
        $rootScope.$broadcast('DataEntryMainMenuVisibilitySet', {visible: true, visibleItems: $scope.visibleWidgetsInMainMenu});
    };
    
    $scope.bottomLineItems = {};
    $scope.neverShowItems = {};
    $scope.topLineStageFilter = {};
    $scope.headerStages = [];
    $scope.headerCombineStages = {};
    
    $scope.getHeaderStages = function(){
        angular.forEach($scope.programStages, function(stage){
            if((angular.isUndefined($scope.bottomLineItems) || angular.isUndefined($scope.bottomLineItems[stage.id]) || $scope.bottomLineItems[stage.id] === false) && 
               (angular.isUndefined($scope.neverShowItems) || angular.isUndefined($scope.neverShowItems[stage.id]) || $scope.neverShowItems[stage.id] === false) &&
               (angular.isUndefined($scope.headerCombineStages) || angular.isUndefined($scope.headerCombineStages[stage.id]))){
                    $scope.headerStages.push(stage);                    
               }
        });
    };
    
    $scope.headerStagesWithoutCurrent = function(){        
        if($scope.headerStages.length > 0){
            if(angular.isDefined($scope.selectedMainMenuStage)){                
                var withoutCurrent = [];
                var currentStage = $scope.selectedMainMenuStage;
                if(angular.isDefined($scope.headerCombineStages) && $scope.headerCombineStages[$scope.selectedMainMenuStage.id]){                    
                    currentStage = $scope.stagesById[$scope.headerCombineStages[$scope.selectedMainMenuStage.id]];
                }
                
                angular.forEach($scope.headerStages, function(headerStage){
                    if(headerStage.id !== currentStage.id){
                        withoutCurrent.push(headerStage);
                    }
                });
                return withoutCurrent;
            }
            else {
                return $scope.headerStages;
            }
        }        
    };
    
    $scope.headerCurrentStageName = function(){
        
        var name = "";
        if($scope.selectedMainMenuStage && angular.isDefined($scope.selectedMainMenuStage.displayName)){
            name = $scope.selectedMainMenuStage.displayName;
            if(angular.isDefined($scope.headerCombineStages) && $scope.headerCombineStages[$scope.selectedMainMenuStage.id]){
                var stageWithName = $scope.stagesById[$scope.headerCombineStages[$scope.selectedMainMenuStage.id]];
                if(angular.isDefined(stageWithName) && angular.isObject(stageWithName)){
                    name = stageWithName.displayName;
                }
            }
        }        
        return name;
    };
    
    $scope.displayEventInTopLine = function(item) {
        if($scope.neverShowItems[item.id]) {
            return false;
        }
        if($scope.bottomLineItems[item.id]) {
            return false;
        }
        return true;
    };
    
    $scope.displayEventInBottomLine = function(item) {
        if($scope.neverShowItems[item.id]) {
            return false;
        }
        if($scope.bottomLineItems[item.id]) {
            return true;
        }
        return false;
    };
    
    function topLineEventsIsFiltered(){               
        if((angular.isDefined($scope.neverShowItems) && !angular.equals({},$scope.neverShowItems)) ||
           (angular.isDefined($scope.bottomLineItems) && !angular.equals({}, $scope.bottomLineItems)) ||
           (angular.isDefined($scope.topLineStageFilter) && !angular.equals({}, $scope.topLineStageFilter))){
            return true;
        }
        return false;
    }
    
    $scope.topLineEvents = [];
    function getTopLineEvents(allEvents){              
        if(!topLineEventsIsFiltered()){
            $scope.topLineEvents = $scope.allEventsSorted;
            return $scope.topLineEvents;
        }        
        else {
            $scope.topLineEvents = [];
            
            if(angular.isDefined($scope.topLineStageFilter) && !angular.equals({}, $scope.topLineStageFilter)){
                
                var filterStages = [];
                for(var key in $scope.topLineStageFilter){
                    filterStages.push($scope.stagesById[key]);
                }
                filterStages.sort(function(a,b){
                    return a.sortOrder - b.sortOrder;
                });
                
                angular.forEach(filterStages, function(filterStage){
                    var stageEvents = $scope.eventsByStage[filterStage.id];                    
                    $scope.topLineEvents = $scope.topLineEvents.concat(stageEvents);                    
                });            
            }
            else {
                var hiddenStages = [];
                if(angular.isDefined($scope.neverShowItems) && angular.isDefined($scope.bottomLineItems)){
                    hiddenStages = angular.extend({}, $scope.neverShowItems, $scope.bottomLineItems);
                }
                else if(angular.isDefined($scope.neverShowItems)){
                    hiddenStages = $scope.neverShowItems;
                }
                else if(angular.isDefined($scope.bottomLineItems)){
                    hiddenStages = $scope.bottomLineItems;
                }

                angular.forEach($scope.allEventsSorted, function(event){
                    if(!hiddenStages[event.programStage]){
                        $scope.topLineEvents.push(event);
                    }                
                });
            }
            
            return $scope.topLineEvents;
        }        
    }
    
    $scope.getTopLineEventsPage = function(){
        
        if($scope.allEventsSorted && $scope.allEventsSorted.length > 0){            
            var topLineEvents = getTopLineEvents($scope.allEventsSorted);            
            $scope.getEventPageForEvent($scope.currentEvent);
            return topLineEvents.slice($scope.eventPagingStart, $scope.eventPagingEnd);
        }
        return [];
    };
    
    $scope.isCompulsory = function(dataElement) {
        return $scope.currentStage.programStageDataElementsCollection[dataElement.id].compulsory;
    };

    $scope.allowDateInFuture = function(dataElement) {
        return $scope.currentStage.programStageDataElementsCollection[dataElement.id].allowFutureDate;
    };
    
    //check if field is hidden
    $scope.isHidden = function (id, event) {
        //In case the field contains a value, we cant hide it. 
        //If we hid a field with a value, it would falsely seem the user was aware that the value was entered in the UI.
        var EventToCheck = angular.isDefined(event) ? event : $scope.currentEvent;
        
        if (EventToCheck[id]) {
            return false;
        }
        else {            
            if(angular.isDefined($scope.hiddenFields[EventToCheck.event])){
                return $scope.hiddenFields[EventToCheck.event][id];
            }
            else {
                return false;
            }            
        }
    };

    $scope.executeRules = function () {        
        if (!$scope.currentEvent) {
            return;
        }
        
        var allSorted = [];
        for(var ps = 0; ps < $scope.programStages.length; ps++ ) {
            for(var e = 0; e < $scope.eventsByStage[$scope.programStages[ps].id].length; e++) {
                allSorted.push($scope.eventsByStage[$scope.programStages[ps].id][e]);
            }
        }
        allSorted = orderByFilter(allSorted, '-sortingDate').reverse();
        
        var evs = {all: allSorted, byStage: $scope.eventsByStage};
        
        var flag = {debug: true, verbose: false, callerId: $scope.instanceId};
        
        //If the events is displayed in a table, it is necessary to run the rules for all visible events.        
        if ($scope.currentStage && $scope.currentStage.displayEventsInTable && angular.isUndefined($scope.currentStage.rulesExecuted)) {
            angular.forEach($scope.currentStageEvents, function (event) {
                TrackerRulesExecutionService.executeRules($scope.allProgramRules, event, evs, $scope.prStDes, $scope.attributesById, $scope.selectedTei, $scope.selectedEnrollment, $scope.optionSets, flag);
                $scope.currentStage.rulesExecuted = true;
            });
        } else {
            TrackerRulesExecutionService.executeRules($scope.allProgramRules, $scope.currentEvent, evs, $scope.prStDes, $scope.attributesById, $scope.selectedTei, $scope.selectedEnrollment, $scope.optionSets, flag);
        }
    };


    //listen for the selected items
    $scope.$on('dashboardWidgets', function () {
        $scope.showDataEntryDiv = false;
        $scope.showEventCreationDiv = false;
        $scope.currentEvent = null;
        $scope.currentStage = null;
        $scope.currentStageEvents = null;
        $scope.totalEvents = 0;
        $scope.eventsLoaded = false;
        $scope.stageStyleLabels = [];
        $scope.eventStyleLabels = [];

        $scope.allowEventCreation = false;
        $scope.repeatableStages = [];
        $scope.eventsByStage = [];
        $scope.eventsByStageDesc = [];
        $scope.programStages = [];
        $scope.tabularEntryStages = [];
        $rootScope.ruleeffects = {};        
        $scope.prStDes = [];
        $scope.allProgramRules = [];
        $scope.allowProvidedElsewhereExists = [];
        $scope.optionsReady = false;
        
        var selections = CurrentSelection.get();
            $scope.selectedOrgUnit = selections.orgUnit;
            $scope.selectedEntity = selections.tei;
            $scope.selectedProgram = selections.pr;
            $scope.selectedEnrollment = selections.selectedEnrollment;
            
            var ouNames = CurrentSelection.getOrgUnitNames();            
            ouNames[$scope.selectedOrgUnit.id] = $scope.selectedOrgUnit.displayName;
            CurrentSelection.setOrgUnitNames( ouNames );

            $scope.showSelf = true;
            if(angular.isUndefined($scope.selectedEnrollment) || $scope.selectedEnrollment === null || ($scope.dashBoardWidgetFirstRun && $scope.selectedEnrollment.status === "COMPLETED")){
                //onOpenEnrollment
                $scope.showSelf = false;
            }

            $rootScope.$broadcast('BeforeOpenEnrollment', $scope.showSelf);
            $scope.dashBoardWidgetFirstRun = false;
        
    	    $scope.optionSets = selections.optionSets;

    	    $scope.stagesById = [];    	    
    	    if ($scope.selectedOrgUnit && $scope.selectedProgram && $scope.selectedProgram.id && $scope.selectedEntity ){
                if ($scope.selectedOrgUnit.reportDateRange) {
                    if ($scope.selectedOrgUnit.reportDateRange.minDate) {
                        $scope.model.minDate = $scope.selectedOrgUnit.reportDateRange.minDate;
                    }
                    if ($scope.selectedOrgUnit.reportDateRange.maxDate) {
                        $scope.model.maxDate = $scope.selectedOrgUnit.reportDateRange.maxDate;
                    }
                }
                
                $scope.programStages = $scope.tabularEntryStages = $scope.selectedProgram.programStages;
                
                angular.forEach($scope.selectedProgram.programStages, function (stage) {
                    if (stage.openAfterEnrollment) {
                        $scope.currentStage = stage;
                    }

                    stage.programStageDataElementsCollection = {};

                    stage.executionDateLabel = stage.executionDateLabel ? stage.executionDateLabel : $translate.instant('report_date');
                    stage.dueDateLabel = stage.dueDateLabel ? stage.dueDateLabel : $translate.instant('due_date');
                    angular.forEach(stage.programStageDataElements, function (prStDe) {
                        $scope.prStDes[prStDe.dataElement.id] = prStDe;
                        if(prStDe.allowProvidedElsewhere){
                            $scope.allowProvidedElsewhereExists[stage.id] = true;
                        }

                        stage.programStageDataElementsCollection[prStDe.dataElement.id] = prStDe;
                    });

                    $scope.stagesById[stage.id] = stage;
                    $scope.eventsByStage[stage.id] = [];

                    //If one of the stages has less than $scope.tableMaxNumberOfDataElements data elements, allow sorting as table:
                    if ($scope.stageCanBeShownAsTable(stage)) {
                        $scope.stagesCanBeShownAsTable = true;
                    }
                });

                $scope.programStages = orderByFilter($scope.programStages, '-sortOrder').reverse();
                if (!$scope.currentStage) {
                    $scope.currentStage = $scope.programStages[0];
                }

                $scope.setCurrentStage($scope.currentStage);                

                if($scope.useMainMenu){
                    $scope.buildMainMenuStages();
                }

                $scope.setDisplayTypeForStages();
                $scope.getHeaderStages();

                $scope.selectedCategories = [];
                if($scope.selectedProgram.categoryCombo && 
                        !$scope.selectedProgram.categoryCombo.isDefault &&
                        $scope.selectedProgram.categoryCombo.categories){
                    $scope.selectedCategories = $scope.selectedProgram.categoryCombo.categories;                    
                }
                else{
                    $scope.optionsReady = true;
                }

                TrackerRulesFactory.getRules($scope.selectedProgram.id).then(function(rules){
                    $scope.allProgramRules = rules;
                    $scope.getEvents();
                    broadcastDataEntryControllerData();
                });    	        
    	    }
        });

    $scope.openEventExternal = function(event){
        if($scope.useMainMenu){
            var stage = $scope.stagesById[event.programStage];
            $scope.openStageFromMenu(stage);
        }else{
            $scope.showDataEntry(event, true, true);
        }
    };
    
    $scope.deleteScheduleAndOverdueEvents = function(){
        var promises = [];
        for(var i = 0; i < $scope.programStages.length; i++ ) {
            for(var e = 0; e < $scope.eventsByStage[$scope.programStages[i].id].length; e++) {
                if($scope.eventsByStage[$scope.programStages[i].id][e].status ==='SCHEDULE' || $scope.eventsByStage[$scope.programStages[i].id][e].status ==='OVERDUE'){
                    promises.push(DHIS2EventFactory.delete($scope.eventsByStage[$scope.programStages[i].id][e]));
                }
            }
        }
        
        return $q.all(promises);
    };
    
    function broadcastDataEntryControllerData(){
        $rootScope.$broadcast('dataEntryControllerData', {programStages: $scope.programStages, eventsByStage: $scope.eventsByStage, addNewEvent: $scope.addNewEvent, openEvent: $scope.openEventExternal, deleteScheduleOverDueEvents: $scope.deleteScheduleAndOverdueEvents, executeRules: $scope.executeRules });
    }
    
    $scope.getEvents = function () {

        $scope.allEventsSorted = [];
        var events = CurrentSelection.getSelectedTeiEvents();        
        events = $filter('filter')(events, {program: $scope.selectedProgram.id});
        if (angular.isObject(events) && events.length > 0) {
            angular.forEach(events, function (dhis2Event) {
                if ($scope.selectedEnrollment && $scope.selectedEnrollment.enrollment === dhis2Event.enrollment && dhis2Event.orgUnit) {
                    if (dhis2Event.notes) {
                        dhis2Event.notes = orderByFilter(dhis2Event.notes, '-storedDate');
                        angular.forEach(dhis2Event.notes, function (note) {
                            note.displayDate = DateUtils.formatFromApiToUser(note.storedDate);
                            note.storedDate = DateUtils.formatToHrsMins(note.storedDate);
                        });
                    }
                    var eventStage = $scope.stagesById[dhis2Event.programStage];
                    if (angular.isObject(eventStage)) {
                        dhis2Event.name = eventStage.displayName;
                        dhis2Event.executionDateLabel = eventStage.executionDateLabel ? eventStage.executionDateLabel : $translate.instant('report_date');
                        dhis2Event.dueDateLabel = eventStage.dueDateLabel ? eventStage.dueDateLabel : $translate.instant('due_date');
                        dhis2Event.dueDate = DateUtils.formatFromApiToUser(dhis2Event.dueDate);
                        dhis2Event.sortingDate = dhis2Event.dueDate;

                        if (dhis2Event.eventDate) {                            
                            dhis2Event.eventDate = DateUtils.formatFromApiToUser(dhis2Event.eventDate);
                            dhis2Event.sortingDate = dhis2Event.eventDate;                            
                        }
                        
                        dhis2Event.editingNotAllowed = EventUtils.getEditingStatus(dhis2Event, eventStage, $scope.selectedOrgUnit, $scope.selectedTei, $scope.selectedEnrollment);
                        
                        dhis2Event.statusColor = EventUtils.getEventStatusColor(dhis2Event);
                        dhis2Event = EventUtils.processEvent(dhis2Event, eventStage, $scope.optionSets, $scope.prStDes);
                        $scope.eventsByStage[dhis2Event.programStage].push(dhis2Event);
                        
                        if ($scope.currentStage && $scope.currentStage.id === dhis2Event.programStage) {
                            $scope.currentEvent = dhis2Event;
                        }
                    }
                    
                    $scope.allEventsSorted.push(dhis2Event);
                }
            });
            
            $scope.orgUnitNames = CurrentSelection.getOrgUnitNames();
            $scope.fileNames = CurrentSelection.getFileNames();
            $scope.allEventsSorted = orderByFilter($scope.allEventsSorted, '-sortingDate').reverse();
            sortEventsByStage(null);
            $scope.showDataEntry($scope.currentEvent, true, true);
            $scope.eventsLoaded = true;
        }
        else {
            //There is no events - so loading is finished:
            $scope.eventsLoaded = true;
        }
    };

    $scope.enableRescheduling = function () {
        $scope.schedulingEnabled = !$scope.schedulingEnabled;
    };

    $scope.stageCanBeShownAsTable = function (stage) {
        if (stage.programStageDataElements 
                && stage.programStageDataElements.length <= $scope.tableMaxNumberOfDataElements
                && stage.repeatable) {
            return true;
        }
        return false;
    };

    $scope.toggleEventsTableDisplay = function () {       
        $scope.showEventsAsTables = !$scope.showEventsAsTables;                

        $scope.setDisplayTypeForStages();

        
        if ($scope.currentStage && $scope.stageCanBeShownAsTable($scope.currentStage)) {
            //If the current event was deselected, select the first event in the current Stage before showing data entry:
            if(!$scope.currentEvent.event 
                    && $scope.eventsByStage[$scope.currentStage.id]) {
                $scope.currentEvent = $scope.eventsByStage[$scope.currentStage.id][0];
            }
            
            $scope.getDataEntryForm();
        } 
    };
    
    $scope.setDisplayTypeForStages = function(){
        angular.forEach($scope.programStages, function (stage) {
            $scope.setDisplayTypeForStage(stage);
        });
    };
    
    $scope.setDisplayTypeForStage = function(stage){
        if ($scope.stageCanBeShownAsTable(stage)) {
            stage.displayEventsInTable = $scope.showEventsAsTables;
        }
    };
    
    $scope.stageNeedsEventErrors = {enrollment: 1, complete: 2, scheduleDisabled: 3, scheduledFound: 4, notRepeatable: 5};
    
    $scope.stageNeedsEventOfType = function (stage, type, completeRequired, errorResponseContainer) {
        
        if(type === $scope.eventCreationActions.schedule || type === $scope.eventCreationActions.referral){
            if(stage.hideDueDate === true){
                if(angular.isDefined(errorResponseContainer)){
                    errorResponseContainer.errorCode = $scope.stageNeedsEventErrors.scheduleDisabled;
                }                
                return false;
            }
        }
        
        return $scope.stageNeedsEvent(stage, completeRequired, errorResponseContainer);
    };
    
    $scope.stageNeedsEvent = function (stage, completeRequired, errorResponseContainer) {
        
        if(!stage){
            return false;
        }
        
        var calculatedCompleteRequired = (angular.isDefined(completeRequired) && completeRequired) || (angular.isDefined(stage.onlyOneIncompleteEvent) && stage.onlyOneIncompleteEvent);
        
        if($scope.selectedEnrollment && $scope.selectedEnrollment.status === 'ACTIVE'){
            if(!stage){
                if(!$scope.allEventsSorted || $scope.allEventsSorted.length === 0){
                    return true;
                }
                for(var key in $scope.eventsByStage){
                    stage = $scope.stagesById[key];
                    if(stage && stage.repeatable){
                        for (var j = 0; j < $scope.eventsByStage[stage.id].length; j++) {
                            if (!$scope.eventsByStage[stage.id][j].eventDate && $scope.eventsByStage[stage.id][j].status !== 'SKIPPED') {
                                return true;
                            }
                        }
                        return true;
                    }
                }
                return false;
            }

            //In case the event is a table, we sould always allow adding more events(rows)
            if (stage.displayEventsInTable) {
                return true;
            }
            
            if ($scope.eventsByStage[stage.id].length === 0) {
                return true;
            }
            
            if (stage.repeatable) {
                for (var j = 0; j < $scope.eventsByStage[stage.id].length; j++) {
                    if(angular.isDefined(calculatedCompleteRequired) && calculatedCompleteRequired === true){
                        var foundEvent = $scope.eventsByStage[stage.id][j];
                        if(foundEvent.status !== $scope.EVENTSTATUSCOMPLETELABEL && foundEvent.status !== $scope.EVENTSTATUSSKIPPEDLABEL){
                            if(angular.isDefined(errorResponseContainer)){
                                errorResponseContainer.errorCode = $scope.stageNeedsEventErrors.complete;
                            }
                            return false;
                        }                            
                    }
                    else if (!$scope.eventsByStage[stage.id][j].eventDate && $scope.eventsByStage[stage.id][j].status !== 'SKIPPED') {
                        if(angular.isDefined(errorResponseContainer)){
                            errorResponseContainer.errorCode = $scope.stageNeedsEventErrors.scheduledFound;
                        }
                        return false;
                    }
                }
                return true;
            }
            else{
                if(angular.isDefined(errorResponseContainer)){
                    errorResponseContainer.errorCode = $scope.stageNeedsEventErrors.notRepeatable;
                }
                return false;
            }
        }
        
        if(angular.isDefined(errorResponseContainer)){
            errorResponseContainer.errorCode = $scope.stageNeedsEventErrors.enrollment;
        }
        return false;
    };
    
    $scope.creatableStagesExist = function(stageList) {
        if(stageList && stageList.length > 0) {
            return true;
        }
        
        return false;
    };
    
    $scope.getTopLineColumnStyle = function(colNr){
        if($scope.useMainMenu && ($scope.topLineEvents.length === 0 || $scope.hideTopLineEventsForFormTypes[$scope.displayCustomForm])){
            if(colNr === 1){
                return 'col-xs-12';
            }
            else {
                return '';
            }
        }
        else if($scope.showStageTasks){
            if(colNr === 1){
                return $scope.selectedEnrollment.status !== 'ACTIVE' ? 'col-xs-12' : 'col-xs-6 col-sm-9';
            }
            else {
                return 'col-xs-6 col-sm-3';
            }
        }
        else {
            if(colNr === 1){
                return $scope.selectedEnrollment.status !== 'ACTIVE' ? 'col-xs-12' : 'col-xs-10 col-sm-11';
            }
            else {
                return 'col-xs-2 col-sm-1';
            }
        }        
    };    
    
    $scope.displayStageTasksInTopLine = function(stage) {
        if($scope.stagesNotShowingInStageTasks[stage.id]){
            return false;
        }   
        
        return $scope.stageNeedsEvent(stage);
    };
    
    $scope.showStageTasks = false;
    $scope.toggleShowStageTasks = function(){
        $scope.showStageTasks = !$scope.showStageTasks;
    };
    
    $scope.addNewEvent = function(newEvent,setProgramStage) {
        //Have to make sure the event is preprocessed - this does not happen unless "Dashboardwidgets" is invoked.
        newEvent = EventUtils.processEvent(newEvent, $scope.stagesById[newEvent.programStage], $scope.optionSets, $scope.prStDes);
        if(setProgramStage) $scope.currentStage = $scope.stagesById[newEvent.programStage];
        $scope.eventsByStage[newEvent.programStage].push(newEvent);
        sortEventsByStage('ADD', newEvent);
        broadcastDataEntryControllerData();
    };
    
    function getApplicableStagesForStageTasks(){
        
        if(angular.isUndefined($scope.stagesNotShowingInStageTasks)){
            return $scope.programStages;
        }
        else {
            var applicableStages = [];
            angular.forEach($scope.programStages, function(stage){
                if(!$scope.stagesNotShowingInStageTasks[stage.id]){
                    applicableStages.push(stage);
                }
            });
            return applicableStages;
        }
    }
    
    $scope.stageErrorInEventLayout = [];
    $scope.showCreateEventIfStageNeedsEvent = function(stage, eventCreationAction, requireStageEventsToBeCompleted, showModalOnNoEventsNeeded){

        
        showModalOnNoEventsNeeded = angular.isDefined(showModalOnNoEventsNeeded) && showModalOnNoEventsNeeded === true ? true : false;
        var errorResponseContainer = {};
        
        if($scope.stageNeedsEventOfType(stage, eventCreationAction, requireStageEventsToBeCompleted, errorResponseContainer)){
            if(!showModalOnNoEventsNeeded){
                $scope.stageErrorInEventLayout[stage.id] = "";
            }            
            $scope.showCreateEvent(stage, eventCreationAction);
        }
        else {
            if(showModalOnNoEventsNeeded){
                var errorMessage = "";
                if(angular.isDefined(errorResponseContainer.errorCode)){

                    switch(errorResponseContainer.errorCode){
                        case $scope.stageNeedsEventErrors.enrollment:
                            errorMessage = $translate.instant('enrollment_is_not_active');
                            break;
                        case $scope.stageNeedsEventErrors.complete:
                            errorMessage = $translate.instant('please_complete_all_events');
                            break;                    
                        case $scope.stageNeedsEventErrors.scheduleDisabled:
                            errorMessage = $translate.instant('scheduling_disabled_for_programstage');
                            break;
                        case $scope.stageNeedsEventErrors.scheduledFound:
                            errorMessage = $translate.instant('event_already_scheduled');
                            break;                    
                        case $scope.stageNeedsEventErrors.notRepeatable:
                            errorMessage = $translate.instant('programstage_multiple_events_disabled');
                            break;
                        default:
                            break;                    
                    }
                }
                var headerText = $translate.instant('event_cant_be_created');
                var bodyText = errorMessage;
                NotificationService.showNotifcationDialog(headerText, bodyText);

            }
            else {
                $scope.stageErrorInEventLayout[stage.id] = eventCreationAction;
            }
        }
    };
    
    $scope.showCreateEvent = function (stage, eventCreationAction, suggestedStage) {        
        
        var availableStages = [];
        if(!stage){
            
            //get applicable events
            var allApplicableEvents = [];
            if(!$scope.allEventsSorted || $scope.allEventsSorted.length === 0){
                
            }
            else if(angular.isUndefined($scope.stagesNotShowingInStageTasks)){
                allApplicableEvents = $scope.allEventsSorted.slice();
            }
            else {
                angular.forEach($scope.allEventsSorted, function(event){
                    if(angular.isUndefined($scope.stagesNotShowingInStageTasks[event.programStage])){
                        allApplicableEvents.push(event);
                    }
                }); 
            }         
            
            var applicableStages = getApplicableStagesForStageTasks();           
            
            if(allApplicableEvents.length === 0 && applicableStages.length > 0){                               
                availableStages = applicableStages;
            }
            else{
                angular.forEach(applicableStages, function(stage){
                    if($scope.stageNeedsEvent(stage)){
                        availableStages.push(stage);
                    }
                });
            }           
            if(availableStages.length === 0) {
                var headerText = $translate.instant("error");
                var bodyText = $translate.instant("no_stages_available");
                NotificationService.showNotifcationDialog(headerText, bodyText);
                return;
            }
        }
        var autoCreate = stage && stage.displayEventsInTable ? stage.displayEventsInTable : false;
        EventCreationService.showModal($scope.eventsByStage, stage, availableStages, $scope.programStages, $scope.selectedEntity, $scope.selectedProgram, $scope.selectedOrgUnit, $scope.selectedEnrollment, autoCreate, eventCreationAction, allApplicableEvents,suggestedStage, $scope.selectedCategories)
                .then(function (eventContainer) {
                    if(angular.isDefined(eventContainer)){                
                        var ev = eventContainer.ev;
                        var dummyEvent = eventContainer.dummyEvent;      

                        if (angular.isObject(ev) && angular.isObject(dummyEvent)) {

                            var newEvent = ev;
                            newEvent.orgUnitName = dummyEvent.orgUnitName;
                            newEvent.name = dummyEvent.name;
                            newEvent.executionDateLabel = dummyEvent.executionDateLabel;
                            newEvent.dueDateLabel = dummyEvent.dueDateLabel;
                            newEvent.sortingDate = ev.eventDate ? ev.eventDate : ev.dueDate,
                            newEvent.statusColor = EventUtils.getEventStatusColor(ev);
                            newEvent.eventDate = DateUtils.formatFromApiToUser(ev.eventDate);
                            newEvent.dueDate = DateUtils.formatFromApiToUser(ev.dueDate);
                            newEvent.enrollmentStatus = dummyEvent.enrollmentStatus;

                            if (dummyEvent.coordinate) {
                                newEvent.coordinate = {};
                            }


                            $scope.addNewEvent(newEvent, true);
                            
                            $scope.currentEvent = null;
                            $scope.showDataEntry(newEvent, true, true);

                        }
                    }
                }, function () {
            });
    };

    $scope.setCurrentStage = function(stage, openDataEntry){
        if (!stage) {
            return;
        }
        $scope.currentStage = stage;
        $scope.currentEvent = null;
        $scope.eventGridColumns = EventUtils.getGridColumns($scope.currentStage, $scope.prStDes);
        if( $scope.eventsByStage[stage.id].length === 1 ){
            $scope.currentEvent = $scope.eventsByStage[stage.id][0];
        }
        
        $scope.showAttributeCategoryOptions = false;

        if( openDataEntry ){
            $scope.getDataEntryForm();
        }
    };

    $scope.showDataEntry = function (event, suppressToggling, resetStage) {
        if (event) {
            if ($scope.currentEvent && !suppressToggling && $scope.currentEvent.event === event.event &&
                $scope.currentStage.programStageDataElements.length > 5) {
                //clicked on the same stage, do toggling
                $scope.deSelectCurrentEvent(resetStage);
            }
            else {
                $scope.currentElement = {};                
                $scope.currentEvent = event;
                
                var index = -1;
                for (var i = 0; i < $scope.eventsByStage[event.programStage].length && index === -1; i++) {
                    if ($scope.eventsByStage[event.programStage][i].event === event.event) {
                        index = i;
                    }
                }                
                if(index !== -1){
                    $scope.currentEvent = $scope.eventsByStage[event.programStage][index];                    
                }
                
                $scope.showDataEntryDiv = true;
                $scope.showEventCreationDiv = false;

                if ($scope.currentEvent.notes) {
                    angular.forEach($scope.currentEvent.notes, function (note) {
                        note.displayDate = DateUtils.formatFromApiToUser(note.storedDate);
                        note.storedDate = DateUtils.formatToHrsMins(note.storedDate);
                    });

                    if ($scope.currentEvent.notes.length > 0) {
                        $scope.currentEvent.notes = orderByFilter($scope.currentEvent.notes, '-storedDate');
                    }
                }
                
                $scope.getDataEntryForm();
            }
        }
    };
    
    $scope.deSelectCurrentEvent = function(resetStage){
        if( resetStage ){
            $scope.currentStage = null;
        }
        $scope.currentEvent = null;
        $scope.currentElement = {id: '', saved: false};
        $scope.showDataEntryDiv = !$scope.showDataEntryDiv;
    };
    
    $scope.tableRowIsEditable = function(eventRow){
        if( eventRow === $scope.currentEvent &&
            eventRow.status !== $scope.EVENTSTATUSCOMPLETELABEL &&
            eventRow.status !== $scope.EVENTSTATUSSKIPPEDLABEL &&
            $scope.tableEditMode !== $scope.tableEditModes.form){
            
            return true;
        }
        return false;
    };
    
    $scope.tableRowStatusButtonsEnabled = function(event){
        return event.orgUnit === $scope.selectedOrgUnit.id && $scope.selectedEntity.inactive === false && $scope.selectedEnrollment.status === 'ACTIVE';
    };
    
    $scope.tableEditModes = { form: 0, table: 1, tableAndForm: 2 };
    $scope.tableEditMode = $scope.tableEditModes.table;
    
    $scope.toggleTableEditMode = function(){        
        $scope.tableEditMode = $scope.tableEditMode === $scope.tableEditModes.tableAndForm ? $scope.tableEditModes.form : $scope.tableEditModes.tableAndForm;
    };
    
    $scope.eventRowChanged = false;
    $scope.eventRowClicked = function(event){        
        
        if($scope.currentEvent !== event){
            $scope.eventRowChanged = true;
            $scope.switchToEventRow(event);
        }
        else {
            $scope.eventRowChanged = false;
        }        
         
        if($scope.tableEditMode === $scope.tableEditModes.form){
            $scope.openEventEditFormModal(event);
        }
        
    };
    
    $scope.eventRowDblClicked = function(event){
                
        if($scope.currentEvent === event &&
           $scope.tableEditMode === $scope.tableEditModes.tableAndForm &&
           $scope.eventRowChanged === false){           
            $scope.openEventEditFormModal(event);
        }
    };
        
    $scope.openEventEditFormModal = function(event){

        var stage = $scope.stagesById[event.programStage];        
        if( stage && stage.id ){
            event.editingNotAllowed = EventUtils.getEditingStatus(event, stage, $scope.selectedOrgUnit, $scope.selectedTei, $scope.selectedEnrollment);
        }        
        
        $scope.eventEditFormModalInstance = modalInstance = $modal.open({
            templateUrl: 'components/dataentry/modal-default-form.html',
            scope: $scope           
        });

        $scope.eventEditFormModalInstance.result.then(function (status) {                        
            //completed, deleted or skipped
            $scope.currentEvent = {};            
        }, function(){
            //closed            
        });
    };
    
    $scope.switchToEventRowDeselected = function(event){
        if($scope.currentEvent !== event) {
            $scope.showDataEntry(event,false, true);
        }
        $scope.currentEvent = {};
    };
    
    $scope.switchToEventRow = function (event) {
        if($scope.currentEvent !== event) {
            $scope.reSortStageEvents = false;
            $scope.showDataEntry(event,false, true);
            $scope.reSortStageEvents = true;
        }
    };

    $scope.switchDataEntryForm = function () {
        $scope.displayCustomForm = !$scope.displayCustomForm;
    };
    
    $scope.buildOtherValuesLists = function () {
        var otherValues = {};
        //Only default forms need to build an other values list.
        if($scope.displayCustomForm === "DEFAULT" || $scope.displayCustomForm === false) {
            //Build a list of datavalues OUTSIDE the current event. 
            angular.forEach($scope.currentStage.programStageDataElements, function(programStageDataElement) {
                angular.forEach($scope.programStages, function(stage) {
                    for(var i = 0; i < $scope.eventsByStage[stage.id].length; i++) {
                        //We are not interested in the values from the current stage:
                        if($scope.eventsByStage[stage.id][i] !== $scope.currentEvent) {
                            var currentId = programStageDataElement.dataElement.id;
                            if ( $scope.eventsByStage[stage.id][i][currentId] ) {
                                //The current stage has a dataelement of the type in question

                                //Init the list if not already done:
                                if(!otherValues[currentId]) {
                                    otherValues[currentId] = [];
                                }
                                
                                //Decorate and push the alternate value to the list:
                                
                                var alternateValue = $scope.eventsByStage[stage.id][i][currentId];                                
                                alternateValue = CommonUtils.displayBooleanAsYesNo(alternateValue, programStageDataElement.dataElement);
                                

                                //Else decorate with the event date:
                                alternateValue = $scope.eventsByStage[stage.id][i].eventDate + ': ' + alternateValue;
                                otherValues[currentId].push(alternateValue);
                            }
                        }
                    }
                });
            });
        }
        
        return otherValues;
    };
    
    $scope.getDataEntryForm = function () {
        $scope.showAttributeCategoryOptions = false;
        $scope.currentFileNames = $scope.fileNames ? ($scope.fileNames[$scope.currentEvent.event] ? $scope.fileNames[$scope.currentEvent.event] : []) : [];
        $scope.currentStage = $scope.stagesById[$scope.currentEvent.programStage];
        $scope.currentStageEvents = $scope.eventsByStage[$scope.currentEvent.programStage];       

        angular.forEach($scope.currentStage.programStageSections, function (section) {
            section.open = true;
        });
        
        $scope.setDisplayTypeForStage($scope.currentStage);
        $scope.customDataEntryForm = CustomFormService.getForProgramStage($scope.currentStage, $scope.prStDes);        
        if ($scope.customDataEntryForm) {
            $scope.displayCustomForm = "CUSTOM";
        }else{
            switch($scope.currentStage.timelineDataEntryMode){
                case $scope.timelineDataEntryModes.COMPAREPREVIOUSDATAENTRYFORM:
                    $scope.compareMode = $scope.compareDataEntryFormModes.PREVIOUS;
                    $scope.displayCustomForm = "COMPARE";
                    $scope.readyCompareDisplayForm();
                    break;
                case $scope.timelineDataEntryModes.COMPAREALLDATAENTRYFORM:
                    $scope.compareMode = $scope.compareDataEntryFormModes.ALL;
                    $scope.displayCustomForm = "COMPARE";
                    $scope.readyCompareDisplayForm();
                    break;
                case $scope.timelineDataEntryModes.TABLEDATAENTRYFORM:
                    if($scope.reSortStageEvents === true){
                        sortStageEvents($scope.currentStage);            
                        if($scope.eventsByStage.hasOwnProperty($scope.currentStage.id)){
                            $scope.currentStageEvents = $scope.eventsByStage[$scope.currentStage.id];
                        }            
                    }
                    $scope.displayCustomForm = "TABLE";
                    break;
                
                default:
                    $scope.displayCustomForm = "DEFAULT";
                    break;
            }
        }

        $scope.currentEvent.editingNotAllowed = EventUtils.getEditingStatus($scope.currentEvent, $scope.currentStage, $scope.selectedOrgUnit, $scope.selectedTei, $scope.selectedEnrollment);
        
        $scope.currentEventOriginal = angular.copy($scope.currentEvent);
        
        $scope.currentStageEventsOriginal = angular.copy($scope.currentStageEvents);
        
        var period = {event: $scope.currentEvent.event, stage: $scope.currentEvent.programStage, name: $scope.currentEvent.sortingDate};
        $scope.currentPeriod[$scope.currentEvent.programStage] = period;        
        
        //Because of separatae dataentry-controllers for tabular and timeline data entry,
        //the rule effects might already be in place:
        processRuleEffect($scope.currentEvent.event);
        
        //Execute rules for the first time, to make the initial page appear correctly.
        //Subsequent calls will be made from the "saveDataValue" function.        
        $scope.executeRules();
    };

    $scope.saveDatavalue = function (prStDe, field) {
        $scope.saveDataValueForEvent(prStDe, field, $scope.currentEvent, false);
    };
    
    $scope.saveDataValueForRadio = function(prStDe, event, value){
        
        var def = $q.defer();
        
        event[prStDe.dataElement.id] = value;
        
        var saveReturn = $scope.saveDataValueForEvent(prStDe, null, event, false);
        if(angular.isDefined(saveReturn)){
            if(saveReturn === true){
                def.resolve("saved");                
            }
            else if(saveReturn === false){
                def.reject("error");
            }
            else{
                saveReturn.then(function(){
                    def.resolve("saved");
                }, function(){
                    def.reject("error");
                });
            }
        }
        else {
            def.resolve("notSaved");
        }

        
        return def.promise;
    };
    
    $scope.saveDataValueForEvent = function (prStDe, field, eventToSave, backgroundUpdate) {
        
        if( !prStDe ){
            return;
        }
        
        //Do not change the input notification variables for background updates
        if(!backgroundUpdate) {
            //Blank out the input-saved class on the last saved due date:
            $scope.eventDateSaved = false;

            //check for input validity
            $scope.updateSuccess = false;
        }
        
        var oldValue = null;
        for(var i=0; i<$scope.currentStageEventsOriginal.length; i++){
            if($scope.currentStageEventsOriginal[i].event === eventToSave.event) {
                oldValue = $scope.currentStageEventsOriginal[i][prStDe.dataElement.id];
                break;
            }
        }
        
        if (field && field.$invalid) {
            $scope.currentEvent[prStDe.dataElement.id] = oldValue;
            $scope.currentElement = {id: prStDe.dataElement.id, saved: false, event: eventToSave.event};
            return false;
        }

        //input is valid
        var value = eventToSave[prStDe.dataElement.id];

        if (oldValue !== value) {
            
            value = CommonUtils.formatDataValue(eventToSave.event, value, prStDe.dataElement, $scope.optionSets, 'API');
            
            //Do not change the input notification variables for background updates
            if(!backgroundUpdate) {
                $scope.updateSuccess = false;
                $scope.currentElement = {id: prStDe.dataElement.id, event: eventToSave.event, saved: false, failed:false, pending:true};            
            }
            
            var ev = {event: eventToSave.event,
                orgUnit: eventToSave.orgUnit,
                program: eventToSave.program,
                programStage: eventToSave.programStage,
                status: eventToSave.status,
                trackedEntityInstance: eventToSave.trackedEntityInstance,
                dataValues: [
                    {
                        dataElement: prStDe.dataElement.id,
                        value: value,
                        providedElsewhere: eventToSave.providedElsewhere[prStDe.dataElement.id] ? true : false
                    }
                ]
            };
            return DHIS2EventFactory.updateForSingleValue(ev).then(function (response) {
                if(!response) {
                    if(!backgroundUpdate) {
                        $scope.currentElement.saved = false;
                        $scope.currentElement.pending = false;
                        $scope.currentElement.failed = true;
                    } else {
                        $log.warn("Could not perform background update of " + prStDe.dataElement.id + " with value " +
                            value);
                    }
                    return;
                }

                $scope.updateFileNames();
                
                if(!backgroundUpdate) {
                    $scope.currentElement.saved = true;
                    $scope.currentElement.pending = false;
                    $scope.currentElement.failed = false;                    
                    $scope.latitudeSaved = false;
                    $scope.longitudeSaved = false;
                }
                
                $scope.currentEventOriginal = angular.copy($scope.currentEvent);

                $scope.currentStageEventsOriginal = angular.copy($scope.currentStageEvents);

                //In some cases, the rules execution should be suppressed to avoid the 
                //possibility of infinite loops(rules updating datavalues, that triggers a new 
                //rule execution)
                if(!backgroundUpdate) {
                    //Run rules on updated data:
                    $scope.executeRules();
                }

            });

        }
    };

    $scope.saveDatavalueLocation = function (prStDe) {

        $scope.updateSuccess = false;

        if (!angular.isUndefined($scope.currentEvent.providedElsewhere[prStDe.dataElement.id])) {

            //currentEvent.providedElsewhere[prStDe.dataElement.id];
            var value = $scope.currentEvent[prStDe.dataElement.id];
            var ev = {event: $scope.currentEvent.event,
                orgUnit: $scope.currentEvent.orgUnit,
                program: $scope.currentEvent.program,
                programStage: $scope.currentEvent.programStage,
                status: $scope.currentEvent.status,
                trackedEntityInstance: $scope.currentEvent.trackedEntityInstance,
                dataValues: [
                    {
                        dataElement: prStDe.dataElement.id,
                        value: value,
                        providedElsewhere: $scope.currentEvent.providedElsewhere[prStDe.dataElement.id] ? true : false
                    }
                ]
            };
            DHIS2EventFactory.updateForSingleValue(ev).then(function (response) {
                $scope.updateSuccess = true;
            });
        }
    };

    $scope.saveEventDate = function (reOrder) {       
        $scope.saveEventDateForEvent($scope.currentEvent, reOrder);        
    };

    $scope.saveEventDateForEvent = function (eventToSave, reOrder) {
        if(!eventToSave.eventDate) {
            return;
        }
        $scope.eventDateSaved = false;
        
        $scope.currentElement = {id: "eventDate", event: eventToSave.event, saved: false};
        
        var e = {event: eventToSave.event,
            enrollment: eventToSave.enrollment,
            dueDate: DateUtils.formatFromUserToApi(eventToSave.dueDate),
            status: eventToSave.status === 'SCHEDULE' ? 'ACTIVE' : eventToSave.status,
            program: eventToSave.program,
            programStage: eventToSave.programStage,
            orgUnit: eventToSave.dataValues && eventToSave.dataValues.length > 0 ? eventToSave.orgUnit : $scope.selectedOrgUnit.id,
            eventDate: DateUtils.formatFromUserToApi(eventToSave.eventDate),
            trackedEntityInstance: eventToSave.trackedEntityInstance
        };
        
        DHIS2EventFactory.updateForEventDate(e).then(function (data) {
            eventToSave.sortingDate = eventToSave.eventDate;
            
            $scope.invalidDate = false;
            $scope.validatedDateSetForEvent = {date: eventToSave.eventDate, event: eventToSave};
            
            $scope.eventDateSaved = eventToSave.event;
            eventToSave.statusColor = EventUtils.getEventStatusColor(eventToSave); 
            eventToSave.status = e.status;
            
            $scope.currentEvent.sortingDate = eventToSave.sortingDate;
            $scope.currentEvent.orgUnit = e.orgUnit;
            $scope.currentEvent.statusColor = eventToSave.statusColor;
            $scope.currentEvent.status = eventToSave.status;
            $scope.currentEvent.orgUnitName = $scope.selectedOrgUnit.displayName;
            
            sortEventsByStage('UPDATE');
            
            $scope.currentElement = {id: "eventDate", event: eventToSave.event, saved: true};
            $scope.executeRules();
        });
    };

    $scope.saveDueDate = function () {
        $scope.dueDateSaved = false;

        var e = {event: $scope.currentEvent.event,
            enrollment: $scope.currentEvent.enrollment,
            dueDate: DateUtils.formatFromUserToApi($scope.currentEvent.dueDate),
            status: $scope.currentEvent.status,
            program: $scope.currentEvent.program,
            programStage: $scope.currentEvent.programStage,
            orgUnit: $scope.selectedOrgUnit.id,
            trackedEntityInstance: $scope.currentEvent.trackedEntityInstance
        };

        if ($scope.currentStage.periodType) {
            e.eventDate = e.dueDate;
        }

        if ($scope.currentEvent.coordinate) {
            e.coordinate = $scope.currentEvent.coordinate;
        }

        DHIS2EventFactory.update(e).then(function (data) {
            $scope.invalidDueDate = false;
            $scope.dueDateSaved = true;

            if (e.eventDate && !$scope.currentEvent.eventDate && $scope.currentStage.periodType) {
                $scope.currentEvent.eventDate = $scope.currentEvent.dueDate;
            }
            
            $scope.currentEvent.sortingDate = $scope.currentEvent.dueDate;
            $scope.currentEvent.statusColor = EventUtils.getEventStatusColor($scope.currentEvent);
            $scope.currentEvent.status = e.status;
            
            $scope.schedulingEnabled = !$scope.schedulingEnabled;
            sortEventsByStage('UPDATE');
        });        
        
    };

    $scope.saveCoordinate = function (type) {
        
        if (type === 'LAT' || type === 'LATLNG') {
            $scope.latitudeSaved = false;
        }
        if (type === 'LNG' || type === 'LATLNG') {
            $scope.longitudeSaved = false;
        }

        if ($scope.currentEvent.coordinate.latitude === $scope.currentEventOriginal.coordinate.latitude 
                && $scope.currentEvent.coordinate.longitude === $scope.currentEventOriginal.coordinate.longitude) {//no change
            return;
        }

        //valid coordinate(s), proceed with the saving
        var dhis2Event = $scope.makeDhis2EventToUpdate();

        DHIS2EventFactory.update(dhis2Event).then(function (response) {
            if( response ){
                $scope.currentEventOriginal = angular.copy($scope.currentEvent);
                $scope.currentStageEventsOriginal = angular.copy($scope.currentStageEvents);
                
                $scope.latitudeSaved = true;
                $scope.longitudeSaved = true;
            }
            else{                
                $scope.currentEvent = angular.copy( $scope.currentEventOriginal );
                $scope.latitudeSaved = false;
                $scope.longitudeSaved = false;
            }            
            $scope.currentElement = {};            
        });
    };

    $scope.addNote = function () {
        
        if(!$scope.note.value){
            var headerText =  $translate.instant("error");
            var bodyText =  $translate.instant("please_add_some_text");
            NotificationService.showNotifcationDialog(headerText, bodyText);
            return;
        }
        var newNote = {value: $scope.note.value};
            
        if (angular.isUndefined($scope.currentEvent.notes)) {
            $scope.currentEvent.notes = [{value: newNote.value, storedDate: today, displayDate: today, storedBy: storedBy}];
        }
        else {
            $scope.currentEvent.notes.splice(0, 0, {value: newNote.value, storedDate: today, displayDate: today, storedBy: storedBy});
        }

        var e = {event: $scope.currentEvent.event,
            program: $scope.currentEvent.program,
            programStage: $scope.currentEvent.programStage,
            orgUnit: $scope.currentEvent.orgUnit,
            trackedEntityInstance: $scope.currentEvent.trackedEntityInstance,
            notes: [newNote]
        };

        DHIS2EventFactory.updateForNote(e).then(function (data) {
            $scope.note = {};
        });
    };
    
    $scope.notesModal = function(){
                
        var bodyList = [];

        if($scope.currentEvent.notes) {
            for(i = 0; i < $scope.currentEvent.notes.length; i++){
                var currentNote = $scope.currentEvent.notes[i];            
                bodyList.push({value1: currentNote.storedDate, value2: currentNote.value});
            }
        }
        
        var dialogOptions = {
            closeButtonText: 'Close',            
            textAreaButtonText: 'Add',
            textAreaButtonShow: $scope.currentEvent.status === $scope.EVENTSTATUSSKIPPEDLABEL ? false : true,
            headerText: 'Notes',
            bodyTextAreas: [{model: 'note', placeholder: 'Add another note here', required: true, show: $scope.currentEvent.status === $scope.EVENTSTATUSSKIPPEDLABEL ? false : true}],
            bodyList: bodyList,
            currentEvent: $scope.currentEvent
        };        
        
        var dialogDefaults = {
            
            templateUrl: 'views/list-with-textarea-modal.html',
            controller: function ($scope, $modalInstance, DHIS2EventFactory, DateUtils) {                    
                    $scope.modalOptions = dialogOptions;
                    $scope.formSubmitted = false;
                    $scope.currentEvent = $scope.modalOptions.currentEvent;
                    $scope.textAreaValues = [];
                    
                    $scope.textAreaButtonClick = function(){                                               
                        if($scope.textAreaModalForm.$valid){                                
                            $scope.note = $scope.textAreaValues["note"];
                            $scope.addNote();
                            $scope.textAreaModalForm.$setUntouched();
                            $scope.formSubmitted = false;                            
                        }
                        else {
                            $scope.formSubmitted = true;
                        }
                    };                   

                                        
                    $scope.modalOptions.close = function(){                        
                        $modalInstance.close($scope.currentEvent);
                    };
                    
                    $scope.addNote = function(){
                                                
                        newNote = {value: $scope.note};
                        var date = DateUtils.formatToHrsMins(new Date());
                        var today = DateUtils.getToday();

                        var e = {event: $scope.currentEvent.event,
                                program: $scope.currentEvent.program,
                                programStage: $scope.currentEvent.programStage,
                                orgUnit: $scope.currentEvent.orgUnit,
                                trackedEntityInstance: $scope.currentEvent.trackedEntityInstance,
                                notes: [newNote]
                        };
                        DHIS2EventFactory.updateForNote(e).then(function (data) {
                            if (angular.isUndefined($scope.modalOptions.bodyList) || $scope.modalOptions.bodyList.length === 0) {
                                $scope.modalOptions.bodyList = [{value1: date, value2: newNote.value}];
                                $scope.modalOptions.currentEvent.notes = [{storedDate: date,displayDate: today, value: newNote.value}];
                            }
                            else {
                                $scope.modalOptions.bodyList.splice(0, 0, {value1: date, value2: newNote.value});
                                $scope.modalOptions.currentEvent.notes.splice(0,0,{storedDate: date,displayDate: today, value: newNote.value});
                            }
                            $scope.note = $scope.textAreaValues["note"] = "";
                        });
                    };                    
                }            
        };
        
        NotificationService.showNotifcationWithOptions(dialogDefaults, dialogOptions).then(function(e){
            $scope.currentEvent.notes = e.notes;
        });
        
    };

    $scope.clearNote = function () {
        $scope.note = {};
    };

    $scope.getInputDueDateClass = function (event) {
        if (event.event === $scope.eventDateSaved) {
            return 'input-success';
        }
        else {
            return '';
        }

    };

    $scope.getInputNotifcationClass = function(id, custom, event){
        if(!event) {
            event = $scope.currentEvent;
        }
        if($scope.currentElement.id && $scope.currentElement.id === id && $scope.currentElement.event && $scope.currentElement.event === event.event){
            if($scope.currentElement.pending){
                if(custom){
                    return 'input-pending';
                }
                return 'form-control input-pending';
            }
            
            if($scope.currentElement.saved){
                if(custom){
                    return 'input-success';
                }
                return 'form-control input-success';
            }            
            else{
                if(custom){
                    return 'input-error';
                }
                return 'form-control input-error';
            }            
        }  
        if(custom){
            return '';
        }
        return 'form-control';
    };

    var completeEnrollmentAllowed = function(ignoreEventId){
        for(var i = 0; i < $scope.programStages.length; i++ ) {
            for(var e = 0; e < $scope.eventsByStage[$scope.programStages[i].id].length; e++) {
                if($scope.eventsByStage[$scope.programStages[i].id][e].status ==='ACTIVE' && $scope.eventsByStage[$scope.programStages[i].id][e].event !== ignoreEventId){
                    return false;
                }
            }
        }
        return true;
    };
    
    
    var completeEnrollment = function () {
        $scope.deleteScheduleAndOverdueEvents().then(function(result){
            
            var en = angular.copy( $scope.selectedEnrollment );
            en.status = 'COMPLETED';
            EnrollmentService.update(en).then(function (data) {
                if( data && data.status === 'OK' ){
                    $scope.selectedEnrollment.status = 'COMPLETED';
                    selection.load();
                    $location.path('/').search({program: $scope.selectedProgramId});
                }                
            });
        });
    };
    
    $scope.makeDhis2EventToUpdate = function(){
        var dhis2Event = EventUtils.reconstruct($scope.currentEvent, $scope.currentStage, $scope.optionSets);
        var dhis2EventToUpdate = angular.copy(dhis2Event);
        dhis2EventToUpdate.dataValues = [];
        
        if(dhis2Event.dataValues){
            angular.forEach(dhis2Event.dataValues, function(dataValue){
                if(dataValue.value && dataValue.value.selections){
                    angular.forEach(dataValue.value.selections, function(selection){
                        var dv = {
                            dataElement: selection.id,
                            value: true,
                            providedElsewhere: false
                        };
                        dhis2EventToUpdate.dataValues.push(dv);
                    });
                }else{
                    dhis2EventToUpdate.dataValues.push(dataValue);
                }
            });
        };
        return dhis2EventToUpdate;
    };
    
    $scope.completeIncompleteEvent = function (inTableView, outerDataEntryForm) {
        
        if($scope.currentEvent.status !== 'COMPLETED'){
            $scope.outerDataEntryForm.submitted = true;
            if($scope.outerDataEntryForm.$invalid){
                NotificationService.showNotifcationDialog($translate.instant("error"), $translate.instant("form_invalid"));
                return;
            }
        }

        var modalOptions;
        
        var modalDefaults = {};
        var dhis2Event = $scope.makeDhis2EventToUpdate();        
        
        if ($scope.currentEvent.status === 'COMPLETED') {//activiate event
            modalOptions = {
                closeButtonText: 'cancel',
                headerText: 'edit',
                bodyText: 'are_you_sure_to_incomplete_event'
            };
            dhis2Event.status = 'ACTIVE';
        }
        else {//complete event    
            //We must execute the rules right before deciding wheter to allow completion:
            $scope.executeRules();
            
            if(angular.isUndefined(inTableView) || inTableView === false || inTableView === null){
                
                if(!outerDataEntryForm){
                    outerDataEntryForm = $scope.outerDataEntryForm;
                }
                outerDataEntryForm.$setSubmitted();
                if(outerDataEntryForm.$invalid){
                    var dialogOptions = {
                        headerText: 'errors',
                        bodyText: 'form_invalid',
                        sections: sections
                    };
                    NotificationService.showNotifcationWithOptions({}, dialogOptions);                    
                    return;
                }
            }
            
            //Warnings might be put into both dialogs with errors and dialogs without errors.
            //preparing a warnings section in case it is needed by one of the other dialogs.
            var warningSection = false;
            if(angular.isDefined($scope.warningMessages[$scope.currentEvent.event]) && $scope.warningMessages[$scope.currentEvent.event].length > 0) {
                warningSection = {
                    bodyText:'validation_warnings',
                    bodyList:$scope.warningMessages[$scope.currentEvent.event],
                    itemType:'warning'
                };
            }
            
            if(angular.isDefined($scope.errorMessages[$scope.currentEvent.event]) && $scope.errorMessages[$scope.currentEvent.event].length > 0) {
                //There is unresolved program rule errors - show error message.
                var sections = [
                    {
                        bodyList:$scope.errorMessages[$scope.currentEvent.event],
                        itemType:'danger'
                    }
                ];
                
                if(warningSection) {
                    sections.push(warningSection);
                }
                
                var dialogOptions = {
                    headerText: 'errors',
                    bodyText: 'please_fix_errors_before_completing',
                    sections: sections
                };                
                
                NotificationService.showNotifcationWithOptions({}, dialogOptions);
                return;
            }
            else
            {
                modalOptions = {
                    closeButtonText: 'cancel',
                    headerText: 'complete',
                    bodyText: 'are_you_sure_to_complete_event'
                };
                
                if(warningSection) {
                    modalOptions.sections = [warningSection];
                }
                
                modalOptions.actionButtons =[{ text: 'complete', action: modalCompleteIncompleteActions.complete, class: 'btn btn-primary'}];

                modalOptions.actionButtons.push({text: 'complete_and_exit', action: modalCompleteIncompleteActions.completeAndExit, class: 'btn btn-primary'});                
                
                if($scope.currentStage.remindCompleted){
                    modalOptions.bodyText = 'are_you_sure_to_complete_event_and_enrollment';                    
                    modalOptions.actionButtons.push({text: 'complete_event_and_enrollment', action: modalCompleteIncompleteActions.completeEnrollment, class: 'btn btn-primary'});
                }
                
                modalDefaults.templateUrl = 'components/dataentry/modal-complete-event.html';
                dhis2Event.status = 'COMPLETED';
                dhis2Event.completedDate = today;
            }
        }
        ModalService.showModal(modalDefaults, modalOptions).then(function (modalResult) {
            if(modalResult===modalCompleteIncompleteActions.completeEnrollment){
                if(!completeEnrollmentAllowed(dhis2Event.event)){
                    modalOptions = {
                        actionButtonText: 'OK',
                        headerText: 'complete_enrollment_failed',
                        bodyText: 'complete_active_events_before_completing_enrollment'
                    };
                    ModalService.showModal({},modalOptions);
                }else{
                    modalOptions = {
                        closeButtonText: 'cancel',
                        actionButtonText: 'complete',
                        headerText: 'complete_enrollment',
                        bodyText: 'are_you_sure_to_complete_enrollment_delete_schedule'
                    };
                    ModalService.showModal({},modalOptions).then(function(){
                        $scope.executeCompleteIncompleteEvent(dhis2Event,modalResult);
                    });
                }
            }else{
                $scope.executeCompleteIncompleteEvent(dhis2Event,modalResult);               
            }
        });           
    };
    
    $scope.executeCompleteIncompleteEvent = function(dhis2Event, modalResult){
        var modalOptions = {};
        if(eventLockEnabled && eventIsLocked(dhis2Event)){
            modalOptions = {
                actionButtonText: 'OK',
                headerText: 'Event locked',
                bodyText: 'event is locked. Contact system administrator to reopen'
            };
            return ModalService.showModal({},modalOptions);
        }
        
        return DHIS2EventFactory.update(dhis2Event).then(function (data) {

            if(modalResult === modalCompleteIncompleteActions.completeAndExit){
                selection.load();
                $location.path('/').search({program: $scope.selectedProgramId}); 
            }else{
                if ($scope.currentEvent.status === 'COMPLETED') {//activiate event
                    if( !$scope.userAuthority.canUnCompleteEvent ){
                        NotificationService.showNotifcationDialog($translate.instant("error"), $translate.instant("not_authorized_to_uncomplete_event"));
                        return;
                    }
                    $scope.currentEvent.status = 'ACTIVE';
                }
                else {//complete event                    
                    $scope.currentEvent.status = 'COMPLETED';

                }

                setStatusColor();
                $scope.currentEvent.editingNotAllowed = EventUtils.getEditingStatus($scope.currentEvent, $scope.currentStage, $scope.selectedOrgUnit, $scope.selectedTei, $scope.selectedEnrollment);
                
                for(var i=0;i<$scope.allEventsSorted.length;i++){
                    if($scope.allEventsSorted[i].event === $scope.currentEvent.event){
                        $scope.allEventsSorted[i] = $scope.currentEvent;
                        i=$scope.allEventsSorted.length;
                    }
                }
                
                if ($scope.currentEvent.status === 'COMPLETED') {

                    if (modalResult === modalCompleteIncompleteActions.completeEnrollment) {
                        completeEnrollment();
                    }
                    else {
                        if ($scope.currentStage.allowGenerateNextVisit) {
                            $scope.showCreateEvent(null, $scope.eventCreationActions.schedule);
                        }
                    }
                }
            }
            broadcastDataEntryControllerData();
        });
    };

    function eventIsLocked(){
        if($scope.currentEvent.status === 'COMPLETED'){
            var now = moment();
            var completedDate = moment($scope.currentEvent.completedDate);
            if(now.diff(completedDate, 'hours') > eventLockHours){
                return true;
            }
        }
        return false;
    }
    
    $scope.skipUnskipEvent = function () {
        var modalOptions;
        var dhis2Event = $scope.makeDhis2EventToUpdate();

        if ($scope.currentEvent.status === 'SKIPPED') {//unskip event
            modalOptions = {
                closeButtonText: 'cancel',
                actionButtonText: 'unskip',
                headerText: 'unskip',
                bodyText: 'are_you_sure_to_unskip_event'
            };
            dhis2Event.status = 'ACTIVE';
        }
        else {//skip event
            modalOptions = {
                closeButtonText: 'cancel',
                actionButtonText: 'skip',
                headerText: 'skip',
                bodyText: 'are_you_sure_to_skip_event'
            };
            dhis2Event.status = 'SKIPPED';
        }

        ModalService.showModal({}, modalOptions).then(function (result) {
            
            $scope.executeSkipUnskipEvent(dhis2Event);
            
        });
    };
    
    $scope.executeSkipUnskipEvent = function(dhis2Event){
        
        return DHIS2EventFactory.update(dhis2Event).then(function (data) {

                if ($scope.currentEvent.status === 'SKIPPED') {//activiate event                    
                    $scope.currentEvent.status = 'SCHEDULE';
                }
                else {//complete event                    
                    $scope.currentEvent.status = 'SKIPPED';
                }

                setStatusColor();                
                $scope.currentEvent.editingNotAllowed = EventUtils.getEditingStatus($scope.currentEvent, $scope.currentStage, $scope.selectedOrgUnit, $scope.selectedTei, $scope.selectedEnrollment);
            });
        
    };
    

    var setStatusColor = function () {
        var statusColor = EventUtils.getEventStatusColor($scope.currentEvent);
        var continueLoop = true;
        for (var i = 0; i < $scope.eventsByStage[$scope.currentEvent.programStage].length && continueLoop; i++) {
            if ($scope.eventsByStage[$scope.currentEvent.programStage][i].event === $scope.currentEvent.event) {
                $scope.eventsByStage[$scope.currentEvent.programStage][i].statusColor = statusColor;
                $scope.currentEvent.statusColor = statusColor;
                continueLoop = false;
            }
        }
    };

    $scope.deleteEvent = function () {
        
        var modalOptions = {
            closeButtonText: 'cancel',
            actionButtonText: 'delete',
            headerText: 'delete',
            bodyText: 'are_you_sure_to_delete_event_with_audit'
        };

        ModalService.showModal({}, modalOptions).then(function (result) {
            $scope.executeDeleteEvent();
        });
    };
        
    $scope.executeDeleteEvent = function(){
        
        return DHIS2EventFactory.delete($scope.currentEvent).then(function (data) {

                var continueLoop = true, index = -1;
                for (var i = 0; i < $scope.eventsByStage[$scope.currentEvent.programStage].length && continueLoop; i++) {
                    if ($scope.eventsByStage[$scope.currentEvent.programStage][i].event === $scope.currentEvent.event) {
                        $scope.eventsByStage[$scope.currentEvent.programStage][i] = $scope.currentEvent;
                        continueLoop = false;
                        index = i;
                    }
                }
                               
                var programStageID = $scope.currentEvent.programStage;

                $scope.eventsByStage[programStageID].splice(index, 1);
                $scope.currentStageEvents = $scope.eventsByStage[programStageID];
                
                //if event is last event in allEventsSorted and only element on page, show previous page
                var GetPreviousEventPage = false;
                if($scope.allEventsSorted[$scope.allEventsSorted.length-1].event === $scope.currentEvent.event){
                    var index = $scope.allEventsSorted.length - 1;
                    if(index !== 0){
                        if(index % $scope.eventPageSize === 0){                            
                            GetPreviousEventPage = true;
                        }
                    }
                }                
                sortEventsByStage('REMOVE');                                          
                if(GetPreviousEventPage){
                    $scope.getEventPage("BACKWARD");
                }                
                
                if($scope.displayCustomForm === "TABLE"){
                    $scope.currentEvent = {};                
                }
                else if($scope.displayCustomForm === "COMPARE"){
                    $scope.openStagesEvent([$scope.currentStage.id], function(){
                        $scope.openEmptyStage($scope.currentStage.id);
                        }); 
                }
                else {
                    $scope.deSelectCurrentEvent();                    
                }
                
                broadcastDataEntryControllerData();
                
            }, function(error){   
                
                //temporarily error message because of new audit functionality
                NotificationService.showNotifcationDialog($translate.instant("error"), $translate.instant("delete_error_audit"));
                return $q.reject(error);
            });        
    };

    $scope.getEventStyle = function (ev, skipCurrentEventStyle) {

        var style = EventUtils.getEventStatusColor(ev);
        $scope.eventStyleLabels[ev.event] = $scope.getDescriptionTextForEventStyle(style, $scope.descriptionTypes.label, false);
        
        if ($scope.currentEvent && $scope.currentEvent.event === ev.event && (angular.isUndefined(skipCurrentEventStyle) || skipCurrentEventStyle === false)) {
            style = style + '-darker' + ' ' + ' current-event';
        }        
        
        return style;
    };
    
    

    $scope.getColumnWidth = function (weight) {
        var width = weight <= 1 ? 1 : weight;
        width = (width / $scope.totalEvents) * 100;
        return "width: " + width + '%';
    };

    $scope.sortEventsByDate = function (dhis2Event) {
        var d = dhis2Event.sortingDate;
        return DateUtils.getDate(d);
    };
    
    var sortStageEvents = function(stage){        
        var key = stage.id;
        if ($scope.eventsByStage.hasOwnProperty(key)){
            var sortedEvents = $filter('orderBy')($scope.eventsByStage[key], function (event) {
                    if(angular.isDefined(stage.displayEventsInTable) && stage.displayEventsInTable === true){
                        return DateUtils.getDate(event.eventDate);
                    }
                    else{
                        return DateUtils.getDate(event.sortingDate);
                    }                    
                }, false);
            $scope.eventsByStage[key] = sortedEvents;
            $scope.eventsByStageDesc[key] = [];
            
            //Reverse the order of events, but keep the objects within the array.
            //angular.copy and reverse did not work - this messed up databinding.
            angular.forEach(sortedEvents, function(sortedEvent) {
                $scope.eventsByStageDesc[key].splice(0,0,sortedEvent);
            });          
            
            if(angular.isDefined($scope.currentStage) && $scope.currentStage !== null && $scope.currentStage.id === stage.id){
                $scope.currentStageEvents = sortedEvents;
            }
            return sortedEvents;
        }        
    };

    var sortEventsByStage = function (operation, newEvent) {

        $scope.eventFilteringRequired = false;

        for (var key in $scope.eventsByStage) {

            var stage = $scope.stagesById[key];            
            var sortedEvents = sortStageEvents(stage);           
            if ($scope.eventsByStage.hasOwnProperty(key) && stage && $scope.selectedEnrollment && $scope.selectedEnrollment.enrollment ) {
           
                var periods = PeriodService.getPeriods(sortedEvents, stage, $scope.selectedEnrollment).occupiedPeriods;

                $scope.eventPeriods[key] = periods;
                $scope.currentPeriod[key] = periods.length > 0 ? periods[0] : null;
                $scope.eventFilteringRequired = $scope.eventFilteringRequired ? $scope.eventFilteringRequired : periods.length > 1;
            }
        }
        
        if (operation) {
            if (operation === 'ADD' && newEvent && newEvent.event) {
                var ev = EventUtils.reconstruct(newEvent, $scope.currentStage, $scope.optionSets);                
                ev.enrollment = newEvent.enrollment;
                ev.visited = newEvent.visited;
                ev.orgUnitName = newEvent.orgUnitName;
                ev.name = newEvent.name;
                ev.sortingDate =newEvent.sortingDate;
                
                $scope.allEventsSorted.push(ev);
            }
            if (operation === 'UPDATE') {
                var ev = EventUtils.reconstruct($scope.currentEvent, $scope.currentStage, $scope.optionSets);
                ev.enrollment = $scope.currentEvent.enrollment;
                ev.visited = $scope.currentEvent.visited;
                ev.orgUnitName = $scope.currentEvent.orgUnitName;
                ev.name = $scope.currentEvent.name;
                ev.sortingDate = $scope.currentEvent.sortingDate;
                var index = -1;
                for (var i = 0; i < $scope.allEventsSorted.length && index === -1; i++) {
                    if ($scope.allEventsSorted[i].event === $scope.currentEvent.event) {
                        index = i;
                    }
                }
                if (index !== -1) {
                    $scope.allEventsSorted[index] = ev;
                }
            }
            if (operation === 'REMOVE') {
                var index = -1;
                for (var i = 0; i < $scope.allEventsSorted.length && index === -1; i++) {
                    if ($scope.allEventsSorted[i].event === $scope.currentEvent.event) {
                        index = i;
                    }
                }
                if (index !== -1) {
                    $scope.allEventsSorted.splice(index, 1);
                }
            }

            $timeout(function () {
                $rootScope.$broadcast('tei-report-widget', {});
            }, 200);
        }        
        $scope.allEventsSorted = orderByFilter($scope.allEventsSorted, '-sortingDate').reverse();         
    };

    $scope.showLastEventInStage = function (stageId) {
        var ev = $scope.eventsByStage[stageId][$scope.eventsByStage[stageId].length - 1];
        $scope.showDataEntryForEvent(ev);
    };

    $scope.showDataEntryForEvent = function (event) {

        var period = {event: event.event, stage: event.programStage, name: event.sortingDate};
        $scope.currentPeriod[event.programStage] = period;

        var event = null;
        for (var i = 0; i < $scope.eventsByStage[period.stage].length; i++) {
            if ($scope.eventsByStage[period.stage][i].event === period.event) {
                event = $scope.eventsByStage[period.stage][i];
                break;
            }
        }

        if (event) {
            $scope.showDataEntry(event, false, true);
        }
        
    };
    
    $scope.interacted = function (field, form) {        
        
        var status = false;
        if (field) {
            if(angular.isDefined(form)){
                status = form.$submitted || field.$dirty;
            }
            else {
                status = $scope.outerDataEntryForm.$submitted || field.$dirty;
            }            
        }
        return status;
    };

    $scope.getEventPage = function(direction){
        if(direction === 'FORWARD'){
            $scope.eventPagingStart += $scope.eventPageSize;
            $scope.eventPagingEnd += $scope.eventPageSize;            
        }
        
        if(direction === 'BACKWARD'){
            $scope.eventPagingStart -= $scope.eventPageSize;
            $scope.eventPagingEnd -= $scope.eventPageSize;
        }
        
        $scope.showDataEntry($scope.topLineEvents[$scope.eventPagingStart], false, true);
    };   
    
    $scope.getEventPageForEvent = function(event){
        if(angular.isDefined(event) && angular.isObject(event) && angular.isDefined($scope.topLineEvents)){
            
            var index = -1;
            for(var i = 0; i < $scope.topLineEvents.length; i++){
                if(event.event === $scope.topLineEvents[i].event){
                    index = i;
                    break;
                }
            }

            if(index !== -1){
                var page = Math.floor(index / $scope.eventPageSize);
                $scope.eventPagingStart = page * $scope.eventPageSize;
                $scope.eventPagingEnd = $scope.eventPagingStart + $scope.eventPageSize;
            }
        }        
    };

    $scope.deselectCurrent = function(id){        
        
        if($scope.currentEvent && $scope.currentEvent.event === id){
            $scope.currentEvent = {};            
            sortStageEvents($scope.currentStage);
            $scope.currentStageEvents = $scope.eventsByStage[$scope.currentStage.id];
        }
    };
    
    $scope.abortDeselect = function(){
        if(!$scope.currentStage.displayEventsInTable){
            return true;
        }
        return false;
    };
    
    $scope.showCompleteErrorMessageInModal = function(message, fieldName, isWarning){
        var messages = [message];
        var headerPrefix = angular.isDefined(isWarning) && isWarning === true ? "Warning in " : "Error in ";
        
        var dialogOptions = {
                    headerText: headerPrefix + fieldName,
                    bodyText: '',
                    bodyList: messages
                };                
                
        NotificationService.showNotifcationWithOptions({}, dialogOptions);
    };
    
    var getColSize = function(colSize){
        return 'col-xs-'+Math.floor(colSize);
    }
    //for compare-mode
    $scope.compareModeColDefs = {header: 1, otherEvent: 2, currentEvent: 3, otherEvents: 4, providedElsewhere: 5, nextEvent: 6, nextEvents: 7};
    $scope.getCompareModeColSize = function(colId){                
        
        var otherEventsCnt = $scope.otherStageEvents.length;                
        
        switch(colId){
            case $scope.compareModeColDefs.header:
                if(otherEventsCnt > 4){
                    if($scope.allowProvidedElsewhereExists[$scope.currentStage.id]){
                        return 'col-xs-1';
                    }
                    return 'col-xs-2';
                }
                else if(otherEventsCnt === 4){
                    if($scope.allowProvidedElsewhereExists[$scope.currentStage.id]){
                        return 'col-xs-1';
                    }
                    return 'col-xs-2';
                }
                else if(otherEventsCnt >= 2){
                    return 'col-xs-3';
                }
                else if(otherEventsCnt === 1) {
                    return 'col-xs-4';
                }
                else {
                    return 'col-xs-5';
                }
                break;
            case $scope.compareModeColDefs.otherEvent: 
                if(otherEventsCnt > 3){
                    return '';
                }
                else if(otherEventsCnt === 3){
                    return 'col-xs-4';
                }
                else if(otherEventsCnt === 2){
                    return 'col-xs-6';
                }
                else if(otherEventsCnt === 1){
                    return 'col-xs-12';
                }
                else{
                    return '';
                }                
                break;
            case $scope.compareModeColDefs.currentEvent:
                if(otherEventsCnt > 3){
                    return 'col-xs-3';
                }
                else if(otherEventsCnt === 3){
                    return 'col-xs-3';
                }
                else if(otherEventsCnt >= 2){
                    if($scope.allowProvidedElsewhereExists[$scope.currentStage.id]){
                        return 'col-xs-2';
                    }
                    return 'col-xs-3';
                }
                else if(otherEventsCnt === 1){
                    if($scope.allowProvidedElsewhereExists[$scope.currentStage.id]){
                        return 'col-xs-3';
                    }
                    return 'col-xs-5';
                }
                else{
                    if($scope.allowProvidedElsewhereExists[$scope.currentStage.id]){
                        return 'col-xs-6';
                    }
                    return 'col-xs-7';
                }
                break;
            //Wrapper that contains all other events
            case $scope.compareModeColDefs.otherEvents:
                if(otherEventsCnt >= 2){
                    return 'col-xs-6';
                }
                else if(otherEventsCnt === 1){
                    return 'col-xs-3';
                }
                else {
                    return '';
                }
                break;
            case $scope.compareModeColDefs.providedElsewhere:
                return 'col-xs-1';
                break;
        }
    };
    
    $scope.maxCompareItemsInCompareView = 3;
    $scope.setOtherStageEvents = function(){
        
        $scope.otherStageEvents = [];
        $scope.otherStageEventIndexes = [];
        $scope.stageEventsExcludedSkipped = [];

        $scope.nextStageEvents = [];
        $scope.nextStageEventIndexes = [];
        
        if(angular.isUndefined($scope.currentStageEvents) || $scope.currentStageEvents.length <= 1){
            return;
        }        
        else {            
            
            angular.forEach($scope.currentStageEvents, function(event){
                if(event.status !== $scope.EVENTSTATUSSKIPPEDLABEL || event.event === $scope.currentEvent.event){
                        $scope.stageEventsExcludedSkipped.push(event);
                }
            });
            
            
            $scope.indexOfCurrentEvent = -1;
            for(var i = 0; i < $scope.stageEventsExcludedSkipped.length; i++){
                var stageEvent = $scope.stageEventsExcludedSkipped[i];
                if(stageEvent.event === $scope.currentEvent.event){
                    $scope.indexOfCurrentEvent = i;
                    break;
                }                    
            }

            for(var j = 0; j < $scope.maxCompareItemsInCompareView; j++){
                var position = $scope.indexOfCurrentEvent - 1 - j;
                if(position < 0){
                    break;
                }
                
                var relative = - j - 1;
                $scope.otherStageEventIndexes.unshift({relative: relative, position: position});
            }
            if($scope.compareMode === $scope.compareDataEntryFormModes.ALL){
                var subsequentEventsCount = $scope.maxCompareItemsInCompareView - $scope.otherStageEventIndexes.length;
                if(subsequentEventsCount > 0){
                    for(var k = 0; k < subsequentEventsCount; k++){
                        var position = $scope.indexOfCurrentEvent + 1 + k;
                        if(position === $scope.stageEventsExcludedSkipped.length){
                            break;
                        }
                        
                        var relative = k + 1;
                        $scope.otherStageEventIndexes.push({relative: relative, position: position});
                    }
                }
            }



            angular.forEach($scope.otherStageEventIndexes, function(indexContainer,i,j){
                $scope.otherStageEvents.push($scope.stageEventsExcludedSkipped[indexContainer.position]);
            });               
        }
    };
    
    $scope.navigateOtherStageEvents = function(direction){
        
        angular.forEach($scope.otherStageEventIndexes, function(indexContainer){
            var change;
            if(direction < 0){
                change = -1;
                if(indexContainer.relative - 1 === 0){
                    change = -2;
                }               
            }
            else{
                change = 1;
                if(indexContainer.relative + 1 === 0){
                    change = 2;
                }                
            }
            
            indexContainer.relative += change;
            indexContainer.position += change;
        });
        
        $scope.otherStageEvents = [];
        angular.forEach($scope.otherStageEventIndexes, function(indexContainer){
            $scope.otherStageEvents.push($scope.stageEventsExcludedSkipped[indexContainer.position]);
        });
    };
    
    $scope.readyCompareDisplayForm = function(){
        $scope.setOtherStageEvents();

        if($scope.displayCustomForm !== "COMPARE"){
            $scope.displayCustomForm = "COMPARE";
        }                 
    };
    
    $scope.$watch("displayCustomForm", function(newValue, oldValue){        
        if(newValue === "COMPARE"){
            $scope.readyCompareDisplayForm();
        }
    });
    
    $scope.buttonType = {back: 1, forward: 2};
    $scope.showOtherEventsNavigationButtonInCompareForm = function(type){        
        if(type === $scope.buttonType.back) {
            if($scope.otherStageEventIndexes.length > 0) {
                var indexContainer = $scope.otherStageEventIndexes[0];
                if(indexContainer.position > 0 && indexContainer.relative < 0) {
                    return true;
                } else if($scope.compareMode === $scope.compareDataEntryFormModes.ALL && indexContainer.position > 0 && indexContainer.relative > 0) {
                    var temp = indexContainer.position - 1;
                    if(temp === $scope.indexOfCurrentEvent && temp === 0) {
                        return false;
                    }
                    return true;
                }
            }
            return false;
        }
        else{
            if($scope.otherStageEventIndexes.length > 0){
                var lastEvent = $scope.otherStageEventIndexes[$scope.otherStageEventIndexes.length - 1];
                if(lastEvent.relative < -1){
                    return true;
                }else if($scope.compareMode === $scope.compareDataEntryFormModes.ALL){
                    var totalEvents = $scope.stageEventsExcludedSkipped.length;
                    var hasNextEvents = ((totalEvents - 1) - $scope.indexOfCurrentEvent) > 0 && lastEvent.position < (totalEvents -1);
                    if(hasNextEvents) return true;
                }
            }
            return false;
        }
    };
    
    $scope.currentStageEventNumber = function(){
        for(var i = 0; i < $scope.stageEventsExcludedSkipped.length; i++){
            if($scope.currentEvent.event === $scope.stageEventsExcludedSkipped[i].event){
                return i+1;
            }
        }
        return;
    };
    
    $scope.getStageStyle = function(stage){
        
       var eventToFetch = $scope.getEventForStage(stage);
        
        if(eventToFetch >= 0){
            var stageStyle = $scope.getEventStyle($scope.eventsByStage[stage.id][eventToFetch]);
            if($scope.currentStage && $scope.currentStage.id === stage.id){
                stageStyle += " current-stage";
            }
            return stageStyle;
        }
        else {
            return '';
        }
    };
    
    $scope.getMainMenuItemStyle = function(stage){
        
        if($scope.eventsLoaded){                
            $scope.stageStyleLabels[stage.id] = "";
            var stages = [stage.id];
        
            if(angular.isDefined($scope.headerCombineStages)){
                for(var key in $scope.headerCombineStages){
                    if(key === stage.id){
                        stages.push($scope.headerCombineStages[key]);
                    }
                    else if($scope.headerCombineStages[key] === stage.id){
                        stages.push(key);
                    }
                }
            }

            var event = $scope.getEventForStages(stages);

            if(angular.isDefined(event)){
                var style = $scope.getEventStyle(event, true);
                $scope.stageStyleLabels[stage.id] = $scope.getDescriptionTextForEventStyle(style, $scope.descriptionTypes.label, true);
                return style;
            }
        }
        
        return '';                      
    };
    
    $scope.descriptionTypes = {full: 1, label: 2};
    $scope.getDescriptionTextForEventStyle = function(style, descriptionType, useInStage){
        
        if(angular.isDefined(style) && style !== ""){
            var eventStyles = $filter('filter')($scope.eventStyles, {color: style},true);
            if(angular.isDefined(eventStyles) && eventStyles.length === 1){            
                 return $scope.getDescriptionTextForDescription(eventStyles[0].description, descriptionType, useInStage);
            }
        }        
        return "";
    };
    
    $scope.getDescriptionTextForDescription = function(description, descriptionType, useInStage){
        
        var translateText = "";
            
        if(useInStage){
            translateText = "stage_";
        }
        translateText += description;

        if(descriptionType === $scope.descriptionTypes.label){
            translateText += "_label";                
        }            
        return $translate.instant(translateText);        
    };
    
    $scope.getStageStyleLabel = function(stage){
        if($scope.stageStyleLabels[stage.id]){
            return "(" + $scope.stageStyleLabels[stage.id] + ")";
        }
        return "(" + $translate.instant("stage_empty_label") + ")";
    };
    
    $scope.getEventStyleLabel = function(event){
        if($scope.eventStyleLabels[event.event]){
            return "(" + $scope.eventStyleLabels[event.event] + ")";
        }
        return '';
    };
    
    $scope.getEventForStage = function(stage){
        //get first incomplete not skipped. If none, get latest nok skipped         
        var lastComplete = -1;
        var firstOpen = -1;  
        
        if(angular.isDefined($scope.eventsByStage[stage.id]) && $scope.eventsByStage[stage.id].length > 0){
            var stageEvents = $scope.eventsByStage[stage.id];
            for(i = 0; i < stageEvents.length; i++){
                var itiratedEvent = stageEvents[i];
                if(itiratedEvent.status !== $scope.EVENTSTATUSSKIPPEDLABEL && itiratedEvent.status !== $scope.EVENTSTATUSCOMPLETELABEL){
                    firstOpen = i;
                    break;
                }
                else if(itiratedEvent.status === $scope.EVENTSTATUSCOMPLETELABEL){
                    lastComplete = i;
                }
            }
        }
        
        var eventToFetch = -1;
        if(firstOpen >= 0){
            eventToFetch = firstOpen;
        }
        else if(lastComplete >= 0){
            eventToFetch = lastComplete;
        }
        return eventToFetch;
    };
    
    $scope.getEventForStages = function(stagesInputArray){
        var stages = [];
        if(angular.isString(stagesInputArray[0])){
            //getstages
            angular.forEach(stagesInputArray, function(stageString){
                stages.push($scope.stagesById[stageString]);
            });
        }
        else{
            stages = stagesInputArray;
        }
        
        stages.sort(function(a,b){
            return a.sortOrder - b.sortOrder;
        });
        
        var eventsForStages = [];
        angular.forEach(stages, function(stage){
            eventsForStages = eventsForStages.concat($scope.eventsByStage[stage.id]);
        });
        
        return $scope.getEventFromEventCollection(eventsForStages);
    };
    
    $scope.getEventFromEventCollection = function(eventCollection){
        //get first incomplete not skipped. If none, get latest nok skipped         
        var lastComplete = -1;
        var firstOpen = -1;  
        
        var stageEvents = eventCollection;
        for(i = 0; i < stageEvents.length; i++){
            var itiratedEvent = stageEvents[i];
            if(itiratedEvent.status !== $scope.EVENTSTATUSSKIPPEDLABEL && itiratedEvent.status !== $scope.EVENTSTATUSCOMPLETELABEL){
                firstOpen = i;
                break;
            }
            else if(itiratedEvent.status === $scope.EVENTSTATUSCOMPLETELABEL){
                lastComplete = i;
            }
        }
        
        
        var eventToFetch = -1;
        if(firstOpen >= 0){
            eventToFetch = firstOpen;
        }
        else if(lastComplete >= 0){
            eventToFetch = lastComplete;
        }
        
        if(eventToFetch !== -1){
            return stageEvents[eventToFetch];
        }
        return; 
    };
    
    $scope.openStageFormFromEventLayout = function(stage){                
        
        if($scope.currentStage && $scope.currentStage.id === stage.id){
            $scope.deSelectCurrentEvent();
        }
        else {
            $scope.openStageEvent(stage, function(){
                if($scope.stageOpenInEventLayout === stage.id){
                    $scope.stageOpenInEventLayout = "";
                }
                else {
                    $scope.stageOpenInEventLayout = stage.id;
                 }
            });
        }
    };
    
    $scope.openStageEventFromMenu = function(stage, timelineFilter){
        
        var stages = [stage.id];
        //set timeLineFilter if present
        if(angular.isDefined(timelineFilter)){
            var timelineFilterArr = timelineFilter.split(",");
            $scope.topLineStageFilter = {};
            angular.forEach(timelineFilterArr, function(filter){
                $scope.topLineStageFilter[filter] = true;
                if(stage.id !== filter){
                    stages.push(filter);
                }
            });
        }
        
        $scope.openStagesEvent(stages, function(){
            $scope.openEmptyStage(stage);
        });        
    };
    
    $scope.openStagesEvent = function(stages, noEventFoundFunc){
        var event = $scope.getEventForStages(stages);
        
        if(angular.isDefined(event)){ 
            $scope.getEventFromStageSelection(event);            
        }
        else {
            noEventFoundFunc();
        }
    };
    
    $scope.openStageEvent = function(stage, noEventFoundFunc){
        
        var latest = $scope.getEventForStage(stage);
        
        if(latest >= 0){
            $scope.getEventFromStageSelection($scope.eventsByStage[stage.id][latest]);
        }
        else {
            noEventFoundFunc();
        }
    };
    
    $scope.getEventFromStageSelection = function(event){
        
        $scope.showDataEntryForEvent(event);
        
        if(angular.isDefined($scope.currentStage) && $scope.currentStage !== null && angular.isDefined($scope.currentStage.displayEventsInTable) && $scope.currentStage.displayEventsInTable === true){
            $scope.currentEvent = {};
        }
    };
    
    $scope.openEmptyStage = function(stage){
        $scope.deSelectCurrentEvent();
        $scope.currentStage = stage;        
    };
    
    $scope.getStageEventCnt = function(stage){                
        
        var cnt = -1;
        
        if($scope.eventsLoaded){            
            cnt = 0;
            if(angular.isDefined($scope.eventsByStage[stage.id])){
                cnt = $scope.eventsByStage[stage.id].length;
            }

            if(angular.isDefined($scope.headerCombineStages)){
                for(var key in $scope.headerCombineStages){
                    if(stage.id === key){
                        if(angular.isDefined($scope.eventsByStage[$scope.headerCombineStages[key]])){
                            cnt += $scope.eventsByStage[$scope.headerCombineStages[key]].length;
                        }
                    }
                    else if(stage.id === $scope.headerCombineStages[key]){
                        if(angular.isDefined($scope.eventsByStage[key])){
                            cnt += $scope.eventsByStage[key].length;
                        }
                    }
                }
            }
        }
        
        return cnt > -1 ? cnt : "";        
    };
    
    $scope.$watch("currentEvent", function(newValue, oldValue){
        if(angular.isDefined(newValue)){
            $scope.stageOpenInEventLayout = "";            
        }
    });
    
    $scope.getValueTitleCompareForm = function(event){
	return event.eventDate;
    };
    
    $scope.getGestAgeForANCEventContainer = function(event){
        return '';
    };
    
    $scope.getStageErrorMessageInEventLayout = function(stage){
        if(angular.isDefined($scope.stageErrorInEventLayout[stage.id])){
            switch($scope.stageErrorInEventLayout[stage.id]){
                case $scope.eventCreationActions.add:                    
                    return $translate.instant('please_complete_all_results_before_add');
                    break;
                case $scope.eventCreationActions.schedule:
                    return $translate.instant('please_complete_all_results_before_schedule');
                    break;
                case $scope.eventCreationActions.referral:
                    return $translate.instant('please_complete_all_results_before_referral');
                    break;                
            }
        }
    };
    
    $scope.resetStageErrorInEventLayout = function(){
        if(angular.isDefined($scope.stageErrorInEventLayout[$scope.currentEvent.programStage]) && $scope.stageErrorInEventLayout[$scope.currentEvent.programStage] !== ""){
                    $scope.stageErrorInEventLayout[$scope.currentEvent.programStage] = "";
                }
    };

    $scope.downloadFile = function(eventUid, dataElementUid, e) {
        eventUid = eventUid ? eventUid : $scope.currentEvent.event ? $scope.currentEvent.event : null;        
        if( !eventUid || !dataElementUid){
            NotificationService.showNotifcationDialog($translate.instant("error"), $translate.instant("missing_file_identifier"));
            return;
        }
        
        $window.open('../api/events/files?eventUid=' + eventUid +'&dataElementUid=' + dataElementUid, '_blank', '');
        if(e){
            e.stopPropagation();
            e.preventDefault();
        }
    };
    
    $scope.deleteFile = function(ev, dataElement){
        
        if( !dataElement ){
            NotificationService.showNotifcationDialog($translate.instant("error"), $translate.instant("missing_file_identifier"));
            return;
        }
        
        var modalOptions = {
            closeButtonText: 'cancel',
            actionButtonText: 'remove',
            headerText: 'remove',
            bodyText: 'are_you_sure_to_remove'
        };

        ModalService.showModal({}, modalOptions).then(function(result){            
            $scope.fileNames[$scope.currentEvent.event][dataElement] = null;
            $scope.currentEvent[dataElement] = null;
            ev[dataElement] = null;
            $scope.saveDatavalue($scope.prStDes[dataElement], null);
            //$scope.updateEventDataValue($scope.currentEvent, dataElement);
        });
    };
    
    $scope.updateFileNames = function(){        
        for(var dataElement in $scope.currentFileNames){
            if($scope.currentFileNames[dataElement]){
                if(!$scope.fileNames[$scope.currentEvent.event]){
                    $scope.fileNames[$scope.currentEvent.event] = [];
                }                 
                $scope.fileNames[$scope.currentEvent.event][dataElement] = $scope.currentFileNames[dataElement];
            }
        }
    };
    
    $scope.categoryOptionComboFilter = function(){
        
        var modalInstance = $modal.open({
            templateUrl: 'components/dataentry/modal-category-option.html',
            controller: 'EventCategoryComboController',
            resolve: {
                selectedProgram: function () {
                    return $scope.selectedProgram;
                },
                selectedCategories: function(){
                    return $scope.selectedCategories;
                },
                selectedTeiId: function(){
                    return $scope.selectedTei.trackedEntityInstance;
                }
            }
        });

        modalInstance.result.then(function (events) {
            if (angular.isObject(events)) {
                CurrentSelection.setSelectedTeiEvents( events );
                $scope.getEvents();
            }
        }, function () {
        });        
    };
    
    $scope.editAttributeCategoryOptions = function(){
        $scope.showAttributeCategoryOptions = !$scope.showAttributeCategoryOptions;
        
        if( $scope.showAttributeCategoryOptions && $scope.currentEvent && $scope.currentEvent.attributeCategoryOptions ){                        
            var selectedOptions = $scope.currentEvent.attributeCategoryOptions.split(";");
            var reverse = false;
            for (var i=0; i<$scope.selectedCategories.length; i++) {
                for(var j=0; j<$scope.selectedCategories[i].categoryOptions.length; j++) {
                    if($scope.selectedCategories[i].categoryOptions[j].id === selectedOptions[i]){
                        $scope.selectedCategories[i].selectedOption = $scope.selectedCategories[i].categoryOptions[j];
                        break;
                    }
                    else{
                        reverse = true;
                    }
                }
            }
            
            if( reverse ){
                selectedOptions = selectedOptions.reverse();
                $scope.currentEvent.attributeCategoryOptions = selectedOptions.join(';');
                for (var i=0; i<$scope.selectedCategories.length; i++) {
                    for(var j=0; j<$scope.selectedCategories[i].categoryOptions.length; j++) {
                        if($scope.selectedCategories[i].categoryOptions[j].id === selectedOptions[i]){
                            $scope.selectedCategories[i].selectedOption = $scope.selectedCategories[i].categoryOptions[j];
                            break;
                        }
                    }
                }
            }
        }        
    };
    
    $scope.saveAttributeCategoryOptions = function(){
        var selectedOptions = [], optionsReady = true;
        $scope.changedCat = {id: -1, saved: false};
        for (var i = 0; i < $scope.selectedCategories.length; i++) {
            
            if( $scope.selectedCategories[i].selectedOption.id !== $scope.currentEvent.attributeCategoryOptions.split(';')[i] ){                
                $scope.changedCat.id = $scope.selectedCategories[i].id;
            }
            if ($scope.selectedCategories[i].selectedOption && $scope.selectedCategories[i].selectedOption.id) {
                selectedOptions.push($scope.selectedCategories[i].selectedOption.id);
            }
            else{
                optionsReady = false;
            }
        }
        
        var acos = selectedOptions.join(';');
        if( optionsReady && acos !== $scope.currentEvent.attributeCategoryOptions ){
            
            var ev = EventUtils.processEvent($scope.currentEvent, $scope.currentStage, $scope.optionSets, $scope.prStDes);
            
            if( ev.event && ev.enrollment && ev.trackedEntityInstance && ev.attributeCategoryOptions && ev.attributeOptionCombo){
                var dhis2Event = {event: ev.event, orgUnit: ev.orgUnit, enrollment: ev.enrollment, program: ev.program, programStage: ev.programStage, dataValues: ev.dataValues};
                
                if( ev.status ){
                    dhis2Event.status = ev.status;
                }
                
                if( ev.eventDate ){
                    dhis2Event.eventDate = ev.eventDate;
                }
                
                if( ev.notes ){
                    dhis2Event.notes = ev.notes;
                }
                
                if( ev.coordinate ){
                    dhis2Event.coordinate = ev.coordinate;
                }
                
                dhis2Event.attributeCategoryOptions = acos;
            }            
            
            DHIS2EventFactory.update(dhis2Event).then(function(data){            
                $scope.currentEvent.attributeCategoryOptions = dhis2Event.attributeCategoryOptions;
                $scope.changedCat.saved = true;
            });
        }
    };
    
    //$scope.getInputNotifcationClass = function(id, custom, event){
    $scope.getOptionSaveNotifcationClass = function( id ){
        if($scope.changedCat && $scope.changedCat.id && $scope.changedCat.id === id){            
            if($scope.changedCat.saved){
                return 'form-control input-success';
            }            
            else{
                return 'form-control input-error';
            }            
        }
        return 'form-control';
    };
    
    $scope.hideEditAttributeCategoryOptions = function(){
        $scope.showAttributeCategoryOptions = !$scope.showAttributeCategoryOptions;
    };
    
})
.controller('EventOptionsInTableController', function($scope, $translate){
    
    var COMPLETE = "Complete";
    var INCOMPLETE = "Incomplete";
    var VALIDATE = "Validate";
    var DELETE = "Delete";    
    var SKIP = "Skip";
    var UNSKIP = "Unskip";
    var NOTE = "Note";
    

    $scope.completeIncompleteEventFromTable = function(){
                        
        if ($scope.currentEvent.status !== 'COMPLETED'){
            $scope.currentEvent.submitted = true;           
            var formData = $scope.$eval('eventRowForm' + $scope.eventRow.event);                    
            if(formData.$valid){
                $scope.completeIncompleteEvent(true);
            }
        }
        else{
            $scope.completeIncompleteEvent(true);
        }
    };
    
    $scope.eventTableOptions = {};    
    $scope.eventTableOptions[COMPLETE] = {text: "Complete", tooltip: 'Complete', icon: "<span class='glyphicon glyphicon-check'></span>", value: COMPLETE, onClick: $scope.completeIncompleteEventFromTable, sort: 0};
    $scope.eventTableOptions[INCOMPLETE] = {text: "Reopen", tooltip: 'Reopen', icon: "<span class='glyphicon glyphicon-pencil'></span>", value: INCOMPLETE, onClick: $scope.completeIncompleteEventFromTable, sort: 1};
    //$scope.eventTableOptions[VALIDATE] = {text: "Validate", tooltip: 'Validate', icon: "<span class='glyphicon glyphicon-cog'></span>", value: VALIDATE, onClick: $scope.validateEvent, sort: 6};    
    $scope.eventTableOptions[DELETE] = {text: "Delete", tooltip: 'Delete', icon: "<span class='glyphicon glyphicon-floppy-remove'></span>", value: DELETE, onClick: $scope.deleteEvent, sort: 2};
    $scope.eventTableOptions[SKIP] = {text: "Skip", tooltip: 'Skip', icon: "<span class='glyphicon glyphicon-step-forward'></span>", value: SKIP, onClick: $scope.skipUnskipEvent, sort: 3};
    $scope.eventTableOptions[UNSKIP] = {text: "Schedule back", tooltip: 'Schedule back', icon: "<span class='glyphicon glyphicon-step-backward'></span>", value: UNSKIP, onClick: $scope.skipUnskipEvent, sort: 4};
    //$scope.eventTableOptions[NOTE] = {text: "Notes", tooltip: 'Show notes', icon: "<span class='glyphicon glyphicon-list-alt'></span>", value: NOTE, onClick: $scope.notesModal, sort: 5};    
    
    $scope.eventRow.validatedEventDate = $scope.eventRow.eventDate;
    updateEventTableOptions();
    
    $scope.$watch("eventRow.status", function(newValue, oldValue){
        if(newValue !== oldValue){
            updateEventTableOptions();
        }    
        
    });
    
    $scope.$watch("validatedDateSetForEvent", function(newValue, oldValue){                        
        if(angular.isDefined(newValue)){
            if(!angular.equals(newValue, {})){
                var updatedEvent = newValue.event;
                if(updatedEvent === $scope.eventRow){                    
                        $scope.eventRow.validatedEventDate = newValue.date; 
                        updateEventTableOptions();                    
                }
            }
        }        
        
    });
    
    function updateEventTableOptions(){
        
        var eventRow = $scope.eventRow;        
        
        for(var key in $scope.eventTableOptions){
            $scope.eventTableOptions[key].show = true;
            $scope.eventTableOptions[key].disabled = false;
        }
        
        $scope.eventTableOptions[UNSKIP].show = false;        
        
        switch(eventRow.status){
            case $scope.EVENTSTATUSCOMPLETELABEL:
                $scope.eventTableOptions[COMPLETE].show = false;
                $scope.eventTableOptions[SKIP].show = false; 
                $scope.eventTableOptions[DELETE].show = false;
                //$scope.eventTableOptions[VALIDATE].show = false;                
                $scope.defaultOption = $scope.eventTableOptions[INCOMPLETE];
                break;
            case $scope.EVENTSTATUSSKIPPEDLABEL:
                $scope.eventTableOptions[COMPLETE].show = false;
                $scope.eventTableOptions[INCOMPLETE].show = false;
                //$scope.eventTableOptions[VALIDATE].show = false;                
                $scope.eventTableOptions[SKIP].show = false;
                
                $scope.eventTableOptions[UNSKIP].show = true;
                $scope.defaultOption = $scope.eventTableOptions[UNSKIP];
                break;            
            default:                 
                if(eventRow.validatedEventDate){
                    $scope.eventTableOptions[INCOMPLETE].show = false;
                    $scope.eventTableOptions[SKIP].show = false;
                    $scope.defaultOption = $scope.eventTableOptions[COMPLETE];
                }
                else {
                    $scope.eventTableOptions[INCOMPLETE].show = false;                    
                    //$scope.eventTableOptions[VALIDATE].show = false;
                    $scope.eventTableOptions[COMPLETE].disabled = true;
                    $scope.defaultOption = $scope.eventTableOptions[COMPLETE];
                }                          
                break;
        }
        
        createOptionsArray();
    }
    
    function createOptionsArray(){
        
        $scope.eventTableOptionsArr = [];        
        
        for(var key in $scope.eventTableOptions){
            $scope.eventTableOptionsArr[$scope.eventTableOptions[key].sort] = $scope.eventTableOptions[key];
        }
    }
});
