export function importEventToListAsync(teiIds, programId, programStageId, orgUnitId, elementIds, teiAccessApiService, orderByFilter ) {
    return getTeisWithEnrollmentsAsync(teiIds, programId, orgUnitId, teiAccessApiService).then(response => {
        var teis = getTEIs(response);
        var elementDictionary = getValuesFromEvent(teis, elementIds, programStageId, orderByFilter);
        return elementDictionary;
    });
}

function getTeisWithEnrollmentsAsync(teiIds, programId,orgUnitId, teiAccessApiService) {
    return teiAccessApiService.get(null, programId, DHIS2URL+'/trackedEntityInstances.json?trackedEntityInstance='+teiIds.join(';')+'&program='+programId+'&ou=' + orgUnitId + '&fields=trackedEntityInstance,orgUnit,enrollments[enrollment,program,enrollmentDate,events[status,dataValues,programStage,eventDate]]');
}

function getValuesFromEvent(teis, elementIds, programStageId, orderByFilter) {
    var teiDictionary = {};
    teis.forEach(tei => {
        var enrollments = getOrderedEnrollments(tei, orderByFilter);
        enrollments.forEach(enrollment => {
            var events = getOrderedEventsFromProgramStageWithData(enrollment, orderByFilter, programStageId);
            events.forEach(event => {
                elementIds.forEach(elementId => {
                    var dataValue = getDataElementFromEvent(event, elementId);

                    if (dataValue) {
                        teiDictionary[tei.trackedEntityInstance] = {
                            ...teiDictionary[tei.trackedEntityInstance],
                            [elementId]: dataValue,
                        };
                    }
                });
                if(teiDictionary[tei.trackedEntityInstance]) {
                    teiDictionary[tei.trackedEntityInstance] = {
                        ...teiDictionary[tei.trackedEntityInstance],
                        eventDate: event.eventDate,
                        enrollmentDate: enrollment.enrollmentDate,
                    };
                }
            });
        });
    });
    return teiDictionary;

}

function getTEIs(response) {
    return response.data && response.data.trackedEntityInstances && response.data.trackedEntityInstances.length > 0 ? response.data.trackedEntityInstances : [];
}

function getOrderedEnrollments(tei, orderByFilter) {
    if(tei.enrollments && tei.enrollments.length > 0 ) {
        return orderByFilter(tei.enrollments, '+enrollmentDate');
    }
    return [];
}

function getOrderedEventsFromProgramStageWithData(enrollment, orderByFilter, programStageId) {
    if (enrollment.events && enrollment.events.length > 0) {
        return orderByFilter(enrollment.events, '+eventDate').filter(event =>
            event.programStage == programStageId && event.dataValues && event.dataValues.length > 0
        );
    }
    return [];
}

function getDataElementFromEvent(event, dataElementId) {
    var outValue;
    event.dataValues.forEach(function(dataValue){
        if(dataValue.dataElement == dataElementId) {
            outValue = dataValue.value;
        }
    });

    return outValue;
}
