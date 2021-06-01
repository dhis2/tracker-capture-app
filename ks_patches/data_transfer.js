import {
    NEARKONTAKT_PROGRAM_ID,
    INDEKSERING_PROGRAM_ID,
    NAERKONTAKT_TESTRESULT_PROGRAM_STAGE_ID,
    INDEKSERING_TESTRESULT_PROGRAM_STAGE_ID,
    NAERKONTAKT_HELSESTATUS_PROGRAM_STAGE_ID, INDEKSERING_HELSESTATUS_PROGRAM_STAGE_ID
} from "../utils/constants";

export function transferDataFromNaerkontaktToIndeksering(enrollmentResponse, tei, program, enrollmentService, eventFactory) {
    // Transfer only to indeksregistrering og oppfølging
    if(program !== INDEKSERING_PROGRAM_ID) {
        return;
    }

    if(tei.enrollments) {
        tei.enrollments.forEach( enrollment => {
            // Transfer only data from Nærkontaktregistrering
            if (enrollment.program == NEARKONTAKT_PROGRAM_ID) {
                transferEvents(enrollment.events, enrollmentResponse.enrollment, NAERKONTAKT_TESTRESULT_PROGRAM_STAGE_ID, INDEKSERING_PROGRAM_ID, INDEKSERING_TESTRESULT_PROGRAM_STAGE_ID, eventFactory);
                transferEvents(enrollment.events, enrollmentResponse.enrollment, NAERKONTAKT_HELSESTATUS_PROGRAM_STAGE_ID, INDEKSERING_PROGRAM_ID, INDEKSERING_HELSESTATUS_PROGRAM_STAGE_ID, eventFactory);
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

