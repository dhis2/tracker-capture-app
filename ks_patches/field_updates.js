import {BIRTH_DATE_FIELD_ID, DNUMBER_FIELD_ID} from "../utils/constants";
import {getFullYear} from "../utils/converters";

export function conditionalAutofillBirthdateOnDnumberChange(tei, field) {
    // only update if the changed field is d-number
    if (field !== DNUMBER_FIELD_ID) {
        return;
    }

    // Do not overwrite already set birth date
    if (tei[BIRTH_DATE_FIELD_ID]) {
        return;
    }

    var dnumber = tei[DNUMBER_FIELD_ID];
    tei[BIRTH_DATE_FIELD_ID] = getValidDateOrUndefined(dnumber);
}

function getValidDateOrUndefined(dnumber) {
    if(dnumber.length !== 11) {
        return undefined;
    }
    var day = dnumber.substr(0,2);
    var month = dnumber.substr(2,2);
    var year = dnumber.substr(4,2);
    // Simple valid date test. Can give incorrect dates for months with less than 30 days.
    // Should not be a problem for valid fnr, and is handled ok in application.
    if( day > 0 && day <= 31 &&
        month > 0 && month <= 12 &&
        year < 100 && year > -1) {
        return day + '-' + month + '-' + getFullYear(year);
    }

    return undefined;
}

