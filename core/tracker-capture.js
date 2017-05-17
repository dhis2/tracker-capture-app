/* global dhis2, angular, selection, i18n_ajax_login_failed, _ */

dhis2.util.namespace('dhis2.tc');

// whether current user has any organisation units
dhis2.tc.emptyOrganisationUnits = false;

var i18n_no_orgunits = 'No organisation unit attached to current user, no data entry possible';
var i18n_offline_notification = 'You are offline';
var i18n_online_notification = 'You are online';
var i18n_ajax_login_failed = 'Login failed, check your username and password and try again';

var DHIS2URL = '../api/26';
var optionSetIds = [];
var trackedEntityAttributeIds = [];
var batchSize = 50;
var programBatchSize = 50;

dhis2.tc.store = null;
dhis2.tc.metaDataCached = dhis2.tc.metaDataCached || false;
dhis2.tc.memoryOnly = $('html').hasClass('ie7') || $('html').hasClass('ie8');
var adapters = [];    
if( dhis2.tc.memoryOnly ) {
    adapters = [ dhis2.storage.InMemoryAdapter ];
} else {
    adapters = [ dhis2.storage.IndexedDBAdapter, dhis2.storage.DomLocalStorageAdapter, dhis2.storage.InMemoryAdapter ];
}

dhis2.tc.store = new dhis2.storage.Store({
    name: 'dhis2tc',
    adapters: [dhis2.storage.IndexedDBAdapter, dhis2.storage.DomSessionStorageAdapter, dhis2.storage.InMemoryAdapter],
    objectStores: ['programs', 'trackedEntities', 'attributes', 'relationshipTypes', 'optionSets', 'programIndicators', 'ouLevels', 'programRuleVariables', 'programRules','constants']
});

(function($) {
    $.safeEach = function(arr, fn)
    {
        if (arr)
        {
            $.each(arr, fn);
        }
    };
})(jQuery);

/**
 * Page init. The order of events is:
 *
 * 1. Load ouwt 
 * 2. Load meta-data (and notify ouwt) 
 * 
 */
$(document).ready(function()
{
    $.ajaxSetup({
        type: 'POST',
        cache: false
    });

    $('#loaderSpan').show();
});

$(document).bind('dhis2.online', function(event, loggedIn)
{
    if (loggedIn)
    {
        if (dhis2.tc.emptyOrganisationUnits) {
            setHeaderMessage(i18n_no_orgunits);
        }
        else {
            setHeaderDelayMessage(i18n_online_notification);
        }
    }
    else
    {
        var form = [
            '<form style="display:inline;">',
            '<label for="username">Username</label>',
            '<input name="username" id="username" type="text" style="width: 70px; margin-left: 10px; margin-right: 10px" size="10"/>',
            '<label for="password">Password</label>',
            '<input name="password" id="password" type="password" style="width: 70px; margin-left: 10px; margin-right: 10px" size="10"/>',
            '<button id="login_button" type="button">Login</button>',
            '</form>'
        ].join('');

        setHeaderMessage(form);
        ajax_login();
    }
});

$(document).bind('dhis2.offline', function()
{
    if (dhis2.tc.emptyOrganisationUnits) {
        setHeaderMessage(i18n_no_orgunits);
    }
    else {
        setHeaderMessage(i18n_offline_notification);
    }
});

function ajax_login()
{
    $('#login_button').bind('click', function()
    {
        var username = $('#username').val();
        var password = $('#password').val();

        $.post('../dhis-web-commons-security/login.action', {
            'j_username': username,
            'j_password': password
        }).success(function()
        {
            var ret = dhis2.availability.syncCheckAvailability();

            if (!ret)
            {
                alert(i18n_ajax_login_failed);
            }
        });
    });
}

// -----------------------------------------------------------------------------
// Metadata downloading
// -----------------------------------------------------------------------------

