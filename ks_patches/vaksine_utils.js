import {PROFIL_VAKSINE_1_TYPE_ID, PROFIL_VAKSINE_1_DATO_ID, PROFIL_VAKSINE_2_TYPE_ID, PROFIL_VAKSINE_2_DATO_ID, PROFIL_VAKSINE_3_TYPE_ID, PROFIL_VAKSINE_3_DATO_ID} from "../utils/constants";

export function createCombinedVaccineObject(sysvakVaccine, selectedTei, DateUtils) {
    return sysvakVaccine.map((vaccine, index) => createVaccineObject(selectedTei, vaccine, index + 1, DateUtils));
}

function createVaccineObject(selectedTei, vaccine, doseNr, DateUtils) {
    return enrichWithValidation({
        profileDose: getVaksineDoseFromProfile(selectedTei, doseNr),
        name: getVaccineNicename(vaccine),
        date: convertVaccineDate(vaccine.vaccinationDate, DateUtils)
    });
}

function getVaksineDoseFromProfile(selectedTei, doseNr) {
    if(doseNr > 3 || doseNr < 1) {
        return undefined;
    }
    var ids = getVaksineIds(doseNr);
    return getNameAndDate(ids, selectedTei.attributes);
}

function getVaksineIds(doseNr) {
    if(doseNr === 1) {
        return {
            typeId: PROFIL_VAKSINE_1_TYPE_ID,
            dateId: PROFIL_VAKSINE_1_DATO_ID
        }
    }
    if(doseNr === 2) {        return {
        typeId: PROFIL_VAKSINE_2_TYPE_ID,
        dateId: PROFIL_VAKSINE_2_DATO_ID
    }
    }
    if(doseNr === 3) {
        return {
            typeId: PROFIL_VAKSINE_3_TYPE_ID,
            dateId: PROFIL_VAKSINE_3_DATO_ID
        }
    }
}

function getNameAndDate(ids, attributes) {
    var dose = {
        name: attributes.find(att => att.attribute === ids.typeId).value,
        date: attributes.find(att => att.attribute === ids.dateId).value
    };
    return dose && dose.date || dose.name ? dose : undefined;
}

function convertVaccineDate(vaccinationDate, DateUtils) {
    if(vaccinationDate[1]) {
        vaccinationDate[1] = vaccinationDate[1] - 1;
    }
    return DateUtils.getDateFromUTCString(vaccinationDate);
}

function getVaccineNicename(vaccine) {
    switch(vaccine.vaccineCode.code) {
        case "ASZ03":
            return "Vaxzevria (AstraZeneca)";
        default:
            return vaccine.vaccineCode.display;
    }
}

function enrichWithValidation(vaccine) {
    if(!vaccine.profileDose) {
        return {...vaccine, vaccineIsInProfile: false, dateMismatch: false, nameMismatch: false};
    }
    return {...vaccine,
        vaccineIsInProfile: true,
        dateMismatch: vaccine.date !== vaccine.profileDose.date,
        nameMismatch: vaccine.name !== vaccine.profileDose.name,
    }
}
