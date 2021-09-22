export function importEventToListAsync(teiIds, programId, programStageId, orgUnitId, elementIds, teiAccessApiService ) {
    return getTeisWithEnrollmentsAsync(teiIds, programId, orgUnitId, teiAccessApiService).then(response => {
        var teis = getTEIs(response);
        var elementDictionary = getValuesFromEvent(teis, elementIds, programStageId);
        return elementDictionary;
    });
}

function getTeisWithEnrollmentsAsync(teiIds, programId,orgUnitId, teiAccessApiService) {
    return teiAccessApiService.get(null, programId, DHIS2URL+'/trackedEntityInstances.json?trackedEntityInstance='+teiIds.join(';')+'&paging=false&program='+programId+'&ou=' + orgUnitId + '&fields=trackedEntityInstance,orgUnit,enrollments[enrollment,program,enrollmentDate,events[status,dataValues,programStage,eventDate]]');
}

function getValuesFromEvent(teis, elementIds, programStageId) {
    var teiDictionary = {};
    teis.forEach(tei => {
        var enrollment = getNewestEnrollment(tei);
        var event = getNewestEventFromProgramStageWithData(enrollment, programStageId);
        if (event && enrollment && elementIds) {
            elementIds.forEach(elementId => {
                var dataValue = getDataElementFromEvent(event, elementId);

                if (dataValue) {
                    teiDictionary[tei.trackedEntityInstance] = {
                        ...teiDictionary[tei.trackedEntityInstance],
                        [elementId]: dataValue,
                    };
                }
            });
            if (teiDictionary[tei.trackedEntityInstance]) {
                teiDictionary[tei.trackedEntityInstance] = {
                    ...teiDictionary[tei.trackedEntityInstance],
                    eventDate: event.eventDate,
                    enrollmentDate: enrollment.enrollmentDate,
                };
            }
        }
    });
    return teiDictionary;

}

function getTEIs(response) {
    return response.data && response.data.trackedEntityInstances && response.data.trackedEntityInstances.length > 0 ? response.data.trackedEntityInstances : [];
}

function getNewestEnrollment(tei) {
    if(tei.enrollments && tei.enrollments.length > 0 ) {
        return tei.enrollments.sort((e1, e2) => firstDateIsBeforeSecond(e1.eventDate, e2.eventDate))[0];
    }
    return undefined;
}

function getNewestEventFromProgramStageWithData(enrollment, programStageId) {
    if (enrollment && enrollment.events && enrollment.events.length > 0) {
        return enrollment.events.filter(event =>
            event.programStage == programStageId && event.dataValues && event.dataValues.length > 0
        ).sort((e1, e2) => firstDateIsBeforeSecond(e1.eventDate, e2.eventDate))[0];
    }
    return undefined;
}

function getDataElementFromEvent(event, dataElementId) {
    var outValue;
    if(event && event.dataValues) {
        event.dataValues.forEach(function (dataValue) {
            if (dataValue.dataElement == dataElementId) {
                outValue = dataValue.value;
            }
        });
    }

    return outValue;
}

function firstDateIsBeforeSecond(first, second) {
    var firstDate = new Date(first);
    var secondDate = new Date(second);
    return firstDate.getTime() < secondDate.getTime();
}