function downloadMetaData()
{
    console.log('Loading required meta-data');
    var def = $.Deferred();
    var def2 = $.Deferred();
    var promise = def.promise();

    promise = promise.then( dhis2.tc.store.open );
    promise = promise.then( getSystemSetting );
    promise = promise.then( getUserProfile );
    promise = promise.then( getConstants );
    promise = promise.then( getOrgUnitLevels );
    promise = promise.then( getRelationships );       
    promise = promise.then( getTrackedEntities );    
    promise = promise.then( getMetaPrograms );
    promise = promise.then( filterMissingPrograms );
    promise = promise.then( getPrograms );
    promise = promise.then( getMetaTrackeEntityAttributes );
    promise = promise.then( filterMissingTrackedEntityAttributes );
    promise = promise.then( getTrackedEntityAttributes );
    promise = promise.then( getOptionSetsForAttributes );
    promise = promise.then( getOptionSetsForDataElements );
    promise = promise.then( getOptionSets );   
    promise.done(function() {        
        //Enable ou selection after meta-data has downloaded
        $( "#orgUnitTree" ).removeClass( "disable-clicks" );
        dhis2.tc.metaDataCached = true;
        dhis2.availability.startAvailabilityCheck();
        console.log( 'Finished loading meta-data' );        
        selection.responseReceived();
        def2.resolve();
    });
    def.resolve();
    return def2.promise();
}

function getSystemSetting()
{   
    if(localStorage['SYSTEM_SETTING']){
       return; 
    }
    
    return dhis2.tracker.getTrackerObject(null, 'SYSTEM_SETTING', DHIS2URL + '/systemSettings', 'key=keyGoogleMapsApiKey&key=keyMapzenSearchApiKey&key=keyCalendar&key=keyDateFormat', 'localStorage', dhis2.tc.store);
}

function getUserProfile()
{
    var SessionStorageService = angular.element('body').injector().get('SessionStorageService');    
    if( SessionStorageService.get('USER_PROFILE') ){
       return; 
    }
    
    return dhis2.tracker.getTrackerObject(null, 'USER_PROFILE', DHIS2URL + '/me.json', 'fields=id,displayName,userCredentials[username,userRoles[id,programs,authorities]],organisationUnits[id,displayName,level,code,path,children[id,displayName,level,children[id]]],dataViewOrganisationUnits[id,displayName,level,path,code,children[id,displayName,level,children[id]]],teiSearchOrganisationUnits[id,displayName,level,path,code,children[id,displayName,level,children[id]]]', 'sessionStorage', dhis2.ec.store);
}

function getConstants()
{
    dhis2.tc.store.getKeys( 'constants').done(function(res){        
        if(res.length > 0){
            return;
        }        
        return dhis2.tracker.getTrackerObjects('constants', 'constants', DHIS2URL + '/constants.json', 'paging=false&fields=id,displayName,value', 'idb', dhis2.tc.store);        
    });    
}

function getOrgUnitLevels()
{
    dhis2.tc.store.getKeys( 'ouLevels').done(function(res){        
        if(res.length > 0){
            return;
        }        
        return dhis2.tracker.getTrackerObjects('ouLevels', 'organisationUnitLevels', DHIS2URL + '/organisationUnitLevels.json', 'filter=level:gt:1&fields=id,displayName,level&paging=false', 'idb', dhis2.tc.store);
    }); 
}

function getRelationships()
{    
    dhis2.tc.store.getKeys( 'relationshipTypes').done(function(res){        
        if(res.length > 0){
            return;
        }
        return dhis2.tracker.getTrackerObjects('relationshipTypes', 'relationshipTypes', DHIS2URL + '/relationshipTypes.json', 'paging=false&fields=id,displayName,aIsToB,bIsToA,displayName', 'idb', dhis2.tc.store);
    });    
}

function getTrackedEntities()
{
    dhis2.tc.store.getKeys('trackedEntities').done(function(res){
        if(res.length > 0){
            return;
        }        
        return dhis2.tracker.getTrackerObjects('trackedEntities', 'trackedEntities', DHIS2URL + '/trackedEntities.json', 'paging=false&fields=id,displayName', 'idb', dhis2.tc.store);
    });    
}

