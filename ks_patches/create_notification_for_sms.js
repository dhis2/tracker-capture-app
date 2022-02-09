export function createNotificationForSms(smsMsg, phoneNumber, dateUtils, currentSelection, sessionStorageService, enrollmentService) {
    var selections = currentSelection.get();
    var enrollment = selections.selectedEnrollment && selections.selectedEnrollment.enrollment;
    if (enrollment) {
        var selectedEnrollment = selections.selectedEnrollment;

        var noteText = `SMS sendt til ${phoneNumber}: ${smsMsg}`;
        var newNote = {
            value: noteText,
        };
        selectedEnrollment.notes = [newNote];
        enrollmentService.updateForNote(selectedEnrollment);
    }
}
