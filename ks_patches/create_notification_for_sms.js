export function createNotificationForSms(smsMsg, phoneNumber, dateUtils, currentSelection, sessionStorageService, enrollmentService, scope) {
    var selections = currentSelection.get();
    var enrollment = selections.selectedEnrollment && selections.selectedEnrollment.enrollment;
    if (enrollment) {
        var selectedEnrollment = selections.selectedEnrollment;
        var today = dateUtils.getToday();
        var userProfile = sessionStorageService.get('USER_PROFILE');
        var storedBy = userProfile && userProfile.userCredentials && userProfile.userCredentials.username ? userProfile.userCredentials.username : '';

        var noteText = "SMS sendt til " + phoneNumber + " : " + smsMsg;
        var newNote = {
            value: noteText,
            storedDate: dateUtils.formatFromUserToApi(today),
            displayDate: today,
            storedBy: storedBy
        };
        if (selectedEnrollment.notes) {
            selectedEnrollment.notes.splice(0, 0, newNote);
        } else {
            selectedEnrollment.notes = [newNote];
        }
        enrollmentService.updateForNote(selectedEnrollment);
    }
}
