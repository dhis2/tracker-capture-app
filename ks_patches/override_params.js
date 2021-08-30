import {INDEKSERING_PROGRAM_ID, NAERKONTAKT_PROGRAM_ID} from "../utils/constants";

export function customPageSizeForProgram(program) {
    if(program === INDEKSERING_PROGRAM_ID) {
        return 150;
    }
    if(program === NAERKONTAKT_PROGRAM_ID) {
        return 150;
    }
    return undefined;
}