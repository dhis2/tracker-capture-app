'use strict';

/* Controllers */
var d2Controllers = angular.module('d2Controllers', [])

//Controller for column show/hide
.controller('ColumnDisplayController', 
    function($scope, 
            $modalInstance,
            hiddenGridColumns,
            gridColumns,
            gridColumnDomainKey,
            gridColumnKey,
            gridColumnsInUserStore,
            GridColumnService){
    
    $scope.gridColumns = gridColumns;
    $scope.hiddenGridColumns = hiddenGridColumns;
    
    $scope.close = function () {
        $modalInstance.close($scope.gridColumns);
    };
    
    $scope.showHideColumns = function(gridColumn){
       
        if(gridColumn.show){                
            $scope.hiddenGridColumns--;            
        }
        else{
            $scope.hiddenGridColumns++;            
        }
        
        if(gridColumnKey) {
            gridColumnsInUserStore[gridColumnKey] = angular.copy($scope.gridColumns);
        }
        GridColumnService.set(gridColumnsInUserStore, gridColumnDomainKey);
    };    
})

//controller for dealing with google map
.controller('MapController',
        function($scope,
                $modalInstance,
                $translate,
                $http,
                $window,
                $q,
                $timeout,
                CommonUtils,
                leafletData,
                CurrentSelection,
                DHIS2URL,
                NotificationService,
                ModalService,
                geometryType,
                geoJson) {
    var inDrawMode = false;
    $scope.tilesDictionaryKeys = ['openstreetmap', 'googlemap'];   
    $scope.selectedTileKey = 'openstreetmap';           
    $scope.tilesDictionary = {
        openstreetmap: {
            url: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            options: {
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }
        },
        googlemap: {
            layers: {
                baselayers: {
                    googleRoadmap: {
                        name: 'Google Streets',
                        layerType: 'ROADMAP',
                        type: 'google'
                    },
                    googleHybrid: {
                        name: 'Google Hybrid',
                        layerType: 'HYBRID',
                        type: 'google'
                    },
                    googleTerrain: {
                        name: 'Google Terrain',
                        layerType: 'TERRAIN',
                        type: 'google'
                    }
                }
            }
        }
    };
    
    var polygonFeatureGroup;
    var geoJsonHasCoordinates = geoJson && geoJson.coordinates && geoJson.coordinates.length > 0;
    var geometryTypes = {
        Polygon: {
            markerEnabled: false,
            initialize: function(){
                leafletData.getMap($scope.selectedTileKey).then(function( map ){
                    if(geoJsonHasCoordinates){
                        var firstCoordinate = geoJson.coordinates[0][0];
                        map.setView([firstCoordinate[1],firstCoordinate[0]], $scope.maxZoom);
                    }
                });
                    /*         
                 if( $scope.marker && $scope.marker.m1 && $scope.marker.m1.lat && $scope.marker.m1.lng ){
                     map.setView([$scope.marker.m1.lat, $scope.marker.m1.lng], $scope.maxZoom);
                 }*/
            },
            runIntegrations: function(){
                integrateGeoCoder();
                integratePolygon();
            },
            getGeoJson: function(){
                var geoJsonFeatureGroup = polygonFeatureGroup.toGeoJSON();
                if(geoJsonFeatureGroup && geoJsonFeatureGroup.features && geoJsonFeatureGroup.features.length > 0){
                    return geoJsonFeatureGroup.features[0].geometry;
                }
                return null;
            }
        },
        Point: {
            markerEnabled: true,
            initialize: function(){
                if(geoJson && geoJson.coordinates.length === 2){
                    $scope.marker = {m1: {lat: geoJson.coordinates[1], lng: geoJson.coordinates[0], draggable: true}};
                }
                if($scope.marker){
                    leafletData.getMap($scope.selectedTileKey).then(function( map ){
                        map.setView([$scope.marker.m1.lat, $scope.marker.m1.lng], $scope.maxZoom);
                    });
                }
            },
            runIntegrations: function(){
                integrateGeoCoder();
            },
            getGeoJson: function(){
                if($scope.marker && $scope.marker.m1 && $scope.marker.m1.lat && $scope.marker.m1.lng){
                    var geoJson = {
                        type: "Point",
                        coordinates: [$scope.marker.m1.lng, $scope.marker.m1.lat]
                    }
                    return geoJson;
                }
                return null;
            }
        }
    }

    var currentGeometryType = geometryTypes[geometryType];
    
    var ouLevels = CurrentSelection.getOuLevels();
    var ouLevelsHashMap = ouLevels.reduce(function(map, ouLevel) {
        map[ouLevel.level] = ouLevel;
        return map;
    },{});
    
    getGeoJsonByOuLevel(ouLevels[0].level);
    currentGeometryType.initialize();
    currentGeometryType.runIntegrations();
    
    $scope.maxZoom = 8;
    
    $scope.center = {lat: 8.88, lng: -11.55, zoom: $scope.maxZoom};    
    
    var systemSetting = CommonUtils.getSystemSetting();
    
    if( !systemSetting.keyGoogleMapsApiKey || systemSetting.keyGoogleMapsApiKey === '' ){
        NotificationService.showNotifcationDialog($translate.instant("warning"), $translate.instant("missing_google_maps_api_key"));
        systemSetting.keyGoogleMapsApiKey = 'AIzaSyBjlDmwuON9lJbPMDlh_LI3zGpGtpK9erc';
    }
    
    var setCoordinateLabel = '<i class="fa fa-map-marker fa-2x"></i><span class="small-horizontal-spacing">' + $translate.instant('set_coordinate') + '</span>';
    var zoomInLabel = '<i class="fa fa-search-plus fa-2x"></i><span class="small-horizontal-spacing">' + $translate.instant('zoom_in') + '</span>';
    var zoomOutLabel = '<i class="fa fa-search-minus fa-2x"></i><span class="small-horizontal-spacing">' + $translate.instant('zoom_out') + '</span>';
    var centerMapLabel = '<i class="fa fa-crosshairs fa-2x"></i><span class="small-horizontal-spacing">' + $translate.instant('center_map') + '</span>';
    
    $scope.mapDefaults = {map: {
        contextmenu: true,
        contextmenuWidth: 180,
        contextmenuItems: getContextMenuItems()
    }};
                        
    
    var geojsonMarkerOptions = {
			    radius: 15,
			    fillColor: '#ff7800',
			    color: '#000',
			    weight: 1,
			    opacity: 1,
			    fillOpacity: 0.8
			};
                        
    var style = {fillColor: "green",
                    weight: 1,
                    opacity: 0.8,
                    color: 'black',
                    fillOpacity: 0
                };

    //$scope.marker = $scope.geoObject && $scope.geoObject === "POINT" && $scope.geoObject.coordinates.length === 2 ? {m1: {lat: $scope.geoObject.coordinates[0], lng: $scope.location.lng, draggable: true}} : {};
    
    leafletData.getMap($scope.selectedTileKey).then(function( map ){
        L.geoJSON($scope.selectedGeoJson).addTo(map);
    });
    function pointToLayer( feature, latlng ){
        return L.circleMarker(latlng, geojsonMarkerOptions);
    };
    
    function onEachFeature(feature, layer) {
        
        layer.on("mouseover",function(e){            
            $("#polygon-label").text( feature.properties.name );
        });
        layer.on("mouseout",function(e){
            $("#polygon-label").text('');
        });       
        layer.bringToBack(); 
        
        if( layer._layers ){
            layer.eachLayer(function (l) {
                l.bindContextMenu({
                    contextmenu: true,
                    contextmenuWidth: 180,                
                    contextmenuItems: getContextMenuItems(feature)
                });
            });
        }
        else{
            layer.bindContextMenu({
                    contextmenu: true,
                    contextmenuWidth: 180,
                    contextmenuInheritItems: false,
                    contextmenuItems: getContextMenuItems(feature)
                });
        }        
    }

    function getContextMenuItems(feature){

        var items = [];
        var featureProperties = feature && feature.properties;
        if(featureProperties && feature.properties.type==="ou"){
            var ouLevel = ouLevelsHashMap[featureProperties.level];
            var parentLevel = ouLevelsHashMap[ouLevel.level-1];
            var childLevel = ouLevelsHashMap[ouLevel.level+1];
            if(childLevel){
                items.push({
                    text: "Show "+childLevel.displayName.toLowerCase()+ " level",
                    callback: function(){
                        getGeoJsonByOuLevel(childLevel.level, feature.id);
                    }
                });
            }
            if(parentLevel){
                var parent;
                var parentGraph = featureProperties.parentGraph.split("/");
                //gets the parent of the currents parent
                var parent = parentGraph.length > 1 ? parentGraph[parentGraph.length-2] : null;
                items.push({
                    text: "Show "+parentLevel.displayName.toLowerCase()+ " level",
                    callback: function(){
                        getGeoJsonByOuLevel(parentLevel.level, parent);
                    }
                });
            }

        }
        items.push({
            text: centerMapLabel,
            callback: function(e){
                centerMap(e, feature);
            }
        });
        if(geometryType === "Point"){
            items.unshift({
                text: setCoordinateLabel,
                callback: function(e){
                    setCoordinate(e, feature);
                }
            },
            {
                separator: true
            });
        }

        return items.map(function(item, index) {
            item.index = index;
            return item;
        });

    }

    var currentOuLayer;

    function getGeoJsonByOuLevel(level, parent){
        var url = DHIS2URL+'/organisationUnits.geojson?level='+level;
        if(parent){
            url+="&parent="+parent;
        }

        return $http.get(url).then(function(response){                
            return leafletData.getMap().then(function( map ){
                if(currentOuLayer){
                    currentOuLayer.removeFrom(map);
                }
                var latlngs = [];

                var convertPolygonCoordinates = function(polygon) {
                    angular.forEach(polygon, function(linearRing){
                        angular.forEach(linearRing, function(coordinate){
                            latlngs.push(L.GeoJSON.coordsToLatLng(coordinate));
                        });
                    });
                }

                angular.forEach(response.data.features, function(feature){
                    feature.properties.type = "ou";
                    if(feature.geometry.type === "Polygon"){
                        convertPolygonCoordinates(feature.geometry.coordinates);
                    } else if (feature.geometry.type === "MultiPolygon"){
                        angular.forEach(feature.geometry.coordinates, convertPolygonCoordinates);
                    }
                });

                currentOuLayer = L.geoJson(response.data,{
                    style: style,
                    onEachFeature: onEachFeature,
                    pointToLayer: pointToLayer
                });
                currentOuLayer.addTo(map);
                currentOuLayer.bringToBack();


                if(!geoJsonHasCoordinates && latlngs.length > 0 ){                            
                    map.fitBounds(latlngs, {maxZoom: $scope.maxZoom});
                }
            });
        });
    }
    
    function setCoordinate(e, feature, layer){
        if( feature && feature.geometry && feature.geometry.type === 'Point'){
            var m = feature.geometry.coordinates;            
            $scope.marker = {m1: {lat: m[1], lng: m[0], draggable: true}};
        }
        else{
            $scope.marker = {m1: {lat: e.latlng.lat, lng: e.latlng.lng, draggable: true}};
        }
        
        $scope.location = {lat: $scope.marker.m1.lat, lng: $scope.marker.m1.lng};
    };
    
    function zoomIn(e, feature){
        $scope.maxZoom += 2; 
        if( feature && feature.id ){            
            zoomMap( feature, 'IN');
        }
        else{            
            $scope.center = angular.copy(e.latlng);            
            $scope.center.zoom = $scope.maxZoom;
        }        
    };
    
    function zoomOut(e, feature){
        $scope.maxZoom -= 2;
        if( feature && feature.id ){             
            zoomMap( feature, 'OUT');
        }
        else{
            $scope.center = angular.copy(e.latlng);            
            $scope.center.zoom = $scope.maxZoom;
        }
    };
    
    function centerMap(e, feature){
        $scope.maxZoom += 2;
        $scope.center.lat = e.latlng.lat;
        $scope.center.lng = e.latlng.lng;
    };
    
    function integrateGeoCoder(){
        
        leafletData.getMap($scope.selectedTileKey).then(function( map ){
               /*         
            if( $scope.marker && $scope.marker.m1 && $scope.marker.m1.lat && $scope.marker.m1.lng ){
                map.setView([$scope.marker.m1.lat, $scope.marker.m1.lng], $scope.maxZoom);
            }*/
            
            $scope.geocoder = L.Control.geocoder({
                defaultMarkGeocode: false
            }).addTo(map);

            $scope.geocoder.on('markgeocode', function(e) {
                $scope.marker = {m1: {lat: e.geocode.center.lat, lng: e.geocode.center.lng, draggable: true}};
                map.setView([e.geocode.center.lat, e.geocode.center.lng], 16);
            })
            .addTo(map);
        
        });
    }

    function integratePolygon(){
        leafletData.getMap($scope.selectedTileKey).then(function( map ){
            var options = {
                clickable:true,
                color:"#3498db",
                fill:true,
                fillColor:null,
                fillOpacity:0.2,
                opacity:0.5,
                stroke:true,
                weight:4
            }
            polygonFeatureGroup = L.geoJson(geoJson);
            polygonFeatureGroup.addTo(map);
            var drawControl = new L.Control.Draw({
            edit: {
                featureGroup: polygonFeatureGroup,
                remove: true,
            },
            draw: {
                polygon: {
                    allowIntersection: false, // Restricts shapes to simple polygons
                    drawError: {
                        color: '#e74c3c', // Color the shape will turn when intersects
                        message: '<strong>Intersecting</strong> not allowed!' // Message that will show when intersect
                    },
                    shapeOptions: {
                        color: '#3498db',
                    }
                },
                polyline: false,
                circle: false,
                rectangle: false,
                marker: false,
                circlemarker: false,
            }
            }).addTo(map);
            polygonFeatureGroup.eachLayer(function(layer){
                layer.bringToFront();
            });
            map.on('draw:created', function(e) {
                var layer = e.layer;
                polygonFeatureGroup.clearLayers(); 
                polygonFeatureGroup.addLayer(layer);
                
                if(layer._latlngs) {
                    var polygons = layer.toGeoJSON()
                    $scope.location = polygons.geometry;
                }                
            });
            map.on('draw:toolbaropened', function(e){
                inDrawMode = true;
            });
            map.on('draw:toolbarclosed', function(e){
                inDrawMode = false;
            });
        });
    }
    
    function loadGoogleMapApi() {
        
        var deferred = $q.defer();
        $window.initMap = function() {
            deferred.resolve();
        };
        
        var script = document.createElement('script'); 
        script.src = 'https://maps.google.com/maps/api/js?callback=initMap&key=' + systemSetting.keyGoogleMapsApiKey;
        document.body.appendChild(script);
        return deferred.promise;
    }
    
  
            
    $scope.setTile = function( tileKey ){        
        if( tileKey === $scope.selectedTileKey ){
            return;
        }        
        if( tileKey ){
            var promise;
            if( tileKey === 'openstreetmap' ){
                $scope.googleMapLayers = null;
                $scope.selectedTileKey = tileKey;
                promise = $q.when();
            }
            else if( tileKey === 'googlemap' ){
                if ($window.google && $window.google.maps) {
                    $scope.selectedTileKey = tileKey;
                    promise = $q.when();
                    
                }else {
                    promise =loadGoogleMapApi().then(function () {
                        $scope.selectedTileKey = tileKey;
                    }, function () {
                        console.log('Google map loading failed.');
                    });
                }
            }
            return promise.then(function(){
                integrateGeoCoder();
                integratePolygon();
            });
        }
        
    };        
    
    $scope.close = function () {
        $modalInstance.dismiss();
    };

    var internalCaptureCoordinate = function(){
        var geoJson = currentGeometryType.getGeoJson();
        if(!geoJson){
            NotificationService.showNotifcationDialog($translate.instant("warning"), $translate.instant("no_geometry_captured"));
        }
        $modalInstance.close(geoJson);
    }
    
    $scope.captureCoordinate = function(){
        
        if(inDrawMode) {
            var modalOptions = {
                closeButtonText: "Cancel",
                actionButtonText: 'OK',
                headerText: 'cancel_capturing_polygon',
                bodyText: 'you_are_currently_in_draw_mode_all_unfinished_changes_will_be_lost',
            };
            ModalService.showModal({},modalOptions).then(function(){
                internalCaptureCoordinate();
            }, function(){});
            return;
        }
        internalCaptureCoordinate();
    };


    
    function setDraggedMarker( args ){
        if( args ){
            $scope.marker.m1.lng = args.model.lng;
            $scope.marker.m1.lat = args.model.lat;
        }
    }
    
    $scope.$on('leafletDirectiveMarker.googlemap.dragend', function (e, args) {
        setDraggedMarker( args );
    });
    
    $scope.$on('leafletDirectiveMarker.openstreetmap.dragend', function (e, args) {
        setDraggedMarker( args );
    });
})