function getMetaPrograms()
{    
    return dhis2.tracker.getTrackerObjects('programs', 'programs', DHIS2URL + '/programs.json', 'filter=programType:eq:WITH_REGISTRATION&paging=false&fields=id,version,programTrackedEntityAttributes[trackedEntityAttribute[id,optionSet[id,version]]],programStages[id,programStageDataElements[dataElement[id,optionSet[id,version]]]]', 'temp', dhis2.tc.store);
}

function filterMissingPrograms( programs )
{
    if( !programs ){
        return;
    }
    
    var mainDef = $.Deferred();
    var mainPromise = mainDef.promise();

    var def = $.Deferred();
    var promise = def.promise();

    var builder = $.Deferred();
    var build = builder.promise();

    var ids = [];
    _.each( _.values( programs ), function ( program ) {        
        build = build.then(function() {
            var d = $.Deferred();
            var p = d.promise();
            dhis2.tc.store.get('programs', program.id).done(function(obj) {
                if(!obj || obj.version !== program.version) {                        
                    ids.push( program.id );
                }
                d.resolve();
            });
            return p;
        });  
    });

    build.done(function() {
        def.resolve();
        promise = promise.done( function () {
            mainDef.resolve( programs, ids );
        } );
    }).fail(function(){
        mainDef.resolve( null, null );
    });

    builder.resolve();

    return mainPromise;
}

function getPrograms( programs, ids )
{
    if( !ids || !ids.length || ids.length < 1){
        return;
    }
    
    var batches = dhis2.tracker.chunk( ids, programBatchSize );
    
    var mainDef = $.Deferred();
    var mainPromise = mainDef.promise();

    var def = $.Deferred();
    var promise = def.promise();

    var builder = $.Deferred();
    var build = builder.promise();
    
    _.each( _.values( batches ), function ( batch ) {        
        promise = getBatchPrograms( programs, batch );
        promise = promise.then( getMetaProgramIndicators );
        promise = promise.then( getProgramIndicators );
        promise = promise.then( getMetaProgramRules );
        promise = promise.then( getProgramRules );
        promise = promise.then( getMetaProgramRuleVariables );
        promise = promise.then( getProgramRuleVariables );
    });

    build.done(function() {
        def.resolve();
        promise = promise.done( function () {                      
            mainDef.resolve( programs, ids );
        } );        
        
    }).fail(function(){
        mainDef.resolve( null, null );
    });

    builder.resolve();

    return mainPromise;    
}

function getBatchPrograms( programs, batch )
{   
    var ids = '[' + batch.toString() + ']';
    
    var def = $.Deferred();
    
    $.ajax( {
        url: DHIS2URL + '/programs.json',
        type: 'GET',
        data: 'fields=*,dataEntryForm[*],relatedProgram[id,displayName],relationshipType[id,displayName],trackedEntity[id,displayName],categoryCombo[id,displayName,isDefault,categories[id,displayName,categoryOptions[id,displayName]]],organisationUnits[id,displayName],userRoles[id,displayName],programStages[*,dataEntryForm[*],programStageSections[id,displayName,sortOrder,dataElements[id]],programStageDataElements[*,dataElement[*,optionSet[id]]]],programTrackedEntityAttributes[*,trackedEntityAttribute[id,unique]]&paging=false&filter=id:in:' + ids
    }).done( function( response ){

        if(response.programs){
            _.each(_.values( response.programs), function(program){
                if( program.organisationUnits ){
                    var ou = {};
                    _.each(_.values( program.organisationUnits), function(o){
                        ou[o.id] = o.displayName;
                    });
                    program.organisationUnits = ou;
                }
                
                if( program.programStages ){
                    program.programStages = _.sortBy( program.programStages, 'sortOrder' );
                }

                dhis2.tc.store.set( 'programs', program );
            });
        }
        
        def.resolve( programs, batch );
    });

    return def.promise();
}

