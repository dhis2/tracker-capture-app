import {NEARKONTAKT_PROGRAM_CODE, INDEKSERING_PROGRAM_CODE} from "../utils/constants";

export function transferNotesFromNaerkontaktToIndeksering(enrollmentResponse, tei, program, enrollmentService){

    // Transfer only for indeksregistrering og oppfølging
    if(program !== INDEKSERING_PROGRAM_CODE) {
        return;
    }

    if(tei.enrollments) {
        tei.enrollments.map( enrollment => {
            // Transfer only notes from Nærkontaktregistrering
            if( enrollment.program == NEARKONTAKT_PROGRAM_CODE) {
                var e = angular.copy(enrollmentResponse);
                delete e.enrollmentDate; // Date on wrong format. Not needed
                delete e.incidentDate; // Date on wrong format. Not needed
                e.notes = enrollment.notes.map(note => {
                    delete note.note; // Cannot reuse note ID
                    return note;
                })
                enrollmentService.updateForNote(e);
            }
        });
    }
}