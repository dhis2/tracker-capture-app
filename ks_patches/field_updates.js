import {BIRTH_DATE_FIELD_CODE, DNUMBER_FIELD_CODE} from "../utils/constants";

export function conditionalAutofillBirthdateOnDnumberChange(tei, field) {
    // only update if the changed field is d-number
    if (field !== DNUMBER_FIELD_CODE) {
        return;
    }

    // Do not override already set birth date
    if (tei[BIRTH_DATE_FIELD_CODE]) {
        return;
    }

    var dnumber = tei[DNUMBER_FIELD_CODE];
    tei[BIRTH_DATE_FIELD_CODE] = getValidDateOrUndefined(dnumber);
}

function getValidDateOrUndefined(dnumber) {
    if(dnumber.length !== 11) {
        return undefined;
    }
    var day = dnumber.substr(0,2);
    var month = dnumber.substr(2,2);
    var year = dnumber.substr(4,2);
    // Simple valid date test
    if(day > 0 && day <= 31 && month > 0 && month <= 12 && year < 100 && year > -1) {
        return day + '-' + month + '-' + guessCentury(year);
    }

    return undefined;
}

function guessCentury(year) {
    var thisYear =  new Date().getFullYear() - 2000; // Gets two digit year of today

    // Will wrongly guess age of 100+ year olds as babies
    if (year < thisYear) {
        return '20' + year;
    }
    return '19' + year;
}