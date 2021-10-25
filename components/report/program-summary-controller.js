/* global trackerCapture, angular */

var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('ProgramSummaryController',
        function($scope,
                DateUtils,
                EventUtils,
                TEIGridService,
                AttributesFactory,
                ProgramFactory,
                CurrentSelection,
                MetaDataFactory,
                EventReportService) {
    $scope.today = DateUtils.getToday();
    
    $scope.ouModes = [{name: 'SELECTED'}, {name: 'CHILDREN'}, {name: 'DESCENDANTS'}, {name: 'ACCESSIBLE'}];         
    $scope.selectedOuMode = $scope.ouModes[0];
    $scope.pager = { pageSize: reportEntriesLimit + 1, page: 1 };
    $scope.report = {};
    $scope.model = {};
    
    $scope.optionSets = null;
    if(!$scope.optionSets){
        $scope.optionSets = [];
        MetaDataFactory.getAll('optionSets').then(function(optionSets){
            angular.forEach(optionSets, function(optionSet){  
                $scope.optionSets[optionSet.id] = optionSet;
                optionSet.optionsByCode = {};
                angular.forEach(optionSet.options, function(option){
                    optionSet.optionsByCode[option.code] = option;
                });
            });
            CurrentSelection.setOptionSets($scope.optionSets);
        });
    }
    
    //watch for selection of org unit from tree
    $scope.$watch('selectedOrgUnit', function() {      
        $scope.model.selectedProgram = null;
        $scope.reportStarted = false;
        $scope.dataReady = false;  
        $scope.programStages = null;
        $scope.stagesById = [];
        if( angular.isObject($scope.selectedOrgUnit)){            
            $scope.loadPrograms($scope.selectedOrgUnit);
        }
    });
    
    //load programs associated with the selected org unit.
    $scope.loadPrograms = function(orgUnit) {        
        $scope.selectedOrgUnit = orgUnit;        
        if (angular.isObject($scope.selectedOrgUnit)){
            ProgramFactory.getProgramsByOu($scope.selectedOrgUnit,true, $scope.model.selectedProgram).then(function(response){
                $scope.programs = response.programs;
                $scope.model.selectedProgram = response.selectedProgram;
            });
        }        
    };
    
    $scope.$watch('model.selectedProgram', function() {        
        $scope.programStages = null;
        $scope.stagesById = [];
        if( angular.isObject($scope.model.selectedProgram)){            
            $scope.reportStarted = false;
            $scope.dataReady = false;            
            $scope.programStages = $scope.model.selectedProgram.programStages;
            $scope.stagesById = [];
            angular.forEach($scope.programStages, function(stage){
                $scope.stagesById[stage.id] = stage;
                stage.dataElementsById = {};
                if(stage.programStageDataElements){
                    angular.forEach(stage.programStageDataElements, function(prStDe){
                        stage.dataElementsById[prStDe.dataElement.id] = prStDe.dataElement;
                    });
                }
            });            
        }
    });

    $scope.ngSwitchParameter = function() {
        return $scope.eventRows.length > reportEntriesLimit ? -1 : $scope.teiList.length;
    }

    $scope.generateReport = function(program, report, ouMode){
        
        $scope.model.selectedProgram = program;
        $scope.report = report;
        $scope.selectedOuMode = ouMode;
        
        //check for form validity
        $scope.outerForm.submitted = true;        
        if( $scope.outerForm.$invalid || !$scope.model.selectedProgram){
            return false;
        }
        
        $scope.reportStarted = true;
        $scope.dataReady = false;
        $scope.eventRows = [];
            
        AttributesFactory.getByProgram($scope.model.selectedProgram).then(function(atts){
            $scope.model.selectedProgram.attributesById = {};
            angular.forEach(atts, function(attr){
                $scope.model.selectedProgram.attributesById[attr.id] = attr;
            });
            var grid = TEIGridService.generateGridColumns(atts, $scope.selectedOuMode.name,true);   
            $scope.gridColumns = grid.columns;
        });  
        
        EventReportService.getEventReport($scope.selectedOrgUnit.id, 
                                        $scope.selectedOuMode.name, 
                                        $scope.model.selectedProgram.id, 
                                        DateUtils.formatFromUserToApi($scope.report.startDate), 
                                        DateUtils.formatFromUserToApi($scope.report.endDate), 
                                        null,
                                        null, 
                                        $scope.pager).then(function(data){
            $scope.dhis2Events = [];  
            $scope.teiList = [];
            
            if( data && data.eventRows ){
                $scope.eventRows = data.eventRows;
                angular.forEach(data.eventRows, function(ev){
                    if(ev.trackedEntityInstance){
                        var stage = $scope.stagesById[ev.programStage];
                        if(stage){
                            ev.name = stage.displayName;
                            ev.programName = $scope.model.selectedProgram.displayName;
                            ev.statusColor = EventUtils.getEventStatusColor(ev); 
                            ev.eventDate = DateUtils.formatFromApiToUser(ev.eventDate);

                            angular.forEach(ev.dataValues, function(dv){
                                var de = stage.dataElementsById[dv.dataElement];
                                if(de && de.optionSetValue){
                                    var optionSet = $scope.optionSets[de.optionSet.id];
                                    if(optionSet.optionsByCode[dv.value]){
                                        ev[dv.dataElement] = optionSet.optionsByCode[dv.value].displayName;
                                    }
                                    else{
                                        ev[dv.dataElement] = dv.value;
                                    }
                                }else{
                                    ev[dv.dataElement] = dv.value;
                                }
                                $scope.stagesById[ev.programStage].hasData = true;
                            });

                            angular.forEach(ev.attributes, function(att){
                                var attr = $scope.model.selectedProgram.attributesById[att.attribute];
                                if(attr && attr.optionSetValue){
                                    var optionSet = $scope.optionSets[attr.optionSet.id];
                                    if(optionSet.optionsByCode[att.value].displayName){
                                        ev[att.attribute] = optionSet.optionsByCode[att.value].displayName;
                                    }
                                    else {
                                        ev[att.attribute] = att.value;
                                    }
                                }else{
                                    ev[att.attribute] = att.value;
                                }
                                
                            });

                            if($scope.teiList.indexOf(ev.trackedEntityInstance) === -1){
                                $scope.teiList.push( ev.trackedEntityInstance );
                            }
                            $scope.dhis2Events.push(ev);
                        }
                    }
                });
            }
            
            $scope.reportStarted = false;
            $scope.dataReady = true;            
        });
    };    
});