function getMetaTrackeEntityAttributes( programs )
{
    var def = $.Deferred();
    
    $.ajax({
        url: DHIS2URL + '/trackedEntityAttributes.json',
        type: 'GET',
        data:'paging=false&filter=displayInListNoProgram:eq:true&fields=id,optionSet[id,version]'
    }).done( function(response) {          
        var trackedEntityAttributes = [];
        _.each( _.values( response.trackedEntityAttributes ), function ( trackedEntityAttribute ) {             
            if( trackedEntityAttribute && trackedEntityAttribute.id ) {            
                trackedEntityAttributes.push( trackedEntityAttribute );
            }            
        });
        
        _.each( _.values( programs ), function ( program ) {        
            if(program.programTrackedEntityAttributes){
                _.each(_.values(program.programTrackedEntityAttributes), function(teAttribute){
                    if( trackedEntityAttributes.indexOf(teAttribute.id) === -1 ){
                        trackedEntityAttributes.push(teAttribute.trackedEntityAttribute);
                    }
                });
            }
        });
        
        def.resolve( programs, trackedEntityAttributes );
        
    }).fail(function(){
        def.resolve( null );
    });
    
    return def.promise();
}

function filterMissingTrackedEntityAttributes( programs, trackedEntityAttributes )
{
    if( !trackedEntityAttributes ){
        return;
    }
    
    var mainDef = $.Deferred();
    var mainPromise = mainDef.promise();

    var def = $.Deferred();
    var promise = def.promise();

    var builder = $.Deferred();
    var build = builder.promise();        

    _.each(_.values(trackedEntityAttributes), function(teAttribute){        
        build = build.then(function() {
            var d = $.Deferred();
            var p = d.promise();
            dhis2.tc.store.get('attributes', teAttribute.id).done(function(obj) {
                if(!obj && trackedEntityAttributeIds.indexOf(teAttribute.id) === -1) {
                    trackedEntityAttributeIds.push( teAttribute.id );
                }
                d.resolve();
            });
            return p;
        });            
    });

    build.done(function() {
        def.resolve();
        promise = promise.done( function () {
            mainDef.resolve( programs, trackedEntityAttributes );
        } );
    }).fail(function(){
        mainDef.resolve( null );
    });

    builder.resolve();

    return mainPromise;    
}

function getTrackedEntityAttributes( programs, trackedEntityAttributes)
{
    return dhis2.tracker.getBatches( trackedEntityAttributeIds, batchSize, {programs: programs, trackedEntityAttributes: trackedEntityAttributes}, 'attributes', 'trackedEntityAttributes', DHIS2URL + '/trackedEntityAttributes.json', 'paging=false&fields=id,generated,displayName,code,description,valueType,optionSetValue,confidential,inherit,sortOrderInVisitSchedule,sortOrderInListNoProgram,displayOnVisitSchedule,displayInListNoProgram,unique,programScope,orgunitScope,confidential,optionSet[id,version],trackedEntity[id,displayName]', 'idb', dhis2.tc.store );
}

function getOptionSetsForAttributes( data )
{
    if( !data || !data.trackedEntityAttributes ){
        return;
    }
    
    var mainDef = $.Deferred();
    var mainPromise = mainDef.promise();

    var def = $.Deferred();
    var promise = def.promise();

    var builder = $.Deferred();
    var build = builder.promise();

    _.each(_.values( data.trackedEntityAttributes), function( teAttribute) {           
        if( teAttribute.optionSet && teAttribute.optionSet.id ){
            build = build.then(function() {
                var d = $.Deferred();
                var p = d.promise();
                dhis2.tc.store.get('optionSets', teAttribute.optionSet.id).done(function(obj) {                            
                    if((!obj || obj.version !== teAttribute.optionSet.version) && optionSetIds.indexOf(teAttribute.optionSet.id) === -1) {                                
                        optionSetIds.push(teAttribute.optionSet.id);
                    }
                    d.resolve();
                });

                return p;
            });
        }            
    });

    build.done(function() {
        def.resolve();
        promise = promise.done( function () {
            mainDef.resolve( data );
        } );
    }).fail(function(){
        mainDef.resolve( null );
    });

    builder.resolve();

    return mainPromise;    
}

