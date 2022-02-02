export function setAssignedUser(teiId, assignedUser, programId, programStage, DHIS2EventFactory, TEIService, DateUtils) {
    TEIService.getTeiWithAllAvailableFields(teiId, null, []).then((tei) => {
        if (tei && tei.enrollments) {
            var enrollment = tei.enrollments.find(enrollment => enrollment.program === programId);
            if (enrollment && enrollment.events) {
                var event = enrollment.events.find(event => event.programStage === programStage);
                if (event) {
                    setNewAssignedUser(event, assignedUser, DHIS2EventFactory);
                } else {
                    createNewEventAndAssignUser(teiId, programId, programStage, enrollment.enrollment, enrollment.orgUnit, assignedUser, DHIS2EventFactory, DateUtils);
                }
            }
        }
    });
}

function setNewAssignedUser(event, assignedUser, DHIS2EventFactory) {
    event.assignedUser = assignedUser;
    DHIS2EventFactory.update(event).then(function (response) {

    });
}

function createNewEventAndAssignUser(teiId, programId, programStage, enrollmentId, orgUnit, assignedUser, DHIS2EventFactory, DateUtils) {
    var newEvent = {
        trackedEntityInstance: teiId,
        program: programId,
        programStage: programStage,
        enrollment: enrollmentId,
        orgUnit: orgUnit,
        assignedUser: assignedUser,
        notes: [],
        dataValues: [],
        status: 'ACTIVE',
        eventDate: DateUtils.formatFromUserToApi(DateUtils.getToday())
    };
    DHIS2EventFactory.create(newEvent);
}

