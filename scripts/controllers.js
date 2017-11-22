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
    GridColumnService) {
        var trackedEntityListTypes = { SEARCH: "SEARCH", WORKINGLIST: "WORKINGLIST"};
        var ouModes = [{name: 'SELECTED'}, {name: 'CHILDREN'}, {name: 'DESCENDANTS'}, {name: 'ACCESSIBLE'}];
        var previousProgram = null;
        var userGridColumns = null;
        var optionSets = null;

        $scope.searchModes = { LISTALL: 'LIST_ALL', FREETEXT: 'FREE_TEXT', ATTRIBUTEBASED: 'ATTRIBUTE_BASED' };
        $scope.listExportFormats = ["XML","JSON","CSV"];
        $scope.parent = { };
        $scope.searchValues = {};
        $scope.advancedSearchValues = {};

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

        var setPager = function(pager){
            $scope.pager = pager;
            $scope.pager.toolBarDisplay = 5;
    
            Paginator.setPage($scope.pager.page);
            Paginator.setPageCount($scope.pager.pageCount);
            Paginator.setPageSize($scope.pager.pageSize);
            Paginator.setItemCount($scope.pager.total);
        }

        $scope.$watch('selectedOrgUnit', function() {
            if( angular.isObject($scope.selectedOrgUnit)){
                reset();
                loadPrograms()
                .then(loadUserGridColumns)
                .then(loadAttributes)
                .then(loadAttributesByProgram)
                .then(loadOptionSets)
                .then(loadCachedData);
            }
        });

        var reset = function(){
            previousProgram = $scope.parent.selectedProgram;
            $scope.parent.selectedProgram = $scope.selectedProgram = null;
            $scope.advancedSearchValues = {};
            $scope.searchValues = {};
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
            return resolvedEmptyPromise();

        }
        var loadPrograms = function(){
            return ProgramFactory.getProgramsByOu($scope.selectedOrgUnit, previousProgram).then(function(response){
                $scope.programs = response.programs;
                $scope.parent.selectedProgram = $scope.selectedProgram = response.selectedProgram;

                //for test
                angular.forEach($scope.programs, function(p){
                    if(p.id === 'WSGAb5XwJ3Y'){
                        p.workingLists = [
                            {
                                name: "test1",
                                description: "",
                                icon: "fa fa-calendar"
                            },
                            {
                                name: "test2",
                                description: "",
                                icon: "fa fa-address-book"
                            },
                            {
                                name: "test3",
                                description: "",
                                icon: "fa fa-etsy"
                            },
                    
                        ];
                    }
                });

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
                $scope.advancedSearchValues.attributes = angular.copy($scope.attributes);
            });
        }

        var loadCachedData = function(){
            var frontPageData = CurrentSelection.getFrontPageData();
            if(frontPageData && frontPageData.selectedOrgUnit.id == $scope.selectedOrgUnit.id){
                $scope.pager = frontPageData.pager;
                $scope.setProgram(frontPageData.program);
                $scope.advancedSearchValues = frontPageData.advancedSearchValues;
                $scope.searchValues = frontPageData.searchValues;
                $scope.gridColumns = frontPageData.gridColumns;
                if(frontPageData.trackedEntityList && frontPageData.trackedEntityList.refresh){
                    if(frontPageData.trackedEntityList.type == trackedEntityListTypes.SEARCH){
                        $scope.search(frontPageData.trackedEntityList.config.searchMode);
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
            if($scope.currentWorkingList && $scope.currentWorkingList.name == workingList.name){
                return "active";
            }
            return "";
        }

        $scope.setWorkingList = function(workingList){
            setCurrentTrackedEntityList(trackedEntityListTypes.WORKINGLIST, workingList, null);

            $scope.currentTrackedEntityList.loading = true;
            //TEIService.getByUrl(workingList.url).then(setCurrentTrackedEntityListData);
            TEIService.search()
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
            if (serverResponse && serverResponse.metaData && serverResponse.metaData.pager) setPager(serverResponse.metaData.pager);
            $scope.currentTrackedEntityList.data = TEIGridService.format($scope.selectedOrgUnit.id, serverResponse, false, optionSets, null);
            $scope.currentTrackedEntityList.loading = false;
            updateCurrentSelection();
        }
    


        var fetchTeis = function(){
            if($scope.currentTrackedEntityList){
                if($scope.currentTrackedEntityList.type === trackedEntityListTypes.SEARCH){
                    $scope.fetchTeisBySearch();
                }
            }
        }

        $scope.search = function(searchMode){
            var searchConfig = {
                searchMode: searchMode,
                queryUrl: "", 
                programUrl: "", 
                attributeUrl: { url: null, hasValue: false }, 
                ouMode: $scope.advancedSearchValues.ouMode && searchMode === $scope.searchModes.ATTRIBUTEBASED ? $scope.advancedSearchValues.ouMode : ouModes[2],
                orgUnit: $scope.advancedSearchValues.orgUnit && searchMode === $scope.searchModes.ATTRIBUTEBASED ? $scope.advancedSearchValues.orgUnit : $scope.selectedOrgUnit,
            };
            var grid = TEIGridService.generateGridColumnsForSearch(userGridColumns[$scope.parent.selectedProgram.id], $scope.attributes, searchConfig.ouMode, true);
            $scope.gridColumns = grid.columns;

            if($scope.parent.selectedProgram){
                searchConfig.programUrl = 'program=' + $scope.parent.selectedProgram.id;
            }

            if(searchMode == $scope.searchModes.FREETEXT){
                if(!$scope.searchValues.searchText){
                    $scope.emptySearchText = true;
                    return;
                }
                searchConfig.queryUrl = 'query=LIKE:' + $scope.searchValues.searchText;
            }else if(searchMode == $scope.searchModes.ATTRIBUTEBASED){
                searchConfig.attributeUrl = EntityQueryFactory.getAttributesQuery($scope.advancedSearchValues.attributes, $scope.advancedSearchValues.enrollment);
                if(!searchConfig.attributeUrl.hasValue) {
                    $scope.emptySearchAttribute = true;
                    return;
                }
            }

            setCurrentTrackedEntityList(trackedEntityListTypes.SEARCH, searchConfig, null);
            $scope.fetchTeisBySearch(searchConfig);
        }


        $scope.fetchTeisBySearch = function(){
            if(!$scope.currentTrackedEntityList.type == trackedEntityListTypes.SEARCH) return;
            var searchConfig = $scope.currentTrackedEntityList.config;
            var sortColumn = $scope.currentTrackedEntityList.sortColumn;
            $scope.currentTrackedEntityList.loading = true;
            searchConfig.queryAndSortUrl = searchConfig.queryUrl;
            if(sortColumn){
                var order = '&order=' + sortColumn.id + ':' +sortColumn.direction;
                searchConfig.queryAndSortUrl = searchConfig.queryAndSortUrl.concat(order);
            }
            TEIService.search(searchConfig.orgUnit.id,searchConfig.ouMode.name, searchConfig.queryAndSortUrl, searchConfig.programUrl, searchConfig.attributeUrl, $scope.pager, true)
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
            if($scope.currentTrackedEntityList && $scope.currentTrackedEntityList.type === trackedEntityListTypes.SEARCH){
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
                
                var searchConfig = $scope.currentTrackedEntityList.config;
                TEIService.search(searchConfig.orgUnit.id,searchConfig.ouMode.name, searchConfig.queryAndSortUrl, searchConfig.programUrl, attrIdList, false, false, format,attrNamesList, attrNamesIdMap, optionSets).then(function(data){
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

        $scope.setProgram = function(selectedProgram){
            reset();
            $scope.parent.selectedProgram = $scope.selectedProgram = selectedProgram;
            loadAttributes().then(loadAttributesByProgram);
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
                advancedSearchValues: $scope.advancedSearchValues,
                searchValues: $scope.searchValues,
                gridColumns: $scope.gridColumns,
                selectedOrgUnit: $scope.selectedOrgUnit,
                pager: $scope.pager
            }
            CurrentSelection.setFrontPageData(frontPageData);

        }
});
