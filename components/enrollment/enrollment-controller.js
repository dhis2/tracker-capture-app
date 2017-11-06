/* global trackerCapture, angular */

var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('EnrollmentController',
        function($rootScope,
                $scope,  
                $route,
                $location,
                $timeout,
                $translate,
                $parse,
                DateUtils,
                SessionStorageService,
                CurrentSelection,
                EnrollmentService,
                ModalService,
                NotificationService) {
    
        var selections;

        //listen for the selected items
        $scope.$on('selectedItems', function (event, args) {
            selections = CurrentSelection.get();
            $scope.today = DateUtils.getToday();
            $scope.selectedOrgUnit = selections.orgUnit;
            $scope.attributes = [];
            $scope.historicalEnrollments = [];
            $scope.showEnrollmentDiv = false;
            $scope.showEnrollmentHistoryDiv = false;
            $scope.hasEnrollmentHistory = false;
            $scope.selectedEnrollment = null;
            $scope.currentEnrollment = null;
            $scope.newEnrollment = {};

            processSelectedTei();

            $scope.selectedEntity = selections.te;
            $scope.selectedProgram = selections.pr;
            $scope.optionSets = selections.optionSets;
            $scope.programs = selections.prs;
            $scope.hasOtherPrograms = $scope.programs.length > 1 ? true : false;
            var selectedEnrollment = selections.selectedEnrollment;
            $scope.enrollments = selections.enrollments;
            $scope.programExists = args.programExists;
            $scope.programNames = selections.prNames;

            $scope.programStageNames = selections.prStNames;
            $scope.attributesById = CurrentSelection.getAttributesById();
            $scope.activeEnrollments = [];
            angular.forEach(selections.enrollments, function (en) {
                if (en.status === "ACTIVE" && $scope.selectedProgram && $scope.selectedProgram.id !== en.program) {
                    $scope.activeEnrollments.push(en);
                }
            });
            if ($scope.selectedProgram) {

                $scope.stagesById = [];
                angular.forEach($scope.selectedProgram.programStages, function (stage) {
                    $scope.stagesById[stage.id] = stage;
                });

                angular.forEach($scope.enrollments, function (enrollment) {
                    if (enrollment.program === $scope.selectedProgram.id) {
                        if (enrollment.status === 'ACTIVE') {
                            selectedEnrollment = enrollment;
                            $scope.currentEnrollment = enrollment;
                        }
                        if (enrollment.status === 'CANCELLED' || enrollment.status === 'COMPLETED') {
                            $scope.historicalEnrollments.push(enrollment);
                            $scope.hasEnrollmentHistory = true;
                        }
                    }
                });
                if (selectedEnrollment && selectedEnrollment.status === 'ACTIVE') {
                    $scope.selectedEnrollment = selectedEnrollment;
                    $scope.loadEnrollmentDetails(selectedEnrollment);
                }
                else {
                    $scope.selectedEnrollment = null;
                    $scope.showEnrollmentHistoryDiv = true;
                    $scope.broadCastSelections('dashboardWidgets');
                }
            }
            else {
                $scope.broadCastSelections('dashboardWidgets');
            }
        });
        $scope.$on('teienrolled', function (event, args) {
            $route.reload();

        });
        $scope.verifyExpiryDate = function(eventDateStr) {
            var dateGetter = $parse(eventDateStr);
            var dateSetter = dateGetter.assign;
            var date = dateGetter($scope);
            if(!date) {
                return;
            }

            if (!DateUtils.verifyExpiryDate(date, $scope.selectedProgram.expiryPeriodType, $scope.selectedProgram.expiryDays)) {
                dateSetter($scope, null);
            }
        };
        $scope.loadEnrollmentDetails = function (enrollment) {
            $scope.showEnrollmentHistoryDiv = false;
            $scope.selectedEnrollment = enrollment;

            if ($scope.selectedEnrollment.enrollment && $scope.selectedEnrollment.orgUnit) {
                $scope.broadCastSelections('dashboardWidgets');
            }
        };

        $scope.showNewEnrollment = function () {
            if($scope.selectedProgram.onlyEnrollOnce && $scope.hasEnrollmentHistory) {
                var modalOptions = {
                    headerText: 'warning',
                    bodyText: 'can_not_add_new_enrollment'
                };
    
                ModalService.showModal({}, modalOptions);

                return;
            }
            
            $scope.showEnrollmentDiv = !$scope.showEnrollmentDiv;

            if(!$scope.showEnrollmentDiv) {
                return;
            }

            if ($scope.showEnrollmentDiv) {

                $scope.showEnrollmentHistoryDiv = false;

                //load new enrollment details
                $scope.selectedEnrollment = {orgUnitName: $scope.selectedOrgUnit.displayName};
                
                if( $scope.selectedProgram && $scope.selectedProgram.captureCoordinates ){
                    $scope.selectedEnrollment.coordinate = {};
                }

                $scope.loadEnrollmentDetails($scope.selectedEnrollment);
                
                $timeout(function () {
                    $rootScope.$broadcast('registrationWidget', {
                        registrationMode: 'ENROLLMENT',
                        selectedTei: $scope.selectedTei
                    });
                }, 200);
            }
            else {
                hideEnrollmentDiv();
            }
        };

        $scope.showEnrollmentHistory = function () {

            $scope.showEnrollmentHistoryDiv = !$scope.showEnrollmentHistoryDiv;

            if ($scope.showEnrollmentHistoryDiv) {
                $scope.selectedEnrollment = null;
                $scope.showEnrollmentDiv = false;

                $scope.broadCastSelections('dashboardWidgets');
            }
        };

        $scope.broadCastSelections = function (listeners) {
            var tei = selections.tei;
            CurrentSelection.set({
                tei: tei,
                te: $scope.selectedEntity,
                prs: $scope.programs,
                pr: $scope.selectedProgram,
                prNames: $scope.programNames,
                prStNames: $scope.programStageNames,
                enrollments: $scope.enrollments,
                selectedEnrollment: $scope.selectedEnrollment,
                optionSets: $scope.optionSets,
                orgUnit: selections.orgUnit
            });
            $timeout(function () {
                $rootScope.$broadcast(listeners, {});
            }, 200);
        };

        var processSelectedTei = function () {
            $scope.selectedTei = angular.copy(selections.tei);
            angular.forEach($scope.selectedTei.attributes, function (att) {
                $scope.selectedTei[att.attribute] = att.value;
            });
        };

        var hideEnrollmentDiv = function () {

            /*currently the only way to cancel enrollment window is by going through
             * the main dashboard controller. Here I am mixing program and programId,
             * as I didn't want to refetch program from server, the main dashboard
             * has already fetched the programs. With the ID passed to it, it will
             * pass back the actual program than ID.
             */
            processSelectedTei();
            $scope.selectedProgram = ($location.search()).program;
            $scope.broadCastSelections('mainDashboard');
        };

        $scope.activateDeactivateEnrollment = function () {
            
            if($scope.enrollmentForm && $scope.enrollmentForm.$invalid){
                NotificationService.showNotifcationDialog($translate.instant("error"), $translate.instant("form_invalid"));
                return;
            }
            
            var modalOptions = {
                closeButtonText: 'no',
                actionButtonText: 'yes',
                headerText: $scope.selectedEnrollment.status === 'CANCELLED' ? 'activate_enrollment' : 'deactivate_enrollment',
                bodyText: $scope.selectedEnrollment.status === 'CANCELLED' ? 'are_you_sure_to_activate_enrollment' : 'are_you_sure_to_deactivate_enrollment'
            };


            ModalService.showModal({}, modalOptions).then(function (result) {
                
                var en = angular.copy( $scope.selectedEnrollment );
                en.status = $scope.selectedEnrollment.status === 'CANCELLED' ? 'ACTIVE' : 'CANCELLED';
                EnrollmentService.update( en ).then(function ( data ) {
                    if( data && data.status === 'OK' ){
                        $scope.selectedEnrollment.status = $scope.selectedEnrollment.status === 'CANCELLED' ? 'ACTIVE' : 'CANCELLED';
                        $scope.loadEnrollmentDetails($scope.selectedEnrollment);
                    }                    
                });
            });
        };

        $scope.completeReopenEnrollment = function () {
            
            if($scope.enrollmentForm && $scope.enrollmentForm.$invalid){
                NotificationService.showNotifcationDialog($translate.instant("error"), $translate.instant("form_invalid"));
                return;
            }
            
            var modalOptions = {
                closeButtonText: 'no',
                actionButtonText: 'yes',
                headerText: $scope.selectedEnrollment.status === 'ACTIVE' ? 'complete_enrollment' : 'reopen_enrollment',
                bodyText: $scope.selectedEnrollment.status === 'ACTIVE' ? 'are_you_sure_to_complete_enrollment' : 'are_you_sure_to_reopen_enrollment'
            };


            ModalService.showModal({}, modalOptions).then(function (result) {
                
                var en = angular.copy( $scope.selectedEnrollment );
                en.status = $scope.selectedEnrollment.status === 'ACTIVE' ? 'COMPLETED' : 'ACTIVE';
                EnrollmentService.update( en ).then(function (data) {
                    if( data && data.status === 'OK' ){
                        $scope.selectedEnrollment.status = $scope.selectedEnrollment.status === 'ACTIVE' ? 'COMPLETED' : 'ACTIVE';
                        $scope.loadEnrollmentDetails($scope.selectedEnrollment);
                    }
                });
            });
        };
        
        $scope.deleteEnrollment = function () {

            var modalOptions = {
                closeButtonText: 'no',
                actionButtonText: 'yes',
                headerText: 'delete_enrollment',
                bodyText: 'are_you_sure_to_delete_enrollment'
            };

            ModalService.showModal({}, modalOptions).then(function (result) {                
                EnrollmentService.delete( $scope.selectedEnrollment.enrollment ).then(function (data) {
                    $scope.selectedEnrollment = null;
                    var advancedSearchOptions = CurrentSelection.getAdvancedSearchOptions();
                    advancedSearchOptions.refresh = true;
                    CurrentSelection.setAdvancedSearchOptions(advancedSearchOptions);

                    NotificationService.showNotifcationDialog($translate.instant('success'), $translate.instant('enrollment') + ' ' + $translate.instant('deleted'));                
                    $scope.back();
                });
            });
        };

        $scope.markForFollowup = function () {
            
            if($scope.enrollmentForm && $scope.enrollmentForm.$invalid){
                NotificationService.showNotifcationDialog($translate.instant("error"), $translate.instant("form_invalid"));
                return;
            }
            
            $scope.selectedEnrollment.followup = !$scope.selectedEnrollment.followup;
            EnrollmentService.update($scope.selectedEnrollment);
        };

        $scope.changeProgram = function (program) {
            var pr = $location.search().program;
            if (pr && pr === program) {
                $route.reload();
            }
            else {
                $location.path('/dashboard').search({tei: $scope.selectedTeiId, program: program, ou: $scope.selectedOrgUnit.id});
            }
        };

        $scope.canUseEnrollment = function () {

            if ($scope.selectedTei.inactive) {
                return false;
            }

            if ($scope.currentEnrollment && $scope.selectedEnrollment.enrollment !== $scope.currentEnrollment.enrollment) {
                if ($scope.currentEnrollment.status === 'ACTIVE') {
                    return false;
                }
            }
            return true;
        };
        
        $scope.saveCoordinate = function(param){            
            var en = angular.copy( $scope.currentEnrollment );            
            $scope.enrollmentLatSaved = false;
            $scope.enrollmentLngSaved = false;            
            EnrollmentService.update( en ).then(function (data) {
                $scope.enrollmentLatSaved = true;
                $scope.enrollmentLngSaved = true;
            });
        };
});
