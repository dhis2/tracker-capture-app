function verifyUniqueSearchGroup(searchGroup, { useProgramSearchScope, SearchGroupService, tetSearchConfig, attributesById, program, trackedEntityType, orgUnit }){
    var promise;
    if(useProgramSearchScope){
        var tetSearchGroup = SearchGroupService.findTetSearchGroup(searchGroup, tetSearchConfig);
        promise = SearchGroupService.programScopeSearch(searchGroup, tetSearchGroup, program, trackedEntityType, orgUnit);
    }else{
        promise = SearchGroupService.tetScopeSearch(searchGroup, trackedEntityType, orgUnit);
    }

    return promise.then(function(res){
        if(res.status === "UNIQUE"){
            return {
                isUnique: false,
                duplicateInfo: {
                    data: res.data,
                    id: searchGroup.attributes[0].id,
                }
            };
        }
        return {
            isUnique: true
        };
    });
}

function processUniqueSearchGroupVerification(searchGroups, index, verificationDependencies){
    var searchGroup = searchGroups[index];
    return verifyUniqueSearchGroup(searchGroup, verificationDependencies)
        .then(result => {
            if(!result.isUnique){
                return result;
            }

            if(searchGroups.length > index + 1){
                return processUniqueSearchGroupVerification(searchGroups, index + 1, verificationDependencies);
            }

            return result;
        });
}

function doUniqueSearchGroupsVerification(searchGroups, verificationDependencies){
    if (!searchGroups || searchGroups.length === 0){
        var def = verificationDependencies.$q.defer();
        def.resolve({ isUnique: true });
        return def.promise;
    }
    return processUniqueSearchGroupVerification(searchGroups, 0, verificationDependencies);
}

function verifyUniqueSearchGroups(searchGroups, verificationDependencies){
    var uniqueSearchGroups = searchGroups
        .filter(group => group.uniqueGroup);
    
    return doUniqueSearchGroupsVerification(uniqueSearchGroups, verificationDependencies)
        .then(result => result);
}

function verifyDefaultSearchGroup(searchGroups, { useProgramSearchScope, SearchGroupService, tetSearchConfig, attributesById, program, trackedEntityType, orgUnit, $q }){
    var defaultSearchGroup = searchGroups
        .find(group => !group.uniqueGroup);
    
    if (!defaultSearchGroup) {
        return $q.when({});
    }

    var tetSearchGroup;
    if(useProgramSearchScope) {
        tetSearchGroup = SearchGroupService.findTetSearchGroup(defaultSearchGroup, tetSearchConfig, attributesById);
    }

    function fetch(pager, sortColumn) {
        var promise;
        if(useProgramSearchScope){
            promise = SearchGroupService.programScopeSearch(defaultSearchGroup, tetSearchGroup, program, trackedEntityType, orgUnit, pager, sortColumn);
        }else{
            promise = SearchGroupService.tetScopeSearch(defaultSearchGroup, trackedEntityType, orgUnit, pager, sortColumn);
        }
        return promise;
    }

    return fetch().then(function(res){
        if(res.status === "MATCHES"){
            return {
                potentialDuplicates: res.data,
                onRefetch: fetch,
            };
        }
        return {};
    });
}

function addValuesToSearchGroup(searchGroup, { tei }) {
    var valueContainers = searchGroup.attributes &&
        searchGroup
            .attributes
            .map(attr => ({
                id: attr.id,
                value: tei[attr.id],
            }));
    valueContainers && valueContainers.forEach(vc => {
        searchGroup[vc.id] = vc.value;
    });
}

function addValuesToSearchGroups(programSearchGroups, tetSearchGroups, addValuesDependencies) {
// set values into searchGroups!?! (this is used in the searchGroup service, which is also used for the actual searching so won't change this)
    programSearchGroups && programSearchGroups.forEach(group => {
        addValuesToSearchGroup(group, addValuesDependencies);
    });

    tetSearchGroups && tetSearchGroups.forEach(group => {
        addValuesToSearchGroup(group, addValuesDependencies);
    });
}

export function processRegistration(destination, { SearchGroupService, tei, searchGroups, useProgramSearchScope, tetSearchConfig, attributesById, program, trackedEntityType, orgUnit, showMatchesModal, showDuplicateModal, registerEntity, $q, onOpenModal }) {
    // 1. do not verify unique search groups with generated value
    var verificationSearchGroups = searchGroups && searchGroups
        .filter(group => !group.uniqueGroup || (group.attributes && group.attributes.length > 0 && !group.attributes[0].generated));    

    // 2. set values into searchGroups!!? (this is used in the searchGroup service, which is also used for the actual searching so won't change this)
    addValuesToSearchGroups(verificationSearchGroups, tetSearchConfig && tetSearchConfig.searchGroups, {
        tei
    });
    // 3. actually verify the search groups
    return verifyUniqueSearchGroups(verificationSearchGroups, {
        useProgramSearchScope,
        SearchGroupService,
        tetSearchConfig,
        attributesById,
        program,
        trackedEntityType,
        orgUnit,
        $q
    })
        .then(result => {
            if (!result.isUnique) {
                onOpenModal();
                showDuplicateModal(result.duplicateInfo.data, result.duplicateInfo.id);
                return {
                    duplicateUniqueAttributeId: result.duplicateInfo.id,
                };  
            }

            return verifyDefaultSearchGroup(verificationSearchGroups, {
                useProgramSearchScope,
                SearchGroupService,
                tetSearchConfig,
                attributesById,
                program,
                trackedEntityType,
                orgUnit,
                $q
            })
                .then(({ potentialDuplicates, onRefetch }) => {
                    if (potentialDuplicates) {
                        // show modal
                        onOpenModal();
                        return showMatchesModal(true, potentialDuplicates, onRefetch);
                    }
                    // perform registration
                    return registerEntity(destination, true);
                });
        })
}
