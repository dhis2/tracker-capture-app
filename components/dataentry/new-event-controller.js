
/* global trackerCapture, angular */

var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('EventCreationController',
        function ($scope,
                $rootScope,
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
                eventsByStage,
                stage,
                stages,
                writableStages,
                allStages,
                tei,
                program,
                orgUnit,
                enrollment,                
                eventCreationAction,
                autoCreate,
                EventUtils,
                events,
                selectedCategories,
                PeriodService,
                ModalService,
                CurrentSelection,
                TEIService,
                TCOrgUnitService) {
    $scope.selectedOrgUnit = orgUnit;
    $scope.selectedEnrollment = enrollment;      
    $scope.stages = stages;
    $scope.writableStages = writableStages;
    $scope.allStages = allStages;
    $scope.events = events;
    $scope.eventCreationAction = eventCreationAction;
    $scope.eventCreationActions = EventCreationService.eventCreationActions;
    $scope.isNewEvent = (eventCreationAction === $scope.eventCreationActions.add);
    $scope.isScheduleEvent = (eventCreationAction === $scope.eventCreationActions.schedule || eventCreationAction === $scope.eventCreationActions.referral);
    $scope.isReferralEvent = (eventCreationAction === $scope.eventCreationActions.referral);
    $scope.model = {selectedStage: stage, dueDateInvalid: false, eventDateInvalid: false};
    $scope.stageSpecifiedOnModalOpen = angular.isObject(stage) ? true : false;
    $scope.suggestedStage = stage;
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
        
        var availableStagesOrdered = $scope.writableStages.slice();
        availableStagesOrdered.sort(function (a,b){
            return a.sortOrder - b.sortOrder;
        });
        
        var stagesById = [];
        
        if((angular.isUndefined(events) || events.length === 0) && angular.isUndefined($scope.suggestedStage)){
            suggestedStage = availableStagesOrdered[0];
            for(var i=0; i< availableStagesOrdered.length; i++){
                if(availableStagesOrdered[i].access.data.write){
                    suggestedStage = availableStagesOrdered[i];
                    i = availableStagesOrdered.length;
                }
            }
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
                    if(eventStage.access.data.write){
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
            }
            else {
                lastStageForEvents = $scope.suggestedStage;
            }
            if(!lastStageForEvents) lastStageForEvents = availableStagesOrdered[0];

            
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
        $scope.lockButton = true;
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

            /********************
			25/09/2020 - Get last Update Date and set the value of adding new event - start
			********************/
			var newEvent;
			var reportDate = new Date();   
			reportDate.setDate(reportDate.getDate());		  
			var dd = reportDate.getDate();  
			var mm = reportDate.getMonth() + 1;
			var yyyy = reportDate.getFullYear();
			if (dd < 10) {
			dd = '0' + dd;
			}
			if (mm < 10) {
			mm = '0' + mm;
			}

			var minutes = reportDate.getMinutes();
			var hours = reportDate.getHours();

			if (hours < 10) {
				hours = '0' + hours;
			}

			if (minutes < 10) {
					minutes = '0' + minutes;
			}
			var timeNow = hours + ":" + minutes;
			var reportDate = yyyy + '-'+ mm + '-' + dd + 'T'+ timeNow;
			var eventlastupdatedDateUid = "eszSkeX2wzN";
			var userIdUid = "LFi3vm9dd5A";

			var SessionStorageService = angular.element('body').injector().get('SessionStorageService');
			var settings = SessionStorageService.get('USER_PROFILE');	
			var usernameCurrent = settings.userCredentials.username.toUpperCase();		

			/********************
			25/09/2020 - Get last Update Date and set the value of adding new event - end
			********************/	

            /*
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

        */

        if (dummyEvent.programStage == "mRDg7F9tAZH")
			{	       
	        newEvent = {
	            trackedEntityInstance: dummyEvent.trackedEntityInstance,
	            program: dummyEvent.program,
	            programStage: dummyEvent.programStage,
	            enrollment: dummyEvent.enrollment,
	            orgUnit: dummyEvent.orgUnit,
				notes: [],
				//origin dataValues assigned - replaced 25/09/2020
				//dataValues: [],
				//25/09/2020 - default event last update date 
				dataValues: [{"dataElement": eventlastupdatedDateUid, "value": reportDate},
							 {"dataElement": userIdUid, "value": usernameCurrent}],	
	            status: 'ACTIVE'
			};
				
			
			}
			else 
			{
				newEvent = {
					trackedEntityInstance: dummyEvent.trackedEntityInstance,
					program: dummyEvent.program,
					programStage: dummyEvent.programStage,
					enrollment: dummyEvent.enrollment,
					orgUnit: dummyEvent.orgUnit,
					notes: [],
					//origin dataValues assigned - replaced 25/09/2020
					//dataValues: [],
					//25/09/2020 - default event last update date 
					dataValues: [{"dataElement": eventlastupdatedDateUid, "value": reportDate}],	
					status: 'ACTIVE'
				};
			}
        
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
                $scope.lockButton = false;
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

                		
			//03/08/2020 - edit here for adding totals - end here
			
            var currentEventDetails = $scope.currentEvent;
			var cumulativeTotal = 0;				
			var selectedEntityid =  $scope.selectedEntity.trackedEntityInstance;			
			var selectedEntityUrl = '../api/trackedEntityInstances/'+selectedEntityid + '?paging=false&fields=enrollments[events]&program=JRuLW57woOB&programStatus=ACTIVE';
            									
			$('#TableCaptureForm tr').each(function (i, row) {				
							//console.log('row id: '+ row.id);
							if (row.cells[3] != undefined && row.id == "row-OdcXvW9sRW7") {								
								$.getJSON(selectedEntityUrl,
									function (json) {					
									var enrollmentsjson = json;
									var cumulativeTotal = 0;
									if (enrollmentsjson.enrollments != undefined) {										
										if (enrollmentsjson.enrollments[0].events.length > 0) {											
											$.each(enrollmentsjson.enrollments[0].events, function (i, event) {
												if (event.programStage == 'mRDg7F9tAZH') {
													$.each(event.dataValues, function (s, dataValue) {
														var dataElement = dataValue.dataElement;
														if (dataElement == 'OdcXvW9sRW7') {
															if (dataValue.value != undefined) {
																cumulativeTotal = 1.0*cumulativeTotal + (dataValue.value)*1.0;
																//console.log('event: ' + event.event +'  dataValue: ' + dataValue.value);
																row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';					
															}
															return false;
														}
													})
												}
											})
										}
									}
									})

								//row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)
								var el = angular.element(row);
								var scope = el.scope();
								var $injector = el.injector();
								$injector.invoke(function ($compile) {
									$compile(el)(scope)
								})
							}
							else if (row.cells[3] != undefined && row.id == "row-sheYRpw3hy5")
							{
									$.getJSON(selectedEntityUrl,
									function (json) {	
									var cumulativeTotal = 0;				
									var enrollmentsjson = json;
									if (enrollmentsjson.enrollments != undefined) {
												
										if (enrollmentsjson.enrollments[0].events.length > 0) {
											
											$.each(enrollmentsjson.enrollments[0].events, function (i, event) {
												if (event.programStage == 'mRDg7F9tAZH') {
													$.each(event.dataValues, function (s, dataValue) {
														var dataElement = dataValue.dataElement;
														if (dataElement == 'sheYRpw3hy5') {
															if (dataValue.value != undefined) {
																cumulativeTotal = 1.0*cumulativeTotal + (dataValue.value)* 1.0;
																//console.log('event: ' + event.event +'  dataValue: ' + dataValue.value);	
																row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';				
															}
															return false;
														}
													})
												}
											})
										}
									}
									})

								//row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)
								var el = angular.element(row);
								var scope = el.scope();
								var $injector = el.injector();
								$injector.invoke(function ($compile) {
									$compile(el)(scope)
								})


							}
							else if (row.cells[3] != undefined && row.id == "row-N9YnWLhO5YT")
							{
									$.getJSON(selectedEntityUrl,
									function (json) {	
									var cumulativeTotal = 0;				
									var enrollmentsjson = json;
									if (enrollmentsjson.enrollments != undefined) {
												
										if (enrollmentsjson.enrollments[0].events.length > 0) {
											
											$.each(enrollmentsjson.enrollments[0].events, function (i, event) {
												if (event.programStage == 'mRDg7F9tAZH') {
													$.each(event.dataValues, function (s, dataValue) {
														var dataElement = dataValue.dataElement;
														if (dataElement == 'N9YnWLhO5YT') {
															if (dataValue.value != undefined) {
																cumulativeTotal = 1.0*cumulativeTotal + (dataValue.value)*1.0;
																//console.log('event: ' + event.event +'  dataValue: ' + dataValue.value);	
																row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';				
															}
															return false;
														}
													})
												}
											})
										}
									}
									})

								//row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)
								var el = angular.element(row);
								var scope = el.scope();
								var $injector = el.injector();
								$injector.invoke(function ($compile) {
									$compile(el)(scope)
								})


							}
							else if (row.cells[3] != undefined && row.id == "row-VnHmmfDZRL8")
							{
								  var cumulativeTotal = 0.0;

									$.getJSON(selectedEntityUrl,
									function (json) {		
									var cumulativeTotal = 0;			
									var enrollmentsjson = json;
									if (enrollmentsjson.enrollments != undefined) {
												
										if (enrollmentsjson.enrollments[0].events.length > 0) {
											
											$.each(enrollmentsjson.enrollments[0].events, function (i, event) {
												if (event.programStage == 'mRDg7F9tAZH') {
													$.each(event.dataValues, function (s, dataValue) {
														var dataElement = dataValue.dataElement;
														if (dataElement == 'VnHmmfDZRL8') {
															if (dataValue.value != undefined) {
																cumulativeTotal = 1.0*cumulativeTotal + (dataValue.value)*1.0;
																//console.log('event: ' + event.event +'  dataValue: ' + dataValue.value);
																row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';					
															}
															return false;
														}
													})
												}
											})
										}
									}
									})

								//row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)
								var el = angular.element(row);
								var scope = el.scope();
								var $injector = el.injector();
								$injector.invoke(function ($compile) {
									$compile(el)(scope)
								})


							}
							else if (row.cells[3] != undefined && row.id == "row-bsOhL5gMiA2")
							{
									$.getJSON(selectedEntityUrl,
									function (json) {	
									var cumulativeTotal = 0;				
									var enrollmentsjson = json;
									if (enrollmentsjson.enrollments != undefined) {
												
										if (enrollmentsjson.enrollments[0].events.length > 0) {
											
											$.each(enrollmentsjson.enrollments[0].events, function (i, event) {
												if (event.programStage == 'mRDg7F9tAZH') {
													$.each(event.dataValues, function (s, dataValue) {
														var dataElement = dataValue.dataElement;
														if (dataElement == 'bsOhL5gMiA2') {
															if (dataValue.value != undefined) {
																cumulativeTotal = 1.0*cumulativeTotal + (dataValue.value)*1.0;
																//console.log('event: ' + event.event +'  dataValue: ' + dataValue.value);		
																row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)			
															}
															return false;
														}
													})
												}
											})
										}
									}
									})

								//row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)
								var el = angular.element(row);
								var scope = el.scope();
								var $injector = el.injector();
								$injector.invoke(function ($compile) {
									$compile(el)(scope)
								})


							}
							else if (row.cells[3] != undefined && row.id == "row-lOl69tQ4SsN")
							{
									$.getJSON(selectedEntityUrl,
									function (json) {
									var cumulativeTotal = 0;					
									var enrollmentsjson = json;
									if (enrollmentsjson.enrollments != undefined) {
												
										if (enrollmentsjson.enrollments[0].events.length > 0) {
											
											$.each(enrollmentsjson.enrollments[0].events, function (i, event) {
												if (event.programStage == 'mRDg7F9tAZH') {
													$.each(event.dataValues, function (s, dataValue) {
														var dataElement = dataValue.dataElement;
														if (dataElement == 'lOl69tQ4SsN') {
															if (dataValue.value != undefined) {
																cumulativeTotal = 1.0*cumulativeTotal + (dataValue.value)*1.0;
																//console.log('event: ' + event.event +'  dataValue: ' + dataValue.value);	
																row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)				
															}
															return false;
														}
													})
												}
											})
										}
									}
									})

								//row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)
								var el = angular.element(row);
								var scope = el.scope();
								var $injector = el.injector();
								$injector.invoke(function ($compile) {
									$compile(el)(scope)
								})


							}
							else if (row.cells[3] != undefined && row.id == "row-YWT49rK48Kv")
							{
									$.getJSON(selectedEntityUrl,
									function (json) {
									var cumulativeTotal = 0;					
									var enrollmentsjson = json;
									if (enrollmentsjson.enrollments != undefined) {
												
										if (enrollmentsjson.enrollments[0].events.length > 0) {
											
											$.each(enrollmentsjson.enrollments[0].events, function (i, event) {
												if (event.programStage == 'mRDg7F9tAZH') {
													$.each(event.dataValues, function (s, dataValue) {
														var dataElement = dataValue.dataElement;
														if (dataElement == 'YWT49rK48Kv') {
															if (dataValue.value != undefined) {
																cumulativeTotal = 1.0*cumulativeTotal + (dataValue.value)*1.0;
																//console.log('event: ' + event.event +'  dataValue: ' + dataValue.value);
																row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)					
															}
															return false;
														}
													})
												}
											})
										}
									}
									})

								//row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)
								var el = angular.element(row);
								var scope = el.scope();
								var $injector = el.injector();
								$injector.invoke(function ($compile) {
									$compile(el)(scope)
								})


							}
							else if (row.cells[3] != undefined && row.id == "row-Avuy4qMx47D")
							{
								
								$.getJSON(selectedEntityUrl,
									function (json) {	
									var cumulativeTotal = 0;				
									var enrollmentsjson = json;
									if (enrollmentsjson.enrollments != undefined) {
												
										if (enrollmentsjson.enrollments[0].events.length > 0) {
											
											$.each(enrollmentsjson.enrollments[0].events, function (i, event) {
												if (event.programStage == 'mRDg7F9tAZH') {
													$.each(event.dataValues, function (s, dataValue) {
														var dataElement = dataValue.dataElement;
														if (dataElement == 'Avuy4qMx47D') {
															if (dataValue.value != undefined) {
																cumulativeTotal = 1.0*cumulativeTotal + (dataValue.value)*1.0;
																//console.log('event: ' + event.event +'  dataValue: ' + dataValue.value);
																row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)					
															}
															return false;
														}
													})
												}
											})
										}
									}
									})

								//row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)
								var el = angular.element(row);
								var scope = el.scope();
								var $injector = el.injector();
								$injector.invoke(function ($compile) {
									$compile(el)(scope)
								})


							}
							else if (row.cells[3] != undefined && row.id == "row-XE0l3snpzH8" )
							{							

								$.getJSON(selectedEntityUrl,
									function (json) {	
										var cumulativeTotal = 0;				
									var enrollmentsjson = json;
									if (enrollmentsjson.enrollments != undefined) {
												
										if (enrollmentsjson.enrollments[0].events.length > 0) {
											
											$.each(enrollmentsjson.enrollments[0].events, function (i, event) {
												if (event.programStage == 'mRDg7F9tAZH') {
													$.each(event.dataValues, function (s, dataValue) {
														var dataElement = dataValue.dataElement;
														if (dataElement == 'XE0l3snpzH8') {
															if (dataValue.value != undefined) {
																cumulativeTotal = 1.0*cumulativeTotal + (dataValue.value)*1.0;
																//console.log('event: ' + event.event +'  dataValue: ' + dataValue.value);
																row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)					
															}
															return false;
														}
													})
												}
											})
										}
									}
									})

								//row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)
								var el = angular.element(row);
								var scope = el.scope();
								var $injector = el.injector();
								$injector.invoke(function ($compile) {
									$compile(el)(scope)
								})

							}
							else if (row.cells[3] != undefined && row.id == "row-kL42B2XHokE")
							{						

								$.getJSON(selectedEntityUrl,
									function (json) {	
									var cumulativeTotal = 0;				
									var enrollmentsjson = json;
									if (enrollmentsjson.enrollments != undefined) {
												
										if (enrollmentsjson.enrollments[0].events.length > 0) {
											
											$.each(enrollmentsjson.enrollments[0].events, function (i, event) {
												if (event.programStage == 'mRDg7F9tAZH') {
													$.each(event.dataValues, function (s, dataValue) {
														var dataElement = dataValue.dataElement;
														if (dataElement == 'kL42B2XHokE') {
															if (dataValue.value != undefined) {
																cumulativeTotal = 1.0*cumulativeTotal + (dataValue.value)*1.0;
																//console.log('event: ' + event.event +'  dataValue: ' + dataValue.value);
																row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)					
															}
															return false;
														}
													})
												}
											})
										}
									}
									})

								//row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)
								var el = angular.element(row);
								var scope = el.scope();
								var $injector = el.injector();
								$injector.invoke(function ($compile) {
									$compile(el)(scope)
								})

							}
							else if (row.cells[3] != undefined && row.id == "row-xp2cVKbT7z8")
							{
							

								$.getJSON(selectedEntityUrl,
									function (json) {		
										var cumulativeTotal = 0;			
									var enrollmentsjson = json;
									if (enrollmentsjson.enrollments != undefined) {
												
										if (enrollmentsjson.enrollments[0].events.length > 0) {
											
											$.each(enrollmentsjson.enrollments[0].events, function (i, event) {
												if (event.programStage == 'mRDg7F9tAZH') {
													$.each(event.dataValues, function (s, dataValue) {
														var dataElement = dataValue.dataElement;
														if (dataElement == 'xp2cVKbT7z8') {
															if (dataValue.value != undefined) {
																cumulativeTotal = 1.0*cumulativeTotal + (dataValue.value)*1.0;
																//console.log('event: ' + event.event +'  dataValue: ' + dataValue.value);
																row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)					
															}
															return false;
														}
													})
												}
											})
										}
									}
									})

								//row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)
								var el = angular.element(row);
								var scope = el.scope();
								var $injector = el.injector();
								$injector.invoke(function ($compile) {
									$compile(el)(scope)
								})

							}
							else if (row.cells[3] != undefined && row.id == "row-A3h8GTMv3CK")
							{
								$.getJSON(selectedEntityUrl,
									function (json) {		
										var cumulativeTotal = 0;			
									var enrollmentsjson = json;
									if (enrollmentsjson.enrollments != undefined) {
												
										if (enrollmentsjson.enrollments[0].events.length > 0) {
											
											$.each(enrollmentsjson.enrollments[0].events, function (i, event) {
												if (event.programStage == 'mRDg7F9tAZH') {
													$.each(event.dataValues, function (s, dataValue) {
														var dataElement = dataValue.dataElement;
														if (dataElement == 'A3h8GTMv3CK') {
															if (dataValue.value != undefined) {
																cumulativeTotal = 1.0*cumulativeTotal + (dataValue.value)*1.0;
																//console.log('event: ' + event.event +'  dataValue: ' + dataValue.value);	
																row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)				
															}
															return false;
														}
													})
												}
											})
										}
									}
									})

								//row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)
								var el = angular.element(row);
								var scope = el.scope();
								var $injector = el.injector();
								$injector.invoke(function ($compile) {
									$compile(el)(scope)
								})

								

							}
							else if (row.cells[3] != undefined && row.id == "row-jfJfoWAp5xb")
							{

								$.getJSON(selectedEntityUrl,
									function (json) {	
										var cumulativeTotal = 0;				
									var enrollmentsjson = json;
									if (enrollmentsjson.enrollments != undefined) {
												
										if (enrollmentsjson.enrollments[0].events.length > 0) {
											
											$.each(enrollmentsjson.enrollments[0].events, function (i, event) {
												if (event.programStage == 'mRDg7F9tAZH') {
													$.each(event.dataValues, function (s, dataValue) {
														var dataElement = dataValue.dataElement;
														if (dataElement == 'jfJfoWAp5xb') {
															if (dataValue.value != undefined) {
																cumulativeTotal = 1.0*cumulativeTotal + (dataValue.value)*1.0;
																//console.log('event: ' + event.event +'  dataValue: ' + dataValue.value);
																row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)					
															}
															return false;
														}
													})
												}
											})
										}
									}
									})

								//row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)
								var el = angular.element(row);
								var scope = el.scope();
								var $injector = el.injector();
								$injector.invoke(function ($compile) {
									$compile(el)(scope)
								})

							}
							else if (row.cells[3] != undefined && row.id == "row-Pg1qZvjwNLd")
							{
								$.getJSON(selectedEntityUrl,
									function (json) {	
										var cumulativeTotal = 0;				
									var enrollmentsjson = json;
									if (enrollmentsjson.enrollments != undefined) {
												
										if (enrollmentsjson.enrollments[0].events.length > 0) {
											
											$.each(enrollmentsjson.enrollments[0].events, function (i, event) {
												if (event.programStage == 'mRDg7F9tAZH') {
													$.each(event.dataValues, function (s, dataValue) {
														var dataElement = dataValue.dataElement;
														if (dataElement == 'Pg1qZvjwNLd') {
															if (dataValue.value != undefined) {
																cumulativeTotal = 1.0*cumulativeTotal + (dataValue.value)*1.0;
																//console.log('event: ' + event.event +'  dataValue: ' + dataValue.value);
																row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)					
															}
															return false;
														}
													})
												}
											})
										}
									}
									})

								//row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)
								var el = angular.element(row);
								var scope = el.scope();
								var $injector = el.injector();
								$injector.invoke(function ($compile) {
									$compile(el)(scope)
								})

							}
							else if (row.cells[3] != undefined && row.id == "row-Vg7NPVpmPvi")
							{
								
								$.getJSON(selectedEntityUrl,
									function (json) {	
										var cumulativeTotal = 0;				
									var enrollmentsjson = json;
									if (enrollmentsjson.enrollments != undefined) {
												
										if (enrollmentsjson.enrollments[0].events.length > 0) {
											
											$.each(enrollmentsjson.enrollments[0].events, function (i, event) {
												if (event.programStage == 'mRDg7F9tAZH') {
													$.each(event.dataValues, function (s, dataValue) {
														var dataElement = dataValue.dataElement;
														if (dataElement == 'Vg7NPVpmPvi') {
															if (dataValue.value != undefined) {
																cumulativeTotal = 1.0*cumulativeTotal + (dataValue.value)*1.0;
																//console.log('event: ' + event.event +'  dataValue: ' + dataValue.value);
																row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)					
															}
															return false;
														}
													})
												}
											})
										}
									}
									})

								//row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)
								var el = angular.element(row);
								var scope = el.scope();
								var $injector = el.injector();
								$injector.invoke(function ($compile) {
									$compile(el)(scope)
								})

							}
							else if (row.cells[3] != undefined && row.id == "row-TlyT82eTiFU")
							{							
								$.getJSON(selectedEntityUrl,
									function (json) {	
										var cumulativeTotal = 0;				
									var enrollmentsjson = json;
									if (enrollmentsjson.enrollments != undefined) {
												
										if (enrollmentsjson.enrollments[0].events.length > 0) {
											
											$.each(enrollmentsjson.enrollments[0].events, function (i, event) {
												if (event.programStage == 'mRDg7F9tAZH') {
													$.each(event.dataValues, function (s, dataValue) {
														var dataElement = dataValue.dataElement;
														if (dataElement == 'TlyT82eTiFU') {
															if (dataValue.value != undefined) {
																cumulativeTotal = 1.0*cumulativeTotal + (dataValue.value)*1.0;
																//console.log('event: ' + event.event +'  dataValue: ' + dataValue.value);
																row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)					
															}
															return false;
														}
													})
												}
											})
										}
									}
									})

								//row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)
								var el = angular.element(row);
								var scope = el.scope();
								var $injector = el.injector();
								$injector.invoke(function ($compile) {
									$compile(el)(scope)
								})


							}

							else if (row.cells[3] != undefined && row.id == "row-SnGNuVm0fbD")
							{							
								$.getJSON(selectedEntityUrl,
									function (json) {	
										var cumulativeTotal = 0;				
									var enrollmentsjson = json;
									if (enrollmentsjson.enrollments != undefined) {
												
										if (enrollmentsjson.enrollments[0].events.length > 0) {
											
											$.each(enrollmentsjson.enrollments[0].events, function (i, event) {
												if (event.programStage == 'mRDg7F9tAZH') {
													$.each(event.dataValues, function (s, dataValue) {
														var dataElement = dataValue.dataElement;
														if (dataElement == 'SnGNuVm0fbD') {
															if (dataValue.value != undefined) {
																cumulativeTotal = 1.0*cumulativeTotal + (dataValue.value)*1.0;
																//console.log('event: ' + event.event +'  dataValue: ' + dataValue.value);
																row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)					
															}
															return false;
														}
													})
												}
											})
										}
									}
									})

								//row.cells[3].innerHTML = '<p style="margin-bottom:.0001pt; padding:0cm 5.4pt 0cm 5.4pt">' + cumulativeTotal + '</p>';	//console.log(row.cells[3].innerHTML)
								var el = angular.element(row);
								var scope = el.scope();
								var $injector = el.injector();
								$injector.invoke(function ($compile) {
									$compile(el)(scope)
								})
							}
			})		
				
			//03/08/2020 - edit here for adding totals - end here
			

            

            } else {
                $scope.eventCreationForm.submitted = false;
            }
            $scope.lockButton = false;
        });
    };

    //Start referral logic
    $scope.setSelectedSearchingOrgUnit = function(orgUnit){
        $scope.selectedSearchingOrgUnit = orgUnit;
        dummyEvent.orgUnit = orgUnit.id;
        dummyEvent.orgUnitName = orgUnit.displayName;
    };

    if($scope.isReferralEvent){
        TCOrgUnitService.getSearchOrgUnitTree().then(function(searchOrgUnitTree){
            $scope.searchOrgUnitTree = searchOrgUnitTree;
        });
    }

    $scope.expandCollapseOrgUnitTree = function(orgUnit) {
        if(!orgUnit.children || orgUnit.children.length === 0) return;
        if(orgUnit.children[0].displayName){
            orgUnit.show = !orgUnit.show;
        }
        else {
            OrgUnitFactory.getChildren(orgUnit.id).then(function(ou){
                orgUnit.children = ou.children;
                orgUnit.show = !orgUnit.show;
            });
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
            $scope.attributesById = CurrentSelection.getAttributesById();
            $scope.optionSets = CurrentSelection.getOptionSets();
            var currSelections = CurrentSelection.get();
            $scope.tei = currSelections.tei;

            TEIService.changeTeiProgramOwner($scope.tei.trackedEntityInstance, $scope.selectedProgram.id, dummyEvent.orgUnit).then(function(response){
                $scope.save();
                $rootScope.$broadcast('ownerUpdated', {programExists: true});
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
