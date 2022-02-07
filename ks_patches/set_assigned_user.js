export function setAssignedUser(teiId, assignedUser, programId, programStage, DHIS2EventFactory, TEIService, DateUtils) {
    TEIService.getTeiWithAllAvailableFields(teiId, null, []).then((tei) => {
        if (tei && tei.enrollments) {
            var enrollment = tei.enrollments.find(enrollment => enrollment.program === programId && enrollment.status === 'ACTIVE');
            if (enrollment && enrollment.events) {
                var event = enrollment.events.find(event => event.programStage === programStage && event.status !== 'COMPLETED');
                setNewAssignedUser(event, assignedUser, DHIS2EventFactory);
            }
        }
    });
}

function setNewAssignedUser(event, assignedUser, DHIS2EventFactory) {
    event.assignedUser = assignedUser;
    DHIS2EventFactory.update(event).then(function (response) {

    });
}

