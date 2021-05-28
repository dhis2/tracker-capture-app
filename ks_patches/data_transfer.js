import {
    NEARKONTAKT_PROGRAM_CODE,
    INDEKSERING_PROGRAM_CODE,
    NAERKONTAKT_TESTRESULT_PROGRAM_STAGE_CODE,
    INDEKSERING_TESTRESULT_PROGRAM_STAGE_CODE,
    NAERKONTAKT_HELSESTATUS_PROGRAM_STAGE_CODE, INDEKSERING_HELSESTATUS_PROGRAM_STAGE_CODE
} from "../utils/constants";

export function transferDataFromNaerkontaktToIndeksering(enrollmentResponse, tei, program, enrollmentService, eventFactory) {
    // Transfer only to indeksregistrering og oppfølging
    if(program !== INDEKSERING_PROGRAM_CODE) {
        return;
    }

    if(tei.enrollments) {
        tei.enrollments.forEach( enrollment => {
            // Transfer only data from Nærkontaktregistrering
            if (enrollment.program == NEARKONTAKT_PROGRAM_CODE) {
                transferEvents(enrollment.events, enrollmentResponse.enrollment, NAERKONTAKT_TESTRESULT_PROGRAM_STAGE_CODE, INDEKSERING_PROGRAM_CODE, INDEKSERING_TESTRESULT_PROGRAM_STAGE_CODE, eventFactory);
                transferEvents(enrollment.events, enrollmentResponse.enrollment, NAERKONTAKT_HELSESTATUS_PROGRAM_STAGE_CODE, INDEKSERING_PROGRAM_CODE, INDEKSERING_HELSESTATUS_PROGRAM_STAGE_CODE, eventFactory);
                transferNotes(enrollment.notes, enrollmentResponse, enrollmentService);
            }
        });
    }
}

function transferEvents(events, enrollmentId, fromProgramStage, toProgram, toProgramStage, eventFactory){
    events.forEach( event => {
        if(event.programStage == fromProgramStage) {
            var newEvent = angular.copy(event);
            newEvent.program = toProgram;
            newEvent.programStage = toProgramStage;
            newEvent.enrollment = enrollmentId;
            if(newEvent.notes) {
                newEvent.notes = newEvent.notes.map(note => {
                    delete note.note; // Cannot reuse note ID
                    return note;
                });
            }
            delete newEvent.event; // Cannot reuse event ID
            eventFactory.create(newEvent);
        }
    });
}

function transferNotes(notes, enrollmentResponse, enrollmentService) {
    var enrollmentUpdate = angular.copy(enrollmentResponse);
    delete enrollmentUpdate.enrollmentDate; // Date on wrong format. Not needed
    delete enrollmentUpdate.incidentDate; // Date on wrong format. Not needed
    enrollmentUpdate.notes = notes.map(note => {
        delete note.note; // Cannot reuse note ID
        return note;
    });
    enrollmentService.updateForNote(enrollmentUpdate);
}

