var trackerCapture = angular.module('trackerCapture');

trackerCapture.controller('ListsController',function(
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
    ProgramWorkingListService,
    OperatorFactory) {
        var ouModes = [{name: 'SELECTED'}, {name: 'CHILDREN'}, {name: 'DESCENDANTS'}, {name: 'ACCESSIBLE'}];
        var userGridColumns = null;
        var defaultCustomWorkingListValues = { ouMode: ouModes[0], programStatus: ""};

        $scope.trackedEntityListTypes = { CUSTOM: "CUSTOM", WORKINGLIST: "WORKINGLIST"};
        $scope.listExportFormats = ["XML","JSON","CSV"];
        $scope.customWorkingListValues = defaultCustomWorkingListValues;
        $scope.defaultOperators = OperatorFactory.defaultOperators;
        $scope.boolOperators = OperatorFactory.boolOperators;

        var setPager = function(pager){
            $scope.pager = pager;
            $scope.pager.toolBarDisplay = 5;
        }

        $scope.$watch('base.selectedProgram', function() {
            init();
        });

        var init = function(){
            if( angular.isObject($scope.base.selectedProgram)){
                reset();
                loadUserGridColumns()
                .then(loadAttributesByProgram)
                .then(loadWorkingLists)
                .then(loadCachedData);
            }
        }

        var reset = function(){
            $scope.customWorkingListValues = defaultCustomWorkingListValues;
            $scope.currentTrackedEntityList = null;
            $scope.gridColumns = null;
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
                    if($scope.base.selectedProgram){
                        $scope.gridColumns = userGridColumns[$scope.base.selectedProgram.id];
                    }
                });
            }
            if($scope.base.selectedProgram){
                $scope.gridColumns = userGridColumns[$scope.base.selectedProgram.id];
            }
            return resolvedEmptyPromise();

        }

        
        var loadWorkingLists = function(){
            return ProgramWorkingListService.getConfigs($scope.base.selectedProgram).then(function(programWorkingLists)
            {
                $scope.base.selectedProgram.workingLists = programWorkingLists;
            });
        }

        var loadAttributesByProgram = function(){
            return AttributesFactory.getByProgram($scope.base.selectedProgram).then(function(atts){
                $scope.programAttributes = AttributesFactory.generateAttributeFilters(atts);
                $scope.customWorkingListValues.attributes = angular.copy($scope.programAttributes);
            });
        }

        var loadCachedData = function(){
            var frontPageData = CurrentSelection.getFrontPageData();
            var selectedProgramID = $scope.base.selectedProgram ? $scope.base.selectedProgram.id : null;
            if(frontPageData && frontPageData.selectedOrgUnit.id == $scope.selectedOrgUnit.id && frontPageData.program.id == selectedProgramID){
                $scope.pager = frontPageData.pager;
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
                program: $scope.base.selectedProgram ? $scope.base.selectedProgram.id: null,
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
                    direction: 'desc',
                }
            }
        }

        var setCurrentTrackedEntityListData = function(serverResponse){
            if (serverResponse && serverResponse.metaData && serverResponse.metaData.pager) setPager(serverResponse.metaData.pager);
            $scope.currentTrackedEntityList.data = TEIGridService.format($scope.selectedOrgUnit.id, serverResponse, false, $scope.base.optionSets, null);
            $scope.currentTrackedEntityList.loading = false;
            updateCurrentSelection();
        }
    


        $scope.fetchTeis = function(pager, sortColumn){
            var s = 1;
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
            var grid = TEIGridService.generateGridColumnsForSearch(userGridColumns[$scope.base.selectedProgram.id], $scope.programAttributes, customConfig.ouMode, true);
            $scope.gridColumns = grid.columns;

            if($scope.base.selectedProgram){
                customConfig.programUrl = 'program=' + $scope.base.selectedProgram.id;
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
                        if(!$scope.base.selectedProgram) {
                            return null;
                        }
                        return $scope.base.selectedProgram.id;
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
                    promise = TEIService.search($scope.selectedOrgUnit.id, config.ouMode.name, config.queryAndSortUrl, config.programUrl, attrIdList, false, false, format, attrNamesList, attrNamesIdMap, $scope.base.optionSets);
                }else{
                    promise = TEIService.search($scope.selectedOrgUnit.id, ouModes[0].name, config.url,null, attrIdList, false, false,format, attrNamesList, attrNamesIdMap,$scope.base.optionSets);
                }
                promise.then(function(data){
                    if (data && data.metaData && data.metaData.pager) setPager(data.metaData.pager);
    
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
                program: $scope.base.selectedProgram,
                trackedEntityList: $scope.currentTrackedEntityList,
                customWorkingListValues: $scope.customWorkingListValues,
                gridColumns: $scope.gridColumns,
                selectedOrgUnit: $scope.selectedOrgUnit,
                pager: $scope.pager
            }
            CurrentSelection.setFrontPageData(frontPageData);

        }
});
