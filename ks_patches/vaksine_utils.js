import {PROFIL_VAKSINE_1_TYPE_ID, PROFIL_VAKSINE_1_DATO_ID, PROFIL_VAKSINE_2_TYPE_ID, PROFIL_VAKSINE_2_DATO_ID, PROFIL_VAKSINE_3_TYPE_ID, PROFIL_VAKSINE_3_DATO_ID} from "../utils/constants";

export function createCombinedVaccineObject(sysvakVaccine, selectedTei, DateUtils) {
    return sysvakVaccine.map((vaccine, index) => createVaccineObject(selectedTei, vaccine, index + 1, DateUtils));
}

function createVaccineObject(selectedTei, vaccine, doseNr, DateUtils) {
    var vaccinationDate = convertVaccineDate(vaccine.vaccinationDate, DateUtils);
    return enrichWithValidation({
        profileDose: getVaksineDoseFromProfile(selectedTei, doseNr),
        ...getVaccineNicenameAndType(vaccine),
        date: vaccinationDate,
        monthsAgo: getNrOfMonthsAgo(vaccinationDate, DateUtils)
    });
}

function getNrOfMonthsAgo(date, DateUtils) {
    if (!date) {
        return undefined;
    }
    var age = DateUtils.getAge(date);
    if(age.years > 0) {
        return 12;
    }
    return age.months;
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
    if(doseNr === 2) {
        return {
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
    const tmpDate = angular.copy(vaccinationDate);
    if(tmpDate[1]) {
        tmpDate[1] = tmpDate[1] - 1;
    }
    return DateUtils.getDateFromUTCString(tmpDate);
}

function getVaccineNicenameAndType(vaccine) {
    switch(vaccine.vaccineCode.code) {
        case "ASZ03":
            return {
                name: "Vaxzevria (AstraZeneca)",
                type: "AstraZeneca"
            };
        case "MOD03":
            return {
                name: "Covid-19 Vaccine Moderna",
                type: "Moderna"
            };
        case "BNT03":
            return {
                name: "Comirnaty (BioNTech og Pfizer)",
                type: "Comirnaty"
            };
        case "JAN03":
            return {
                name: "Covid-19 Vaccine Janssen",
                type: "Janssen"
            };
        case "CUR03":  // Not supported in DHIS2 yet
        default:
            return {
            name: vaccine.vaccineCode.display + ' (Annet)',
                type: "annenvaksine"
            };
    }
}


function enrichWithValidation(vaccine) {
    if(!vaccine.profileDose) {
        return {...vaccine, vaccineIsInProfile: false, dateMismatch: false, nameMismatch: false, updatePossible: true};
    }
    var dateMismatch = vaccine.date !== vaccine.profileDose.date;
    var nameMismatch = vaccine.name !== vaccine.profileDose.name && vaccine.type !== vaccine.profileDose.name;
    return {...vaccine,
        vaccineIsInProfile: true,
        dateMismatch,
        nameMismatch,
        updatePossible:  dateMismatch || nameMismatch
    }
}

export function saveVaccineToProfile(tei, vaccines, attributesById, TEIService, $q) {

    var teiCopy = angular.copy(tei);

    teiCopy.attributes = getUpdatedVaccineAttributes(teiCopy.attributes, vaccines);
    if(!tei.trackedEntityInstance) { // If trackedEntityInstance is not set, we assume we are registering
        updateAttributes(tei, teiCopy.attributes);
        var promiseMaker = $q.defer();
        promiseMaker.resolve(true);
        return promiseMaker.promise;
    }
    return TEIService.update(teiCopy, [], attributesById).then((status) => {
        if(status && status.httpStatus === "OK") {
            updateAttributes(tei, teiCopy.attributes);
            return true;
        }
        return false;
    });
}

function getUpdatedVaccineAttributes(attributes, vaccines) {
    return [
        getUpdatedAttribute(attributes, vaccines[0].type, PROFIL_VAKSINE_1_TYPE_ID),
        getUpdatedAttribute(attributes, vaccines[0].date, PROFIL_VAKSINE_1_DATO_ID),
        getUpdatedAttribute(attributes, vaccines[1].type, PROFIL_VAKSINE_2_TYPE_ID),
        getUpdatedAttribute(attributes, vaccines[1].date, PROFIL_VAKSINE_2_DATO_ID),
        getUpdatedAttribute(attributes, vaccines[2].type, PROFIL_VAKSINE_3_TYPE_ID),
        getUpdatedAttribute(attributes, vaccines[2].date, PROFIL_VAKSINE_3_DATO_ID),
    ];
}

function getUpdatedAttribute(attributes, value, id) {
    var attribute = attributes.find(att => att.attribute === id);
    return {...attribute, value};
}

function updateAttributes(tei, attributesToUpdate) {
    tei.attributes = tei.attributes.map(att => getUpdatedAttributeOrSelf(att, attributesToUpdate))
}

function getUpdatedAttributeOrSelf(attribute, attributesToUpdate) {
    return attributesToUpdate.find(att => att.attribute === attribute.attribute) || attribute;
}

export function hackToUpdateVaccineFieldsInProfile(selectedTei, sysvakVaccines) {
    selectedTei[PROFIL_VAKSINE_1_TYPE_ID] = sysvakVaccines[0].name;
    selectedTei[PROFIL_VAKSINE_1_DATO_ID] = sysvakVaccines[0].date;
    selectedTei[PROFIL_VAKSINE_2_TYPE_ID] = sysvakVaccines[1].name;
    selectedTei[PROFIL_VAKSINE_2_DATO_ID] = sysvakVaccines[1].date;
    selectedTei[PROFIL_VAKSINE_3_TYPE_ID] = sysvakVaccines[2].name;
    selectedTei[PROFIL_VAKSINE_3_DATO_ID] = sysvakVaccines[2].date;
}
