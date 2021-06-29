import {
    DUPLIKAT_PROGRAM_ID,
    INNREISE_ARBEIDSGIVER_ATTRIBUTE_ID,
    INNREISE_AVREISELAND_ATTRIBUTE_ID,
    INNREISE_INNREISE_DATO_ATTRIBUTE_ID,
    INNREISE_KARANTENEKODE_2_ATTRIBUTE_ID,
    INNREISE_KARANTENEKODE_4_ATTRIBUTE_ID,
    INNREISE_KARANTENETYPE_ATTRIBUTE_ID,
    INNREISE_OPPFOLGINGSTATUS_ATTRIBUTE_ID,
    INNREISE_OPPHOLDSADRESSE_ATTRIBUTE_ID, INNREISE_PROGRAM_ID,
    INNREISE_SISTE_PROVESVAR_ATTRIBUTE_ID,
    INNREISE_SISTE_PROVESVAR_DATO_ATTRIBUTE_ID,
    PROFIL_EPOST_ATTRIBUTE_ID, PROFIL_FNR_ATTRIBUTE_ID,
    PROFIL_FORETRUKKET_SPRAAK_ATTRIBUTE_ID,
    PROFIL_MOBIL_TLF_ATTRIBUTE_ID
} from "../utils/constants";

export function setCustomShowOnAttributes(attributes, programId) {
    if(programId === INNREISE_PROGRAM_ID || programId === DUPLIKAT_PROGRAM_ID) {
        attributes = attributes.map(attribute => {
            if(attributesToHideFromProfileInInnreise.find(attId => attId === attribute.id)) {
                return {...attribute, show: false};
            }
            if(attributesToShowInProfileInInnreise.find(attId => attId === attribute.id)) {
                return {...attribute, show: true};
            }
            return attribute;
        });
        return attributes;
    }
    return attributes;
}

export function setCustomShowOnAttributesInList(attributes, programId) {
    if(programId === INNREISE_PROGRAM_ID || programId === DUPLIKAT_PROGRAM_ID) {
        attributes = attributes.map(attribute => {
            if(attributesToHideInInnreiseArbeidsliste.find(attId => attId === attribute.id)) {
                return {...attribute, show: false};
            }
            return attribute;
        });
        return attributes;
    }
    return attributes;
}
const attributesToHideFromProfileInInnreise = [
    INNREISE_OPPFOLGINGSTATUS_ATTRIBUTE_ID,
    INNREISE_KARANTENEKODE_4_ATTRIBUTE_ID,
    INNREISE_KARANTENEKODE_2_ATTRIBUTE_ID,
    INNREISE_KARANTENETYPE_ATTRIBUTE_ID,
    INNREISE_INNREISE_DATO_ATTRIBUTE_ID,
    INNREISE_SISTE_PROVESVAR_DATO_ATTRIBUTE_ID,
    INNREISE_SISTE_PROVESVAR_ATTRIBUTE_ID,
    INNREISE_OPPHOLDSADRESSE_ATTRIBUTE_ID,
    INNREISE_ARBEIDSGIVER_ATTRIBUTE_ID,
    INNREISE_AVREISELAND_ATTRIBUTE_ID
]

const attributesToShowInProfileInInnreise = [
    PROFIL_FORETRUKKET_SPRAAK_ATTRIBUTE_ID,
    PROFIL_EPOST_ATTRIBUTE_ID,
    PROFIL_MOBIL_TLF_ATTRIBUTE_ID,
    PROFIL_FNR_ATTRIBUTE_ID
]

const attributesToHideInInnreiseArbeidsliste = [
    'orgUnitName',
    'created'
]