/* global trackerCapture, angular */

var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('NotesController',
        function($scope,
                $translate,
                DateUtils,
                EnrollmentService,
                CurrentSelection,
                NotificationService,
                SessionStorageService,
                orderByFilter,
                UsersService) {
    var userProfile = SessionStorageService.get('USER_PROFILE');
    var storedBy = userProfile && userProfile.userCredentials && userProfile.userCredentials.username ? userProfile.userCredentials.username : '';

    var today = DateUtils.getToday();
    
    $scope.note = {};
    $scope.showNotesDiv = true;
    
    $scope.$on('dashboardWidgets', function() {
        $scope.selectedEnrollment = null;
        var selections = CurrentSelection.get();
        $scope.selectedTei = selections.tei;
        
        if(selections.selectedEnrollment && selections.selectedEnrollment.enrollment){ 
            $scope.selectedEnrollment = angular.copy(selections.selectedEnrollment);
            if (!angular.isUndefined($scope.selectedEnrollment.notes)) {
                $scope.selectedEnrollment.notes = orderByFilter($scope.selectedEnrollment.notes, '-storedDate');
                angular.forEach($scope.selectedEnrollment.notes, function (note) {
                    $scope.updateNoteWithRealName(note);
                    note.displayDate = DateUtils.formatFromApiToUser(note.storedDate);
                    note.storedDate = DateUtils.formatToHrsMins(note.storedDate);
                });
            }
        }
    });

    $scope.updateNoteWithRealName = function(note) {
        UsersService.getByQuery(note.storedBy).then( function(users) {
            if(users.length === 1) {
                note.storedBy = users[0].firstName + ' ' + users[0].lastName;
            }
        }); 
    }

    $scope.$on('notificationSuccessful', function(event,messageText) {
        $scope.addNote(messageText);
    });
    
    $scope.addNote = function(noteText){
        if(!noteText) {
            noteText = $scope.note.value;
        }

        if(!noteText){
            NotificationService.showNotifcationDialog($translate.instant("error"), $translate.instant("please_add_some_text"));
            return;
        }

        var newNote = {value: noteText, storedDate: DateUtils.formatFromUserToApi(today), displayDate: today, storedBy: storedBy};

        $scope.updateNoteWithRealName(newNote);

        if(angular.isUndefined( $scope.selectedEnrollment.notes) ){
            $scope.selectedEnrollment.notes = [newNote];

        }
        else{
            $scope.selectedEnrollment.notes.splice(0,0,newNote);
        }

        var e = angular.copy($scope.selectedEnrollment);
        e.enrollmentDate = DateUtils.formatFromUserToApi(e.enrollmentDate);
        if(e.incidentDate){
            e.incidentDate = DateUtils.formatFromUserToApi(e.incidentDate);
        }
        e.notes = [{value: newNote.value}];
        EnrollmentService.updateForNote(e).then(function(){
            $scope.clear();
        });
    };
    
    $scope.clear = function(){
        $scope.note = {};
    };
    
    $scope.showNotes = function(){
        $scope.showNotesDiv = !$scope.showNotesDiv;
    };

    $scope.copyNote = function(note) {
        var $temp = $("<input>");
        $("body").append($temp);
        $temp.val(note.value).select();
        document.execCommand("copy");
        $temp.remove();
    }

    $scope.printNote = function(note){
        var w=window.open();
        w.document.write('Dato: ' + note.displayDate + '(' + note.storedBy + ')<br>' + note.value);
        w.print();
        w.close();
    }
});