function getOptionSetsForDataElements( data )
{   
    if( !data ||!data.programs ){
        return;
    }
   
    var mainDef = $.Deferred();
    var mainPromise = mainDef.promise();

    var def = $.Deferred();
    var promise = def.promise();

    var builder = $.Deferred();
    var build = builder.promise();
    
    _.each( _.values( data.programs ), function ( program ) {
        if(program.programStages){
            _.each(_.values( program.programStages), function( programStage) {
                if(programStage.programStageDataElements){
                    _.each(_.values( programStage.programStageDataElements), function(prStDe){
                        if( prStDe.dataElement ){                                    
                            if( prStDe.dataElement.optionSet && prStDe.dataElement.optionSet.id ){
                                build = build.then(function() {
                                    var d = $.Deferred();
                                    var p = d.promise();
                                    dhis2.tc.store.get('optionSets', prStDe.dataElement.optionSet.id).done(function(obj) {                                    
                                        if( (!obj || obj.version !== prStDe.dataElement.optionSet.version) && optionSetIds.indexOf(prStDe.dataElement.optionSet.id) === -1) {                                
                                            optionSetIds.push( prStDe.dataElement.optionSet.id );
                                        }
                                        d.resolve();
                                    });
                                    return p;
                                });
                            }
                        }
                    });
                }
            });
        }
    });
    
    build.done(function() {
        def.resolve();
        promise = promise.done( function () {
            mainDef.resolve();
        } );
    }).fail(function(){
        mainDef.resolve();
    });
    
    builder.resolve();

    return mainPromise;    
}

function getOptionSets()
{   
    return dhis2.tracker.getBatches( optionSetIds, batchSize, null, 'optionSets', 'optionSets', DHIS2URL + '/optionSets.json', 'paging=false&fields=id,displayName,version,options[id,displayName,code]', 'idb', dhis2.tc.store );
}

function getMetaProgramIndicators( programs, programIds )
{   
    programs.programIds = programIds;
    return dhis2.tracker.getTrackerMetaObjects(programs, 'programIndicators', DHIS2URL + '/programIndicators.json', 'paging=false&fields=id&filter=program.id:in:');
}

function getProgramIndicators( programIndicators )
{
    return dhis2.tracker.checkAndGetTrackerObjects( programIndicators, 'programIndicators', DHIS2URL + '/programIndicators', 'fields=id,displayName,code,shortName,displayInForm,expression,displayDescription,description,filter,program[id]', dhis2.tc.store);
}

function getMetaProgramRules( programs )
{    
    return dhis2.tracker.getTrackerMetaObjects(programs, 'programRules', DHIS2URL + '/programRules.json', 'paging=false&fields=id&filter=program.id:in:');
}

function getProgramRules( programRules )
{
    return dhis2.tracker.checkAndGetTrackerObjects( programRules, 'programRules', DHIS2URL + '/programRules', 'fields=id,displayName,condition,description,program[id],programStage[id],priority,programRuleActions[id,content,location,data,programRuleActionType,programStageSection[id],dataElement[id],trackedEntityAttribute[id],programIndicator[id],programStage[id]]', dhis2.tc.store);
}

function getMetaProgramRuleVariables( programs )
{    
    return dhis2.tracker.getTrackerMetaObjects(programs, 'programRuleVariables', DHIS2URL + '/programRuleVariables.json', 'paging=false&fields=id&filter=program.id:in:');
}

function getProgramRuleVariables( programRuleVariables )
{
    return dhis2.tracker.checkAndGetTrackerObjects( programRuleVariables, 'programRuleVariables', DHIS2URL + '/programRuleVariables', 'fields=id,displayName,programRuleVariableSourceType,program[id],programStage[id],dataElement[id],trackedEntityAttribute[id],useCodeForOptionSet', dhis2.tc.store);
}