//Controller for audit history
.controller('AuditHistoryController', 
    function ($scope, 
            $modalInstance,
            $translate,
            AuditHistoryDataService, 
            DateUtils, 
            eventId, 
            dataType, 
            nameIdMap,
            optionSets,
            CommonUtils) {


    $scope.model = {type: dataType, 
    				name: dataType === 'dataElement' ? $translate.instant('data_element') : $translate.instant('attribute'),
    				searchPlaceholder: dataType === 'dataElement' ? $translate.instant('search_by_data_element') : $translate.instant('search_by_attribute'),
                    auditColumns: ['name', 'auditType', 'value', 'modifiedBy', 'created'], itemList:[], uniqueRows:[]};

    $scope.close = function () {
        $modalInstance.close();
    };
    $scope.model.showStatus="waiting";
    AuditHistoryDataService.getAuditHistoryData(eventId, dataType).then(function (data) {

        $scope.model.itemList = [];
        $scope.model.uniqueRows = [];
        
        var reponseData = data.trackedEntityDataValueAudits ? data.trackedEntityDataValueAudits :
            data.trackedEntityAttributeValueAudits ? data.trackedEntityAttributeValueAudits : null;

        if (reponseData) {
            for (var index = 0; index < reponseData.length; index++) {                
                var dataValue = reponseData[index];                
                var audit = {}, obj = {};
                if (dataType === "attribute") {
                    if (nameIdMap[dataValue.trackedEntityAttribute.id]) {
                        obj = nameIdMap[dataValue.trackedEntityAttribute.id];
                        audit.name = obj.displayName;
                        audit.valueType = obj.valueType;
                    }
                } else if (dataType === "dataElement") {
                    if (nameIdMap[dataValue.dataElement.id] && nameIdMap[dataValue.dataElement.id].dataElement) {
                        obj = nameIdMap[dataValue.dataElement.id].dataElement;
                        audit.name = obj.displayFormName;
                        audit.valueType = obj.valueType;
                    }
                }
                
                dataValue.value = CommonUtils.formatDataValue(null, dataValue.value, obj, optionSets, 'USER');
                audit.auditType = dataValue.auditType;                
                audit.value = dataValue.value;
                audit.modifiedBy = dataValue.modifiedBy;
                audit.created = DateUtils.formatToHrsMinsSecs(dataValue.created);                
                
                $scope.model.itemList.push(audit);
                if( $scope.model.uniqueRows.indexOf(audit.name) === -1){
                	$scope.model.uniqueRows.push(audit.name);
                }
                
                if($scope.model.uniqueRows.length > 0){
                	$scope.model.uniqueRows = $scope.model.uniqueRows.sort();
                }
            }
        }
        if ($scope.model.itemList.length === 0) {
            $scope.model.showStatus="data_unavailable";
        } else {
            $scope.model.showStatus="data_available";
        }
    },function(){
        $scope.model.showStatus="data_unavailable";
    });
})

