import {
    INDEKSERING_PROGRAM_ID,
    INNREISE_PROGRAM_ID,
    NEARKONTAKT_PROGRAM_ID,
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
        setHeader(serverResponse, 'tildelt_bruker');
        setDataValue(serverResponse, response);
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
        case NEARKONTAKT_PROGRAM_ID:
            return {
                program: NEARKONTAKT_PROGRAM_ID,
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

function setDataValue(serverResponse, values) {
    serverResponse.rows.forEach((row, index) => {
        row.push(values[index]);
    });

}

function getTildeltBrukerForTeiAsync(teis, programId, assignedUserStage, orgUnitId, teiAccessApiService, q) {
    var promises = [];
    teis.forEach(teiId => {
        promises.push(teiAccessApiService.get(null, programId, DHIS2URL + '/trackedEntityInstances/' + teiId + '.json?program=' + programId + '&fields=enrollments[program,events[programStage,assignedUserDisplayName,eventDate,status]]').then(result => result && result.data && result.data.enrollments));
    });
    return q.all(promises).then(teiEnrollments => {
        return teiEnrollments.map(enrollments => {
            var result = enrollments.find(enrollment => enrollment.program === programId);
            var events = result && result.events && result.events.filter(event => event.programStage === assignedUserStage && event.assignedUserDisplayName);
            var assignedUsers = _.uniq(events && events.map(event => event.assignedUserDisplayName));
            return assignedUsers.join(' & ');
        })
    })
}