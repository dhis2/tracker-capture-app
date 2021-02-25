/* global trackerCapture, angular */

//Controller for dashboard
var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('DashboardController',
    function ($rootScope,
            $scope,
            $location,
            $window,
            $modal,
            $timeout,
            $filter,
            $translate,
            $q,
            $route,
            $templateCache,
            TCStorageService,
            orderByFilter,
            SessionStorageService,
            TEIService,
            TEService,
            MetaDataFactory,
            EnrollmentService,
            ProgramFactory,
            DHIS2EventFactory,
            DashboardLayoutService,
            AttributesFactory,
            CurrentSelection,
            ModalService,
            AuthorityService,
            OrgUnitFactory,
            NotificationService,
            TeiAccessApiService) {


    var preAuditCancelled = function(){
        var modalOptions = {
            closeButtonText: "Cancel",
            actionButtonText: 'OK',
            headerText: 'Cancel audit',
            bodyText: 'Cancelling audit will redirect you back to home. Any changes that are not saved will be lost'
        };
        return ModalService.showModal({},modalOptions);

    }
    TeiAccessApiService.setAuditCancelledSettings({
        preAuditCancelled: preAuditCancelled,
        postAuditCancelled: function(){
            window.location.hash = '#/';
            window.location.reload();
        }
    });

    $scope.duplicateExists = false;
    $rootScope.hasAccess = false;
    $scope.APIURL = DHIS2URL;
    //selections
    var orgUnitUrl = ($location.search()).ou;
    var fromAudit = ($location.search()).fromAudit;
    $scope.topBarConfig = {};
    $scope.displayEnrollment = false;
    $scope.dataEntryMainMenuItemSelected = false;    
    $scope.metaDataCached = false;
    $scope.model = {orgUnitClosed: false};
    if ( !dhis2.tc.metaDataCached){
        downloadMetaData().then(function () {
            updateDashboard();
        });
    }
    else {
        updateDashboard();
    }

    $scope.returnUrl;
    if ( $location.search().returnUrl ) {
        $scope.returnUrl = $location.search().returnUrl;
    }

    function getOrgUnit() {
        var def = $q.defer();
        var selection = CurrentSelection.get();
        if(selection.orgUnit && selection.orgUnit.id === orgUnitUrl) {
            def.resolve(selection.orgUnit);
        } else {
            OrgUnitFactory.getFromStoreOrServer(orgUnitUrl).then(function(ou){
                def.resolve(ou);
            });
        }
        return def.promise;
    }

    var loadTrackedEntityType = function(){
        return TEService.get($scope.selectedTei.trackedEntityType).then(function (te) {
            $scope.trackedEntityType = te;
        });
    }

    function updateDashboard() {
        
        $scope.metaDataCached = true;

        getOrgUnit().then(function (orgUnit) {
            if (!orgUnit) {
                return;
            }

            $scope.selectedTeiId = ($location.search()).tei;
            $scope.selectedProgramId = $scope.selectedProgram ? $scope.selectedProgram.id : ($location.search()).program;
            $scope.selectedOrgUnit = orgUnit;
            $scope.userAuthority = AuthorityService.getUserAuthorities(SessionStorageService.get('USER_PROFILE'));
            $scope.sortedTeiIds = CurrentSelection.getSortedTeiIds();
            $scope.showSettingsButton = true;
            $scope.topbarClass = $scope.showSettingsButton ? "dashboard-info-box-sm" : "dashboard-info-box-lg";
            $scope.topbarRightSizeClass = $scope.showSettingsButton ? "dashboard-info-btn-right-two-buttons" : "dashboard-info-btn-right-one-button";

            //Labels
            $scope.removeLabel = $translate.instant('remove');
            $scope.expandLabel = $translate.instant('expand');
            $scope.collapseLabel = $translate.instant('collapse');
            $scope.noDataReportLabel = $translate.instant('no_data_report');
            $scope.noRelationshipLabel = $translate.instant('no_relationship');
            $scope.settingsLabel = $translate.instant('settings');
            $scope.showHideWidgetsLabel = $translate.instant('show_hide_widgets');
            $scope.notEnrolledLabel = $translate.instant('not_yet_enrolled_data_entry');
            $scope.stickLabel = $translate.instant('stick_right_widgets');
            $scope.unstickLabel = $translate.instant('unstick_right_widgets');

            $scope.model.stickyDisabled = true;
            $scope.previousTeiExists = false;
            $scope.nextTeiExists = false;

            $scope.temporaryHideWidgets = [];
            $scope.temporaryShowWidgets = [];

            if ($scope.sortedTeiIds && $scope.sortedTeiIds.length > 0) {
                var current = $scope.sortedTeiIds.indexOf($scope.selectedTeiId);

                if (current !== -1) {
                    if ($scope.sortedTeiIds.length - 1 > current) {
                        $scope.nextTeiExists = true;
                    }

                    if (current > 0) {
                        $scope.previousTeiExists = true;
                    }
                }
            }

            //get ouLevels
            TCStorageService.currentStore.open().done(function () {
                TCStorageService.currentStore.getAll('ouLevels').done(function (response) {
                    var ouLevels = angular.isObject(response) ? orderByFilter(response, '-level').reverse() : [];
                    CurrentSelection.setOuLevels(orderByFilter(ouLevels, '-level').reverse());
                });
            });

            if ($scope.selectedTeiId) {

                TEIService.getPotentialDuplicatesForTei($scope.selectedTeiId).then(function(duplicates){
                    $scope.potentialDuplicates = duplicates.identifiableObjects;
                    $scope.duplicateExists = $scope.potentialDuplicates.length > 0 ? true : false;
                });
                
                //get option sets
                $scope.optionSets = [];
                MetaDataFactory.getAll('optionGroups').then(function(optionGroups){
                    var optionGroupsById = optionGroups.toHashMap('id', function(map,obj,key) { obj.optionsById = obj.options.toHashMap('id'); });
                    CurrentSelection.setOptionGroupsById(optionGroupsById);

                    MetaDataFactory.getAll('optionSets').then(function (optionSets) {
                        angular.forEach(optionSets, function (optionSet) {
                            $scope.optionSets[optionSet.id] = optionSet;
                        });
    
                        AttributesFactory.getAll().then(function (atts) {
    
                            $scope.attributesById = [];
                            angular.forEach(atts, function (att) {
                                $scope.attributesById[att.id] = att;
                            });
    
                            CurrentSelection.setAttributesById($scope.attributesById);
                            var teiPromise;

                            if($scope.selectedProgramId){
                                teiPromise = TEIService.getWithProgramData($scope.selectedTeiId, $scope.selectedProgramId, $scope.optionSets, $scope.attributesById, fromAudit);
                            }else{
                                teiPromise = TEIService.get($scope.selectedTeiId,$scope.optionSets, $scope.attributesById);
                            }
                            //Fetch the selected entity
                            teiPromise.then(function (response) {
                                $rootScope.hasAccess = true;
                                if (response) {
                                    $scope.selectedTei = response;

                                    //get the entity type
                                    loadTrackedEntityType().then(function () {
                                        var enrollments = ($scope.selectedTei && $scope.selectedTei.enrollments) || [];
                                        $scope.allEnrollments = angular.copy(enrollments);
                                        var selectedEnrollment = null;
                                        if(enrollments){
                                            selectedEnrollment = enrollments.find(function(e){ return e.program === $scope.selectedProgramId && e.status === 'ACTIVE'; });
                                        }

                                        ProgramFactory.getProgramsByOu($scope.selectedOrgUnit, selectedEnrollment ? true : false,
                                            selectedEnrollment ? {id:selectedEnrollment.program} : null).then(function (response) {
                                            $scope.programs = [];
                                            $scope.programNames = [];
                                            $scope.programStageNames = [];

                                            //get programs valid for the selected ou and tei
                                            angular.forEach(response.programs, function (program) {
                                                if (program.trackedEntityType && program.trackedEntityType.id === $scope.selectedTei.trackedEntityType) {
                                                    $scope.programs.push(program);
                                                    $scope.programNames[program.id] = {
                                                        id: program.id,
                                                        displayName: program.displayName
                                                    };
                                                    angular.forEach(program.programStages, function (stage) {
                                                        $scope.programStageNames[stage.id] = {
                                                            id: stage.id,
                                                            displayName: stage.displayName
                                                        };
                                                    });

                                                    if ($scope.selectedProgramId && program.id === $scope.selectedProgramId) {
                                                        $scope.selectedProgram = program;
                                                    }
                                                }
                                            });

                                            var events = enrollments.reduce(function(previousEvents,e) {
                                                var events = previousEvents.concat(e.events);
                                                return events;
                                            },[]);

                                            //var events = (selectedEnrollment && selectedEnrollment.events) || [];
                                            //prepare selected items for broadcast
                                            CurrentSelection.setSelectedTeiEvents(events);
                                            CurrentSelection.set({
                                                tei: $scope.selectedTei,
                                                te: $scope.trackedEntityType,
                                                prs: $scope.programs,
                                                pr: $scope.selectedProgram,
                                                prNames: $scope.programNames,
                                                prStNames: $scope.programStageNames,
                                                enrollments: enrollments,
                                                selectedEnrollment: selectedEnrollment,
                                                optionSets: $scope.optionSets,
                                                orgUnit: $scope.selectedOrgUnit
                                            });
                                            getDashboardLayout();
                                        });
                                    });
                                }
                            }, function(error){
                                if(error && error.auditDismissed){
                                    $rootScope.hasAccess = false;
                                }
                            });
                        });
                    });
                });
            }            
        });
    }
    
    //dashboard items
    var getDashboardLayout = function () {
        $scope.topBarConfig.settings = {};
        $rootScope.defaultDashboardWidgetsByTitle = {};
        $rootScope.dashboardWidgets = [];
        $scope.widgetsChanged = [];
        $scope.dashboardStatus = [];
        $scope.dashboardWidgetsOrder = {biggerWidgets: [], smallerWidgets: []};
        $scope.orderChanged = false;
        
        DashboardLayoutService.getLockedList().then(function(r){
            if(!r || r === '') {
                $scope.lockedList = {};
                DashboardLayoutService.saveLockedList($scope.lockedList);
            } else {
                $scope.lockedList = r;                
            }
        });

        DashboardLayoutService.get().then(function (response) {
            $scope.dashboardLayouts = response;
            var defaultLayout = $scope.dashboardLayouts.defaultLayout['DEFAULT'];
            var selectedLayout = null;
            if ($scope.selectedProgram && $scope.selectedProgram.id) {
                selectedLayout = $scope.dashboardLayouts.customLayout && $scope.dashboardLayouts.customLayout[$scope.selectedProgram.id] ? $scope.dashboardLayouts.customLayout[$scope.selectedProgram.id] : $scope.dashboardLayouts.defaultLayout[$scope.selectedProgram.id];
            }
            selectedLayout = !selectedLayout ? defaultLayout : selectedLayout;

            if($scope.selectedProgram && $scope.lockedList[$scope.selectedProgram.id]) {
                selectedLayout = $scope.dashboardLayouts.defaultLayout[$scope.selectedProgram.id] ? $scope.dashboardLayouts.defaultLayout[$scope.selectedProgram.id] : defaultLayout;
            }
            
            $scope.model.stickyDisabled = selectedLayout.stickRightSide ? !selectedLayout.stickRightSide : true;
            
            angular.forEach(selectedLayout.widgets, function (widget) {
                if (widget.title !== "activePrograms") {
                    $rootScope[widget.title + 'Widget'] = widget;
                    $rootScope.dashboardWidgets.push($rootScope[widget.title + 'Widget']);
                    $scope.dashboardStatus[widget.title] = angular.copy(widget);
                }
            });

            angular.forEach(defaultLayout.widgets, function (w) {
                if (!$scope.dashboardStatus[w.title]) {
                    $rootScope[w.title + 'Widget'] = w;
                    $rootScope.dashboardWidgets.push($rootScope[w.title + 'Widget']);
                    $scope.dashboardStatus[w.title] = angular.copy(w);
                }
                $rootScope.defaultDashboardWidgetsByTitle[w.title] = w;
            });

            if(selectedLayout.topBarSettings){
                $scope.topBarConfig.settings = selectedLayout.topBarSettings;
            }else{
                selectedLayout.topBarSettings = $scope.topBarConfig.settings;
            }

            $scope.hasBigger = false;
            angular.forEach(orderByFilter($filter('filter')($scope.dashboardWidgets, {parent: "biggerWidget"}), 'order'), function (w) {
                if (w.show) {
                    $scope.hasBigger = true;
                }
                $scope.dashboardWidgetsOrder.biggerWidgets.push(w.title);
            });

            $scope.hasSmaller = false;
            angular.forEach(orderByFilter($filter('filter')($scope.dashboardWidgets, {parent: "smallerWidget"}), 'order'), function (w) {
                if (w.show) {
                    $scope.hasSmaller = true;
                }
                $scope.dashboardWidgetsOrder.smallerWidgets.push(w.title);
            });

            setWidgetsSize();
            $scope.broadCastSelections();
            setInactiveMessage();
        });
    };

    $rootScope.getWidget = function(widgetTitle){
        var result = $.grep($rootScope.dashboardWidgets, function(widget)
        { 
            return widget.title === widgetTitle;
        });
        if(result.length > 0) return result[0];
        return null;
    }

    var setWidgetsSize = function () {

        $scope.widgetSize = {smaller: "col-sm-6 col-md-4", bigger: "col-sm-6 col-md-8"};

        if (!$scope.hasSmaller) {
            $scope.widgetSize = {smaller: "col-sm-1", bigger: "col-sm-11"};
        }

        if (!$scope.hasBigger) {
            $scope.widgetSize = {smaller: "col-sm-11", bigger: "col-sm-1"};
        }
    };

    var setInactiveMessage = function () {
        if ($scope.selectedTei.inactive) {
            var teName = $scope.trackedEntityType && $scope.trackedEntityType.displayName ? $scope.trackedEntityType.displayName : $translate.instance('tracked_entity_instance');
            setHeaderDelayMessage(teName + " " + $translate.instant('tei_inactive_only_read'));
        }
    };
    
    //listen for any change to program selection
    //it is possible that such could happen during enrollment.
    $scope.$on('mainDashboard', function (event, args) {
        var selections = CurrentSelection.get();
        $scope.selectedProgram = null;
        angular.forEach($scope.programs, function (pr) {
            if (pr.id === selections.pr) {
                $scope.selectedProgram = pr;
            }
        });

        $scope.applySelectedProgram();
    });

    function getCurrentDashboardLayout() {
        var widgets = [];
        $scope.hasBigger = false;
        $scope.hasSmaller = false;
        angular.forEach($rootScope.dashboardWidgets, function (widget) {
            var w = angular.copy(widget);
            if ($scope.orderChanged) {
                if ($scope.widgetsOrder.biggerWidgets.indexOf(w.title) !== -1) {
                    $scope.hasBigger = $scope.hasBigger || w.show;
                    w.parent = 'biggerWidget';
                    w.order = $scope.widgetsOrder.biggerWidgets.indexOf(w.title);
                }

                if ($scope.widgetsOrder.smallerWidgets.indexOf(w.title) !== -1) {
                    $scope.hasSmaller = $scope.hasSmaller || w.show;
                    w.parent = 'smallerWidget';
                    w.order = $scope.widgetsOrder.smallerWidgets.indexOf(w.title);
                }
            }
            widgets.push(w);
        });

        return {widgets: widgets, topBarSettings: $scope.topBarConfig.settings, program: $scope.selectedProgram && $scope.selectedProgram.id ? $scope.selectedProgram.id : 'DEFAULT', programStageTimeLineLayout: DashboardLayoutService.getProgramStageLayout()};
    }

    function saveDashboardLayout() {
        var currentLayout = $scope.dashboardLayouts.customLayout ? angular.copy($scope.dashboardLayouts.customLayout) : {};
        var programId = $scope.selectedProgram && $scope.selectedProgram.id ? $scope.selectedProgram.id : 'DEFAULT';        
        currentLayout[programId] = getCurrentDashboardLayout();
        
        DashboardLayoutService.saveLayout(currentLayout, false).then(function () {
            if (!$scope.orderChanged) {
                $scope.hasSmaller = $filter('filter')($scope.dashboardWidgets, {
                    parent: "smallerWidget",
                    show: true
                }).length > 0;
                $scope.hasBigger = $filter('filter')($scope.dashboardWidgets, {
                    parent: "biggerWidget",
                    show: true
                }).length > 0;
            }
            setWidgetsSize();
        });
    };
    
    $scope.saveDashboarLayoutAsDefault = function () {
        var layout = angular.copy($scope.dashboardLayouts.defaultLayout);        
        var programId = $scope.selectedProgram && $scope.selectedProgram.id ? $scope.selectedProgram.id : 'DEFAULT';        
        layout[programId] = getCurrentDashboardLayout();
        delete layout.DEFAULT;
        DashboardLayoutService.saveLayout(layout, true);
    };

    $scope.toggleLockDashboard = function () {
        $scope.lockedList[$scope.selectedProgram.id] = !$scope.lockedList[$scope.selectedProgram.id];

        if($scope.selectedProgram && $scope.selectedProgram.id) {
            DashboardLayoutService.saveLockedList($scope.lockedList);
        } else {
            alert("No program selected.");
        }

    };

    //persist widget sorting
    $scope.applyWidgetsOrderChange = function(param){
        $scope.widgetsOrder = param;
        $scope.orderChanged = false;
        for (var i = 0; i < $scope.widgetsOrder.smallerWidgets.length; i++) {
            if ($scope.widgetsOrder.smallerWidgets.length === $scope.dashboardWidgetsOrder.smallerWidgets.length && $scope.widgetsOrder.smallerWidgets[i] !== $scope.dashboardWidgetsOrder.smallerWidgets[i]) {
                $scope.orderChanged = true;
            }

            if ($scope.widgetsOrder.smallerWidgets.length !== $scope.dashboardWidgetsOrder.smallerWidgets.length) {
                $scope.orderChanged = true;
            }
        }

        for (var i = 0; i < $scope.widgetsOrder.biggerWidgets.length; i++) {
            if ($scope.widgetsOrder.biggerWidgets.length === $scope.dashboardWidgetsOrder.biggerWidgets.length && $scope.widgetsOrder.biggerWidgets[i] !== $scope.dashboardWidgetsOrder.biggerWidgets[i]) {
                $scope.orderChanged = true;
            }

            if ($scope.widgetsOrder.biggerWidgets.length !== $scope.dashboardWidgetsOrder.biggerWidgets.length) {
                $scope.orderChanged = true;
            }
        }

        if ($scope.orderChanged) {
            saveDashboardLayout();
        }
    };

    $scope.$on('DataEntryMainMenuItemSelected', function (event) {
        $scope.dataEntryMainMenuItemSelected = true;
    });

    $scope.$on('ErollmentDeleted', function (args, data) {
        $scope.allEnrollments = data.enrollments;
        updateDashboard();
    });

    $scope.$on('DataEntryMainMenuVisibilitySet', function (event, data) {
        if (data.visible) {
            //hide all widgets except visibleItems in data
            angular.forEach($scope.dashboardWidgets, function (widget) {
                if (!data.visibleItems[widget.title]) {
                    $scope.temporaryHideWidgets[widget.title] = true;
                } else {
                    $scope.temporaryShowWidgets[widget.title] = true;
                }

            });
        } else if (data.closingStage) {//Palestine, show only closing stage

        } else {
            //show widgets, reset temporary settings
            $scope.temporaryHideWidgets = [];
            $scope.temporaryShowWidgets = [];

        }
    });
    
    $scope.applySelectedProgram = function (pr) {
        var path = {ou: $scope.selectedOrgUnit.id, tei: $scope.selectedTei.trackedEntityInstance};
        if (pr) {
            $scope.selectedProgram = pr;
            path.program = pr.id;
        } 
        if ($scope.returnUrl) {
            path.returnUrl = $scope.returnUrl;
        }

        $location.path('/dashboard').search(path);
    };

    $scope.broadCastSelections = function (tei) {

        var selections = CurrentSelection.get();
        if (tei) {
            $scope.selectedTei = tei;
        } else {
            $scope.selectedTei = selections.tei;
        }

        $scope.trackedEntityType = selections.te;
        $scope.optionSets = selections.optionSets;
        $scope.selectedEnrollment = null;

        if ($scope.selectedProgram) {
            for (var i = 0; i < selections.enrollments.length; i++) {
                if (selections.enrollments[i].program === $scope.selectedProgram.id) {
                    $scope.selectedEnrollment = selections.enrollments[i];
                    break;
                }
            }
        }

        CurrentSelection.set({
            tei: $scope.selectedTei,
            te: $scope.trackedEntityType,
            prs: $scope.programs,
            pr: $scope.selectedProgram,
            prNames: $scope.programNames,
            prStNames: $scope.programStageNames,
            enrollments: selections.enrollments,
            selectedEnrollment: $scope.selectedEnrollment,
            optionSets: $scope.optionSets,
            orgUnit: $scope.selectedOrgUnit
        });
        $timeout(function () {
            $rootScope.$broadcast('selectedItems', {programExists: $scope.programs.length > 0});
        }, 500);
    };



    $scope.activiateTEI = function () {
        var st = !$scope.selectedTei.inactive || $scope.selectedTei.inactive === '' ? true : false;

        var modalOptions = {
            closeButtonText: 'no',
            actionButtonText: 'yes',
            headerText: st ? 'deactivate' : 'activate',
            bodyText: 'are_you_sure_to_proceed'
        };

        ModalService.showModal({}, modalOptions).then(function (result) {

            $scope.selectedTei.inactive = st;
            TEIService.update($scope.selectedTei, $scope.optionSets, $scope.attributesById).then(function (data) {
                setInactiveMessage();
                $scope.broadCastSelections($scope.selectedTei);
            });
        }, function () {
        });
    };

    var canDeleteTei = function(){
        if($scope.trackedEntityType && $scope.trackedEntityType.access.data.write){
            if($scope.allEnrollments && $scope.allEnrollments.length > 0){
                if(!$scope.userAuthority.canCascadeDeleteTei) return false;
            }
            return true;
        }
        return false;
    }

    $scope.deleteTEI = function () {
        if(!canDeleteTei()){
            var bodyText = $translate.instant("cannot_delete_this_tei_because_it_already_contains_enrollments");
            var headerText = $translate.instant("delete_failed");
            NotificationService.showNotifcationDialog(headerText, bodyText);
            return;
        }
        var modalOptions = {
            closeButtonText: 'no',
            actionButtonText: 'yes',
            headerText: 'delete',
            bodyText: $translate.instant('are_you_sure_to_proceed') + ' ' + $translate.instant('will_delete_all_data_associated') + ' ' + $scope.trackedEntityType.displayName
        };
        
        ModalService.showModal({}, modalOptions).then(function (result) {
            TEIService.delete($scope.selectedTeiId).then(function (response) {
                if( !response ){
                    var teis = CurrentSelection.getTrackedEntityTypes();                
                    if( teis && teis.rows && teis.rows.own && teis.rows.own.length > 0 ){
                        var index = -1;
                        for( var i=0; i<teis.rows.own.length && index === -1; i++ ){
                            if( teis.rows.own[i].id === $scope.selectedTeiId ){
                                index = i;
                            }
                        }

                        if( index !== -1 ){
                            teis.rows.own.splice(index, 1);
                            CurrentSelection.setTrackedEntityTypes(teis);
                        }
                    }
                }
                NotificationService.showNotifcationDialog($translate.instant('success'), $scope.trackedEntityType.displayName + ' ' + $translate.instant('deleted'));                
                $scope.back();                
            });
        });
    };

    $scope.back = function () {
        if ( $scope.returnUrl ) {
            var returnUrl = '../' + atob($scope.returnUrl).replace(/^\//,"");
            $window.location.href = returnUrl;
        } else if (!$scope.dataEntryMainMenuItemSelected) {
            //reload OU tree
            selection.load();
            $location.path('/').search({program: $scope.selectedProgramId});
        } else {
            $rootScope.$broadcast('DashboardBackClicked');
            $scope.dataEntryMainMenuItemSelected = false;
        }
    };
            
    $scope.getBackButtonText = function () {
        if (!$scope.dataEntryMainMenuItemSelected) {
            return $translate.instant('back');
        } else {
            return $translate.instant('menu');
        }
    };

    $scope.showEnrollment = function () {
        $scope.displayEnrollment = true;
    };

    $scope.removeWidget = function (widget) {
        var modalOptions = {
            closeButtonText: 'no',
            actionButtonText: 'yes',
            headerText: 'remove_widget',
            bodyText: 'remove_widget_info'
        };

        ModalService.showModal({}, modalOptions).then(function (result) {
            widget.show = false;
            saveDashboardLayout();

        }, function () {

        });
    };

    $scope.expandCollapse = function (widget) {
        widget.expand = !widget.expand;
        saveDashboardLayout();
    };

    $scope.showHideWidgets = function () {
        var modalInstance = $modal.open({
            templateUrl: "components/dashboard/dashboard-widgets.html",
            controller: "DashboardWidgetsController"
        });

        modalInstance.result.then(function () {
        });
    };

    $rootScope.closeOpenWidget = function () {
        saveDashboardLayout();
    };

    $rootScope.getCurrentWidget = function(scope){
        var widgetLoaderScope = scope.$parent.$parent;
        if(widgetLoaderScope.biggerWidget) return widgetLoaderScope.biggerWidget;
        if(widgetLoaderScope.smallerWidget) return widgetLoaderScope.smallerWidget;
        return null;
    }

    $scope.openTopBarSettings = function(){
        $scope.topBarConfig.openSettings().then(function(topBarSettings){
            $scope.topBarConfig.settings = topBarSettings;

            saveDashboardLayout();
        });
    }

    $scope.fetchTei = function (mode) {
        var current = $scope.sortedTeiIds.indexOf($scope.selectedTeiId);
        var pr = $scope.selectedProgram ? $scope.selectedProgram.id : ($location.search()).program;
        var tei = null;
        if (mode === 'NEXT') {
            tei = $scope.sortedTeiIds[current + 1];
        } else {
            tei = $scope.sortedTeiIds[current - 1];
        }
        $location.path('/dashboard').search({tei: tei, program: pr ? pr : null, ou: orgUnitUrl ? orgUnitUrl : null});
    };

    $scope.showManageTeiDropdown = function(){
        return $scope.trackedEntityType && $scope.trackedEntityType.access.data.write && $scope.selectedProgram && $scope.selectedProgram.access.data.write;
    }
});