.controller('OrgUnitTreeController', function($scope, $modalInstance, OrgUnitFactory, orgUnitId, orgUnitNames) {
    
    $scope.model = {selectedOrgUnitId: orgUnitId ? orgUnitId : null};
    $scope.orgUnitNames = orgUnitNames ? orgUnitNames : {};

    function expandOrgUnit( orgUnit, ou ){
        if( ou.path.indexOf( orgUnit.path ) !== -1 ){
            orgUnit.show = true;
        }

        orgUnit.hasChildren = orgUnit.children && orgUnit.children.length > 0 ? true : false;
        if( orgUnit.hasChildren ){
            for( var i=0; i< orgUnit.children.length; i++){
                if( ou.path.indexOf( orgUnit.children[i].path ) !== -1 ){
                    orgUnit.children[i].show = true;
                    expandOrgUnit( orgUnit.children[i], ou );
                }
            }
        }
        return orgUnit;
    };

    function attachOrgUnit( orgUnits, orgUnit ){
        for( var i=0; i< orgUnits.length; i++){
            if( orgUnits[i].id === orgUnit.id ){
                orgUnits[i] = orgUnit;
                orgUnits[i].show = true;
                orgUnits[i].hasChildren = orgUnits[i].children && orgUnits[i].children.length > 0 ? true : false;
                return;
            }
            if( orgUnits[i].children && orgUnits[i].children.length > 0 ){
                attachOrgUnit(orgUnits[i].children, orgUnit);
            }
        }
        return orgUnits;
    };

    //Get orgunits for the logged in user
    OrgUnitFactory.getViewTreeRoot().then(function(response) {
        $scope.orgUnits = response.organisationUnits;
        var selectedOuFetched = false;
        var levelsFetched = 0;
        angular.forEach($scope.orgUnits, function(ou){
            ou.show = true;
            levelsFetched = ou.level;
            if( orgUnitId && orgUnitId === ou.id ){
                selectedOuFetched = true;
            }
            angular.forEach(ou.children, function(o){
                levelsFetched = o.level;
                o.hasChildren = o.children && o.children.length > 0 ? true : false;
                if( orgUnitId && !selectedOuFetched && orgUnitId === ou.id ){
                    selectedOuFetched = true;
                }
            });
        });

        levelsFetched = levelsFetched > 0 ? levelsFetched - 1 : levelsFetched;

        if( orgUnitId && !selectedOuFetched ){
            var parents = null;
            OrgUnitFactory.get( orgUnitId ).then(function( ou ){
                if( ou && ou.path ){
                    parents = ou.path.substring(1, ou.path.length);
                    parents = parents.split("/");
                    if( parents && parents.length > 0 ){
                        var url = "fields=id,displayName,path,level,";
                        for( var i=levelsFetched; i<ou.level; i++){
                            url = url + "children[id,displayName,level,path,";
                        }

                        url = url.substring(0, url.length-1);
                        for( var i=levelsFetched; i<ou.level; i++){
                            url = url + "]";
                        }

                        OrgUnitFactory.getOrgUnits(parents[levelsFetched], url).then(function(response){
                            if( response && response.organisationUnits && response.organisationUnits[0] ){
                                response.organisationUnits[0].show = true;
                                response.organisationUnits[0].hasChildren = response.organisationUnits[0].children && response.organisationUnits[0].children.length > 0 ? true : false;
                                response.organisationUnits[0] = expandOrgUnit(response.organisationUnits[0], ou );
                                $scope.orgUnits = attachOrgUnit( $scope.orgUnits, response.organisationUnits[0] );
                            }
                        });
                    }
                }
            });
        }
    });

    //This methode is used to fetch all "search orgUnits" a user has.
    OrgUnitFactory.getSearchTreeRoot().then(function(response) {
        $scope.orgUnitsDataElement = response.organisationUnits;
        var selectedOuFetched = false;
        var levelsFetched = 0;
        angular.forEach($scope.orgUnitsDataElement, function(ou){
            levelsFetched = ou.level;
            if( orgUnitId && orgUnitId === ou.id ){
                selectedOuFetched = true;
            }
            angular.forEach(ou.children, function(o){
                levelsFetched = o.level;
                o.hasChildren = o.children && o.children.length > 0 ? true : false;
                if( orgUnitId && !selectedOuFetched && orgUnitId === ou.id ){
                    selectedOuFetched = true;
                }
            });
        });

        levelsFetched = levelsFetched > 0 ? levelsFetched - 1 : levelsFetched;

        if( orgUnitId && !selectedOuFetched ){
            var parents = null;
            OrgUnitFactory.get( orgUnitId ).then(function( ou ){
                if( ou && ou.path ){
                    parents = ou.path.substring(1, ou.path.length);
                    parents = parents.split("/");
                    if( parents && parents.length > 0 ){
                        var url = "fields=id,displayName,path,level,";
                        for( var i=levelsFetched; i<ou.level; i++){
                            url = url + "children[id,displayName,level,path,";
                        }

                        url = url.substring(0, url.length-1);
                        for( var i=levelsFetched; i<ou.level; i++){
                            url = url + "]";
                        }

                        OrgUnitFactory.getOrgUnits(parents[levelsFetched], url).then(function(response){
                            if( response && response.organisationUnits && response.organisationUnits[0] ){
                                response.organisationUnits[0].show = true;
                                response.organisationUnits[0].hasChildren = response.organisationUnits[0].children && response.organisationUnits[0].children.length > 0 ? true : false;
                                response.organisationUnits[0] = expandOrgUnit(response.organisationUnits[0], ou );
                                $scope.orgUnitsDataElement = attachOrgUnit( $scope.orgUnitsDataElement, response.organisationUnits[0] );
                            }
                        });

                        openPath($scope.orgUnitsDataElement);

                        //Recurtsive methode for expanding all orgUnits that contain the selected orgUnit.
                        function openPath(orgUnits) {
                            angular.forEach(orgUnits, function(orgUnit){
                                if(parents.indexOf(orgUnit.id) > -1) {
                                    $scope.expandCollapse(orgUnit);
                                    openPath(orgUnit.children);
                                }
                            });
                        }
                    }
                }
            });
        }
    });

    //filter orgunits
    $scope.filterOrgUnits = function( clear ){
        if( !$scope.orgUnitFilterText || clear ){
            $scope.orgUnits = angular.copy( $scope.orgUnitsCopy );
            $scope.orgUnitFilterText = undefined;
            return;
        }
        
        OrgUnitFactory.getByName( $scope.orgUnitFilterText ).then(function( response ){            
            $scope.orgUnitsDataElement = response.organisationUnits;
        });
    };

    //expand/collapse of search orgunit tree
    $scope.expandCollapse = function(orgUnit) {
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

    $scope.setSelectedOrgUnit = function( orgUnit ){
    	$scope.model.selectedOrgUnit = {id: orgUnit.id, displayName: orgUnit.displayName};
        $scope.model.selectedOrgUnitId = orgUnit.id;
        $scope.orgUnitNames[orgUnit.id] = orgUnit.displayName;
    };

    $scope.select = function () {
        $modalInstance.close( {selected: $scope.model.selectedOrgUnit, names: $scope.orgUnitNames} );
    };

    $scope.close = function(){        
        $modalInstance.close();
    };
});
