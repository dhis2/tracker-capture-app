import {
    COUNTRY_LOOKUP_ID,
    INNREISE_AVREISELAND_DATA_ELEMENT_ID, INNREISE_KARANTENE_ALTERNATIV_CODE_ID,
    INNREISE_KARANTENE_ALTERNATIV_TEXT_ID,
    INNREISE_KARANTENE_GJENOMFORING_TYPE_CODE_ID,
    INNREISE_KARANTENE_GJENOMFORING_TYPE_TEXT_ID,
    INNREISE_OPPFOLGINGSTATUS_ID, INNREISE_UNNTAK_TYPE_CODE_ID,
    INNREISE_UNNTAK_TYPE_TEXT_ID,
    INNREISEINFORMASJON_PROGRAM_STAGE_ID,
    STATUS_OPPFOLGNING_LOOKUP_ID, INNREISE_OPPHOLDSSTED_ID, INNREISE_ARBEIDSGIVER_NAVN_ID
} from "../utils/constants";
import {importEventToListAsync} from "./import_event_to_list";
import {convertDatestringToDDMMYYYY} from "../utils/converters";

export function addEventDataToInnreiseList(scope, serverResponse, teiAccessApiService, metaDataFactory) {

    var dataValuesToExtract = [
        INNREISE_AVREISELAND_DATA_ELEMENT_ID,
        INNREISE_OPPFOLGINGSTATUS_ID,
        INNREISE_KARANTENE_ALTERNATIV_TEXT_ID,
        INNREISE_KARANTENE_ALTERNATIV_CODE_ID,
        INNREISE_UNNTAK_TYPE_TEXT_ID,
        INNREISE_UNNTAK_TYPE_CODE_ID,
        INNREISE_KARANTENE_GJENOMFORING_TYPE_TEXT_ID,
        INNREISE_KARANTENE_GJENOMFORING_TYPE_CODE_ID,
        INNREISE_OPPHOLDSSTED_ID,
        INNREISE_ARBEIDSGIVER_NAVN_ID
    ];
    var teis = [];
    serverResponse.rows.forEach(function (row) {
        teis.push(row[0]);
    });

    importEventToListAsync(
        teis,
        scope.base.selectedProgram.id,
        INNREISEINFORMASJON_PROGRAM_STAGE_ID,
        scope.selectedOrgUnit.id,
        dataValuesToExtract,
        teiAccessApiService).then(eventData => {
        metaDataFactory.getAll('optionSets').then(function (optionSets) {
            try {
                setHeader(serverResponse, 'Karantenekode4_tekst');
                setDataValue(serverResponse, eventData, INNREISE_KARANTENE_GJENOMFORING_TYPE_TEXT_ID);

                setHeader(serverResponse, 'Karantenekode2_tekst');
                setDataValue(serverResponse, eventData, INNREISE_UNNTAK_TYPE_TEXT_ID);

                setHeader(serverResponse, 'Karantenetype_tekst');
                setDataValue(serverResponse, eventData, INNREISE_KARANTENE_ALTERNATIV_TEXT_ID);

                setHeader(serverResponse, 'Avreiseland');
                setDataValue(serverResponse, eventData, INNREISE_AVREISELAND_DATA_ELEMENT_ID);

                setHeader(serverResponse, 'Innreisedato');
                setDataValue(serverResponse, eventData, 'eventDate', convertDatestringToDDMMYYYY);

                setHeader(serverResponse, 'Oppfolgingstatus');
                var statusLookup = status => optionSetsDataLookup(optionSets, STATUS_OPPFOLGNING_LOOKUP_ID, status);
                setDataValue(serverResponse, eventData, INNREISE_OPPFOLGINGSTATUS_ID, statusLookup);

                setHeader(serverResponse, 'Karantenetype_kode');
                setDataValue(serverResponse, eventData, INNREISE_KARANTENE_ALTERNATIV_CODE_ID);

                setHeader(serverResponse, 'Karantenetype_tekst_short');
                setDataValue(serverResponse, eventData, INNREISE_KARANTENE_ALTERNATIV_CODE_ID, karantenekodeToShortTekst);

                setHeader(serverResponse, 'Karantenetype_tekst');
                setDataValue(serverResponse, eventData, INNREISE_KARANTENE_ALTERNATIV_TEXT_ID);

                setHeader(serverResponse, 'Unntaktype_kode');
                setDataValue(serverResponse, eventData, INNREISE_UNNTAK_TYPE_CODE_ID);

                setHeader(serverResponse, 'Unntaktype_tekst');
                setDataValue(serverResponse, eventData, INNREISE_UNNTAK_TYPE_TEXT_ID);

                setHeader(serverResponse, 'Gjennomforingstype_kode');
                setDataValue(serverResponse, eventData, INNREISE_KARANTENE_GJENOMFORING_TYPE_CODE_ID);

                setHeader(serverResponse, 'Gjennomforingstype_tekst');
                setDataValue(serverResponse, eventData, INNREISE_KARANTENE_GJENOMFORING_TYPE_TEXT_ID);

                setHeader(serverResponse, 'Oppholdsted');
                setDataValue(serverResponse, eventData, INNREISE_OPPHOLDSSTED_ID);

                setHeader(serverResponse, 'Arbeidsgivernavn');
                setDataValue(serverResponse, eventData, INNREISE_ARBEIDSGIVER_NAVN_ID);


                scope.setServerResponse(serverResponse);
            } catch (err) {
                console.log(err);
                scope.setServerResponse(serverResponse);
            }
        });
    });
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

function setDataValue(serverResponse, eventData, dataId, dataConverter = a => a) {
    serverResponse.rows.forEach(row => {
        var teiId = row[0];
        var dataValue;
        if(eventData && teiId && eventData[teiId] && dataId && eventData[teiId][dataId]) {
            dataValue = dataConverter(eventData[teiId][dataId]);
        } else {
            dataValue = undefined;
        }

        row.push(dataValue);
    });
}

function optionSetsDataLookup(optionSets, optionId, dataValue) {
    var optionLookup = optionSets.find(option => option.id === optionId);
    var lookedUpValue = optionLookup && optionLookup.options.find(option => option.code === dataValue);
    return lookedUpValue && lookedUpValue.displayName ? lookedUpValue.displayName : dataValue;
}

function karantenekodeToShortTekst(kode) {
    if (kode === '1001') {
        return 'Karantene';
    }

    if (kode === '1002') {
        return 'Unntatt karantene';
    }

    return kode;
}