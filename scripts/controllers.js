var trackerCapture = angular.module('trackerCapture');

trackerCapture.controller('SelectionController',function(
    $rootScope,
    $scope,
    $modal,
    $location,
    $filter,
    $timeout,
    $q,
    Paginator,
    MetaDataFactory,
    DateUtils,
    OrgUnitFactory,
    ProgramFactory,
    AttributesFactory,
    EntityQueryFactory,
    CurrentSelection,
    TEIGridService,
    TEIService,
    GridColumnService,
    ProgramWorkingListService) {
        var ouModes = [{name: 'SELECTED'}, {name: 'CHILDREN'}, {name: 'DESCENDANTS'}, {name: 'ACCESSIBLE'}];
        var previousProgram = null;
        var userGridColumns = null;
        var optionSets = null;
        var defaultCustomWorkingListValues = { ouMode: ouModes[0], programStatus: ""};
        
        $scope.pager = {};
        $scope.trackedEntityListTypes = { CUSTOM: "CUSTOM", WORKINGLIST: "WORKINGLIST"};
        $scope.listExportFormats = ["XML","JSON","CSV"];
        $scope.parent = { };
        $scope.customWorkingListValues = defaultCustomWorkingListValues;

        //Load orgUnits for user
        OrgUnitFactory.getSearchTreeRoot().then(function(response) {
            $scope.orgUnits = response.organisationUnits;
            angular.forEach($scope.orgUnits, function(ou){
                ou.show = true;
                angular.forEach(ou.children, function(o){
                    o.hasChildren = o.children && o.children.length > 0 ? true : false;
                });
            });
        });

        $scope.$watch('selectedOrgUnit', function() {
            if( angular.isObject($scope.selectedOrgUnit)){
                reset();
                loadPrograms()
                .then(loadUserGridColumns)
                .then(loadAttributes)
                .then(loadAttributesByProgram)
                .then(loadOptionSets)
                .then(loadWorkingLists)
                .then(loadCachedData);
            }
        });

        var reset = function(){
            previousProgram = $scope.parent.selectedProgram;
            $scope.parent.selectedProgram = $scope.selectedProgram = null;
            $scope.customWorkingListValues = defaultCustomWorkingListValues;
            $scope.currentTrackedEntityList = null;
            $scope.gridColumns = null;
        }

        var loadOptionSets = function(){
            if(!optionSets){
                optionSets = [];
                return MetaDataFactory.getAll('optionSets').then(function(optSets){
                    angular.forEach(optSets, function(optionSet){
                        optionSets[optionSet.id] = optionSet;
                    });
                    CurrentSelection.setOptionSets(optionSets);
                });
            }
            return resolvedEmptyPromise();
        }
        var resolvedEmptyPromise = function(){
            var deferred = $q.defer();
            deferred.resolve();
            return deferred.promise;
        }

        var loadUserGridColumns = function(){
            if(!userGridColumns){
                return GridColumnService.get("trackerCaptureGridColumns").then(function (gridColumns) {
                    userGridColumns = gridColumns;
                    if($scope.parent.selectedProgram){
                        $scope.gridColumns = userGridColumns[$scope.parent.selectedProgram.id];
                    }
                });
            }
            if($scope.parent.selectedProgram){
                $scope.gridColumns = userGridColumns[$scope.parent.selectedProgram.id];
            }
            return resolvedEmptyPromise();

        }

        
        var loadWorkingLists = function(){
            return ProgramWorkingListService.getConfigs($scope.selectedProgram).then(function(programWorkingLists)
            {
                $scope.selectedProgram.workingLists = programWorkingLists;
            });
        }

        var loadAttributes = function(){
            var attributesById = CurrentSelection.getAttributesById();
            if(!$scope.attributesById){
                $scope.attributesById = [];
                return MetaDataFactory.getAll('attributes').then(function(atts){
                    angular.forEach(atts, function(att){
                        $scope.attributesById[att.id] = att;
                    });
                    CurrentSelection.setAttributesById($scope.attributesById);
                });
            }
            return resolvedEmptyPromise();
        }

        var loadAttributesByProgram = function(){
            return AttributesFactory.getByProgram($scope.parent.selectedProgram).then(function(atts){
                $scope.attributes = AttributesFactory.generateAttributeFilters(atts);
                $scope.customWorkingListValues.attributes = angular.copy($scope.attributes);
            });
        }

        var loadCachedData = function(){
            var frontPageData = CurrentSelection.getFrontPageData();
            if(frontPageData && frontPageData.selectedOrgUnit.id == $scope.selectedOrgUnit.id){
                $scope.pager = frontPageData.pager;
                $scope.setProgram(frontPageData.program);
                $scope.customWorkingListValues = frontPageData.customWorkingListValues;
                $scope.gridColumns = frontPageData.gridColumns;
                if(frontPageData.trackedEntityList && frontPageData.trackedEntityList.refresh){
                    if(frontPageData.trackedEntityList.type == $scope.trackedEntityListTypes.CUSTOM){
                        $scope.setCustomWorkingList();
                    }else{
                        $scope.setWorkingList(frontPageData.trackedEntityList.config);
                    }
                }else{
                    $scope.currentTrackedEntityList = frontPageData.trackedEntityList;
                }
            }else{
                CurrentSelection.setFrontPageData(null);
            }
        }

        $scope.openTei = function(tei){
            $location.path('/dashboard').search({tei: tei.id,
                program: $scope.parent.selectedProgram ? $scope.parent.selectedProgram.id: null,
                ou: $scope.selectedOrgUnit.id});
        }
    

        $scope.getWorkingListButtonClass = function(workingList){
            if($scope.currentTrackedEntityList)
                if($scope.currentTrackedEntityList.type === $scope.trackedEntityListTypes.WORKINGLIST){
                    var config = $scope.currentTrackedEntityList.config;
                    if(config.name === workingList.name){
                        return "active";
                    }
                }else{
                    if(workingList.name === "custom"){
                        return "active";
                    }
                }
            return "";
        }

        $scope.setWorkingList = function(workingList){
            setCurrentTrackedEntityList($scope.trackedEntityListTypes.WORKINGLIST, workingList, null);
            fetchWorkingList();
        }

        var fetchWorkingList = function(){
            if($scope.currentTrackedEntityList.type === $scope.trackedEntityListTypes.WORKINGLIST){
                var config = $scope.currentTrackedEntityList.config;
                $scope.currentTrackedEntityList.loading = true;
                var url = getOrderUrl(config.url);
                TEIService.search($scope.selectedOrgUnit.id, ouModes[0].name, url,null, null, $scope.pager, true).then(setCurrentTrackedEntityListData);
            }

        }

        var setCurrentTrackedEntityList = function(type, config, data){
            $scope.currentTrackedEntityList = { type: type, config: config, data: data };
            if(!$scope.currentTrackedEntityList.sortColumn){
                $scope.currentTrackedEntityList.sortColumn = {
                    id: 'created',
                    displayName: 'registration_date',
                    valueType: 'date',
                    displayInListNoProgram: false,
                    showFilter: false,
                    show: false,
                    direction: 'desc',
                }
            }
        }

        var setCurrentTrackedEntityListData = function(serverResponse){
            if (serverResponse && serverResponse.metaData && serverResponse.metaData.pager) $scope.pager = serverResponse.metaData.pager;
            $scope.currentTrackedEntityList.data = TEIGridService.format($scope.selectedOrgUnit.id, serverResponse, false, optionSets, null);
            $scope.currentTrackedEntityList.loading = false;
            updateCurrentSelection();
        }
    


        var fetchTeis = function(workingList){
            if($scope.currentTrackedEntityList){
                if($scope.currentTrackedEntityList.type === $scope.trackedEntityListTypes.CUSTOM){
                    $scope.fetchCustomWorkingList();
                }else{
                    fetchWorkingList();
                }
            }
        }

        $scope.setCustomWorkingList = function(){
            var customConfig = {
                queryUrl: "",
                programUrl: "", 
                attributeUrl: { url: null, hasValue: false }, 
                ouMode: $scope.customWorkingListValues.ouMode,
                orgUnit: $scope.selectedOrgUnit,
            };
            var grid = TEIGridService.generateGridColumnsForSearch(userGridColumns[$scope.parent.selectedProgram.id], $scope.attributes, customConfig.ouMode, true);
            $scope.gridColumns = grid.columns;

            if($scope.parent.selectedProgram){
                customConfig.programUrl = 'program=' + $scope.parent.selectedProgram.id;
                if($scope.customWorkingListValues.programStatus){
                    customConfig.programUrl += "&programStatus="+$scope.customWorkingListValues.programStatus;
                }
            }
            customConfig.attributeUrl = EntityQueryFactory.getAttributesQuery($scope.customWorkingListValues.attributes, $scope.customWorkingListValues.enrollment);

            setCurrentTrackedEntityList($scope.trackedEntityListTypes.CUSTOM, customConfig, null);
            $scope.emptyCustomWorkingListValues = false;
            if(!customConfig.attributeUrl.hasValue) {
                $scope.emptyCustomWorkingListValues = true;
                return;
            }
            $scope.fetchCustomWorkingList(customConfig);
        }

        var getOrderUrl = function(urlToExtend){
            if($scope.currentTrackedEntityList.sortColumn){
                var sortColumn = $scope.currentTrackedEntityList.sortColumn;
                if(urlToExtend){
                    return urlToExtend += "&order="+sortColumn.id+':'+sortColumn.direction;
                }
                return "order="+sortColumn.id+":"+sortColumn.direction;
            }

        }


        $scope.fetchCustomWorkingList= function(){
            if(!$scope.currentTrackedEntityList.type == $scope.trackedEntityListTypes.CUSTOM) return;
            var customConfig = $scope.currentTrackedEntityList.config;
            var sortColumn = $scope.currentTrackedEntityList.sortColumn;
            $scope.currentTrackedEntityList.loading = true;
            customConfig.queryAndSortUrl = customConfig.queryUrl;
            if(sortColumn){
                var order = '&order=' + sortColumn.id + ':' +sortColumn.direction;
                customConfig.queryAndSortUrl = customConfig.queryAndSortUrl.concat(order);
            }
            TEIService.search(customConfig.orgUnit.id,customConfig.ouMode.name, customConfig.queryAndSortUrl, customConfig.programUrl, customConfig.attributeUrl.url, $scope.pager, true)
            .then(setCurrentTrackedEntityListData);
        }

        $scope.expandCollapseOrgUnitTree = function(orgUnit) {
            if( orgUnit.hasChildren ){
                //Get children for the selected orgUnit
                OrgUnitFactory.getChildren(orgUnit.id).then(function(ou) {
                    orgUnit.show = !orgUnit.show;
                    orgUnit.hasChildren = false;
                    orgUnit.children = ou.children;
                    angular.forEach(orgUnit.children, function(ou){
                        ou.hasChildren = ou.children && ou.children.length > 0 ? true : false;
                    });
                });
            }
            else{
                orgUnit.show = !orgUnit.show;
            }
        };

        /**
         * TeiList
         * Sort by grid column
         * @param {*} gridHeader 
         */
        $scope.sortGrid = function(gridHeader){
            var sortColumn = $scope.currentTrackedEntityList.sortColumn;
            if (sortColumn && sortColumn.id === gridHeader.id){
                sortColumn.direction = sortColumn.direction === 'asc' ? 'desc' : 'asc';
            }else{
                $scope.currentTrackedEntityList.sortColumn = {id: gridHeader.id, direction: 'asc'};
            }
            fetchTeis();
        };

        /**
         * Pager
         *  Jump to page
         */
        $scope.jumpToPage = function(){
            if($scope.pager && $scope.pager.page && $scope.pager.pageCount && $scope.pager.page > $scope.pager.pageCount){
                $scope.pager.page = $scope.pager.pageCount;
            }
            fetchTeis();
            
        };

        /**
         * Pager
         * Setting page size
         */
        $scope.resetPageSize = function(){
            $scope.pager.page = 1;
            fetchTeis();
        };

        /**
         * Pager
         * Change page
         * @param {*} page 
         */
        $scope.getPage = function(page){
            $scope.pager.page = page;
            fetchTeis();
        };

        /**
         * Registration
         * Shows registration
         */
        $scope.showHideRegistration = function(){
            $scope.showRegistration = !$scope.showRegistration;
            if($scope.showRegistration){
                $timeout(function() {
                    $rootScope.$broadcast('registrationWidget', {registrationMode: 'REGISTRATION'});
                }, 200);
            }

        };

        $scope.showHideListColumns = function(){    
            var modalInstance = $modal.open({
                templateUrl: 'views/column-modal.html',
                controller: 'ColumnDisplayController',
                resolve: {
                    gridColumns: function () {
                        return $scope.gridColumns;
                    },
                    hiddenGridColumns: function(){
                        return ($filter('filter')($scope.gridColumns, {show: false})).length;
                    },
                    gridColumnDomainKey: function(){
                        return "trackerCaptureGridColumns";
                    },
                    gridColumnKey: function(){
                        if(!$scope.parent.selectedProgram) {
                            return null;
                        }
                        return $scope.parent.selectedProgram.id;
                    },
                    gridColumnsInUserStore: function(){
                        return userGridColumns;
                    }
                }
            });
    
            modalInstance.result.then(function (gridColumns) {
            }, function () {
            });
        }

        $scope.getExportList = function (format) {
            var deferred = $q.defer();
            if($scope.currentTrackedEntityList){
                var attrIdList = null;
                var attrNamesList = [];
                var attrNamesIdMap = {};
                if (!format || ($scope.listExportFormats.indexOf(format) === -1)) {
                    return;
                }
                format = format.toLowerCase();
        
                angular.forEach($scope.gridColumns, function (item) {
                    if (item.show && item.attribute) {
                        if (!attrIdList) {
                            attrIdList = "attribute=" + item.id;
                        } else {
                            attrIdList += "&attribute=" + item.id;
                        }
                        attrNamesList.push(item.id);
                        attrNamesIdMap[item.displayName] = item.id;
                    }
                });
                
                var config = $scope.currentTrackedEntityList.config;
                var promise;
                if($scope.currentTrackedEntityList.type === $scope.trackedEntityListTypes.CUSTOM){
                    promise = TEIService.search($scope.selectedOrgUnit.id, config.ouMode.name, config.queryAndSortUrl, config.programUrl, attrIdList, false, false, format, attrNamesList, attrNamesIdMap, optionSets);
                }else{
                    promise = TEIService.search($scope.selectedOrgUnit.id, ouModes[0].name, config.url,null, attrIdList, false, false,format, attrNamesList, attrNamesIdMap,optionSets);
                }
                promise.then(function(data){
                    if (data && data.metaData && data.metaData.pager) $scope.pager = data.metaData.pager);
    
                    var fileName = "trackedEntityList." + format;// any file name with any extension
                    var a = document.createElement('a');
                    var blob, url;
                    a.style = "display: none";
                    blob = new Blob(['' + data], {type: "octet/stream", endings: 'native'});
                    url = window.URL.createObjectURL(blob);
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(function () {
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                    }, 300);
                    deferred.resolve(data);
                });
                return deferred.promise;

            }

        };

        $scope.setProgram = function(selectedProgram){
            reset();
            $scope.parent.selectedProgram = $scope.selectedProgram = selectedProgram;
            loadAttributes()
            .then(loadAttributesByProgram)
            .then(loadWorkingLists);
            if($scope.parent.selectedProgram) $scope.gridColumns = userGridColumns[selectedProgram.id];
        }

        var updateCurrentSelection = function(){
            if($scope.currentTrackedEntityList && $scope.currentTrackedEntityList.data){
                var data = $scope.currentTrackedEntityList.data;
                var sortedTei = [];
                var sortedTeiIds = [];
                if(data.rows && data.rows.own) {
                    sortedTei = sortedTei.concat(data.rows.own);
                }
                if(data.rows && data.rows.other) {
                    sortedTei = sortedTei.concat(data.rows.other);
                }
                sortedTei = $filter('orderBy')(sortedTei, function(tei) {
                    if($scope.currentTrackedEntityList.sortColumn && $scope.currentTrackedEntityList.sortColumn.valueType === 'date'){
                        var d = tei[$scope.currentTrackedEntityList.sortColumn.id];
                        return DateUtils.getDate(d);
                    }
                    return tei[$scope.currentTrackedEntityList.sortColumn.id];
                }, $scope.currentTrackedEntityList.direction == 'desc');
        
                angular.forEach(sortedTei, function(tei){
                    sortedTeiIds.push(tei.id);
                });
                CurrentSelection.setSortedTeiIds(sortedTeiIds);
            }


            var frontPageData = {
                program: $scope.parent.selectedProgram,
                trackedEntityList: $scope.currentTrackedEntityList,
                customWorkingListValues: $scope.customWorkingListValues,
                gridColumns: $scope.gridColumns,
                selectedOrgUnit: $scope.selectedOrgUnit,
                pager: $scope.pager
            }
            CurrentSelection.setFrontPageData(frontPageData);

        }
});
