import {
    INDEKSERING_PROGRAM_ID,
    INNREISE_PROGRAM_ID,
    NAERKONTAKT_PROGRAM_ID,
    OPPFOLGING_STAGE_ID,
    INDEKSERING_HELSESTATUS_PROGRAM_STAGE_ID,
    NAERKONTAKT_OPPFOLGING_PROGRAM_STAGE_ID
} from "../utils/constants";

export function addTildeltToTildeltList(scope, serverResponse, teiAccessApiService, metaDataFactory, q) {
    var teis = [];
    serverResponse.rows.forEach(function (row) {
        teis.push(row[0]);
    });

    var programAndStage = getEnrollmentProgramAndStage(scope);

    getTildeltBrukerForTeiAsync(teis, programAndStage.program, programAndStage.assignedUserStage, scope.selectedOrgUnit.id, teiAccessApiService, q).then(function (response) {
        setHeader(serverResponse, 'tildelt_data');
        setDataValue(serverResponse, response, programAndStage);
        scope.setServerResponse(serverResponse);
    });
}

function getEnrollmentProgramAndStage(scope) {
    var currentProgram = scope.base.selectedProgram.id;
    switch (currentProgram) {
        case INDEKSERING_PROGRAM_ID:
            return {
                program: INDEKSERING_PROGRAM_ID,
                assignedUserStage: INDEKSERING_HELSESTATUS_PROGRAM_STAGE_ID
            };
        case INNREISE_PROGRAM_ID:
            return {
                program: INNREISE_PROGRAM_ID,
                assignedUserStage: OPPFOLGING_STAGE_ID
            };
        case NAERKONTAKT_PROGRAM_ID:
            return {
                program: NAERKONTAKT_PROGRAM_ID,
                assignedUserStage: NAERKONTAKT_OPPFOLGING_PROGRAM_STAGE_ID
            };
        default:
            console.log('Could not find config for program with id: ' + currentProgram);
            return null;
    }
}

function setHeader(serverResponse, headerName) {
    serverResponse.headers.push({
        name: headerName,
        column: headerName,
        hidden: false,
        meta: false,
        type: 'java.lang.String'
    });
}

function setDataValue(serverResponse, values, programAndStage) {
    serverResponse.rows.forEach((row, index) => {
        // Setting full name in first name to get correct name in dropdown
        row.push({...programAndStage, assignedUser: values[index]});
    });

}

function getTildeltBrukerForTeiAsync(teis, programId, assignedUserStage, orgUnitId, teiAccessApiService, q) {
    var promises = [];
    teis.forEach(teiId => {
        promises.push(teiAccessApiService.get(null, programId, DHIS2URL + '/trackedEntityInstances/' + teiId + '.json?program=' + programId + '&fields=enrollments[program,events[programStage,assignedUser,eventDate,status]]')
            .then(result => result && result.data && result.data.enrollments));
    });
    return q.all(promises).then(teiEnrollments => {
        return teiEnrollments.map(enrollments => {
            var result = enrollments.find(enrollment => enrollment.program === programId);
            var nrNonCompletedEvents = result && result.events && result.events.filter(event => event.programStage === assignedUserStage && event.status !== "COMPLETED")
            if(nrNonCompletedEvents.length !== 1) {
                return 'CANNOT_ASSIGN_USER';
            }
            var events = result && result.events && result.events.filter(event => event.programStage === assignedUserStage && event.assignedUser  && event.status !== "COMPLETED");
            var assignedUsers = _.uniq(events && events.map(event => event.assignedUser));
            return assignedUsers[0];
        });
    });
}
