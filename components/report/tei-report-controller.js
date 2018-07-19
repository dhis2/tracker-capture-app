/* global trackerCapture, angular */

//conroller for tei report
var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('TeiReportController',
        function($scope,
                $filter,
                $translate,
                $location,
                CurrentSelection,
                DateUtils,
                EventUtils,
                TEIService,
                EnrollmentService,
                OrgUnitFactory,
                $q) {
    $scope.showProgramReportDetailsDiv = {};
    $scope.enrollmentsByProgram = [];
    $scope.orgUnitLabel = $translate.instant('org_unit');

    $scope.$on('dashboardWidgets', function(event, args) {        
        var selections = CurrentSelection.get();
        OrgUnitFactory.getOrgUnit(($location.search()).ou).then(function (orgUnit) {
            $scope.selectedOrgUnit = orgUnit;
            $scope.selectedTei = selections.tei;
            $scope.selectedEntity = selections.te;
            $scope.selectedProgram = selections.pr;
            $scope.optionSets = selections.optionSets;
            $scope.programs = selections.prs;
            $scope.programNames = selections.prNames;
            $scope.programStageNames = selections.prStNames;
            
            angular.forEach(selections.enrollments, function (en) {
                $scope.enrollmentsByProgram[en.program] = en;
            });

            if ($scope.selectedTei) {
                getEvents();
            }
        });
    });
    
    $scope.$on('tei-report-widget', function(event, eventContainer) {

        setEvents(angular.copy(eventContainer.events));
        loadReportDetails($scope.selectedProgram);
    });

    var getEvents = function() {
        var eventList = angular.copy( CurrentSelection.getSelectedTeiEvents() );        
        if($scope.selectedProgram && $scope.selectedProgram.id){
            eventList = $filter('filter')(eventList, {program: $scope.selectedProgram.id});
        }

        setEvents(eventList);
    }

    var setEvents = function(eventList){
        
        $scope.dataFetched = false;
        $scope.dataExists = false;
        
        $scope.report = [];
        angular.forEach($scope.programs, function(pr){
            $scope.report[pr.id] = {};
        });
        
        angular.forEach(eventList, function(ev){
            if(ev.program && $scope.report[ev.program] && ev.orgUnit){       
                ev.visited = true;
                ev.dueDate = DateUtils.formatFromApiToUser(ev.dueDate);  
                ev.sortingDate = ev.dueDate;
                ev.name = $scope.programStageNames[ev.programStage].displayName;
                ev.programName = $scope.programNames[ev.program].displayName;                    
                if(!$scope.report[ev.program].enrollments){
                    $scope.report[ev.program] = {enrollments: {}};
                }
                ev.statusColor = EventUtils.getEventStatusColor(ev); 

                if(ev.eventDate){
                    ev.eventDate = DateUtils.formatFromApiToUser(ev.eventDate);
                    ev.sortingDate = ev.eventDate;
                }
                else{
                    ev.visited = false;
                }                 

                if(ev.enrollment){
                    if($scope.report[ev.program].enrollments[ev.enrollment]){
                        $scope.report[ev.program].enrollments[ev.enrollment].push(ev);
                    }
                    else{
                        $scope.report[ev.program].enrollments[ev.enrollment]= [ev];
                    }
                }                    
                if(!$scope.dataExists){
                    $scope.dataExists = true;
                }
            }

            if(ev.dataValues){
                ev.dataValues.forEach(function(dataValue) {
                    if(angular.isUndefined(ev[dataValue.dataElement])){
                        ev[dataValue.dataElement] = dataValue.value;
                    }
                });
            }                
        });
        
        $scope.dataFetched = true;
        
    };

    $scope.toggleProgramReportDetails = function(pr){
        $scope.showProgramReportDetailsDiv[pr.id] = !$scope.showProgramReportDetailsDiv[pr.id];
        if($scope.showProgramReportDetailsDiv[pr.id]){
            loadReportDetails(pr);
        }
    };
    
    var loadReportDetails = function(pr){
        
        var selections = CurrentSelection.get();
        $scope.selectedTei = selections.tei;
        $scope.selectedReport = $scope.report[pr.id];
        
        //today as report date
        $scope.today = DateUtils.getToday();

        //process tei attributes, this is to have consistent display so that the tei 
        //contains program attributes whether it has value or not
        TEIService.processAttributes($scope.selectedTei, $scope.selectedProgram, $scope.enrollmentsByProgram[pr.id]).then(function(tei){
            $scope.tei = tei;
        });
        
        //get program stage for the selected program
        //they are needed to assign data element names for event data values
        $scope.stagesById = [];  
        $scope.allowProvidedElsewhereExists = [];
        $scope.prStDes = [];
        
        $scope.programStages = $scope.selectedProgram.programStages;
        angular.forEach($scope.programStages, function(stage){
            var providedElsewhereExists = false;
            for(var i=0; i<stage.programStageDataElements.length; i++){                
                if(stage.programStageDataElements[i].allowProvidedElsewhere && !providedElsewhereExists){
                    providedElsewhereExists = true;
                    $scope.allowProvidedElsewhereExists[stage.id] = true;
                }

                $scope.prStDes[stage.programStageDataElements[i].dataElement.id] = stage.programStageDataElements[i];
            }

            $scope.stagesById[stage.id] = stage;
        });        
        var allEnrollments = selections.enrollments;
        //program reports come grouped in enrollment, process for each enrollment
        var enrollments = [];
        var promises = [];
        if(!$scope.selectedReport.enrollments){
            $scope.enrollments = [];
            return;
        }
        Object.keys($scope.selectedReport.enrollments).forEach(function(enr) {
            $scope.selectedReport.enrollments[enr].forEach(function(ev) {
                if(ev.notes){
                    ev.notes.forEach(function(note) {
                        note.storedDate = DateUtils.formatToHrsMins(note.storedDate);
                    });
                }
            });
            var foundEnrollment = allEnrollments.find(function(e) { return e.enrollment === enr });
            var enrollment = angular.copy(foundEnrollment);
            if(enrollment.notes){
                enrollment.notes.forEach(function(note) {
                    note.storedDate = DateUtils.formatToHrsMins(note.storedDate);
                });
            }
            enrollments.push(enrollment);
        });
        $scope.enrollments = enrollments;
    };
    
    $scope.close = function(){
        $scope.showProgramReportDetailsDiv = false;
    };
    
    $scope.print = function(divName){
        $scope.showProgramReportDetailsDiv = false;
        var printContents = document.getElementById(divName).innerHTML;
        var popupWin = window.open('', '_blank', 'fullscreen=1');
        popupWin.document.open();
        popupWin.document.write('<html>\n\
                                        <head>\n\
                                                <link rel="stylesheet" type="text/css" href="../dhis-web-commons/bootstrap/css/bootstrap.min.css" />\n\
                                                <link rel="stylesheet" type="text/css" href="../dhis-web-commons/css/print.css" />\n\
                                                <link rel="stylesheet" type="text/css" href="styles/style.css" />\n\
                                                <link rel="stylesheet" type="text/css" href="styles/print.css" />\n\
                                        </head>\n\
                                        <body onload="window.print()">' + printContents + 
                                '</html>');
        popupWin.document.close();       
    };
});