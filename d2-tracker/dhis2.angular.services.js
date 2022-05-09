/* Pagination service */
/* global angular, dhis2, moment */
import { extractDataMatrixValue } from './dhis2.d2GS1DataMatrix.js';

var d2Services = angular.module('d2Services', ['ngResource'])

/* Factory for loading translation strings */
.factory('i18nLoader', function ($q, $http, SessionStorageService, DHIS2URL) {
    
    var getTranslationStrings = function (locale) {
        var defaultUrl = 'i18n/i18n_app.properties';
        var url = '';
        if (locale === 'en' || !locale) {
            url = defaultUrl;
        }
        else {
            url = 'i18n/i18n_app_' + locale + '.properties';
        }

        var tx = {locale: locale};

        var promise = $http.get(url).then(function (response) {
            tx = {locale: locale, keys: dhis2.util.parseJavaProperties(response.data)};
            return tx;
        }, function () {

            var p = $http.get(defaultUrl).then(function (response) {
                tx = {locale: locale, keys: dhis2.util.parseJavaProperties(response.data)};
                return tx;
            });
            return p;
        });
        return promise;
    };

    var getUserSetting = function () {
        var locale = 'en';
        
        var promise = $http.get( DHIS2URL + '/userSettings.json?key=keyDbLocale&key=keyUiLocale&key=keyStyle').then(function (response) {
            SessionStorageService.set('USER_SETTING', response.data);
            if (response.data &&response.data.keyUiLocale) {
                locale = response.data.keyUiLocale;
            }
            return locale;
        }, function () {
            return locale;
        });

        return promise;
    };
    return function () {
        var deferred = $q.defer(), translations;
        var userSetting = SessionStorageService.get('USER_SETTING');
        if (userSetting && userSetting.keyUiLocale) {
            getTranslationStrings(userSetting.keyUiLocale).then(function (response) {
                translations = response.keys;
                deferred.resolve(translations);
            });
            return deferred.promise;
        }
        else {
            getUserSetting().then(function (locale) {
                getTranslationStrings(locale).then(function (response) {
                    translations = response.keys;
                    deferred.resolve(translations);
                });
            });
            return deferred.promise;
        }
    };
})
    
.service('AuthorityService', function () {
    var getAuthorities = function (roles) {
        var authority = {};
        if (roles && roles.userCredentials && roles.userCredentials.userRoles) {
            angular.forEach(roles.userCredentials.userRoles, function (role) {
                angular.forEach(role.authorities, function (auth) {
                    authority[auth] = true;
                });
            });
        }
        return authority;
    };

    return {
        getUserAuthorities: function (roles) {
            var auth = getAuthorities(roles);
            var authority = {};
            var allAuth = auth['ALL'];
            authority.ALL = allAuth;
            authority.canCascadeDeleteTei = auth['F_TEI_CASCADE_DELETE'] || allAuth;
            authority.canUncompleteEvent = auth['F_UNCOMPLETE_EVENT'] || allAuth;
            authority.canCascadeDeleteEnrollment = auth['F_ENROLLMENT_CASCADE_DELETE'] || allAuth;
            authority.canReopenDataSet = auth['F_DATASET_REOPEN'] || allAuth;
            authority.canEditExpiredStuff = auth['F_EDIT_EXPIRED'] || allAuth;
            authority.canAdministerDashboard = auth['F_PROGRAM_DASHBOARD_CONFIG_ADMIN'] || allAuth;
            authority.ignoreRequiredTrackerValueValidation = auth['F_IGNORE_TRACKER_REQUIRED_VALUE_VALIDATION'] || allAuth;
            return authority;
        }
    };
})

/* Factory for loading external data */
.factory('ExternalDataFactory', function ($http) {

    return {
        get: function (fileName) {
            var promise = $http.get(fileName).then(function (response) {
                return response.data;
            });
            return promise;
        }
    };
})

/* service for wrapping sessionStorage '*/
.service('SessionStorageService', function ($window) {
    return {
        get: function (key) {
            return JSON.parse($window.sessionStorage.getItem(key));
        },
        set: function (key, obj) {
            $window.sessionStorage.setItem(key, JSON.stringify(obj));
        },
        clearAll: function () {
            for (var key in $window.sessionStorage) {
                $window.sessionStorage.removeItem(key);
            }
        }
    };
})

/* service for getting calendar setting */
.service('CalendarService', function (storage, $rootScope) {

    return {
        getSetting: function () {

            var dhis2CalendarFormat = {keyDateFormat: 'yyyy-MM-dd', keyCalendar: 'gregorian', momentFormat: 'YYYY-MM-DD'};
            var storedFormat = storage.get('SYSTEM_SETTING');
            
            if (angular.isObject(storedFormat) && storedFormat.keyDateFormat && storedFormat.keyCalendar) {
                if (storedFormat.keyCalendar === 'iso8601') {
                    storedFormat.keyCalendar = 'gregorian';
                }

                if (storedFormat.keyDateFormat === 'dd-MM-yyyy') {
                    dhis2CalendarFormat.momentFormat = 'DD-MM-YYYY';
                }

                dhis2CalendarFormat.keyCalendar = storedFormat.keyCalendar;
                dhis2CalendarFormat.keyDateFormat = storedFormat.keyDateFormat;
            }
            $rootScope.dhis2CalendarFormat = dhis2CalendarFormat;
            return dhis2CalendarFormat;
        }
    };
})

/* service for dealing with dates */
.service('DateUtils', function ($filter, CalendarService, NotificationService, $translate) {
    var formatDate = function(date){
       return date.substring(6,10) + '-' + date.substring(3,5) + '-' + date.substring(0,2);
    };
    return {        
        getDate: function (dateValue) {
            if (!dateValue) {
                return;
            }
            var calendarSetting = CalendarService.getSetting();
            dateValue = moment(dateValue, calendarSetting.momentFormat)._d;
            return Date.parse(dateValue);
        },
        format: function (dateValue) {
            if (!dateValue) {
                return;
            }

            var calendarSetting = CalendarService.getSetting();
            dateValue = moment(dateValue, calendarSetting.momentFormat)._d;
            dateValue = $filter('date')(dateValue, calendarSetting.keyDateFormat);
            return dateValue;
        },
        formatToHrsMins: function (dateValue) {
            var calendarSetting = CalendarService.getSetting();
            var dateFormat = 'YYYY-MM-DD @ hh:mm A';
            if (calendarSetting.keyDateFormat === 'dd-MM-yyyy') {
                dateFormat = 'DD-MM-YYYY @ hh:mm A';
            }
            return moment(dateValue).format(dateFormat);
        },
        formatToHrsMinsSecs: function (dateValue) {
            var calendarSetting = CalendarService.getSetting();
            var dateFormat = 'YYYY-MM-DD @ hh:mm:ss A';
            if (calendarSetting.keyDateFormat === 'dd-MM-yyyy') {
                dateFormat = 'DD-MM-YYYY @ hh:mm:ss A';
            }
            return moment(dateValue).format(dateFormat);
        },
        getToday: function () {
            var calendarSetting = CalendarService.getSetting();
            var tdy = $.calendars.instance(calendarSetting.keyCalendar).newDate();
            var today = moment(tdy._year + '-' + tdy._month + '-' + tdy._day, 'YYYY-MM-DD')._d;
            today = Date.parse(today);
            today = $filter('date')(today, calendarSetting.keyDateFormat);
            return today;
        },
        isValid: function( dateValue ){
            if( !dateValue ){
                return false;
            }
            var convertedDate = this.format(angular.copy(dateValue));
            return dateValue === convertedDate;
        },
        isBeforeToday: function (dateValue) {
            if (!dateValue) {
                return;
            }
            dateValue = moment(dateValue, "YYYY-MM-DD");
            if (dateValue.isBefore(moment())) {
                return true;
            }
            return false;
        },
        isAfterToday: function (dateValue) {
            if (!dateValue) {
                return;
            }
            dateValue = moment(dateValue, "YYYY-MM-DD");
            if (dateValue.isAfter(moment())) {
                return true;
            }
            return false;
        },
        formatFromUserToApi: function (dateValue) {
            if (!dateValue) {
                return;
            }
            var calendarSetting = CalendarService.getSetting();
            dateValue = moment(dateValue, calendarSetting.momentFormat)._d;
            dateValue = Date.parse(dateValue);
            dateValue = $filter('date')(dateValue, 'yyyy-MM-dd');
            return dateValue;
        },
        formatFromApiToUser: function (dateValue) {
            if (!dateValue) {
                return;
            }
            var calendarSetting = CalendarService.getSetting();
            if (moment(dateValue, calendarSetting.momentFormat).format(calendarSetting.momentFormat) === dateValue) {
                return dateValue;
            }
            dateValue = moment(dateValue, 'YYYY-MM-DD')._d;
            return $filter('date')(dateValue, calendarSetting.keyDateFormat);
        },
        formatFromApiToUserCalendar: function (dateValue) {
            if (!dateValue) {
                return;
            }

            var calendarSetting = CalendarService.getSetting();

            //A bit hacky way to check if format id dd-mm-yyyy.
            if(dateValue.charAt(2) === '-') {
                dateValue = moment(dateValue, calendarSetting.momentFormat)._d;
                dateValue = Date.parse(dateValue);
                dateValue = $filter('date')(dateValue, 'yyyy-MM-dd');
            }

            var splitDate = dateValue.split('-');

            //Months are for some reason 0 based.
            var date = new Date(splitDate[0], splitDate[1]-1, splitDate[2]);

            if(calendarSetting.keyCalendar === 'ethiopian') {
                date = date.toLocaleDateString('en-GB-u-ca-ethiopic');

            } else if(calendarSetting.keyCalendar === 'coptic') {
                date = date.toLocaleDateString('en-GB-u-ca-coptic');

            } else if(calendarSetting.keyCalendar === 'gregorian') {
                date = date.toLocaleDateString('en-GB-u-ca-gregory');

            } else if(calendarSetting.keyCalendar === 'islamic') {
                date = date.toLocaleDateString('en-GB-u-ca-islamic');
                
            } else if(calendarSetting.keyCalendar === 'iso8601') {
                date = date.toLocaleDateString('en-GB-u-ca-iso8601');
            
            } else if(calendarSetting.keyCalendar === 'persian') {
                date = date.toLocaleDateString('en-GB-u-ca-persian');
                
            } else if(calendarSetting.keyCalendar === 'thai') {
                date = date.toLocaleDateString('en-GB-u-ca-buddhist');
                
            } else if(calendarSetting.keyCalendar === 'nepali') {
                date = date.toLocaleDateString('en-GB-u-ca-ne');
                
            } else {
                date = date.toLocaleDateString('en-GB-u-ca-iso8601');
            
            }
            
            date = formatDate(date);
            return date;
        },
        getDateAfterOffsetDays: function (offSetDays) {
            var date = new Date();
            date.setDate(date.getDate()+offSetDays);
            var calendarSetting = CalendarService.getSetting();
            var tdy = $.calendars.instance(calendarSetting.keyCalendar).fromJSDate(date);
            var dateAfterOffset = moment(tdy._year + '-' + tdy._month + '-' + tdy._day, 'YYYY-MM-DD')._d;
            dateAfterOffset = Date.parse(dateAfterOffset);
            dateAfterOffset = $filter('date')(dateAfterOffset, calendarSetting.keyDateFormat);
            return dateAfterOffset;
        },
        verifyExpiryDate: function(date, expiryPeriodType, expiryDays, showNotifications){
            var eventPeriodEndDate, eventDate, eventPeriod;
            var isValid = true;
            var calendarSetting, dateFormat, generator, today;
            if(!date || !expiryPeriodType || !expiryDays) {
                return isValid;
            }
            calendarSetting = CalendarService.getSetting();
            dateFormat = calendarSetting.momentFormat;
            generator = new dhis2.period.PeriodGenerator($.calendars.instance(calendarSetting.keyCalendar), dateFormat);
            today = moment(this.getToday(), dateFormat);
            eventDate = moment(date, dateFormat);
            eventPeriod = generator.getPeriodForTheDate(eventDate.format("YYYY-MM-DD"), expiryPeriodType, true);
            if (eventPeriod && eventPeriod.endDate) {
                eventPeriodEndDate = moment(eventPeriod.endDate, "YYYY-MM-DD").add(expiryDays, "days");
                if (today.isAfter(eventPeriodEndDate)) {
                    if(showNotifications){
                        NotificationService.showNotifcationDialog($translate.instant("error"), $translate.instant("event_date_out_of_range"));
                    }
                    isValid = false;
                }
            }
            return isValid;
        },
        verifyOrgUnitPeriodDate: function(date, periodStartDate, periodEndDate) {
            var isValid = true;
            var dateFormat, startDate, endDate, eventDate, calendarSetting;
            if(!date) {
                hideHeaderMessage();
                return isValid;
            }
            if (!periodStartDate && !periodEndDate) {
                hideHeaderMessage();
                return isValid;
            } else {
                calendarSetting = CalendarService.getSetting();
                dateFormat = calendarSetting.momentFormat;
                eventDate = moment(date, dateFormat);
                if (!periodStartDate) {
                    endDate = moment(periodEndDate, "YYYY-MM-DD");
                    if (eventDate.isAfter(endDate)) {
                        isValid = false;
                    }
                } else if (!periodEndDate) {
                    startDate = moment(periodStartDate, "YYYY-MM-DD");
                    if (eventDate.isBefore(startDate)) {
                        isValid = false;
                    }
                } else {
                    startDate = moment(periodStartDate, "YYYY-MM-DD");
                    endDate = moment(periodEndDate, "YYYY-MM-DD");
                    if (eventDate.isBefore(startDate) || eventDate.isAfter(endDate)) {
                        isValid = false;
                    }
                }
            }
            if(!isValid) {
                setHeaderDelayMessage($translate.instant("date_out_of_ou_period"));
            } else {
                hideHeaderMessage();
            }
            return isValid;
        },
        getAge: function( _dob ) {
            var calendarSetting = CalendarService.getSetting();

            var tdy = $.calendars.instance(calendarSetting.keyCalendar).newDate();
            var now = moment(tdy._year + '-' + tdy._month + '-' + tdy._day, 'YYYY-MM-DD')._d;
            now = Date.parse(now);
            now = $filter('date')(now, calendarSetting.keyDateFormat);
            now = moment( now, calendarSetting.momentFormat);

            var dob = moment( _dob, calendarSetting.momentFormat);
            var age = {};
            age.years = now.diff(dob, 'years');
            dob.add(age.years, 'years');

            age.months = now.diff(dob, 'months');
            dob.add(age.months, 'months');

            age.days = now.diff(dob, 'days');
            
            return age;
        },
        getDateFromUTCString: function(utcDateTimeString) {
            var calendarSetting = CalendarService.getSetting();
            return moment(utcDateTimeString).format(calendarSetting.momentFormat);
        }
    };
})

.service('UsersService', function( $http, $translate) {

    var mapUserLookupResponse = function( userLookup ) {
        return {userid: userLookup.id, username: userLookup.username, firstName: userLookup.firstName, lastName: userLookup.surname};
    };

    return {
        getByQuery: function( queryString ){
            var promise = $http.get("../api/userLookup?paging=true&page=1&pageSize=10&query=" + queryString).then(function (response) {
                var users = [];
                angular.forEach(response.data.users, function (user) {
                    var userObj = mapUserLookupResponse(user);
                    users.push(userObj);
                });
                return users;
            });
            return promise;
        },
        getByUid: function( uid ){
            var promise = $http.get("../api/userLookup/" + uid).then(function (response) {
                var userObj = mapUserLookupResponse(response.data);
                return userObj;
            });
            return promise;
        }
    };
}) 

/* Service for option name<->code conversion */
.factory('OptionSetService', function() {
    return {
        getCode: function(options, key){
            if(options){
                for(var i=0; i<options.length; i++){
                    if( key === options[i].displayName){
                        return options[i].code;
                    }
                }
            }
            return key;
        },
        getName: function(options, key){
            if(options){
                for(var i=0; i<options.length; i++){
                    if( key === options[i].code){
                        return options[i].displayName;
                    }
                }
            }
            return key;
        }
    };
})

/* service for common utils */
.service('CommonUtils', function($translate, DateUtils, OptionSetService, CurrentSelection, FileService, OrgUnitFactory, NotificationService, SessionStorageService, storage){
    
    var setFileName = function(event, valueId, dataElementId){
        var fileNames = CurrentSelection.getFileNames() || {};
        FileService.get(valueId).then(function(response){
            if(response && response.displayName){
                if(!fileNames[event.event]){
                    fileNames[event.event] = {};
                }
                fileNames[event.event][dataElementId] = response.displayName;
                CurrentSelection.setFileNames( fileNames );
            }
        });
    };
    
    var setOrgUnitName = function( id ){
        var orgUnitNames = CurrentSelection.getOrgUnitNames() || {};
        if( !orgUnitNames[id] ){                
            OrgUnitFactory.getFromStoreOrServer( id ).then(function (response) {
                if(response && response.displayName) {                                                        
                    orgUnitNames[id] = response.displayName;
                    CurrentSelection.setOrgUnitNames( orgUnitNames );
                }
            });
        }
    };
    
    return {
        formatDataValue: function(event, val, obj, optionSets, destination){
            if(val && (
                obj.valueType === 'NUMBER' ||
                obj.valueType === 'PERCENTAGE' ||
                obj.valueType === 'INTEGER' ||
                obj.valueType === 'INTEGER_POSITIVE' ||
                obj.valueType === 'INTEGER_NEGATIVE' ||
                obj.valueType === 'INTEGER_ZERO_OR_POSITIVE')){
                if( dhis2.validation.isNumber(val)){
                    if(obj.valueType === 'NUMBER' || obj.valueType === 'PERCENTAGE'){
                        val = parseFloat(val);
                    }else{
                        val = parseInt(val);
                    }
                }
            }
            if((val || val === 0) && obj.optionSetValue && obj.optionSet && obj.optionSet.id && optionSets && optionSets[obj.optionSet.id] && optionSets[obj.optionSet.id].options  ){
                if(destination === 'USER'){
                    val = OptionSetService.getName(optionSets[obj.optionSet.id].options, String(val));
                }
                else{
                    val = OptionSetService.getCode(optionSets[obj.optionSet.id].options, val);
                }

            }
            if(val && obj.valueType === 'DATE'){
                if(destination === 'USER'){
                    val = DateUtils.formatFromApiToUser(val);
                }
                else{
                    val = DateUtils.formatFromUserToApi(val);
                }
            }
            if(obj.valueType === 'TRUE_ONLY'){
                if(destination === 'USER'){
                    val = val === 'true' ? true : '';
                }
                else{
                    val = val === true ? 'true' : '';
                }
            }
            if( val && obj.valueType === 'ORGANISATION_UNIT' ){
                if( destination === 'USER' ){                    
                    setOrgUnitName( val );
                }
            }
            if(event && val && destination === 'USER' && obj.valueType === 'FILE_RESOURCE'){                
                setFileName(event, val, obj.id);
            }
            return val;
        },
        displayBooleanAsYesNo: function(value, dataElement){
            if(angular.isUndefined(dataElement) || dataElement.valueType === "BOOLEAN"){
                if(value === "true" || value === true){
                    return "Yes";
                }
                else if(value === "false" || value === false){
                    return "No";
                }
            }
            return value;
        },
        userHasValidRole: function(obj, prop, userRoles){
        	if( !obj || !prop || !userRoles){
                return false;
        	}
        	for(var i=0; i < userRoles.length; i++){            
                if( userRoles[i].authorities && userRoles[i].authorities.indexOf('ALL') !== -1 ){
                    return true;
                }
                if( userRoles[i][prop] && userRoles[i][prop].length > 0 ){
                    for( var j=0; j< userRoles[i][prop].length; j++){
                        if( obj.id === userRoles[i][prop][j].id ){
                            return true;
                        }
                    }
                }
            }
            return false;            	
        },        
        checkAndSetOrgUnitName: function( id ){
            setOrgUnitName( id );
        },
        checkAndSetFileName: function(event, valueId, dataElementId ){
            setFileName(event, valueId, dataElementId);
        },
        getUsername: function(){            
            var userProfile = SessionStorageService.get('USER_PROFILE');
            var username = userProfile && userProfile.userCredentials && userProfile.userCredentials.username ? userProfile.userCredentials.username : '';
            return username;
        },
        getSystemSetting: function(){
            var settings = storage.get('SYSTEM_SETTING');            
            return settings;
        }
    };
})

/* service for dealing with custom form */
.service('CustomFormService', function ($translate, NotificationService) {

    return {
        getForProgramStage: function (programStage, programStageDataElements, singleStageProgram) {

            var htmlCode = programStage.dataEntryForm ? programStage.dataEntryForm.htmlCode : null;
            var timeFormat = "24h"

            if (htmlCode) {
                var inputRegex = /<input.*?\/>/g,
                    match,
                    inputFields = [],
                    hasEventDate = false;

                while (match = inputRegex.exec(htmlCode)) {
                    inputFields.push(match[0]);
                }

                for (var i = 0; i < inputFields.length; i++) {
                    var inputField = inputFields[i];
                    
                    var inputElement = $.parseHTML(inputField);
                    var attributes = {};

                    $(inputElement[0].attributes).each(function () {
                        attributes[this.nodeName] = this.value;
                    });

                    var fieldId = '', newInputField;
                    if (attributes.hasOwnProperty('id')) {

                        if (attributes['id'] === 'executionDate') {
                            fieldId = 'eventDate';
                            hasEventDate = true;

                            //name needs to be unique so that it can be used for validation in angularjs
                            if (attributes.hasOwnProperty('name')) {
                                attributes['name'] = fieldId;
                            }

                            newInputField = '<span class="hideInPrint" ng-if="!isHidden(prStDes.' + fieldId + '.dataElement.id, currentEvent)"><input type="text" ' +
                                this.getAttributesAsString(attributes) +
                                ' ng-model="currentEvent.' + fieldId + '"' +
                                ' ng-disabled="model.editingDisabled"' +
                                ' input-field-id="' + fieldId + '"' +
                                ' d2-date ' +
                                ' d2-date-validator ' +
                                ' max-date="' + 0 + '"' +
                                ' ng-attr-placeholder="{{dhis2CalendarFormat.keyDateFormat}}" ' +
                                ' ng-change="verifyExpiryDate(currentEvent.' + fieldId + ')"'+
                                ' ng-class="getInputNotifcationClass(prStDes.' + fieldId + '.dataElement.id,true)"' +
                                ' blur-or-change="saveDatavalue(prStDes.' + fieldId + ')"' +
                                ' ng-required="{{true}}"></span><span class="not-for-screen"><input type="text" ng-attr-value={{currentEvent.' + fieldId + '}}></span>';
                        }
                        else {
                            fieldId = attributes['id'].substring(4, attributes['id'].length - 1).split("-")[1];

                            //name needs to be unique so that it can be used for validation in angularjs
                            if (attributes.hasOwnProperty('name')) {
                                attributes['name'] = fieldId;
                            }

                            var prStDe = programStageDataElements[fieldId];

                            if (prStDe && prStDe.dataElement && prStDe.dataElement.valueType) {

                                var disableInputField = '!dataElementEditable(prStDes.' + fieldId+')';
                                var commonInputFieldProperty = this.getAttributesAsString(attributes) +
                                    ' ng-model="currentEvent.' + fieldId + '" ' +
                                    ' input-field-id="' + fieldId + '"' +
                                    ' ng-disabled="' + disableInputField + '"' + 
                                    ' ng-required="{{prStDes.' + fieldId + '.compulsory}}" ';

                                
                                //check if dataelement has optionset
                                if (prStDe.dataElement.optionSetValue) {
                                    var optionSetId = prStDe.dataElement.optionSet.id;
                                    var optionFilter = singleStageProgram ? 'd2-option-filter="optionVisibility"' : 'd2-option-filter="optionVisibility[currentEvent.event]"';
                                    newInputField = '<span class="hideInPrint" ng-if="!isHidden(prStDes.' + fieldId + '.dataElement.id, currentEvent)">' +
                                                    '<d2-option-list d2-model="currentEvent"' + 
                                                    'd2-model-id="prStDes.' + fieldId + '.dataElement.id"' +
                                                    'd2-required="prStDes.' + fieldId + '.compulsory"' +
                                                    'd2-disabled="' + disableInputField + '"' +
                                                    'd2-change="saveDatavalue(prStDes.' + fieldId + ', outerForm.' + fieldId + ')"' +
                                                    'd2-max-option-size="maxOptionSize"' +
                                                    optionFilter +
                                                    'd2-all-options="optionSets.' + optionSetId + '.options">' +
                                                    '</d2-option-list>' +
                                                    '</span>';
                                }
                                else {
                                    //check data element type and generate corresponding angular input field
                                    if (prStDe.dataElement.valueType === "NUMBER" ||
                                        prStDe.dataElement.valueType === "PERCENTAGE" ||
                                        prStDe.dataElement.valueType === "INTEGER" ||
                                        prStDe.dataElement.valueType === "INTEGER_POSITIVE" ||
                                        prStDe.dataElement.valueType === "INTEGER_NEGATIVE" ||
                                        prStDe.dataElement.valueType === "INTEGER_ZERO_OR_POSITIVE") {
                                        newInputField = '<span class="hideInPrint" ng-if="!isHidden(prStDes.' + fieldId + '.dataElement.id, currentEvent)"><input type="number" ' +
                                            ' d2-number-validator ' +
                                            //' ng-class="{{getInputNotifcationClass(prStDes.' + fieldId + '.dataElement.id, true)}}" ' +
                                            ' ng-class="getInputNotifcationClass(prStDes.' + fieldId + '.dataElement.id, true)" ' +
                                            ' number-type="' + prStDe.dataElement.valueType + '" ' +
                                            ' ng-blur="saveDatavalue(prStDes.' + fieldId + ', outerForm.' + fieldId + ')"' +
                                            commonInputFieldProperty + 'ng-disabled="model.editingDisabled"></span><span class="not-for-screen"><input type="text" ng-attr-value={{currentEvent.' + fieldId + '}}></span>';
                                    }
                                    else if (prStDe.dataElement.valueType === "BOOLEAN") {
                                    	newInputField = '<span class="hideInPrint" ng-if="!isHidden(prStDes.' + fieldId + '.dataElement.id, currentEvent)"><d2-radio-button ' +
                                                                    ' dh-required="prStDes.' + fieldId + '.compulsory" ' +
                                                                    ' dh-disabled="' + disableInputField + '"' +
                                                                    ' dh-value="currentEvent.' + fieldId + '" ' +
                                                                    ' dh-name="' + fieldId + '" ' +
                                                                    ' dh-current-element="currentElement" ' +
                                                                    ' dh-event="currentEvent.event" ' +
                                                                    ' dh-id="prStDes.' + fieldId + '.dataElement.id" ' +
                                                                    ' dh-click="saveDataValueForRadio(prStDes.' + fieldId + ', currentEvent, value )">' +
                                                            ' </d2-radio-button></span> ' +
                                                            '<span class="not-for-screen">' +
                                                            	'<label class="radio-inline"><input type="radio" ng-attr-value="true" ng-model="currentEvent.' + fieldId +'">{{\'yes\' | translate}}</label>' +
                                                            	'<label class="radio-inline"><input type="radio" ng-attr-value="false" ng-model="currentEvent.' + fieldId + '">{{\'no\' | translate}}</label>' +
                                                            '</span>';
                                    }
                                    else if (prStDe.dataElement.valueType === "DATE") {
                                        var maxDate = prStDe.allowFutureDate ? '' : 0;
                                        newInputField = '<span class="hideInPrint" ng-if="!isHidden(prStDes.' + fieldId + '.dataElement.id, currentEvent)"><input type="text" ' +
                                            ' ng-attr-placeholder="{{dhis2CalendarFormat.keyDateFormat}}" ' +
                                            ' ng-class="getInputNotifcationClass(prStDes.' + fieldId + '.dataElement.id, true)" ' +
                                            ' d2-date ' +
                                            ' d2-date-validator ' +
                                            ' max-date="' + maxDate + '"' +
                                            ' blur-or-change="saveDatavalue(prStDes.' + fieldId + ', outerForm.' + fieldId + ')"' +
                                            commonInputFieldProperty + ' ></span><span class="not-for-screen"><input type="text" ng-attr-value={{currentEvent.' + fieldId + '}}></span>';
                                    }
                                    else if (prStDe.dataElement.valueType === "TRUE_ONLY") {
                                        newInputField = '<span class="hideInPrint" ng-if="!isHidden(prStDes.' + fieldId + '.dataElement.id, currentEvent)"><input type="checkbox" ' +
                                            ' ng-class="getInputNotifcationClass(prStDes.' + fieldId + '.dataElement.id, true)" ' +
                                            ' ng-change="saveDatavalue(prStDes.' + fieldId + ', outerForm.' + fieldId + ')"' +
                                            commonInputFieldProperty + ' ></span><span class="not-for-screen"><input type="checkbox" ng-checked={{currentEvent.' + fieldId + '}}></span>';
                                    }
                                    else if (prStDe.dataElement.valueType === "LONG_TEXT") {
                                        newInputField = '<span class="hideInPrint" ng-if="!isHidden(prStDes.' + fieldId + '.dataElement.id, currentEvent)"><textarea row="3" ' +
                                            ' ng-class="getInputNotifcationClass(prStDes.' + fieldId + '.dataElement.id, true)" ' +
                                            ' ng-blur="saveDatavalue(prStDes.' + fieldId + ', outerForm.' + fieldId + ')"' +
                                            commonInputFieldProperty + '></textarea></span><span class="not-for-screen"><textarea row="3" ng-attr-value={{currentEvent.' + fieldId + '}}></textarea></span>';
                                    }
                                    else if (prStDe.dataElement.valueType === "FILE_RESOURCE") {
                                        newInputField = '<span ng-disabled="' + disableInputField + '" class="input-group hideInPrint" ng-if="!isHidden(prStDes.' + fieldId + '.dataElement.id, currentEvent)">\n\
                                                        <span ng-if="currentEvent.' + fieldId + '">\n\
                                                            <a href ng-click="downloadFile(null, \'' + fieldId + '\', null)" ng-attr-title="fileNames[currentEvent.event][' + fieldId + ']" >{{fileNames[currentEvent.event][' + fieldId + '].length > 20 ? fileNames[currentEvent.event][' + fieldId + '].substring(0,20).concat(\'...\') : fileNames[currentEvent.event][' + fieldId + ']}}</a>\n\
                                                        </span>\n\
                                                        <span class="input-group-btn">\n\
                                                            <span class="btn btn-grp btn-file" ng-click="deleteFile(currentEvent, \'' + fieldId + '\')" ng-if="currentEvent.' + fieldId + '">\n\
                                                                <i class="fa fa-trash alert-danger"></i>\n\
                                                                <span ng-attr-title="{{\'delete\' | translate}}" d2-file-input-name="fileNames[currentEvent.event][' + fieldId + ']" d2-file-input-delete="currentEvent.' + fieldId + '">\n\
                                                                </span>\n\
                                                            </span>\n\
                                                            <span class="btn btn-grp btn-file" ng-if="!currentEvent.' + fieldId + '"> \n\
                                                                <span ng-attr-title="{{\'upload\' | translate}}" >\n\
                                                                        <i class="fa fa-upload"></i>\n\
                                                                        <input  type="file" \n\
                                                                                ' + this.getAttributesAsString(attributes) + '\n\
                                                                                input-field-id="' + fieldId + '"\n\
                                                                                d2-file-input-ps="currentStage"\n\
                                                                                d2-file-input="currentEvent"\n\
                                                                                d2-file-input-current-name="currentFileNames"\n\
                                                                                d2-file-input-name="fileNames">\n\
                                                                </span>\n\
                                                            </span> \n\
                                                        </span>\n\
                                                    </span>' 
                                                    '<span class="not-for-screen">' +
                                                    	'<input type="text" ng-attr-value={{currentEvent.' + fieldId + '}}' +
                                                    '</span>';
                                    }
                                    else if (prStDe.dataElement.valueType === "AGE") {
                                    	newInputField = '<span class="hideInPrint" ng-if="!isHidden(prStDes.' + fieldId + '.dataElement.id, currentEvent)"><d2-age ' +
                                    							' id=" ' + fieldId + '" ' +
						                                        ' d2-object="currentEvent" ' + 
						                                        ' d2-disabled="' + disableInputField + '"' +
                                                                ' d2-required="prStDes.' + fieldId + '.compulsory" ' +
						                                        ' d2-function="saveDatavalue(arg1)" ' +						                                        
						                                        ' d2-function-param-text="prStDes.' + fieldId + '" >' +
						                                '</d2-age></span>' +
                                                        '<span class="not-for-screen">' +
                                                    		'<input type="text" ng-attr-value={{currentEvent.' + fieldId + '}}' +
                                                    	'</span>';
                                    }
                                    else if (prStDe.dataElement.valueType === "COORDINATE") {
                                    	newInputField = '<span class="hideInPrint" ng-if="!isHidden(prStDes.' + fieldId + '.dataElement.id, currentEvent)"><d2-map ' +
                                    							' id=" ' + fieldId + '" ' +
						                                        ' d2-object="currentEvent" ' + 
						                                        ' d2-coordinate-format="\'TEXT\'" ' + 
						                                        ' d2-disabled="'+ disableInputField + '"' +
                                                                ' d2-required="prStDes.' + fieldId + '.compulsory" ' +
						                                        ' d2-function="saveDatavalue(arg1)" ' +						                                        
						                                        ' d2-function-param-text="prStDes.' + fieldId + '" ' +
						                                        ' d2-function-param-coordinate="\'LATLNG\'" > ' +
						                                '</d2-map></span>' +
						                                '<span class="not-for-screen">' +
                                                    		'<input type="text" ng-attr-value={{currentEvent.' + fieldId + '}}' +
                                                    	'</span>';
                                    }
                                    else if (prStDe.dataElement.valueType === "ORGANISATION_UNIT") {
                                    	newInputField = '<span class="hideInPrint" ng-if="!isHidden(prStDes.' + fieldId + '.dataElement.id, currentEvent)"><d2-org-unit-tree ' +
					                                            ' selected-org-unit-id="{{selectedOrgUnit.id}}" ' +
					                                            ' id="{{prStDes.' + fieldId + '.dataElement.id}}" ' +
					                                            ' d2-object="currentEvent" ' +
					                                            ' d2-value="currentEvent.' + fieldId + '" ' +
					                                            ' d2-disabled="'+ disableInputField + '"' +
					                                            ' d2-required="prStDes.' + fieldId + '.compulsory" ' +
                                                                ' d2-orgunit-names="orgUnitNames" ' +
					                                            ' d2-function="saveDatavalue(prStDes.' + fieldId + ', currentEvent, value )" >' +
					                                    ' </d2-org-unit-tree></span>' +
					                                    '<span class="not-for-screen">' +
                                                    		'<input type="text" ng-attr-value={{currentEvent.' + fieldId + '}}' +
                                                    	'</span>';
                                    }
                                    else if (prStDe.dataElement.valueType === "PHONE_NUMBER") {
                                        newInputField = '<span class="hideInPrint" ng-if="!isHidden(prStDes.' + fieldId + '.dataElement.id, currentEvent)"><input type="text" ' +
                                            ' ng-class="getInputNotifcationClass(prStDes.' + fieldId + '.dataElement.id, true)" ' +
                                            ' ng-blur="saveDatavalue(prStDes.' + fieldId + ', outerForm.' + fieldId + ')"' +
                                            commonInputFieldProperty + '></span><span class="not-for-screen"><input type="text" ng-attr-value={{currentEvent.' + fieldId + '}}></span>';
                                    }
                                    else if (prStDe.dataElement.valueType === "EMAIL") {
                                        newInputField = '<span class="hideInPrint" ng-if="!isHidden(prStDes.' + fieldId + '.dataElement.id, currentEvent)"><input style="width:100%;" type="email"' +
                                            ' ng-blur="saveDatavalue(prStDes.' + fieldId + ', outerForm.' + fieldId + ')" ' +
                                            commonInputFieldProperty +
                                            ' ng-model="currentEvent.' + fieldId + '">' +
                                            '<span class="not-for-screen"><input type="email" ng-attr-value={{currentEvent.' + fieldId + '}}></span>';
                                    }
                                    else if (prStDe.dataElement.valueType === "TIME") {
                                        newInputField = '<d2-time time-model="currentEvent" ng-if="!isHidden(prStDes.' + fieldId + '.dataElement.id, currentEvent)" time-model-id="\'' + fieldId + '\'"' +
                                            ' time-required="prStDes.' + fieldId + '.compulsory" time-save-methode="saveDatavalue"' +
                                            ' time-element="currentElement" time-use-notification="true"' +
                                            '  time-disabled="' + disableInputField + '" time-format="timeFormat" time-save-methode-parameter1="prStDes.' + fieldId + '" time-save-methode-parameter2="\'' + fieldId + '\'"></d2-time>';
                                    }
                                    else if (prStDe.dataElement.valueType === "DATETIME") {
                                        newInputField = '<d2-date-time datetime-model="currentEvent" ng-if="!isHidden(prStDes.' + fieldId + '.dataElement.id, currentEvent)" datetime-model-id="\'' + fieldId + '\'"' +
                                            ' datetime-required="prStDes.' + fieldId + '.compulsory" datetime-save-methode="saveDatavalue"' +
                                            ' datetime-date-placeholder="{{dhis2CalendarFormat.keyDateFormat}}" datetime-use-notification="true"' +
                                            '  datetime-disabled="' + disableInputField + '" datetime-save-methode-parameter1="prStDes.' + fieldId + '" datetime-save-methode-parameter2="\'' + fieldId + '\'"></d2-date-time>';
                                    }
                                    else if (prStDe.dataElement.valueType === "TEXT") {
                                        newInputField = '<span class="hideInPrint" ng-if="!isHidden(prStDes.' + fieldId + '.dataElement.id, currentEvent)"><input type="text" ' +
                                            ' ng-class="getInputNotifcationClass(prStDes.' + fieldId + '.dataElement.id, true)" ' +
                                            ' ng-blur="saveDatavalue(prStDes.' + fieldId + ', outerForm.' + fieldId + ')"' +
                                            commonInputFieldProperty + '></span><span class="not-for-screen"><input type="text" ng-attr-value={{currentEvent.' + fieldId + '}}></span>';
                                    }
                                    else{
                                    	newInputField = ' {{"unsupported_value_type" | translate }}: ' + prStDe.dataElement.valueType;
                                    }
                                }
                            }
                            else{
                                NotificationService.showNotifcationDialog($translate.instant("error"),
                                    $translate.instant("custom_form_has_invalid_dataelement"));

                                return;
                            }
                            
                            
                        }
                        newInputField = newInputField + ' <span ng-messages="outerForm.' + fieldId + '.$error" class="required" ng-if="interacted(outerForm.' + fieldId + ')" ng-messages-include="d2-tracker/templates/error-messages.html"></span>';

                        htmlCode = htmlCode.replace(inputField, newInputField);

                    }
                }
                htmlCode = addPopOver(htmlCode, programStageDataElements);
                return {htmlCode: htmlCode, hasEventDate: hasEventDate};
            }
            return null;
        },
        getForTrackedEntity: function (trackedEntityForm, target) {
            if (!trackedEntityForm) {
                return null;
            }

            var htmlCode = trackedEntityForm.htmlCode ? trackedEntityForm.htmlCode : null;
            if (htmlCode) {

                var trackedEntityFormAttributes = [];
                angular.forEach(trackedEntityForm.attributes, function (att) {
                    trackedEntityFormAttributes[att.id] = att;
                });


                var inputRegex = /<input.*?\/>/g, match, inputFields = [];
                var hasProgramDate = false;
                while (match = inputRegex.exec(htmlCode)) {
                    inputFields.push(match[0]);
                }

                for (var i = 0; i < inputFields.length; i++) {
                    var inputField = inputFields[i];
                    var inputElement = $.parseHTML(inputField);
                    var attributes = {};

                    $(inputElement[0].attributes).each(function () {
                        attributes[this.nodeName] = this.value;
                    });
                    var attId = '', fieldName = '', newInputField, programId;
                    if (attributes.hasOwnProperty('attributeid')) {
                        attId = attributes['attributeid'];
                        fieldName = attId;
                        var att = trackedEntityFormAttributes[attId];

                        if (att) {
                            var attMaxDate = att.allowFutureDate ? '' : 0;
                            var isTrackerAssociate = att.valueType === 'TRACKER_ASSOCIATE';
                            var requiredInputField = 'attributeIsRequired('+att.id+','+att.mandatory+')';
                            var disableInputField = 'attributeFieldDisabled(attributesById.'+attId+')';
                            var commonInputFieldProperty = ' name="' + fieldName + '"' +
                                ' element-id="' + i + '"' +
                                this.getAttributesAsString(attributes) +
                                ' d2-focus-next-on-enter' +
                                ' ng-model="selectedTei.' + attId + '" ' +
                                ' attribute-data={{attributesById.' + attId + '}} ' +
                                ' selected-program-id={{selectedProgram.id}} ' +
                                ' selected-tei-id={{selectedTei.trackedEntityInstance}} ' +
                                ' ng-disabled="' + disableInputField + '"'+ 
                                ' d2-attribute-validator ' +
                                ' selected-tet={{trackedEntityTypes.selected.id}}' +
                                ' ng-required="'+requiredInputField+'"';

                            //check if attribute has optionset
                            if (att.optionSetValue) {
                                var optionSetId = att.optionSet.id;
                                newInputField = '<span class="hideInPrint"><ui-select style="width:100%;" theme="select2" ' + commonInputFieldProperty + '  on-select="teiValueUpdated(selectedTei,\'' + attId + '\')" >' +
                                    '<ui-select-match allow-clear="true" ng-attr-placeholder="' + $translate.instant('select_or_search') + '">{{$select.selected.displayName || $select.selected}}</ui-select-match>' +
                                    '<ui-select-choices ' +
                                    'repeat="option.displayName as option in optionSets.' + optionSetId + '.options | filter: $select.search | limitTo:maxOptionSize">' +
                                    '<span ng-bind-html="option.displayName | highlight: $select.search"></span>' +
                                    '</ui-select-choices>' +
                                    '</ui-select></span><span class="not-for-screen"><input type="text" ng-attr-value={{selectedTei.' + attId + '}}></span>';
                            }
                            else {
                                //check attribute type and generate corresponding angular input field
                                if (att.valueType === "NUMBER" ||
                                    att.valueType === "PERCENTAGE" ||
                                    att.valueType === "INTEGER" ||
                                		att.valueType === "INTEGER_POSITIVE" ||
                                		att.valueType === "INTEGER_NEGATIVE" ||
                                		att.valueType === "INTEGER_ZERO_OR_POSITIVE" ) {
                                    newInputField = '<span class="hideInPrint"><input style="width:100%;" type="number"' +
                                        ' d2-number-validator ' +
                                        ' number-type="' + att.valueType + '" ' +
                                        ' ng-blur="teiValueUpdated(selectedTei,\'' + attId + '\')" ' +
                                        commonInputFieldProperty + ' ></span><span class="not-for-screen"><input type="text" ng-attr-value={{selectedTei.' + attId + '}}></span>';
                                }
                                else if (att.valueType === "BOOLEAN") {
                                	newInputField = '<span class="hideInPrint"><d2-radio-button ' +
                                                            ' dh-required="'+requiredInputField+'"' +
                                                            ' dh-disabled="'+ disableInputField + '"' +
                                                            ' dh-value="selectedTei.' + attId + '" ' +
                                                            ' dh-name="foo" ' +
                                                            ' dh-current-element="currentElement" ' +
                                                            ' dh-event="currentEvent.event" ' +
                                                            ' dh-id="' + attId + '" >' +
                                                    ' </d2-radio-button></span>' +
                                                    '<span class="not-for-screen">' +
                                                        '<label class="radio-inline"><input type="radio" ng-attr-value="true" ng-model="selectedTei.' + attId + '">{{\'yes\' | translate}}</label>' +
                                                        '<label class="radio-inline"><input type="radio" ng-attr-value="false" ng-model="selectedTei.' + attId + '">{{\'no\' | translate}}</label>' +
                                                    '</span>';
                                }
                                else if (att.valueType === "DATE") {
                                    newInputField = '<span class="hideInPrint"><input  style="width:100%;" type="text"' +
                                        ' ng-attr-placeholder="{{dhis2CalendarFormat.keyDateFormat}}" ' +
                                        ' max-date=" ' + attMaxDate + ' " ' +
                                        ' d2-date' +
                                        ' ng-change="verifyExpiryDate(\'selectedTei.'+attId+'\')"'+
                                        ' blur-or-change="teiValueUpdated(selectedTei,\'' + attId + '\')" ' +
                                        commonInputFieldProperty + ' ></span>' +
                                        '<span class="not-for-screen"><input type="text" ng-attr-value={{selectedTei.' + attId + '}}></span>';
                                }
                                else if (att.valueType === "TRUE_ONLY") {
                                    newInputField = '<span class="hideInPrint"><input style="width:100%;" type="checkbox" ' +
                                        ' ng-change="teiValueUpdated(selectedTei,\'' + attId + '\')" ' +
                                        commonInputFieldProperty + ' ></span>' +
                                        '<span class="not-for-screen"><input type="checkbox" ng-checked={{selectedTei.' + attId + '}}></span>';
                                }
                                else if (att.valueType === "EMAIL") {
                                    newInputField = '<span class="hideInPrint"><input style="width:100%;" type="email"' +
                                        ' ng-blur="teiValueUpdated(selectedTei,\'' + attId + '\')" ' +
                                        commonInputFieldProperty + ' >' +
                                        '<span class="not-for-screen"><input type="text" ng-attr-value={{selectedTei.' + attId + '}}></span>';
                                }
                                else if (att.valueType === "TRACKER_ASSOCIATE") {
                                	newInputField = '<span class="input-group hideInPrint"> ' +
                                                                        ' <input type="text" style="width:100%;"' +
                                                                        ' ng-blur="teiValueUpdated(selectedTei,\'' + attId + '\')" ' +
                                                                        commonInputFieldProperty + ' >' +
                                                                        '<span class="input-group-btn input-group-btn-no-width"> ' +
                                                            '<button class="btn btn-grp default-btn-height" type="button" ' + 
                                                                ' ng-attr-title="{{\'add\' | translate}} {{attributesById.' + attId + '.displayName}}" ' +
                                                                ' ng-if="!selectedTei.' + attId + '" ' +                                                                
                                                                ' ng-class="{true: \'disable-clicks\'} [editingDisabled]" ' +
                                                                ' ng-click="getTrackerAssociate(attributesById.' + attId + ', selectedTei.' + attId + ')" >' +
                                                                '<i class="fa fa-external-link"></i> ' +
                                                            '</button> ' + 
                                                            '<button class="btn btn-grp default-btn-height" type="button" ' + 
                                                                ' ng-attr-title="{{\'remove\' | translate}} {{attributesById.' + attId + '.displayName}}" ' +
                                                                ' ng-if="selectedTei.' + attId + '" ' +
                                                                ' ng-disabled="' + disableInputField + '"'+
                                                                ' ng-class="{true: \'disable-clicks\'} [editingDisabled]" ' +
                                                                ' ng-click="selectedTei.' + attId + ' = null" >' +
                                                                '<i class="fa fa-trash-o"></i> ' +
                                                            '</button> ' + 
                                                        '</span>'+
                                                    '</span>'+
                                                    '<span class="not-for-screen"><input type="text" ng-attr-value={{selectedTei.' + attId + '}}></span>';
                                }
                                else if (att.valueType === "AGE") {
                                	newInputField = '<span class="hideInPrint"><d2-age ' +
                                                            ' id=" ' + attId + '" ' +
						                                    ' d2-object="selectedTei" ' +  						                                    
						                                    ' d2-required="'+requiredInputField+'"' +
                                                            ' d2-disabled="'+ disableInputField +'" >' +
						                                '</d2-age></span>'+
                                                    '<span class="not-for-screen"><input type="text" ng-attr-value={{selectedTei.' + attId + '}}></span>';
                                }
                                else if (att.valueType === "COORDINATE") {
                                	newInputField = '<span class="hideInPrint"><d2-map ' +
                                                            ' id=" ' + attId + '" ' +
						                                    ' d2-object="selectedTei" ' +  
						                                    ' d2-value="selectedTei.' + attId + '" ' +
						                                    ' d2-required="'+requiredInputField+'"' +
					                                        ' d2-disabled="'+ disableInputField + '"' +
						                                    ' d2-coordinate-format="\'TEXT\'" > ' +
						                            '</d2-map></span>'+
                                                    '<span class="not-for-screen"><input type="text" ng-attr-value={{selectedTei.' + attId + '}}></span>';
                                }
                                else if (att.valueType === "ORGANISATION_UNIT") {
                                	newInputField = '<span class="hideInPrint"><d2-org-unit-tree ' +
				                                            ' selected-org-unit-id="{{selectedOrgUnit.id}}" ' +
				                                            ' id=" ' + attId + '" ' +
				                                            ' d2-object="selectedTei" ' +  
						                                    ' d2-value="selectedTei.' + attId + '" ' +
						                                    ' d2-required="'+requiredInputField+'"' +
					                                        ' d2-disabled="'+ disableInputField + '"' +
                                                            ' d2-orgunit-names="orgUnitNames" ' +
					                                        ' d2-function="teiValueUpdated()" >' +
				                                        ' </d2-org-unit-tree></span>'+
                                                    '<span class="not-for-screen"><input type="text" ng-attr-value={{selectedTei.' + attId + '}}></span>';
                                }
                                else if (att.valueType === "LONG_TEXT") {
                                    newInputField = '<span><textarea style="width:100%;" row ="3" ' +
                                        ' ng-blur="teiValueUpdated(selectedTei,\'' + attId + '\')" ' +
                                        commonInputFieldProperty + ' ></textarea></span>';
                                }
                                else if (att.valueType === "TEXT") {
                                    newInputField = '<input type="text" style="width:100%;"' +
                                        ' ng-blur="teiValueUpdated(selectedTei,\'' + attId + '\')" ' +
                                        commonInputFieldProperty + '>';
                                }
                                else if (att.valueType === "PHONE_NUMBER") {
                                    newInputField = '<input type="text" style="width:100%;"' +
                                        ' ng-blur="teiValueUpdated(selectedTei,\'' + attId + '\')" ' +
                                        commonInputFieldProperty + '>';
                                }
                                else {                                	
                                    newInputField = ' {{"unsupported_value_type" | translate }} ' + att.valueType;
                                }                                
                            }
                        }
                        else{
                            NotificationService.showNotifcationDialog($translate.instant("error"),
                                $translate.instant("custom_form_has_invalid_attribute"));
                            return;
                        }
                    }

                    if (attributes.hasOwnProperty('programid')) {
                        hasProgramDate = true;
                        programId = attributes['programid'];
                        if (programId === 'enrollmentDate') {
                            fieldName = 'dateOfEnrollment';
                            var enMaxDate = trackedEntityForm.selectEnrollmentDatesInFuture ? '' : 0;
                            newInputField = '<input type="text" style="width:100%;"' +
                                ' name="' + fieldName + '"' +
                                ' element-id="' + i + '"' +
                                this.getAttributesAsString(attributes) +
                                ' d2-focus-next-on-enter' +
                                ' ng-attr-placeholder="{{dhis2CalendarFormat.keyDateFormat}}" ' +
                                ' ng-model="selectedEnrollment.dateOfEnrollment" ' +
                                ' ng-change="verifyExpiryDate(\'selectedEnrollment.dateOfEnrollment\')"'+
                                ' ng-disabled="\'' + target + '\' === \'PROFILE\' || selectedOrgUnit.closedStatus"' +
                                ' d2-date' +
                                ' max-date="' + enMaxDate + '"' +
                                ' ng-required="true">';
                        }
                        if (programId === 'dateOfIncident' && trackedEntityForm.displayIncidentDate) {
                            fieldName = 'dateOfIncident';
                            var inMaxDate = trackedEntityForm.selectIncidentDatesInFuture ? '' : 0;
                            newInputField = '<input type="text" style="width:100%;"' +
                                ' name="' + fieldName + '"' +
                                ' element-id="' + i + '"' +
                                this.getAttributesAsString(attributes) +
                                ' d2-focus-next-on-enter' +
                                ' ng-attr-placeholder="{{dhis2CalendarFormat.keyDateFormat}}" ' +
                                ' ng-model="selectedEnrollment.dateOfIncident" ' +
                                ' ng-change="verifyExpiryDate(\'selectedEnrollment.dateOfIncident\')"'+
                                ' ng-disabled="\'' + target + '\' === \'PROFILE\' || selectedOrgUnit.closedStatus"' +
                                ' d2-date ' +
                                ' max-date="' + inMaxDate + '">';
                        }
                    }

                    newInputField = newInputField + ' <span ng-messages="outerForm.' + fieldName + '.$error" class="required" ng-if="interacted(outerForm.' + fieldName + ')" ng-messages-include="d2-tracker/templates/error-messages.html"></span>';

                    htmlCode = htmlCode.replace(inputField, newInputField);
                }
                htmlCode = addPopOver(htmlCode, trackedEntityFormAttributes);
                return {htmlCode: htmlCode, hasProgramDate: hasProgramDate};
            }
            return null;
        },
        getAttributesAsString: function (attributes) {
            if (attributes) {
                var attributesAsString = '';
                for (var prop in attributes) {
                    if (prop !== 'value') {
                        attributesAsString += prop + '="' + attributes[prop] + '" ';
                    }
                }
                return attributesAsString;
            }
            return null;
        }
    };
    /* This function inserts the d2-pop-over attributes into the tags containing d2-input-label attribute to
     * add description and url popover to those tags */
    function addPopOver(htmlCodeToInsertPopOver, popOverContent) {

        var inputRegex = /<span.*?\/span>/g;
        var match, tagToInsertPopOver, tagWithPopOver;
        var htmlCode = htmlCodeToInsertPopOver;
        while (match = inputRegex.exec(htmlCodeToInsertPopOver)) {
            if (match[0].indexOf("d2-input-label") > -1) {
                tagToInsertPopOver = match[0];
                tagWithPopOver = insertPopOverSpanToTag(tagToInsertPopOver, popOverContent);
                htmlCode = htmlCode.replace(tagToInsertPopOver,tagWithPopOver);
            }
        }
        return htmlCode;

    }

    function insertPopOverSpanToTag(tagToInsertPopOverSpan, popOverContent)  {

        var attribute, attributes, fieldId, description, url, element, attValue;
        var popOverSpanElement, tagWithPopOverSpan;

        element = $(tagToInsertPopOverSpan);
        attributes = element[0].attributes;

        for (var index = 0; index < attributes.length; index++) {
            if (attributes[index].name === "d2-input-label") {
                attValue = attributes[index].value;
                break;
            }
        }
        if (attValue) {
            popOverSpanElement = $('<span></span>');
            popOverSpanElement.attr("d2-pop-over","");
            popOverSpanElement.attr("details","{{'details'| translate}}");
            popOverSpanElement.attr("trigger","click");
            popOverSpanElement.attr("placement","right");
            popOverSpanElement.attr("class","popover-label");

            if (attValue.indexOf("attributeId.") > -1) {
                fieldId = attValue.split(".")[1];
                description = popOverContent[fieldId].description ? "'" + popOverContent[fieldId].description + "'" :
                    "undefined";
                popOverSpanElement.attr("content","{description: " + description + "}");
                popOverSpanElement.attr("template","attribute-details.html");

            } else {
                fieldId = attValue.split("-")[1];
                description = popOverContent[fieldId].dataElement.description ? "'" +
                popOverContent[fieldId].dataElement.description + "'" : "undefined";
                url = popOverContent[fieldId].dataElement.url ? "'" +
                popOverContent[fieldId].dataElement.url + "'" : "undefined";
                popOverSpanElement.attr("content","{description: " + description + ", url:" + url + "}");
                popOverSpanElement.attr("template","dataelement-details.html");
            }
            popOverSpanElement.html("<a href ng-attr-title=\"{{'details'| translate}}\" class=\"wrap-text\" tabindex=\"-1\">" +element.html() + "</a>");
            element.html(popOverSpanElement[0].outerHTML.replace('d2-pop-over=""','d2-pop-over'));
            tagWithPopOverSpan = element[0].outerHTML;
        }
        return tagWithPopOverSpan;
    }
})

/* Context menu for grid*/
.service('ContextMenuSelectedItem', function () {
    this.selectedItem = '';

    this.setSelectedItem = function (selectedItem) {
        this.selectedItem = selectedItem;
    };

    this.getSelectedItem = function () {
        return this.selectedItem;
    };
})

/* Modal service for user interaction */
.service('ModalService', ['$modal', function ($modal) {

    var modalDefaults = {
        backdrop: true,
        keyboard: true,
        modalFade: true,
        templateUrl: 'views/modal.html'
    };

    var modalOptions = {
        closeButtonText: 'Close',
        actionButtonText: 'OK',
        headerText: 'Proceed?',
        bodyText: 'Perform this action?'
    };

    this.showModal = function (customModalDefaults, customModalOptions) {
        if (!customModalDefaults)
            customModalDefaults = {};
        customModalDefaults.backdrop = 'static';
        return this.show(customModalDefaults, customModalOptions);
    };

    this.show = function (customModalDefaults, customModalOptions) {
        //Create temp objects to work with since we're in a singleton service
        var tempModalDefaults = {};
        var tempModalOptions = {};

        //Map angular-ui modal custom defaults to modal defaults defined in service
        angular.extend(tempModalDefaults, modalDefaults, customModalDefaults);

        //Map modal.html $scope custom properties to defaults defined in service
        angular.extend(tempModalOptions, modalOptions, customModalOptions);

        if (!tempModalDefaults.controller) {
            tempModalDefaults.controller = ['$scope','$modalInstance', function ($scope, $modalInstance) {
                $scope.modalOptions = tempModalOptions;
                $scope.modalOptions.ok = function (result) {
                    $modalInstance.close(result);
                };
                $scope.modalOptions.close = function (result) {
                    $modalInstance.dismiss('cancel');
                };
            }];
        }

        return $modal.open(tempModalDefaults).result;
    };

}])

/* Dialog service for user interaction */
.service('DialogService', ['$modal', function ($modal) {

    var dialogDefaults = {
        backdrop: true,
        keyboard: true,
        backdropClick: true,
        modalFade: true,
        templateUrl: 'views/dialog.html'
    };

    var dialogOptions = {
        closeButtonText: 'close',
        actionButtonText: 'ok',
        headerText: 'dhis2_tracker',
        bodyText: 'Perform this action?'
    };

    this.showDialog = function (customDialogDefaults, customDialogOptions, summaries) {
        if (!customDialogDefaults)
            customDialogDefaults = {};
        customDialogDefaults.backdropClick = false;
        return this.show(customDialogDefaults, customDialogOptions, summaries);
    };

    this.show = function (customDialogDefaults, customDialogOptions, summaries) {
        //Create temp objects to work with since we're in a singleton service
        var tempDialogDefaults = {};
        var tempDialogOptions = {};

        //Map angular-ui modal custom defaults to modal defaults defined in service
        angular.extend(tempDialogDefaults, dialogDefaults, customDialogDefaults);

        //Map modal.html $scope custom properties to defaults defined in service
        angular.extend(tempDialogOptions, dialogOptions, customDialogOptions);

        if (!tempDialogDefaults.controller) {
            tempDialogDefaults.controller = ['$scope','$modalInstance', function ($scope, $modalInstance) {
                $scope.dialogOptions = tempDialogOptions;
                $scope.dialogOptions.ok = function (result) {
                    $modalInstance.close(result);
                };
                if(summaries) {
                    $scope.summaries = summaries;
                }
            }];
            
        }

        return $modal.open(tempDialogDefaults).result;
    };

}])
.service('NotificationService', function (DialogService, $timeout) {
    this.showNotifcationDialog = function(errorMsgheader, errorMsgBody, errorResponse){
        var dialogOptions = {
            headerText: errorMsgheader,
            bodyText: errorMsgBody
        };
        var summaries = null;
        if (errorResponse && errorResponse.data) {
            if(errorResponse.data.message && (errorResponse.data.status === 'ERROR' || errorResponse.data.status === 'WARNING')) {
                dialogOptions.bodyText += "<br/>"+errorResponse.data.message+"<br/>";
            }
            if( errorResponse.data.response && errorResponse.data.response.importSummaries && errorResponse.data.response.importSummaries.length > 0 ){
                summaries = JSON.stringify(errorResponse.data.response.importSummaries);
            }
        }
        DialogService.showDialog({}, dialogOptions, summaries);
    };

    this.showNotifcationWithOptions = function(dialogDefaults, dialogOptions){
        DialogService.showDialog(dialogDefaults, dialogOptions);
    };
    
    this.displayDelayedHeaderMessage = function( message ){
        setHeaderDelayMessage( message );
    };
    
    this.displayHeaderMessage = function( message ){
        $timeout(function(){
            setHeaderMessage( message );
        }, 1000);
    };
    
    this.removeHeaderMessage = function(){
        hideHeaderMessage();
    };
})
.service('Paginator', function () {
    this.page = 1;
    this.pageSize = 50;
    this.itemCount = 0;
    this.pageCount = 0;
    this.toolBarDisplay = 5;

    this.setPage = function (page) {
        if (page > this.getPageCount()) {
            return;
        }

        this.page = page;
    };

    this.getPage = function () {
        return this.page;
    };

    this.setPageSize = function (pageSize) {
        this.pageSize = pageSize;
    };

    this.getPageSize = function () {
        return this.pageSize;
    };

    this.setItemCount = function (itemCount) {
        this.itemCount = itemCount;
    };

    this.getItemCount = function () {
        return this.itemCount;
    };

    this.setPageCount = function (pageCount) {
        this.pageCount = pageCount;
    };

    this.getPageCount = function () {
        return this.pageCount;
    };

    this.setToolBarDisplay = function (toolBarDisplay) {
        this.toolBarDisplay = toolBarDisplay;
    };

    this.getToolBarDisplay = function () {
        return this.toolBarDisplay;
    };

    this.lowerLimit = function () {
        var pageCountLimitPerPageDiff = this.getPageCount() - this.getToolBarDisplay();

        if (pageCountLimitPerPageDiff < 0) {
            return 0;
        }

        if (this.getPage() > pageCountLimitPerPageDiff + 1) {
            return pageCountLimitPerPageDiff;
        }

        var low = this.getPage() - (Math.ceil(this.getToolBarDisplay() / 2) - 1);

        return Math.max(low, 0);
    };
})

.service('GridColumnService', function ($http, $q, DHIS2URL, $translate, SessionStorageService, NotificationService) {
    var GRIDCOLUMNS_URL = DHIS2URL+'/userDataStore/gridColumns/';
    return {
        columnExists: function (cols, id) {
            var colExists = false;
            if (!angular.isObject(cols) || !id || angular.isObject(cols) && !cols.length) {
                return colExists;
            }

            for (var i = 0; i < cols.length && !colExists; i++) {
                if (cols[i].id === id) {
                    colExists = true;
                }
            }
            return colExists;
        },
        set: function (gridColumns, name) {
            var deferred = $q.defer();
            var httpMessage = {
                method: "put",
                url: GRIDCOLUMNS_URL + name,
                data: {"gridColumns": gridColumns},
                headers: {'Content-Type': 'application/json;charset=UTF-8'}
            };

            $http(httpMessage).then(function (response) {
                deferred.resolve(response.data);
            },function (error) {
                httpMessage.method = "post";
                $http(httpMessage).then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    if (error && error.data) {
                        deferred.resolve(error.data);
                    } else {
                        deferred.resolve(null);
                    }
                });
            });
            return deferred.promise;
        },
        get: function (name) {
            var promise = $http.get(GRIDCOLUMNS_URL+name).then(function (response) {
                if (response && response.data && response.data.gridColumns) {
                    SessionStorageService.set(name, {id:name, columns:response.data.gridColumns});
                    return response.data.gridColumns;
                } else {
                    NotificationService.showNotifcationDialog($translate.instant("error"), $translate.instant("gridColumns_invalid"));
                    return null;
                }
            }, function (error) {
                var gridColumnsFromSessionStore = SessionStorageService.get(name);
                if (gridColumnsFromSessionStore && gridColumnsFromSessionStore.columns) {
                    return gridColumnsFromSessionStore.columns;
                }
                return null;
            });
            return promise;
        }
    };
})

/* Service for uploading/downloading file */
.service('FileService', function ($http, DHIS2URL) {

    return {
        get: function (uid) {
            var promise = $http.get(DHIS2URL + '/fileResources/' + uid).then(function (response) {
                return response.data;
            } ,function(error) {
                return null;
            });
            return promise;
        },
        download: function (fileName) {
            var promise = $http.get(fileName).then(function (response) {
                return response.data;
            }, function(error) {
                return null;
            });
            return promise;
        },
        upload: function(file){
            var formData = new FormData();
            formData.append('file', file);
            var headers = {transformRequest: angular.identity, headers: {'Content-Type': undefined}};
            var promise = $http.post(DHIS2URL + '/fileResources', formData, headers).then(function(response){
                return response.data;
            },function(error) {
               return null;
            });
            return promise;
        }
    };
})

/* service for building variables based on the data in users fields */
.service('VariableService', function(DateUtils,OptionSetService,$filter,$log,$q){
    var processSingleValue = function(processedValue,valueType){
        //First clean away single or double quotation marks at the start and end of the variable name.
        processedValue = $filter('trimquotes')(processedValue);

        //Append single quotation marks in case the variable is of text or date type:
        if(valueType === 'LONG_TEXT' || valueType === 'TEXT' || valueType === 'DATE' || valueType === 'AGE' || valueType === 'OPTION_SET' ||
            valueType === 'URL' || valueType === 'DATETIME' || valueType === 'TIME' || valueType === 'PHONE_NUMBER' || 
            valueType === 'ORGANISATION_UNIT' || valueType === 'USERNAME') {
            if(processedValue) {
                processedValue = "'" + processedValue + "'";
            } else {
                processedValue = "''";
            }
        }
        else if(valueType === 'BOOLEAN' || valueType === 'TRUE_ONLY') {
            if(processedValue === "Yes") {
            processedValue = true;
            }
            else if(processedValue === "No") {
                processedValue = false;
            }
            else if(processedValue && eval(processedValue)) {
                processedValue = true;
            }
            else {
                processedValue = false;
            }
        }
        else if( valueType === "INTEGER" || valueType === "NUMBER" || valueType === "INTEGER_POSITIVE"
             ||  valueType === "INTEGER_NEGATIVE" || valueType === "INTEGER_ZERO_OR_POSITIVE" ||
                 valueType === "PERCENTAGE") {
            if(processedValue) {
                processedValue = Number(processedValue);
            } else {
                processedValue = 0;
            }
        }
        else{
            $log.warn("unknown datatype:" + valueType);
        }

        return processedValue;
    };

    var pushVariable = function(variables, variablename, varValue, allValues, varType, variablefound, variablePrefix, variableEventDate, useCodeForOptionSet) {

        var processedValues = [];

        angular.forEach(allValues, function(alternateValue) {
            processedValues.push(processSingleValue(alternateValue,varType));
        });

        variables[variablename] = {
            variableValue:processSingleValue(varValue, varType),
            useCodeForOptionSet:useCodeForOptionSet,
            variableType:varType,
            hasValue:variablefound,
            variableEventDate:variableEventDate,
            variablePrefix:variablePrefix,
            allValues:processedValues
        };
        return variables;
    };
    
    var getDataElementValueOrCodeForValueInternal = function(useCodeForOptionSet, value, dataElementId, allDes, optionSets) {
        return useCodeForOptionSet && allDes && allDes[dataElementId].dataElement.optionSet ? 
                                            OptionSetService.getCode(optionSets[allDes[dataElementId].dataElement.optionSet.id].options, value)
                                            : value;
    };
    
    var geTrackedEntityAttributeValueOrCodeForValueInternal = function(useCodeForOptionSet, value, trackedEntityAttributeId, allTeis, optionSets) {
        return useCodeForOptionSet && allTeis && allTeis[trackedEntityAttributeId].optionSet ? 
                                            OptionSetService.getCode(optionSets[allTeis[trackedEntityAttributeId].optionSet.id].options, value)
                                            : value;
    };

    return {
        processValue: function(value, type) {
            return processSingleValue(value,type);
        },
        getDataElementValueOrCode: function(useCodeForOptionSet, event, dataElementId, allDes, optionSets) {
            return getDataElementValueOrCodeForValueInternal(useCodeForOptionSet, event[dataElementId], dataElementId, allDes, optionSets);
        },
        getDataElementValueOrCodeForValue: function(useCodeForOptionSet, value, dataElementId, allDes, optionSets) {
            return getDataElementValueOrCodeForValueInternal(useCodeForOptionSet, value, dataElementId, allDes, optionSets);
        },
        getTrackedEntityValueOrCodeForValue: function(useCodeForOptionSet, value, trackedEntityAttributeId, allTeis, optionSets) {
            return geTrackedEntityAttributeValueOrCodeForValueInternal(useCodeForOptionSet, value, trackedEntityAttributeId, allTeis, optionSets);
        },
        getVariables: function(allProgramRules, executingEvent, evs, allDes, allTeis, selectedEntity, selectedEnrollment, optionSets, selectedOrgUnit, selectedProgramStage) {

            var variables = {};

            var programVariables = allProgramRules.programVariables;

            programVariables = programVariables.concat(allProgramRules.programIndicators.variables);

            angular.forEach(programVariables, function(programVariable) {
                var dataElementId = programVariable.dataElement;
                
                if(programVariable.dataElement && programVariable.dataElement.id) {
                    dataElementId = programVariable.dataElement.id;
                }

                var dataElementExists = dataElementId && allDes && allDes[dataElementId];

                var trackedEntityAttributeId = programVariable.trackedEntityAttribute;
                if(programVariable.trackedEntityAttribute && programVariable.trackedEntityAttribute.id) {
                    trackedEntityAttributeId = programVariable.trackedEntityAttribute.id;
                }

                var programStageId = programVariable.programStage;
                if(programVariable.programStage && programVariable.programStage.id) {
                    programStageId = programVariable.programStage.id;
                }

                var valueFound = false;
                //If variable evs is not defined, it means the rules is run before any events is registered, skip the types that require an event
                if(programVariable.programRuleVariableSourceType === "DATAELEMENT_NEWEST_EVENT_PROGRAM_STAGE" && evs && evs.byStage && dataElementExists){
                    if(programStageId) {
                        var allValues = [];
                        angular.forEach(evs.byStage[programStageId], function(event) {
                            if(event[dataElementId] !== null) {
                                if(angular.isDefined(event[dataElementId])
                                        && event[dataElementId] !== ""){
                                    var value = getDataElementValueOrCodeForValueInternal(programVariable.useCodeForOptionSet, event[dataElementId], dataElementId, allDes, optionSets);
                                            
                                    allValues.push(value);
                                    valueFound = true;
                                    variables = pushVariable(variables, programVariable.displayName, value, allValues, allDes[dataElementId].dataElement.valueType, valueFound, '#', event.eventDate, programVariable.useCodeForOptionSet);
                                }
                            }
                        });
                    } else {
                        $log.warn("Variable id:'" + programVariable.id + "' name:'" + programVariable.displayName
                            + "' does not have a programstage defined,"
                            + " despite that the variable has sourcetype DATAELEMENT_NEWEST_EVENT_PROGRAM_STAGE" );
                    }
                }
                else if(programVariable.programRuleVariableSourceType === "DATAELEMENT_NEWEST_EVENT_PROGRAM" && evs && dataElementExists){
                    var allValues = [];
                    angular.forEach(evs.all, function(event) {
                        if(angular.isDefined(event[dataElementId])
                            && event[dataElementId] !== null 
                            && event[dataElementId] !== ""){
                            var value = getDataElementValueOrCodeForValueInternal(programVariable.useCodeForOptionSet, event[dataElementId], dataElementId, allDes, optionSets);
                                    
                            allValues.push(value);
                            valueFound = true;
                            variables = pushVariable(variables, programVariable.displayName, value, allValues, allDes[dataElementId].dataElement.valueType, valueFound, '#', event.eventDate, programVariable.useCodeForOptionSet);
                        }
                    });
                }
                else if(programVariable.programRuleVariableSourceType === "DATAELEMENT_CURRENT_EVENT" && evs && dataElementExists){
                    if(angular.isDefined(executingEvent[dataElementId])
                        && executingEvent[dataElementId] !== null 
                        && executingEvent[dataElementId] !== ""){
                        var value = getDataElementValueOrCodeForValueInternal(programVariable.useCodeForOptionSet, executingEvent[dataElementId], dataElementId, allDes, optionSets);
                            
                        valueFound = true;
                        variables = pushVariable(variables, programVariable.displayName, value, null, allDes[dataElementId].dataElement.valueType, valueFound, '#', executingEvent.eventDate, programVariable.useCodeForOptionSet );
                    }
                }
                else if(programVariable.programRuleVariableSourceType === "DATAELEMENT_PREVIOUS_EVENT" && evs && dataElementExists){
                    //Only continue checking for a value if there is more than one event.
                    if(evs.all && evs.all.length > 1) {
                        var allValues = [];
                        var previousvalue = null;
                        var previousEventDate = null;
                        var currentEventPassed = false;
                        for(var i = 0; i < evs.all.length; i++) {
                            //Store the values as we iterate through the stages
                            //If the event[i] is not the current event, it is older(previous). Store the previous value if it exists
                            if(!currentEventPassed && evs.all[i] !== executingEvent &&
                                angular.isDefined(evs.all[i][dataElementId])
                                && evs.all[i][dataElementId] !== "") {
                                previousvalue = getDataElementValueOrCodeForValueInternal(programVariable.useCodeForOptionSet, evs.all[i][dataElementId], dataElementId, allDes, optionSets);
                                previousEventDate = evs.all[i].eventDate;
                                allValues.push(value);
                                valueFound = true;
                            }
                            else if(evs.all[i] === executingEvent) {
                                //We have iterated to the newest event - store the last collected variable value - if any is found:
                                if(valueFound) {
                                    variables = pushVariable(variables, programVariable.displayName, previousvalue, allValues, allDes[dataElementId].dataElement.valueType, valueFound, '#', previousEventDate, programVariable.useCodeForOptionSet);
                                }
                                //Set currentEventPassed, ending the iteration:
                                currentEventPassed = true;
                            }
                        }
                    }
                }
                else if(programVariable.programRuleVariableSourceType === "TEI_ATTRIBUTE"){
                    angular.forEach(selectedEntity.attributes , function(attribute) {
                        if(!valueFound) {
                            if(attribute.attribute === trackedEntityAttributeId
                                    && angular.isDefined(attribute.value)
                                    && attribute.value !== null
                                    && attribute.value !== "") {
                                valueFound = true;
                                //In registration, the attribute type is found in .type, while in data entry the same data is found in .valueType.
                                //Handling here, but planning refactor in registration so it will always be .valueType
                                variables = pushVariable(variables, 
                                    programVariable.displayName, 
                                    geTrackedEntityAttributeValueOrCodeForValueInternal(programVariable.useCodeForOptionSet,attribute.value, trackedEntityAttributeId, allTeis, optionSets),
                                    null, 
                                    attribute.type ? attribute.type : attribute.valueType, valueFound, 
                                    'A', 
                                    '',
                                    programVariable.useCodeForOptionSet);
                            }
                        }
                    });
                }
                else if(programVariable.programRuleVariableSourceType === "CALCULATED_VALUE"){
                    //We won't assign the calculated variables at this step. The rules execution will calculate and assign the variable.
                }

                if(!valueFound){
                    //If there is still no value found, assign default value:
                    if(dataElementId && allDes) {
                        var dataElement = allDes[dataElementId];
                        if( dataElement ) {
                            variables = pushVariable(variables, programVariable.displayName, "", null, dataElement.dataElement.valueType, false, '#', '', programVariable.useCodeForOptionSet );
                        }
                        else {
                            variables = pushVariable(variables, programVariable.displayName, "", null, programVariable.valueType,false, '#', '', programVariable.useCodeForOptionSet );
                        }
                    }
                    else if (programVariable.trackedEntityAttribute) {
                        //The variable is an attribute, set correct prefix and a blank value
                        variables = pushVariable(variables, programVariable.displayName, "", null, programVariable.valueType,false, 'A', '', programVariable.useCodeForOptionSet );
                    }
                    else {
                        //Fallback for calculated(assigned) values:
                        variables = pushVariable(variables, programVariable.displayName, "", null, programVariable.valueType,false, '#', '', programVariable.useCodeForOptionSet );
                    }
                }
            });

            //add context variables:
            //last parameter "valuefound" is always true for event date
            variables = pushVariable(variables, 'environment', 'WebClient',null,'TEXT',true,'V','',false);
            variables = pushVariable(variables, 'current_date', DateUtils.getToday(), null, 'DATE', true, 'V', '', false );

            variables = pushVariable(variables, 'event_date', executingEvent.eventDate, null, 'DATE', true, 'V', '', false );
            variables = pushVariable(variables, 'due_date', executingEvent.dueDate, null, 'DATE', true, 'V', '' );
            variables = pushVariable(variables, 'event_count', evs ? evs.all.length : 0, null, 'INTEGER', true, 'V', '', false );

            variables = pushVariable(variables, 'enrollment_date', selectedEnrollment ? selectedEnrollment.enrollmentDate : '', null, 'DATE', selectedEnrollment ? selectedEnrollment.enrollmentDate ? true : false : false, 'V', '', false );
            variables = pushVariable(variables, 'enrollment_id', selectedEnrollment ? selectedEnrollment.enrollment : '', null, 'TEXT',  selectedEnrollment ? true : false, 'V', '', false );
            variables = pushVariable(variables, 'event_id', executingEvent ? executingEvent.event : '', null, 'TEXT',  executingEvent ? true : false, 'V', executingEvent ? executingEvent.eventDate : false, false);
            variables = pushVariable(variables, 'event_status', executingEvent ? executingEvent.status : '', null, 'TEXT',  executingEvent ? true : false, 'V', executingEvent ? executingEvent.eventDate : false, false);

            variables = pushVariable(variables, 'incident_date', selectedEnrollment ? selectedEnrollment.incidentDate : '', null, 'DATE',  selectedEnrollment ? true : false, 'V', '', false);
            variables = pushVariable(variables, 'enrollment_count', selectedEnrollment ? 1 : 0, null, 'INTEGER', true, 'V', '', false);
            variables = pushVariable(variables, 'tei_count', selectedEnrollment ? 1 : 0, null, 'INTEGER', true, 'V', '', false);
            
            variables = pushVariable(variables, 'program_stage_id',(selectedProgramStage && selectedProgramStage.id) || '', null, 'TEXT', selectedProgramStage && selectedProgramStage.id ? true : false, 'V', '', false);
            variables = pushVariable(variables, 'program_stage_name',(selectedProgramStage && selectedProgramStage.name) || '', null, 'TEXT', selectedProgramStage && selectedProgramStage.name ? true : false, 'V', '', false);


            //Push all constant values:
            angular.forEach(allProgramRules.constants, function(constant){
                variables = pushVariable(variables, constant.id, constant.value, null, 'INTEGER', true, 'C', '', false);
            });

            if(selectedOrgUnit){
                variables = pushVariable(variables, 'orgunit_code', selectedOrgUnit.code, null, 'TEXT', selectedOrgUnit.code ? true : false, 'V', '', false);
            }

            return variables;
        }
    };
})

/* service for executing tracker rules and broadcasting results */
.service('TrackerRulesExecutionService', function($translate, SessionStorageService, VariableService, DateUtils, NotificationService, DHIS2EventFactory, OrgUnitFactory, CalendarService, OptionSetService, $rootScope, $q, $log, $filter, orderByFilter, MetaDataFactory){
    var NUMBER_OF_EVENTS_IN_SCOPE = 10;

    //Variables for storing scope and rules in memory from rules execution to rules execution:
    var allProgramRules = false; 
    var crossEventRulesExist = false;
    var lastEventId = null;
    var lastEventDate = null;
    var lastProgramId = null;
    var eventScopeExceptCurrent = false;

    var replaceVariables = function(expression, variablesHash){
        //replaces the variables in an expression with actual variable values.

        //First, check if the special cases like d2:hasValue(#{variableName}) is present. If it is, we need to replace with:
        //d2:hasValue('variableName') to avoid the further replacement, and make sure the correct input is fed into d2:hasValue.
        var avoidReplacementFunctions = ['d2:hasValue','d2:lastEventDate', 'd2:count', 'd2:countIfZeroPos', 'd2:countIfValue'];
        avoidReplacementFunctions.forEach(avoidReplaceFunction => {
            expression = expression.replace( new RegExp("(" + avoidReplaceFunction + "\\() *[A#CV]\\{([\\w \\-\\_\\.]+)\\}(.*)\\)" ), "$1'$2'$3\)");
        });

        //Check if the expression contains program rule variables at all(any curly braces):
        if(expression.indexOf('{') !== -1) {
            //Find every variable name in the expression;
            var variablespresent = expression.match(/[A#CV]\{[\w \-\_\.]+\}/g);
            //Replace each matched variable:
            angular.forEach(variablespresent, function(variablepresent) {
                //First strip away any prefix and postfix signs from the variable name:
                variablepresent = variablepresent.replace("#{","").replace("A{","").replace("C{","").replace("V{","").replace("}","");

                if(angular.isDefined(variablesHash[variablepresent])) {
                    //Replace all occurrences of the variable name(hence using regex replacement):
                    expression = expression.replace(new RegExp( variablesHash[variablepresent].variablePrefix + "\\{" + variablepresent + "\\}", 'g'),
                        variablesHash[variablepresent].variableValue);
                }
                else {
                    $log.warn("Expression " + expression + " contains variable " + variablepresent
                        + " - but this variable is not defined." );
                }
            });
        }

        //Check if the expression contains environment  variables
        if(expression.indexOf('V{') !== -1) {
            //Find every variable name in the expression;
            var variablespresent = expression.match(/V{\w+.?\w*}/g);
            //Replace each matched variable:
            angular.forEach(variablespresent, function(variablepresent) {
                //First strip away any prefix and postfix signs from the variable name:
                variablepresent = variablepresent.replace("V{","").replace("}","");

                if(angular.isDefined(variablesHash[variablepresent]) &&
                    variablesHash[variablepresent].variablePrefix === 'V') {
                    //Replace all occurrences of the variable name(hence using regex replacement):
                    expression = expression.replace(new RegExp("V{" + variablepresent + "}", 'g'),
                        variablesHash[variablepresent].variableValue);
                }
                else {
                    $log.warn("Expression " + expression + " conains context variable " + variablepresent
                        + " - but this variable is not defined." );
                }
            });
        }

        //Check if the expression contains attribute variables:
        if(expression.indexOf('A{') !== -1) {
            //Find every attribute in the expression;
            var variablespresent = expression.match(/A{\w+.?\w*}/g);
            //Replace each matched variable:
            angular.forEach(variablespresent, function(variablepresent) {
                //First strip away any prefix and postfix signs from the variable name:
                variablepresent = variablepresent.replace("A{","").replace("}","");

                if(angular.isDefined(variablesHash[variablepresent]) &&
                    variablesHash[variablepresent].variablePrefix === 'A') {
                    //Replace all occurrences of the variable name(hence using regex replacement):
                    expression = expression.replace(new RegExp("A{" + variablepresent + "}", 'g'),
                        variablesHash[variablepresent].variableValue);
                }
                else {
                    $log.warn("Expression " + expression + " conains attribute " + variablepresent
                        + " - but this attribute is not defined." );
                }
            });
        }

        //Check if the expression contains constants
        if(expression.indexOf('C{') !== -1) {
            //Find every constant in the expression;
            var variablespresent = expression.match(/C{\w+.?\w*}/g);
            //Replace each matched variable:
            angular.forEach(variablespresent, function(variablepresent) {
                //First strip away any prefix and postfix signs from the variable name:
                variablepresent = variablepresent.replace("C{","").replace("}","");

                if(angular.isDefined(variablesHash[variablepresent]) &&
                    variablesHash[variablepresent].variablePrefix === 'C') {
                    //Replace all occurrences of the variable name(hence using regex replacement):
                    expression = expression.replace(new RegExp("C{" + variablepresent + "}", 'g'),
                        variablesHash[variablepresent].variableValue);
                }
                else {
                    $log.warn("Expression " + expression + " conains constant " + variablepresent
                        + " - but this constant is not defined." );
                }
            });
        }

        return expression;
    };

    var maleCodes = { male: 1, MALE: 1, Male: 1, ma: 1, m: 1, M: 1, 0: 1, false: 1 };

    // command to produce the body of the map:
    // curl https://www.who.int/childgrowth/standards/wfa_girls_0_5_zscores.txt | awk  '{print $1 ": [ " $5 ", " $6 ", " $7 ", " $8 ", " $9 ", " $10 ", " ($11+0) " ]," }'
    var femaleMapWFA = {
        0: [2.0, 2.4, 2.8, 3.2, 3.7, 4.2, 4.8],
        1: [2.7, 3.2, 3.6, 4.2, 4.8, 5.5, 6.2],
        2: [3.4, 3.9, 4.5, 5.1, 5.8, 6.6, 7.5],
        3: [4.0, 4.5, 5.2, 5.8, 6.6, 7.5, 8.5],
        4: [4.4, 5.0, 5.7, 6.4, 7.3, 8.2, 9.3],
        5: [4.8, 5.4, 6.1, 6.9, 7.8, 8.8, 10],
        6: [5.1, 5.7, 6.5, 7.3, 8.2, 9.3, 10.6],
        7: [5.3, 6.0, 6.8, 7.6, 8.6, 9.8, 11.1],
        8: [5.6, 6.3, 7.0, 7.9, 9.0, 10.2, 11.6],
        9: [5.8, 6.5, 7.3, 8.2, 9.3, 10.5, 12],
        10: [5.9, 6.7, 7.5, 8.5, 9.6, 10.9, 12.4],
        11: [6.1, 6.9, 7.7, 8.7, 9.9, 11.2, 12.8],
        12: [6.3, 7.0, 7.9, 8.9, 10.1, 11.5, 13.1],
        13: [6.4, 7.2, 8.1, 9.2, 10.4, 11.8, 13.5],
        14: [6.6, 7.4, 8.3, 9.4, 10.6, 12.1, 13.8],
        15: [6.7, 7.6, 8.5, 9.6, 10.9, 12.4, 14.1],
        16: [6.9, 7.7, 8.7, 9.8, 11.1, 12.6, 14.5],
        17: [7.0, 7.9, 8.9, 10.0, 11.4, 12.9, 14.8],
        18: [7.2, 8.1, 9.1, 10.2, 11.6, 13.2, 15.1],
        19: [7.3, 8.2, 9.2, 10.4, 11.8, 13.5, 15.4],
        20: [7.5, 8.4, 9.4, 10.6, 12.1, 13.7, 15.7],
        21: [7.6, 8.6, 9.6, 10.9, 12.3, 14.0, 16],
        22: [7.8, 8.7, 9.8, 11.1, 12.5, 14.3, 16.4],
        23: [7.9, 8.9, 10.0, 11.3, 12.8, 14.6, 16.7],
        24: [8.1, 9.0, 10.2, 11.5, 13.0, 14.8, 17],
        25: [8.2, 9.2, 10.3, 11.7, 13.3, 15.1, 17.3],
        26: [8.4, 9.4, 10.5, 11.9, 13.5, 15.4, 17.7],
        27: [8.5, 9.5, 10.7, 12.1, 13.7, 15.7, 18],
        28: [8.6, 9.7, 10.9, 12.3, 14.0, 16.0, 18.3],
        29: [8.8, 9.8, 11.1, 12.5, 14.2, 16.2, 18.7],
        30: [8.9, 10.0, 11.2, 12.7, 14.4, 16.5, 19],
        31: [9.0, 10.1, 11.4, 12.9, 14.7, 16.8, 19.3],
        32: [9.1, 10.3, 11.6, 13.1, 14.9, 17.1, 19.6],
        33: [9.3, 10.4, 11.7, 13.3, 15.1, 17.3, 20],
        34: [9.4, 10.5, 11.9, 13.5, 15.4, 17.6, 20.3],
        35: [9.5, 10.7, 12.0, 13.7, 15.6, 17.9, 20.6],
        36: [9.6, 10.8, 12.2, 13.9, 15.8, 18.1, 20.9],
        37: [9.7, 10.9, 12.4, 14.0, 16.0, 18.4, 21.3],
        38: [9.8, 11.1, 12.5, 14.2, 16.3, 18.7, 21.6],
        39: [9.9, 11.2, 12.7, 14.4, 16.5, 19.0, 22],
        40: [10.1, 11.3, 12.8, 14.6, 16.7, 19.2, 22.3],
        41: [10.2, 11.5, 13.0, 14.8, 16.9, 19.5, 22.7],
        42: [10.3, 11.6, 13.1, 15.0, 17.2, 19.8, 23],
        43: [10.4, 11.7, 13.3, 15.2, 17.4, 20.1, 23.4],
        44: [10.5, 11.8, 13.4, 15.3, 17.6, 20.4, 23.7],
        45: [10.6, 12.0, 13.6, 15.5, 17.8, 20.7, 24.1],
        46: [10.7, 12.1, 13.7, 15.7, 18.1, 20.9, 24.5],
        47: [10.8, 12.2, 13.9, 15.9, 18.3, 21.2, 24.8],
        48: [10.9, 12.3, 14.0, 16.1, 18.5, 21.5, 25.2],
        49: [11.0, 12.4, 14.2, 16.3, 18.8, 21.8, 25.5],
        50: [11.1, 12.6, 14.3, 16.4, 19.0, 22.1, 25.9],
        51: [11.2, 12.7, 14.5, 16.6, 19.2, 22.4, 26.3],
        52: [11.3, 12.8, 14.6, 16.8, 19.4, 22.6, 26.6],
        53: [11.4, 12.9, 14.8, 17.0, 19.7, 22.9, 27],
        54: [11.5, 13.0, 14.9, 17.2, 19.9, 23.2, 27.4],
        55: [11.6, 13.2, 15.1, 17.3, 20.1, 23.5, 27.7],
        56: [11.7, 13.3, 15.2, 17.5, 20.3, 23.8, 28.1],
        57: [11.8, 13.4, 15.3, 17.7, 20.6, 24.1, 28.5],
        58: [11.9, 13.5, 15.5, 17.9, 20.8, 24.4, 28.8],
        59: [12.0, 13.6, 15.6, 18.0, 21.0, 24.6, 29.2],
        60: [12.1, 13.7, 15.8, 18.2, 21.2, 24.9, 29.5],
    };

    // command to produce the body of the map:
    // curl https://www.who.int/childgrowth/standards/wfa_boys_0_5_zscores.txt | awk  '{print $1 ": [ " $5 ", " $6 ", " $7 ", " $8 ", " $9 ", " $10 ", " ($11+0) " ]," }'
    var maleMapWFA = {
        0: [2.1, 2.5, 2.9, 3.3, 3.9, 4.4, 5],
        1: [2.9, 3.4, 3.9, 4.5, 5.1, 5.8, 6.6],
        2: [3.8, 4.3, 4.9, 5.6, 6.3, 7.1, 8],
        3: [4.4, 5.0, 5.7, 6.4, 7.2, 8.0, 9],
        4: [4.9, 5.6, 6.2, 7.0, 7.8, 8.7, 9.7],
        5: [5.3, 6.0, 6.7, 7.5, 8.4, 9.3, 10.4],
        6: [5.7, 6.4, 7.1, 7.9, 8.8, 9.8, 10.9],
        7: [5.9, 6.7, 7.4, 8.3, 9.2, 10.3, 11.4],
        8: [6.2, 6.9, 7.7, 8.6, 9.6, 10.7, 11.9],
        9: [6.4, 7.1, 8.0, 8.9, 9.9, 11.0, 12.3],
        10: [6.6, 7.4, 8.2, 9.2, 10.2, 11.4, 12.7],
        11: [6.8, 7.6, 8.4, 9.4, 10.5, 11.7, 13],
        12: [6.9, 7.7, 8.6, 9.6, 10.8, 12.0, 13.3],
        13: [7.1, 7.9, 8.8, 9.9, 11.0, 12.3, 13.7],
        14: [7.2, 8.1, 9.0, 10.1, 11.3, 12.6, 14],
        15: [7.4, 8.3, 9.2, 10.3, 11.5, 12.8, 14.3],
        16: [7.5, 8.4, 9.4, 10.5, 11.7, 13.1, 14.6],
        17: [7.7, 8.6, 9.6, 10.7, 12.0, 13.4, 14.9],
        18: [7.8, 8.8, 9.8, 10.9, 12.2, 13.7, 15.3],
        19: [8.0, 8.9, 10.0, 11.1, 12.5, 13.9, 15.6],
        20: [8.1, 9.1, 10.1, 11.3, 12.7, 14.2, 15.9],
        21: [8.2, 9.2, 10.3, 11.5, 12.9, 14.5, 16.2],
        22: [8.4, 9.4, 10.5, 11.8, 13.2, 14.7, 16.5],
        23: [8.5, 9.5, 10.7, 12.0, 13.4, 15.0, 16.8],
        24: [8.6, 9.7, 10.8, 12.2, 13.6, 15.3, 17.1],
        25: [8.8, 9.8, 11.0, 12.4, 13.9, 15.5, 17.5],
        26: [8.9, 10.0, 11.2, 12.5, 14.1, 15.8, 17.8],
        27: [9.0, 10.1, 11.3, 12.7, 14.3, 16.1, 18.1],
        28: [9.1, 10.2, 11.5, 12.9, 14.5, 16.3, 18.4],
        29: [9.2, 10.4, 11.7, 13.1, 14.8, 16.6, 18.7],
        30: [9.4, 10.5, 11.8, 13.3, 15.0, 16.9, 19],
        31: [9.5, 10.7, 12.0, 13.5, 15.2, 17.1, 19.3],
        32: [9.6, 10.8, 12.1, 13.7, 15.4, 17.4, 19.6],
        33: [9.7, 10.9, 12.3, 13.8, 15.6, 17.6, 19.9],
        34: [9.8, 11.0, 12.4, 14.0, 15.8, 17.8, 20.2],
        35: [9.9, 11.2, 12.6, 14.2, 16.0, 18.1, 20.4],
        36: [10.0, 11.3, 12.7, 14.3, 16.2, 18.3, 20.7],
        37: [10.1, 11.4, 12.9, 14.5, 16.4, 18.6, 21],
        38: [10.2, 11.5, 13.0, 14.7, 16.6, 18.8, 21.3],
        39: [10.3, 11.6, 13.1, 14.8, 16.8, 19.0, 21.6],
        40: [10.4, 11.8, 13.3, 15.0, 17.0, 19.3, 21.9],
        41: [10.5, 11.9, 13.4, 15.2, 17.2, 19.5, 22.1],
        42: [10.6, 12.0, 13.6, 15.3, 17.4, 19.7, 22.4],
        43: [10.7, 12.1, 13.7, 15.5, 17.6, 20.0, 22.7],
        44: [10.8, 12.2, 13.8, 15.7, 17.8, 20.2, 23],
        45: [10.9, 12.4, 14.0, 15.8, 18.0, 20.5, 23.3],
        46: [11.0, 12.5, 14.1, 16.0, 18.2, 20.7, 23.6],
        47: [11.1, 12.6, 14.3, 16.2, 18.4, 20.9, 23.9],
        48: [11.2, 12.7, 14.4, 16.3, 18.6, 21.2, 24.2],
        49: [11.3, 12.8, 14.5, 16.5, 18.8, 21.4, 24.5],
        50: [11.4, 12.9, 14.7, 16.7, 19.0, 21.7, 24.8],
        51: [11.5, 13.1, 14.8, 16.8, 19.2, 21.9, 25.1],
        52: [11.6, 13.2, 15.0, 17.0, 19.4, 22.2, 25.4],
        53: [11.7, 13.3, 15.1, 17.2, 19.6, 22.4, 25.7],
        54: [11.8, 13.4, 15.2, 17.3, 19.8, 22.7, 26],
        55: [11.9, 13.5, 15.4, 17.5, 20.0, 22.9, 26.3],
        56: [12.0, 13.6, 15.5, 17.7, 20.2, 23.2, 26.6],
        57: [12.1, 13.7, 15.6, 17.8, 20.4, 23.4, 26.9],
        58: [12.2, 13.8, 15.8, 18.0, 20.6, 23.7, 27.2],
        59: [12.3, 14.0, 15.9, 18.2, 20.8, 23.9, 27.6],
        60: [12.4, 14.1, 16.0, 18.3, 21.0, 24.2, 27.9],
    };

    //Combine these two commands to produce the list below.
    //curl https://www.who.int/childgrowth/standards/wfl_girls_z_exp.txt | awk  '{print $1 ": [ " $3 ", " $4 ", " $5 ", " $6 ", " $7 ", " $8 ", " ($9+0) " ]," }' | egrep '^(([0-7][0-9])|([8][0-6]))\.[05]'
    //curl https://www.who.int/childgrowth/standards/wfh_girls_z_exp.txt | awk  '{print $1 ": [ " $3 ", " $4 ", " $5 ", " $6 ", " $7 ", " $8 ", " ($9+0) " ]," }' | egrep '^(([8][7-9])|([9][0-9])|[0-9]{3})\.[05]'
    var femaleMapWFH = {
        45.0: [ 1.902, 2.066, 2.252, 2.461, 2.698, 2.967, 3.275 ],
        45.5: [ 1.967, 2.138, 2.329, 2.546, 2.791, 3.070, 3.389 ],
        46.0: [ 2.033, 2.209, 2.407, 2.631, 2.884, 3.172, 3.502 ],
        46.5: [ 2.098, 2.280, 2.485, 2.716, 2.977, 3.275, 3.616 ],
        47.0: [ 2.164, 2.351, 2.562, 2.801, 3.071, 3.378, 3.73 ],
        47.5: [ 2.230, 2.423, 2.641, 2.887, 3.165, 3.482, 3.845 ],
        48.0: [ 2.297, 2.497, 2.721, 2.974, 3.261, 3.588, 3.962 ],
        48.5: [ 2.366, 2.571, 2.803, 3.064, 3.359, 3.696, 4.082 ],
        49.0: [ 2.437, 2.649, 2.887, 3.156, 3.461, 3.808, 4.205 ],
        49.5: [ 2.511, 2.729, 2.975, 3.252, 3.566, 3.924, 4.334 ],
        50.0: [ 2.588, 2.813, 3.066, 3.352, 3.676, 4.045, 4.467 ],
        50.5: [ 2.668, 2.900, 3.161, 3.456, 3.790, 4.171, 4.606 ],
        51.0: [ 2.750, 2.990, 3.259, 3.564, 3.908, 4.301, 4.751 ],
        51.5: [ 2.836, 3.084, 3.362, 3.675, 4.031, 4.437, 4.901 ],
        52.0: [ 2.925, 3.180, 3.467, 3.791, 4.158, 4.577, 5.056 ],
        52.5: [ 3.017, 3.280, 3.576, 3.910, 4.290, 4.721, 5.216 ],
        53.0: [ 3.112, 3.383, 3.688, 4.033, 4.424, 4.870, 5.38 ],
        53.5: [ 3.208, 3.488, 3.803, 4.159, 4.563, 5.022, 5.549 ],
        54.0: [ 3.307, 3.596, 3.921, 4.288, 4.704, 5.178, 5.721 ],
        54.5: [ 3.407, 3.705, 4.040, 4.418, 4.847, 5.336, 5.896 ],
        55.0: [ 3.508, 3.815, 4.160, 4.550, 4.992, 5.496, 6.073 ],
        55.5: [ 3.611, 3.926, 4.281, 4.683, 5.138, 5.657, 6.251 ],
        56.0: [ 3.713, 4.038, 4.403, 4.816, 5.285, 5.818, 6.43 ],
        56.5: [ 3.816, 4.150, 4.526, 4.950, 5.432, 5.980, 6.609 ],
        57.0: [ 3.919, 4.262, 4.648, 5.084, 5.579, 6.143, 6.789 ],
        57.5: [ 4.021, 4.373, 4.770, 5.217, 5.725, 6.304, 6.968 ],
        58.0: [ 4.124, 4.485, 4.891, 5.351, 5.872, 6.466, 7.146 ],
        58.5: [ 4.226, 4.596, 5.013, 5.483, 6.018, 6.626, 7.324 ],
        59.0: [ 4.327, 4.706, 5.133, 5.615, 6.162, 6.786, 7.5 ],
        59.5: [ 4.427, 4.815, 5.252, 5.745, 6.305, 6.944, 7.675 ],
        60.0: [ 4.527, 4.923, 5.370, 5.874, 6.447, 7.099, 7.847 ],
        60.5: [ 4.624, 5.030, 5.486, 6.001, 6.586, 7.253, 8.017 ],
        61.0: [ 4.721, 5.135, 5.601, 6.127, 6.724, 7.405, 8.185 ],
        61.5: [ 4.817, 5.239, 5.714, 6.251, 6.860, 7.555, 8.351 ],
        62.0: [ 4.912, 5.342, 5.826, 6.374, 6.995, 7.703, 8.514 ],
        62.5: [ 5.005, 5.444, 5.937, 6.495, 7.128, 7.849, 8.675 ],
        63.0: [ 5.098, 5.544, 6.047, 6.614, 7.259, 7.993, 8.834 ],
        63.5: [ 5.189, 5.644, 6.155, 6.733, 7.388, 8.136, 8.992 ],
        64.0: [ 5.280, 5.742, 6.262, 6.850, 7.517, 8.277, 9.148 ],
        64.5: [ 5.370, 5.840, 6.369, 6.966, 7.644, 8.417, 9.302 ],
        65.0: [ 5.459, 5.937, 6.474, 7.081, 7.770, 8.555, 9.454 ],
        65.5: [ 5.547, 6.033, 6.578, 7.195, 7.895, 8.692, 9.605 ],
        66.0: [ 5.635, 6.128, 6.682, 7.308, 8.018, 8.827, 9.753 ],
        66.5: [ 5.721, 6.221, 6.784, 7.419, 8.139, 8.960, 9.901 ],
        67.0: [ 5.807, 6.314, 6.885, 7.529, 8.260, 9.092, 10.046 ],
        67.5: [ 5.892, 6.406, 6.984, 7.638, 8.378, 9.222, 10.189 ],
        68.0: [ 5.975, 6.497, 7.083, 7.745, 8.496, 9.351, 10.33 ],
        68.5: [ 6.058, 6.586, 7.180, 7.851, 8.611, 9.478, 10.47 ],
        69.0: [ 6.140, 6.675, 7.277, 7.956, 8.726, 9.603, 10.608 ],
        69.5: [ 6.221, 6.763, 7.372, 8.060, 8.840, 9.728, 10.745 ],
        70.0: [ 6.302, 6.850, 7.467, 8.163, 8.952, 9.851, 10.88 ],
        70.5: [ 6.382, 6.937, 7.561, 8.265, 9.064, 9.973, 11.014 ],
        71.0: [ 6.461, 7.023, 7.654, 8.367, 9.174, 10.094, 11.147 ],
        71.5: [ 6.540, 7.108, 7.747, 8.468, 9.285, 10.215, 11.279 ],
        72.0: [ 6.619, 7.193, 7.839, 8.568, 9.394, 10.334, 11.41 ],
        72.5: [ 6.697, 7.278, 7.931, 8.667, 9.502, 10.453, 11.54 ],
        73.0: [ 6.774, 7.361, 8.021, 8.766, 9.610, 10.571, 11.669 ],
        73.5: [ 6.851, 7.444, 8.111, 8.864, 9.716, 10.687, 11.797 ],
        74.0: [ 6.927, 7.526, 8.200, 8.960, 9.821, 10.801, 11.922 ],
        74.5: [ 7.001, 7.607, 8.287, 9.055, 9.925, 10.915, 12.046 ],
        75.0: [ 7.075, 7.687, 8.374, 9.149, 10.027, 11.026, 12.168 ],
        75.5: [ 7.148, 7.766, 8.459, 9.242, 10.128, 11.136, 12.289 ],
        76.0: [ 7.221, 7.844, 8.544, 9.334, 10.228, 11.246, 12.408 ],
        76.5: [ 7.293, 7.922, 8.628, 9.425, 10.328, 11.354, 12.527 ],
        77.0: [ 7.365, 7.999, 8.712, 9.517, 10.427, 11.463, 12.646 ],
        77.5: [ 7.437, 8.078, 8.797, 9.609, 10.527, 11.572, 12.765 ],
        78.0: [ 7.511, 8.157, 8.883, 9.702, 10.628, 11.682, 12.886 ],
        78.5: [ 7.585, 8.237, 8.970, 9.796, 10.731, 11.794, 13.008 ],
        79.0: [ 7.660, 8.319, 9.058, 9.892, 10.835, 11.907, 13.132 ],
        79.5: [ 7.737, 8.402, 9.148, 9.989, 10.941, 12.023, 13.26 ],
        80.0: [ 7.816, 8.487, 9.240, 10.089, 11.050, 12.142, 13.389 ],
        80.5: [ 7.897, 8.574, 9.335, 10.192, 11.161, 12.264, 13.523 ],
        81.0: [ 7.979, 8.663, 9.431, 10.296, 11.276, 12.388, 13.659 ],
        81.5: [ 8.064, 8.755, 9.530, 10.404, 11.393, 12.517, 13.8 ],
        82.0: [ 8.150, 8.848, 9.631, 10.514, 11.513, 12.647, 13.943 ],
        82.5: [ 8.238, 8.943, 9.735, 10.626, 11.635, 12.781, 14.09 ],
        83.0: [ 8.328, 9.040, 9.840, 10.741, 11.760, 12.918, 14.24 ],
        83.5: [ 8.419, 9.139, 9.947, 10.858, 11.888, 13.058, 14.393 ],
        84.0: [ 8.512, 9.240, 10.057, 10.977, 12.017, 13.200, 14.549 ],
        84.5: [ 8.606, 9.342, 10.167, 11.097, 12.149, 13.344, 14.708 ],
        85.0: [ 8.702, 9.445, 10.280, 11.220, 12.283, 13.491, 14.869 ],
        85.5: [ 8.798, 9.550, 10.393, 11.344, 12.418, 13.639, 15.033 ],
        86.0: [ 8.895, 9.655, 10.508, 11.468, 12.555, 13.789, 15.197 ],
        86.5: [ 8.993, 9.761, 10.623, 11.594, 12.692, 13.940, 15.363 ],
        87.0: [ 9.227, 10.015, 10.900, 11.896, 13.024, 14.304, 15.765 ],
        87.5: [ 9.324, 10.121, 11.015, 12.022, 13.161, 14.455, 15.932 ],
        88.0: [ 9.421, 10.226, 11.130, 12.148, 13.299, 14.607, 16.099 ],
        88.5: [ 9.518, 10.331, 11.244, 12.273, 13.436, 14.758, 16.266 ],
        89.0: [ 9.614, 10.436, 11.358, 12.398, 13.573, 14.909, 16.433 ],
        89.5: [ 9.709, 10.540, 11.472, 12.522, 13.710, 15.059, 16.6 ],
        90.0: [ 9.805, 10.644, 11.585, 12.646, 13.846, 15.210, 16.767 ],
        90.5: [ 9.900, 10.747, 11.698, 12.770, 13.983, 15.360, 16.933 ],
        91.0: [ 9.994, 10.850, 11.811, 12.894, 14.119, 15.511, 17.1 ],
        91.5: [ 10.089, 10.953, 11.924, 13.018, 14.255, 15.662, 17.267 ],
        92.0: [ 10.183, 11.056, 12.037, 13.142, 14.392, 15.813, 17.435 ],
        92.5: [ 10.277, 11.159, 12.149, 13.265, 14.528, 15.964, 17.603 ],
        93.0: [ 10.372, 11.262, 12.262, 13.390, 14.665, 16.116, 17.772 ],
        93.5: [ 10.466, 11.366, 12.376, 13.514, 14.803, 16.268, 17.942 ],
        94.0: [ 10.561, 11.469, 12.489, 13.639, 14.941, 16.421, 18.112 ],
        94.5: [ 10.656, 11.573, 12.603, 13.765, 15.080, 16.576, 18.284 ],
        95.0: [ 10.751, 11.678, 12.718, 13.891, 15.220, 16.731, 18.457 ],
        95.5: [ 10.847, 11.783, 12.833, 14.019, 15.361, 16.887, 18.632 ],
        96.0: [ 10.943, 11.888, 12.949, 14.147, 15.502, 17.045, 18.808 ],
        96.5: [ 11.040, 11.994, 13.066, 14.276, 15.646, 17.204, 18.986 ],
        97.0: [ 11.137, 12.101, 13.184, 14.406, 15.790, 17.365, 19.166 ],
        97.5: [ 11.236, 12.209, 13.303, 14.538, 15.936, 17.528, 19.349 ],
        98.0: [ 11.336, 12.319, 13.424, 14.671, 16.084, 17.693, 19.533 ],
        98.5: [ 11.436, 12.429, 13.546, 14.806, 16.235, 17.861, 19.721 ],
        99.0: [ 11.538, 12.542, 13.670, 14.943, 16.387, 18.031, 19.913 ],
        99.5: [ 11.642, 12.655, 13.796, 15.083, 16.542, 18.205, 20.107 ],
        100.0: [ 11.747, 12.771, 13.924, 15.225, 16.700, 18.381, 20.305 ],
        100.5: [ 11.854, 12.889, 14.053, 15.369, 16.861, 18.561, 20.507 ],
        101.0: [ 11.962, 13.008, 14.186, 15.515, 17.024, 18.743, 20.712 ],
        101.5: [ 12.072, 13.130, 14.320, 15.665, 17.190, 18.930, 20.922 ],
        102.0: [ 12.184, 13.253, 14.457, 15.816, 17.360, 19.119, 21.136 ],
        102.5: [ 12.298, 13.379, 14.596, 15.971, 17.532, 19.312, 21.352 ],
        103.0: [ 12.414, 13.506, 14.737, 16.128, 17.707, 19.508, 21.574 ],
        103.5: [ 12.531, 13.636, 14.880, 16.287, 17.885, 19.708, 21.799 ],
        104.0: [ 12.650, 13.767, 15.026, 16.449, 18.066, 19.911, 22.027 ],
        104.5: [ 12.770, 13.900, 15.173, 16.613, 18.249, 20.117, 22.26 ],
        105.0: [ 12.893, 14.035, 15.323, 16.780, 18.436, 20.326, 22.496 ],
        105.5: [ 13.017, 14.173, 15.475, 16.950, 18.626, 20.540, 22.737 ],
        106.0: [ 13.143, 14.312, 15.630, 17.122, 18.818, 20.756, 22.982 ],
        106.5: [ 13.271, 14.454, 15.787, 17.297, 19.015, 20.977, 23.231 ],
        107.0: [ 13.401, 14.598, 15.947, 17.476, 19.214, 21.202, 23.485 ],
        107.5: [ 13.533, 14.744, 16.110, 17.657, 19.417, 21.430, 23.743 ],
        108.0: [ 13.667, 14.892, 16.275, 17.841, 19.623, 21.662, 24.006 ],
        108.5: [ 13.803, 15.043, 16.442, 18.028, 19.833, 21.898, 24.273 ],
        109.0: [ 13.942, 15.196, 16.612, 18.217, 20.046, 22.138, 24.544 ],
        109.5: [ 14.081, 15.351, 16.784, 18.410, 20.261, 22.380, 24.819 ],
        110.0: [ 14.223, 15.508, 16.959, 18.604, 20.479, 22.626, 25.098 ],
        110.5: [ 14.366, 15.666, 17.135, 18.802, 20.701, 22.876, 25.381 ],
        111.0: [ 14.511, 15.827, 17.314, 19.001, 20.924, 23.128, 25.666 ],
        111.5: [ 14.657, 15.989, 17.494, 19.202, 21.151, 23.383, 25.956 ],
        112.0: [ 14.804, 16.152, 17.676, 19.406, 21.379, 23.642, 26.249 ],
        112.5: [ 14.953, 16.317, 17.860, 19.612, 21.610, 23.902, 26.545 ],
        113.0: [ 15.103, 16.484, 18.045, 19.819, 21.843, 24.165, 26.843 ],
        113.5: [ 15.254, 16.652, 18.232, 20.028, 22.078, 24.430, 27.144 ],
        114.0: [ 15.406, 16.820, 18.420, 20.238, 22.315, 24.698, 27.448 ],
        114.5: [ 15.559, 16.990, 18.609, 20.450, 22.553, 24.967, 27.754 ],
        115.0: [ 15.712, 17.160, 18.799, 20.663, 22.792, 25.238, 28.061 ],
        115.5: [ 15.866, 17.331, 18.990, 20.877, 23.033, 25.510, 28.371 ],
        116.0: [ 16.021, 17.503, 19.181, 21.091, 23.274, 25.783, 28.681 ],
        116.5: [ 16.175, 17.674, 19.373, 21.306, 23.516, 26.057, 28.993 ],
        117.0: [ 16.329, 17.846, 19.565, 21.521, 23.759, 26.332, 29.307 ],
        117.5: [ 16.484, 18.018, 19.757, 21.737, 24.002, 26.607, 29.621 ],
        118.0: [ 16.639, 18.190, 19.950, 21.953, 24.246, 26.883, 29.935 ],
        118.5: [ 16.794, 18.363, 20.142, 22.169, 24.489, 27.160, 30.25 ],
        119.0: [ 16.948, 18.534, 20.334, 22.385, 24.734, 27.437, 30.567 ],
        119.5: [ 17.102, 18.706, 20.527, 22.601, 24.977, 27.714, 30.883 ],
        120.0: [ 17.256, 18.878, 20.719, 22.817, 25.222, 27.991, 31.199 ],
    };

    //Combine these two commands to produce the list below.
    //curl https://www.who.int/childgrowth/standards/wfl_boys_z_exp.txt | awk  '{print $1 ": [ " $3 ", " $4 ", " $5 ", " $6 ", " $7 ", " $8 ", " ($9+0) " ]," }' | egrep '^(([0-7][0-9])|([8][0-6]))\.[05]'
    //curl https://www.who.int/childgrowth/standards/wfh_boys_z_exp.txt | awk  '{print $1 ": [ " $3 ", " $4 ", " $5 ", " $6 ", " $7 ", " $8 ", " ($9+0) " ]," }' | egrep '^(([8][7-9])|([9][0-9])|[0-9]{3})\.[05]'
    var maleMapWFH = {
        45.0: [ 1.877, 2.043, 2.230, 2.441, 2.680, 2.951, 3.261 ],
        45.5: [ 1.942, 2.114, 2.307, 2.524, 2.771, 3.050, 3.37 ],
        46.0: [ 2.008, 2.185, 2.384, 2.608, 2.861, 3.149, 3.477 ],
        46.5: [ 2.074, 2.256, 2.461, 2.691, 2.952, 3.248, 3.585 ],
        47.0: [ 2.141, 2.328, 2.539, 2.776, 3.043, 3.347, 3.694 ],
        47.5: [ 2.208, 2.401, 2.617, 2.861, 3.136, 3.448, 3.804 ],
        48.0: [ 2.277, 2.476, 2.698, 2.948, 3.231, 3.551, 3.916 ],
        48.5: [ 2.349, 2.552, 2.781, 3.038, 3.328, 3.657, 4.031 ],
        49.0: [ 2.422, 2.632, 2.867, 3.131, 3.429, 3.766, 4.151 ],
        49.5: [ 2.499, 2.715, 2.956, 3.228, 3.534, 3.881, 4.275 ],
        50.0: [ 2.579, 2.801, 3.049, 3.328, 3.642, 3.999, 4.403 ],
        50.5: [ 2.661, 2.889, 3.144, 3.431, 3.754, 4.120, 4.536 ],
        51.0: [ 2.746, 2.981, 3.243, 3.538, 3.870, 4.245, 4.672 ],
        51.5: [ 2.834, 3.075, 3.345, 3.648, 3.989, 4.375, 4.813 ],
        52.0: [ 2.925, 3.173, 3.451, 3.762, 4.113, 4.509, 4.958 ],
        52.5: [ 3.020, 3.276, 3.561, 3.881, 4.242, 4.649, 5.111 ],
        53.0: [ 3.120, 3.383, 3.677, 4.006, 4.377, 4.795, 5.27 ],
        53.5: [ 3.223, 3.494, 3.796, 4.135, 4.517, 4.947, 5.434 ],
        54.0: [ 3.330, 3.609, 3.921, 4.269, 4.661, 5.104, 5.605 ],
        54.5: [ 3.440, 3.727, 4.048, 4.407, 4.810, 5.264, 5.779 ],
        55.0: [ 3.553, 3.848, 4.178, 4.547, 4.961, 5.428, 5.957 ],
        55.5: [ 3.667, 3.971, 4.310, 4.689, 5.115, 5.595, 6.138 ],
        56.0: [ 3.783, 4.095, 4.444, 4.834, 5.271, 5.764, 6.322 ],
        56.5: [ 3.900, 4.221, 4.579, 4.980, 5.429, 5.935, 6.506 ],
        57.0: [ 4.017, 4.347, 4.715, 5.126, 5.587, 6.106, 6.692 ],
        57.5: [ 4.135, 4.474, 4.851, 5.272, 5.745, 6.276, 6.877 ],
        58.0: [ 4.252, 4.599, 4.986, 5.418, 5.902, 6.447, 7.061 ],
        58.5: [ 4.369, 4.725, 5.121, 5.563, 6.059, 6.616, 7.245 ],
        59.0: [ 4.485, 4.849, 5.255, 5.707, 6.214, 6.784, 7.427 ],
        59.5: [ 4.600, 4.973, 5.387, 5.850, 6.368, 6.951, 7.607 ],
        60.0: [ 4.713, 5.094, 5.518, 5.991, 6.520, 7.115, 7.785 ],
        60.5: [ 4.824, 5.213, 5.646, 6.128, 6.669, 7.275, 7.959 ],
        61.0: [ 4.932, 5.329, 5.771, 6.263, 6.814, 7.433, 8.13 ],
        61.5: [ 5.039, 5.443, 5.893, 6.395, 6.957, 7.587, 8.297 ],
        62.0: [ 5.143, 5.555, 6.014, 6.525, 7.097, 7.739, 8.462 ],
        62.5: [ 5.245, 5.665, 6.132, 6.653, 7.235, 7.888, 8.624 ],
        63.0: [ 5.346, 5.774, 6.249, 6.779, 7.371, 8.035, 8.784 ],
        63.5: [ 5.445, 5.880, 6.364, 6.903, 7.505, 8.181, 8.942 ],
        64.0: [ 5.544, 5.986, 6.478, 7.026, 7.638, 8.325, 9.098 ],
        64.5: [ 5.640, 6.090, 6.590, 7.147, 7.769, 8.467, 9.253 ],
        65.0: [ 5.736, 6.193, 6.701, 7.267, 7.899, 8.608, 9.406 ],
        65.5: [ 5.830, 6.295, 6.811, 7.385, 8.028, 8.748, 9.558 ],
        66.0: [ 5.924, 6.396, 6.920, 7.503, 8.156, 8.887, 9.71 ],
        66.5: [ 6.017, 6.496, 7.028, 7.621, 8.283, 9.026, 9.861 ],
        67.0: [ 6.109, 6.595, 7.135, 7.737, 8.409, 9.163, 10.011 ],
        67.5: [ 6.200, 6.694, 7.242, 7.853, 8.535, 9.300, 10.161 ],
        68.0: [ 6.291, 6.791, 7.348, 7.967, 8.660, 9.436, 10.31 ],
        68.5: [ 6.380, 6.888, 7.453, 8.082, 8.784, 9.572, 10.459 ],
        69.0: [ 6.470, 6.985, 7.558, 8.196, 8.908, 9.708, 10.607 ],
        69.5: [ 6.559, 7.081, 7.662, 8.309, 9.032, 9.843, 10.756 ],
        70.0: [ 6.647, 7.177, 7.766, 8.423, 9.156, 9.979, 10.905 ],
        70.5: [ 6.735, 7.273, 7.870, 8.536, 9.280, 10.114, 11.053 ],
        71.0: [ 6.823, 7.368, 7.973, 8.648, 9.402, 10.248, 11.201 ],
        71.5: [ 6.909, 7.462, 8.075, 8.759, 9.524, 10.382, 11.348 ],
        72.0: [ 6.995, 7.555, 8.177, 8.870, 9.645, 10.514, 11.493 ],
        72.5: [ 7.080, 7.647, 8.277, 8.979, 9.764, 10.645, 11.637 ],
        73.0: [ 7.163, 7.737, 8.375, 9.086, 9.882, 10.774, 11.78 ],
        73.5: [ 7.246, 7.827, 8.473, 9.193, 9.998, 10.902, 11.92 ],
        74.0: [ 7.327, 7.915, 8.568, 9.297, 10.113, 11.028, 12.059 ],
        74.5: [ 7.407, 8.002, 8.663, 9.401, 10.226, 11.152, 12.195 ],
        75.0: [ 7.486, 8.088, 8.757, 9.503, 10.338, 11.275, 12.33 ],
        75.5: [ 7.565, 8.173, 8.850, 9.604, 10.448, 11.396, 12.464 ],
        76.0: [ 7.641, 8.257, 8.940, 9.703, 10.557, 11.515, 12.595 ],
        76.5: [ 7.717, 8.339, 9.030, 9.801, 10.663, 11.632, 12.723 ],
        77.0: [ 7.792, 8.420, 9.118, 9.896, 10.768, 11.746, 12.848 ],
        77.5: [ 7.865, 8.499, 9.204, 9.990, 10.870, 11.858, 12.972 ],
        78.0: [ 7.938, 8.578, 9.289, 10.083, 10.971, 11.968, 13.092 ],
        78.5: [ 8.010, 8.655, 9.373, 10.174, 11.070, 12.077, 13.211 ],
        79.0: [ 8.082, 8.733, 9.457, 10.265, 11.169, 12.184, 13.328 ],
        79.5: [ 8.154, 8.811, 9.541, 10.356, 11.267, 12.291, 13.445 ],
        80.0: [ 8.227, 8.890, 9.626, 10.448, 11.367, 12.399, 13.561 ],
        80.5: [ 8.302, 8.970, 9.712, 10.540, 11.467, 12.507, 13.679 ],
        81.0: [ 8.379, 9.052, 9.800, 10.635, 11.569, 12.617, 13.798 ],
        81.5: [ 8.457, 9.136, 9.891, 10.732, 11.673, 12.730, 13.92 ],
        82.0: [ 8.538, 9.223, 9.984, 10.832, 11.781, 12.845, 14.044 ],
        82.5: [ 8.623, 9.313, 10.080, 10.935, 11.891, 12.964, 14.172 ],
        83.0: [ 8.710, 9.406, 10.179, 11.042, 12.005, 13.086, 14.303 ],
        83.5: [ 8.800, 9.503, 10.282, 11.152, 12.123, 13.213, 14.439 ],
        84.0: [ 8.894, 9.602, 10.389, 11.265, 12.244, 13.342, 14.578 ],
        84.5: [ 8.990, 9.705, 10.498, 11.382, 12.369, 13.476, 14.721 ],
        85.0: [ 9.088, 9.809, 10.610, 11.501, 12.496, 13.612, 14.866 ],
        85.5: [ 9.189, 9.916, 10.723, 11.622, 12.625, 13.750, 15.014 ],
        86.0: [ 9.290, 10.024, 10.838, 11.744, 12.756, 13.890, 15.163 ],
        86.5: [ 9.392, 10.133, 10.954, 11.868, 12.888, 14.030, 15.314 ],
        87.0: [ 9.637, 10.393, 11.232, 12.164, 13.205, 14.370, 15.677 ],
        87.5: [ 9.738, 10.501, 11.347, 12.287, 13.336, 14.510, 15.828 ],
        88.0: [ 9.838, 10.607, 11.460, 12.409, 13.467, 14.650, 15.979 ],
        88.5: [ 9.937, 10.713, 11.573, 12.530, 13.597, 14.790, 16.129 ],
        89.0: [ 10.034, 10.817, 11.685, 12.650, 13.725, 14.928, 16.278 ],
        89.5: [ 10.130, 10.920, 11.795, 12.768, 13.853, 15.066, 16.428 ],
        90.0: [ 10.226, 11.022, 11.905, 12.886, 13.980, 15.204, 16.576 ],
        90.5: [ 10.320, 11.123, 12.014, 13.004, 14.107, 15.341, 16.725 ],
        91.0: [ 10.414, 11.224, 12.123, 13.121, 14.234, 15.478, 16.874 ],
        91.5: [ 10.507, 11.324, 12.231, 13.238, 14.360, 15.615, 17.024 ],
        92.0: [ 10.599, 11.424, 12.338, 13.354, 14.487, 15.753, 17.174 ],
        92.5: [ 10.691, 11.523, 12.445, 13.470, 14.613, 15.891, 17.325 ],
        93.0: [ 10.782, 11.622, 12.552, 13.587, 14.740, 16.030, 17.477 ],
        93.5: [ 10.873, 11.721, 12.660, 13.704, 14.868, 16.170, 17.63 ],
        94.0: [ 10.964, 11.820, 12.768, 13.822, 14.997, 16.311, 17.786 ],
        94.5: [ 11.056, 11.919, 12.876, 13.940, 15.127, 16.454, 17.943 ],
        95.0: [ 11.148, 12.020, 12.986, 14.060, 15.258, 16.598, 18.103 ],
        95.5: [ 11.241, 12.121, 13.096, 14.181, 15.391, 16.745, 18.265 ],
        96.0: [ 11.334, 12.223, 13.208, 14.304, 15.526, 16.894, 18.43 ],
        96.5: [ 11.428, 12.326, 13.321, 14.428, 15.663, 17.046, 18.599 ],
        97.0: [ 11.524, 12.430, 13.436, 14.555, 15.803, 17.201, 18.771 ],
        97.5: [ 11.620, 12.536, 13.552, 14.683, 15.946, 17.359, 18.948 ],
        98.0: [ 11.718, 12.644, 13.671, 14.814, 16.090, 17.520, 19.127 ],
        98.5: [ 11.817, 12.752, 13.791, 14.947, 16.238, 17.684, 19.311 ],
        99.0: [ 11.917, 12.863, 13.913, 15.082, 16.388, 17.852, 19.498 ],
        99.5: [ 12.018, 12.974, 14.036, 15.219, 16.540, 18.022, 19.688 ],
        100.0: [ 12.120, 13.087, 14.161, 15.358, 16.695, 18.195, 19.883 ],
        100.5: [ 12.224, 13.201, 14.288, 15.498, 16.852, 18.371, 20.081 ],
        101.0: [ 12.328, 13.317, 14.416, 15.641, 17.012, 18.550, 20.282 ],
        101.5: [ 12.433, 13.433, 14.545, 15.786, 17.173, 18.731, 20.487 ],
        102.0: [ 12.539, 13.551, 14.676, 15.932, 17.337, 18.915, 20.694 ],
        102.5: [ 12.647, 13.670, 14.809, 16.080, 17.503, 19.102, 20.904 ],
        103.0: [ 12.755, 13.791, 14.943, 16.230, 17.671, 19.291, 21.118 ],
        103.5: [ 12.865, 13.912, 15.079, 16.381, 17.841, 19.482, 21.334 ],
        104.0: [ 12.975, 14.035, 15.215, 16.534, 18.013, 19.675, 21.553 ],
        104.5: [ 13.086, 14.159, 15.353, 16.689, 18.186, 19.871, 21.775 ],
        105.0: [ 13.198, 14.283, 15.493, 16.845, 18.362, 20.070, 22 ],
        105.5: [ 13.312, 14.410, 15.634, 17.004, 18.540, 20.271, 22.227 ],
        106.0: [ 13.426, 14.537, 15.777, 17.164, 18.721, 20.475, 22.458 ],
        106.5: [ 13.542, 14.667, 15.921, 17.326, 18.903, 20.680, 22.692 ],
        107.0: [ 13.658, 14.797, 16.067, 17.489, 19.088, 20.890, 22.93 ],
        107.5: [ 13.776, 14.928, 16.214, 17.655, 19.274, 21.101, 23.17 ],
        108.0: [ 13.895, 15.061, 16.363, 17.823, 19.464, 21.316, 23.415 ],
        108.5: [ 14.015, 15.195, 16.514, 17.992, 19.655, 21.533, 23.662 ],
        109.0: [ 14.137, 15.332, 16.667, 18.164, 19.850, 21.754, 23.913 ],
        109.5: [ 14.260, 15.470, 16.822, 18.339, 20.047, 21.978, 24.169 ],
        110.0: [ 14.385, 15.609, 16.979, 18.516, 20.247, 22.205, 24.428 ],
        110.5: [ 14.511, 15.751, 17.138, 18.695, 20.450, 22.435, 24.69 ],
        111.0: [ 14.639, 15.894, 17.298, 18.876, 20.655, 22.668, 24.955 ],
        111.5: [ 14.768, 16.038, 17.461, 19.059, 20.862, 22.903, 25.224 ],
        112.0: [ 14.898, 16.184, 17.624, 19.244, 21.071, 23.141, 25.496 ],
        112.5: [ 15.029, 16.331, 17.790, 19.430, 21.282, 23.381, 25.77 ],
        113.0: [ 15.162, 16.479, 17.957, 19.618, 21.495, 23.623, 26.047 ],
        113.5: [ 15.296, 16.629, 18.125, 19.808, 21.710, 23.868, 26.325 ],
        114.0: [ 15.429, 16.779, 18.294, 19.999, 21.927, 24.114, 26.607 ],
        114.5: [ 15.565, 16.931, 18.464, 20.191, 22.144, 24.362, 26.891 ],
        115.0: [ 15.700, 17.083, 18.635, 20.385, 22.364, 24.612, 27.176 ],
        115.5: [ 15.836, 17.236, 18.807, 20.579, 22.584, 24.863, 27.463 ],
        116.0: [ 15.974, 17.389, 18.980, 20.774, 22.805, 25.115, 27.752 ],
        116.5: [ 16.111, 17.543, 19.153, 20.970, 23.028, 25.368, 28.042 ],
        117.0: [ 16.248, 17.697, 19.327, 21.167, 23.251, 25.623, 28.334 ],
        117.5: [ 16.385, 17.852, 19.501, 21.364, 23.475, 25.879, 28.627 ],
        118.0: [ 16.523, 18.006, 19.676, 21.561, 23.699, 26.135, 28.921 ],
        118.5: [ 16.660, 18.161, 19.850, 21.759, 23.924, 26.392, 29.216 ],
        119.0: [ 16.798, 18.316, 20.025, 21.957, 24.150, 26.650, 29.512 ],
        119.5: [ 16.935, 18.470, 20.199, 22.155, 24.375, 26.908, 29.81 ],
        120.0: [ 17.072, 18.624, 20.374, 22.353, 24.601, 27.167, 30.107 ],
    };

    var femaleMapHFA = {
        0: [ 43.6,45.4,47.3,49.1,51.0,52.9,54.7 ],
        1: [ 47.8,49.8,51.7,53.7,55.6,57.6,59.5 ],
        2: [ 51.0,53.0,55.0,57.1,59.1,61.1,63.2 ],
        3: [ 53.5,55.6,57.7,59.8,61.9,64.0,66.1 ],
        4: [ 55.6,57.8,59.9,62.1,64.3,66.4,68.6 ],
        5: [ 57.4,59.6,61.8,64.0,66.2,68.5,70.7 ],
        6: [ 58.9,61.2,63.5,65.7,68.0,70.3,72.5 ],
        7: [ 60.3,62.7,65.0,67.3,69.6,71.9,74.2 ],
        8: [ 61.7,64.0,66.4,68.7,71.1,73.5,75.8 ],
        9: [ 62.9,65.3,67.7,70.1,72.6,75.0,77.4 ],
        10: [ 64.1,66.5,69.0,71.5,73.9,76.4,78.9 ],
        11: [ 65.2,67.7,70.3,72.8,75.3,77.8,80.3 ],
        12: [ 66.3,68.9,71.4,74.0,76.6,79.2,81.7 ],
        13: [ 67.3,70.0,72.6,75.2,77.8,80.5,83.1 ],
        14: [ 68.3,71.0,73.7,76.4,79.1,81.7,84.4 ],
        15: [ 69.3,72.0,74.8,77.5,80.2,83.0,85.7 ],
        16: [ 70.2,73.0,75.8,78.6,81.4,84.2,87.0 ],
        17: [ 71.1,74.0,76.8,79.7,82.5,85.4,88.2 ],
        18: [ 72.0,74.9,77.8,80.7,83.6,86.5,89.4 ],
        19: [ 72.8,75.8,78.8,81.7,84.7,87.6,90.6 ],
        20: [ 73.7,76.7,79.7,82.7,85.7,88.7,91.7 ],
        21: [ 74.5,77.5,80.6,83.7,86.7,89.8,92.9 ],
        22: [ 75.2,78.4,81.5,84.6,87.7,90.8,94.0 ],
        23: [ 76.0,79.2,82.3,85.5,88.7,91.9,95.0 ],
        24: [ 76.7,80.0,83.2,86.4,89.6,92.9,96.1 ],
        25: [ 76.8,80.0,83.3,86.6,89.9,93.1,96.4 ],
        26: [ 77.5,80.8,84.1,87.4,90.8,94.1,97.4 ],
        27: [ 78.1,81.5,84.9,88.3,91.7,95.0,98.4 ],
        28: [ 78.8,82.2,85.7,89.1,92.5,96.0,99.4 ],
        29: [ 79.5,82.9,86.4,89.9,93.4,96.9,100.3 ],
        30: [ 80.1,83.6,87.1,90.7,94.2,97.7,101.3 ],
        31: [ 80.7,84.3,87.9,91.4,95.0,98.6,102.2 ],
        32: [ 81.3,84.9,88.6,92.2,95.8,99.4,103.1 ],
        33: [ 81.9,85.6,89.3,92.9,96.6,100.3,103.9 ],
        34: [ 82.5,86.2,89.9,93.6,97.4,101.1,104.8 ],
        35: [ 83.1,86.8,90.6,94.4,98.1,101.9,105.6 ],
        36: [ 83.6,87.4,91.2,95.1,98.9,102.7,106.5 ],
        37: [ 84.2,88.0,91.9,95.7,99.6,103.4,107.3 ],
        38: [ 84.7,88.6,92.5,96.4,100.3,104.2,108.1 ],
        39: [ 85.3,89.2,93.1,97.1,101.0,105.0,108.9 ],
        40: [ 85.8,89.8,93.8,97.7,101.7,105.7,109.7 ],
        41: [ 86.3,90.4,94.4,98.4,102.4,106.4,110.5 ],
        42: [ 86.8,90.9,95.0,99.0,103.1,107.2,111.2 ],
        43: [ 87.4,91.5,95.6,99.7,103.8,107.9,112.0 ],
        44: [ 87.9,92.0,96.2,100.3,104.5,108.6,112.7 ],
        45: [ 88.4,92.5,96.7,100.9,105.1,109.3,113.5 ],
        46: [ 88.9,93.1,97.3,101.5,105.8,110.0,114.2 ],
        47: [ 89.3,93.6,97.9,102.1,106.4,110.7,114.9 ],
        48: [ 89.8,94.1,98.4,102.7,107.0,111.3,115.7 ],
        49: [ 90.3,94.6,99.0,103.3,107.7,112.0,116.4 ],
        50: [ 90.7,95.1,99.5,103.9,108.3,112.7,117.1 ],
        51: [ 91.2,95.6,100.1,104.5,108.9,113.3,117.7 ],
        52: [ 91.7,96.1,100.6,105.0,109.5,114.0,118.4 ],
        53: [ 92.1,96.6,101.1,105.6,110.1,114.6,119.1 ],
        54: [ 92.6,97.1,101.6,106.2,110.7,115.2,119.8 ],
        55: [ 93.0,97.6,102.2,106.7,111.3,115.9,120.4 ],
        56: [ 93.4,98.1,102.7,107.3,111.9,116.5,121.1 ],
        57: [ 93.9,98.5,103.2,107.8,112.5,117.1,121.8 ],
        58: [ 94.3,99.0,103.7,108.4,113.0,117.7,122.4 ],
        59: [ 94.7,99.5,104.2,108.9,113.6,118.3,123.1 ],
        60: [ 95.2,99.9,104.7,109.4,114.2,118.9,123.7 ],
    };

    var maleMapHFA = {
        0: [ 44.2,46.1,48.0,49.9,51.8,53.7,55.6 ],
        1: [ 48.9,50.8,52.8,54.7,56.7,58.6,60.6 ],
        2: [ 52.4,54.4,56.4,58.4,60.4,62.4,64.4 ],
        3: [ 55.3,57.3,59.4,61.4,63.5,65.5,67.6 ],
        4: [ 57.6,59.7,61.8,63.9,66.0,68.0,70.1 ],
        5: [ 59.6,61.7,63.8,65.9,68.0,70.1,72.2 ],
        6: [ 61.2,63.3,65.5,67.6,69.8,71.9,74.0 ],
        7: [ 62.7,64.8,67.0,69.2,71.3,73.5,75.7 ],
        8: [ 64.0,66.2,68.4,70.6,72.8,75.0,77.2 ],
        9: [ 65.2,67.5,69.7,72.0,74.2,76.5,78.7 ],
        10: [ 66.4,68.7,71.0,73.3,75.6,77.9,80.1 ],
        11: [ 67.6,69.9,72.2,74.5,76.9,79.2,81.5 ],
        12: [ 68.6,71.0,73.4,75.7,78.1,80.5,82.9 ],
        13: [ 69.6,72.1,74.5,76.9,79.3,81.8,84.2 ],
        14: [ 70.6,73.1,75.6,78.0,80.5,83.0,85.5 ],
        15: [ 71.6,74.1,76.6,79.1,81.7,84.2,86.7 ],
        16: [ 72.5,75.0,77.6,80.2,82.8,85.4,88.0 ],
        17: [ 73.3,76.0,78.6,81.2,83.9,86.5,89.2 ],
        18: [ 74.2,76.9,79.6,82.3,85.0,87.7,90.4 ],
        19: [ 75.0,77.7,80.5,83.2,86.0,88.8,91.5 ],
        20: [ 75.8,78.6,81.4,84.2,87.0,89.8,92.6 ],
        21: [ 76.5,79.4,82.3,85.1,88.0,90.9,93.8 ],
        22: [ 77.2,80.2,83.1,86.0,89.0,91.9,94.9 ],
        23: [ 78.0,81.0,83.9,86.9,89.9,92.9,95.9 ],
        24: [ 78.0,81.0,84.1,87.1,90.2,93.2,96.3 ],
        25: [ 78.6,81.7,84.9,88.0,91.1,94.2,97.3 ],
        26: [ 79.3,82.5,85.6,88.8,92.0,95.2,98.3 ],
        27: [ 79.9,83.1,86.4,89.6,92.9,96.1,99.3 ],
        28: [ 80.5,83.8,87.1,90.4,93.7,97.0,100.3 ],
        29: [ 81.1,84.5,87.8,91.2,94.5,97.9,101.2 ],
        30: [ 81.7,85.1,88.5,91.9,95.3,98.7,102.1 ],
        31: [ 82.3,85.7,89.2,92.7,96.1,99.6,103.0 ],
        32: [ 82.8,86.4,89.9,93.4,96.9,100.4,103.9 ],
        33: [ 83.4,86.9,90.5,94.1,97.6,101.2,104.8 ],
        34: [ 83.9,87.5,91.1,94.8,98.4,102.0,105.6 ],
        35: [ 84.4,88.1,91.8,95.4,99.1,102.7,106.4 ],
        36: [ 85.0,88.7,92.4,96.1,99.8,103.5,107.2 ],
        37: [ 85.5,89.2,93.0,96.7,100.5,104.2,108.0 ],
        38: [ 86.0,89.8,93.6,97.4,101.2,105.0,108.8 ],
        39: [ 86.5,90.3,94.2,98.0,101.8,105.7,109.5 ],
        40: [ 87.0,90.9,94.7,98.6,102.5,106.4,110.3 ],
        41: [ 87.5,91.4,95.3,99.2,103.2,107.1,111.0 ],
        42: [ 88.0,91.9,95.9,99.9,103.8,107.8,111.7 ],
        43: [ 88.4,92.4,96.4,100.4,104.5,108.5,112.5 ],
        44: [ 88.9,93.0,97.0,101.0,105.1,109.1,113.2 ],
        45: [ 89.4,93.5,97.5,101.6,105.7,109.8,113.9 ],
        46: [ 89.8,94.0,98.1,102.2,106.3,110.4,114.6 ],
        47: [ 90.3,94.4,98.6,102.8,106.9,111.1,115.2 ],
        48: [ 90.7,94.9,99.1,103.3,107.5,111.7,115.9 ],
        49: [ 91.2,95.4,99.7,103.9,108.1,112.4,116.6 ],
        50: [ 91.6,95.9,100.2,104.4,108.7,113.0,117.3 ],
        51: [ 92.1,96.4,100.7,105.0,109.3,113.6,117.9 ],
        52: [ 92.5,96.9,101.2,105.6,109.9,114.2,118.6 ],
        53: [ 93.0,97.4,101.7,106.1,110.5,114.9,119.2 ],
        54: [ 93.4,97.8,102.3,106.7,111.1,115.5,119.9 ],
        55: [ 93.9,98.3,102.8,107.2,111.7,116.1,120.6 ],
        56: [ 94.3,98.8,103.3,107.8,112.3,116.7,121.2 ],
        57: [ 94.7,99.3,103.8,108.3,112.8,117.4,121.9 ],
        58: [ 95.2,99.7,104.3,108.9,113.4,118.0,122.6 ],
        59: [ 95.6,100.2,104.8,109.4,114.0,118.6,123.2 ],
        60: [ 96.1,100.7,105.3,110.0,114.6,119.2,123.9 ],
    }

    function findDeviationLimits(weight, sdArray) {
        var lowerLimitIn;
        var higherLimitIn;
        // find the standard deviation interval
        for (var i = 0; i < 7; i++) {
            if (weight >= sdArray[i]) {
                lowerLimitIn = i;

                if (weight > sdArray[i]) {
                    // eslint-disable-next-line no-continue
                    continue;
                }
            }

            higherLimitIn = i;
            break;
        }
        return { lowerLimitIn, higherLimitIn };
    }

    function getZScoreFromMap(key, value, map) {

        var sdArray = map[Number(key)];

        if (value < sdArray[0]) { return -3.5; }
        if (value > sdArray[6]) { return 3.5; }

        var deviationLimits = findDeviationLimits(value, sdArray);
        var higherLimitIn = deviationLimits.higherLimitIn;
        var lowerLimitIn = deviationLimits.lowerLimitIn;

        // Find the distance between the two SDs in the common unit.
        var distance = sdArray[higherLimitIn] - sdArray[lowerLimitIn];

        // The gap from the intervals top limit down to the actual value:
        var gap = sdArray[higherLimitIn] - value;

        // The decimal places this gap represent from the higher SD
        var decimalSubtraction = distance > 0 ? gap / distance : 0;

        return (higherLimitIn - 3 - decimalSubtraction).toFixed(2);
    }

    function getZScoreWFA(ageInMonths, weight, gender) {
        var map = femaleMapWFA;

        if (maleCodes[gender] === 1) {
            map = maleMapWFA;
        }

        return getZScoreFromMap(Math.round(ageInMonths), weight, map);
    }

    function getZScoreHFA(ageInMonths, heightInCm, gender) {
        var map = femaleMapHFA;

        if (maleCodes[gender] === 1) {
            map = maleMapHFA;
        }

        return getZScoreFromMap(Math.round(ageInMonths), heightInCm, map);
    }

    function getZScoreWFH(heightInCm, weight, gender) {
        var map = femaleMapWFH;

        if (maleCodes[gender] === 1) {
            map = maleMapWFH;
        }

        return getZScoreFromMap(Math.round(heightInCm * 2) / 2, weight, map);
    }

    var runDhisFunctions = function(expression, variablesHash, flag, selectedOrgUnit) {
        //Called from "runExpression". Only proceed with this logic in case there seems to be dhis function calls: "d2:" is present.
        if(angular.isDefined(expression) && expression.indexOf("d2:") !== -1){
            var dhisFunctions = [{name:"d2:daysBetween",parameters:2},
                {name:"d2:weeksBetween",parameters:2},
                {name:"d2:monthsBetween",parameters:2},
                {name:"d2:yearsBetween",parameters:2},
                {name:"d2:floor",parameters:1},
                {name:"d2:modulus",parameters:2},
                {name:"d2:concatenate"},
                {name:"d2:addDays",parameters:2},
                {name:"d2:zing",parameters:1},
                {name:"d2:oizp",parameters:1},
                {name:"d2:count",parameters:1},
                {name:"d2:countIfZeroPos",parameters:1},
                {name:"d2:countIfValue",parameters:2},
                {name:"d2:ceil",parameters:1},
                {name:"d2:round",parameters:1},
                {name:"d2:hasValue",parameters:1},
                {name:"d2:lastEventDate",parameters:1},
                {name:"d2:validatePattern",parameters:2},
                {name:"d2:addControlDigits",parameters:1},
                {name:"d2:checkControlDigits",parameters:1},
                {name:"d2:left",parameters:2},
                {name:"d2:right",parameters:2},
                {name:"d2:substring",parameters:3},
                {name:"d2:split",parameters:3},
                {name:"d2:zScoreWFA",parameters:3},
                {name:"d2:zScoreWFH",parameters:3},
                {name:"d2:zScoreHFA",parameters:3},
                {name:"d2:length",parameters:1},
                {name:"d2:inOrgUnitGroup",parameters:1},
                {name:"d2:hasUserRole",parameters:1},
                {name:"d2:condition",parameters:3},
                {name:"d2:extractDataMatrixValue",parameters:2}];
            var continueLooping = true;
            //Safety harness on 10 loops, in case of unanticipated syntax causing unintencontinued looping
            for(var i = 0; i < 10 && continueLooping; i++ ) {
                var expressionUpdated = false;
                var brokenExecution = false;
                angular.forEach(dhisFunctions, function(dhisFunction){
                    //Select the function call, with any number of parameters inside single quotations, or number parameters witout quotations
                    var regularExFunctionCall = new RegExp(dhisFunction.name + "\\( *(([\\d/\\*\\+\\-%\. ]+)|( *'[^']*'))*( *, *(([\\d/\\*\\+\\-%\. ]+)|'[^']*'))* *\\)",'g');
                    var callsToThisFunction = expression.match(regularExFunctionCall);
                    angular.forEach(callsToThisFunction, function(callToThisFunction){
                        //Remove the function name and paranthesis:
                        var justparameters = callToThisFunction.replace(/(^[^\(]+\()|\)$/g,"");
                        //Remove white spaces before and after parameters:
                        justparameters = justparameters.trim();
                        //Then split into single parameters:
                        var parameters = justparameters.match(/(('[^']+')|([^,]+))/g);

                        //Show error if no parameters is given and the function requires parameters,
                        //or if the number of parameters is wrong.
                        if(angular.isDefined(dhisFunction.parameters)){
                            //But we are only checking parameters where the dhisFunction actually has a defined set of parameters(concatenate, for example, does not have a fixed number);
                            var numParameters = parameters ? parameters.length : 0;
                            
                            if(numParameters !== dhisFunction.parameters){
                                $log.warn(dhisFunction.name + " was called with the incorrect number of parameters");
                                
                                //Mark this function call as broken:
                                brokenExecution = true;
                            }
                        }

                        //In case the function call is nested, the parameter itself contains an expression, run the expression.
                        if(!brokenExecution && angular.isDefined(parameters) && parameters !== null) {
                            for (var i = 0; i < parameters.length; i++) {
                                parameters[i] = runExpression(parameters[i],dhisFunction.name,"parameter:" + i, flag, variablesHash, selectedOrgUnit);
                            }
                        }

                        //Special block for d2:weeksBetween(*,*) - add such a block for all other dhis functions.
                        if(brokenExecution) {
                            //Function call is not possible to evaluate, remove the call:
                            expression = expression.replace(callToThisFunction, "false");
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:daysBetween") {
                            var firstdate = $filter('trimquotes')(parameters[0]);
                            var seconddate = $filter('trimquotes')(parameters[1]);
                            firstdate = moment(firstdate, CalendarService.getSetting().momentFormat);
                            seconddate = moment(seconddate, CalendarService.getSetting().momentFormat);
                            //Replace the end evaluation of the dhis function:
                            expression = expression.replace(callToThisFunction, seconddate.diff(firstdate,'days'));
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:weeksBetween") {
                            var firstdate = $filter('trimquotes')(parameters[0]);
                            var seconddate = $filter('trimquotes')(parameters[1]);
                            firstdate = moment(firstdate, CalendarService.getSetting().momentFormat);
                            seconddate = moment(seconddate, CalendarService.getSetting().momentFormat);
                            //Replace the end evaluation of the dhis function:
                            expression = expression.replace(callToThisFunction, seconddate.diff(firstdate,'weeks'));
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:monthsBetween") {
                            var firstdate = $filter('trimquotes')(parameters[0]);
                            var seconddate = $filter('trimquotes')(parameters[1]);
                            firstdate = moment(firstdate, CalendarService.getSetting().momentFormat);
                            seconddate = moment(seconddate, CalendarService.getSetting().momentFormat);
                            //Replace the end evaluation of the dhis function:
                            expression = expression.replace(callToThisFunction, seconddate.diff(firstdate,'months'));
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:yearsBetween") {
                            var firstdate = $filter('trimquotes')(parameters[0]);
                            var seconddate = $filter('trimquotes')(parameters[1]);
                            firstdate = moment(firstdate, CalendarService.getSetting().momentFormat);
                            seconddate = moment(seconddate, CalendarService.getSetting().momentFormat);
                            //Replace the end evaluation of the dhis function:
                            expression = expression.replace(callToThisFunction, seconddate.diff(firstdate,'years'));
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:floor") {
                            var floored = Math.floor(parameters[0]);
                            //Replace the end evaluation of the dhis function:
                            expression = expression.replace(callToThisFunction, floored);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:modulus") {
                            var dividend = Number(parameters[0]);
                            var divisor = Number(parameters[1]);
                            var rest = dividend % divisor;
                            //Replace the end evaluation of the dhis function:
                            expression = expression.replace(callToThisFunction, rest);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:concatenate") {
                            var returnString = "'";
                            for (var i = 0; i < parameters.length; i++) {
                                returnString += parameters[i];
                            }
                            returnString += "'";
                            expression = expression.replace(callToThisFunction, returnString);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:addDays") {
                            var date = $filter('trimquotes')(parameters[0]);
                            var daystoadd = $filter('trimquotes')(parameters[1]);
                            var newdate = DateUtils.format( moment(date, CalendarService.getSetting().momentFormat).add(daystoadd, 'days') );
                            var newdatestring = "'" + newdate + "'";
                            //Replace the end evaluation of the dhis function:
                            expression = expression.replace(callToThisFunction, newdatestring);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:zing") {
                            var number = parameters[0];
                            if( number < 0 ) {
                                number = 0;
                            }

                            //Replace the end evaluation of the dhis function:
                            expression = expression.replace(callToThisFunction, number);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:oizp") {
                            var number = parameters[0];
                            var output = 1;
                            if( number < 0 ) {
                                output = 0;
                            }

                            //Replace the end evaluation of the dhis function:
                            expression = expression.replace(callToThisFunction, output);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:count") {
                            var variableName = parameters[0];
                            var variableObject = variablesHash[variableName];
                            var count = 0;
                            if(variableObject)
                            {
                                if(variableObject.hasValue){
                                    if(variableObject.allValues && variableObject.allValues.length > 0)
                                    {
                                        count = variableObject.allValues.length;
                                    } else {
                                        //If there is a value found for the variable, the count is 1 even if there is no list of alternate values
                                        //This happens for variables of "DATAELEMENT_CURRENT_STAGE" and "TEI_ATTRIBUTE"
                                        count = 1;
                                    }
                                }
                            }
                            else
                            {
                                $log.warn("could not find variable to count: " + variableName);
                            }

                            //Replace the end evaluation of the dhis function:
                            expression = expression.replace(callToThisFunction, count);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:countIfZeroPos") {
                            var variableName = $filter('trimvariablequalifiers') (parameters[0]);
                            var variableObject = variablesHash[variableName];

                            var count = 0;
                            if(variableObject)
                            {
                                if( variableObject.hasValue ) {
                                    if(variableObject.allValues && variableObject.allValues.length > 0)
                                    {
                                        for(var i = 0; i < variableObject.allValues.length; i++)
                                        {
                                            if(variableObject.allValues[i] >= 0) {
                                                count++;
                                            }
                                        }
                                    }
                                    else {
                                        //The variable has a value, but no list of alternates. This means we only compare the elements real value
                                        if(variableObject.variableValue >= 0) {
                                            count = 1;
                                        }
                                    }
                                }
                            }
                            else
                            {
                                $log.warn("could not find variable to countifzeropos: " + variableName);
                            }

                            //Replace the end evaluation of the dhis function:
                            expression = expression.replace(callToThisFunction, count);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:countIfValue") {
                            var variableName = parameters[0];
                            var variableObject = variablesHash[variableName];

                            var valueToCompare = VariableService.processValue(parameters[1],variableObject.variableType);

                            var count = 0;
                            if(variableObject)
                            {
                                if( variableObject.hasValue )
                                {
                                    if( variableObject.allValues && variableObject.allValues.length > 0 )
                                    {
                                        for(var i = 0; i < variableObject.allValues.length; i++)
                                        {
                                            if(valueToCompare === variableObject.allValues[i]) {
                                                count++;
                                            }
                                        }
                                    } else {
                                        //The variable has a value, but no list of alternates. This means we compare the standard variablevalue
                                        if(valueToCompare === variableObject.variableValue) {
                                            count = 1;
                                        }
                                    }

                                }
                            }
                            else
                            {
                                $log.warn("could not find variable to countifvalue: " + variableName);
                            }

                            //Replace the end evaluation of the dhis function:
                            expression = expression.replace(callToThisFunction, count);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:ceil") {
                            var ceiled = Math.ceil(parameters[0]);
                            //Replace the end evaluation of the dhis function:
                            expression = expression.replace(callToThisFunction, ceiled);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:round") {
                            var rounded = Math.round(parameters[0]);
                            //Replace the end evaluation of the dhis function:
                            expression = expression.replace(callToThisFunction, rounded);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:hasValue") {
                            var variableName = parameters[0];
                            var variableObject = variablesHash[variableName];
                            var valueFound = false;
                            if(variableObject)
                            {
                                if(variableObject.hasValue){
                                    valueFound = true;
                                }
                            }
                            else
                            {
                                $log.warn("could not find variable to check if has value: " + variableName);
                            }

                            //Replace the end evaluation of the dhis function:
                            expression = expression.replace(callToThisFunction, valueFound);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:lastEventDate") {
                            var variableName = parameters[0];
                            var variableObject = variablesHash[variableName];
                            var valueFound = "''";
                            if(variableObject)
                            {
                                if(variableObject.variableEventDate){
                                    valueFound = VariableService.processValue(variableObject.variableEventDate, 'DATE');
                                }
                                else {
                                    $log.warn("no last event date found for variable: " + variableName);
                                }
                            }
                            else
                            {
                                $log.warn("could not find variable to check last event date: " + variableName);
                            }

                            //Replace the end evaluation of the dhis function:
                            expression = expression.replace(callToThisFunction, valueFound);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:validatePattern") {
                            var inputToValidate = parameters[0].toString();
                            var pattern = parameters[1];
                            var regEx = new RegExp(pattern,'g');
                            var match = inputToValidate.match(regEx);
                            
                            var matchFound = false;
                            if(match !== null && inputToValidate === match[0]) {
                                matchFound = true;
                            }

                            //Replace the end evaluation of the dhis function:
                            expression = expression.replace(callToThisFunction, matchFound);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:addControlDigits") {

                            var baseNumber = parameters[0];
                            var baseDigits = baseNumber.split('');
                            var error = false;

                            var firstDigit = 0;
                            var secondDigit = 0;

                            if(baseDigits && baseDigits.length < 10 ) {
                                var firstSum = 0;
                                var baseNumberLength = baseDigits.length;
                                //weights support up to 9 base digits:
                                var firstWeights = [3,7,6,1,8,9,4,5,2];
                                for(var i = 0; i < baseNumberLength && !error; i++) {
                                    firstSum += parseInt(baseDigits[i]) * firstWeights[i];
                                }
                                firstDigit = firstSum % 11;

                                //Push the first digit to the array before continuing, as the second digit is a result of the
                                //base digits and the first control digit.
                                baseDigits.push(firstDigit);
                                //Weights support up to 9 base digits plus first control digit:
                                var secondWeights = [5,4,3,2,7,6,5,4,3,2];
                                var secondSum = 0;
                                for(var i = 0; i < baseNumberLength + 1 && !error; i++) {
                                    secondSum += parseInt(baseDigits[i]) * secondWeights[i];
                                }
                                secondDigit = secondSum % 11;

                                if(firstDigit === 10) {
                                    $log.warn("First control digit became 10, replacing with 0");
                                    firstDigit = 0;
                                }
                                if(secondDigit === 10) {
                                    $log.warn("Second control digit became 10, replacing with 0");
                                    secondDigit = 0;
                                }
                            }
                            else
                            {
                                $log.warn("Base nuber not well formed(" + baseNumberLength + " digits): " + baseNumber);
                            }

                            if(!error) {
                                //Replace the end evaluation of the dhis function:
                                expression = expression.replace(callToThisFunction, baseNumber + firstDigit + secondDigit);
                                expressionUpdated = true;
                            }
                            else
                            {
                                //Replace the end evaluation of the dhis function:
                                expression = expression.replace(callToThisFunction, baseNumber);
                                expressionUpdated = true;
                            }
                        }
                        else if(dhisFunction.name === "d2:checkControlDigits") {
                            $log.warn("checkControlDigits not implemented yet");

                            //Replace the end evaluation of the dhis function:
                            expression = expression.replace(callToThisFunction, parameters[0]);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:left") {
                            var string = String(parameters[0]);
                            var numChars = string.length < parameters[1] ? string.length : parameters[1];
                            var returnString =  string.substring(0,numChars);
                            returnString = VariableService.processValue(returnString, 'TEXT');
                            expression = expression.replace(callToThisFunction, returnString);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:right") {
                            var string = String(parameters[0]);
                            var numChars = string.length < parameters[1] ? string.length : parameters[1];
                            var returnString =  string.substring(string.length - numChars, string.length);
                            returnString = VariableService.processValue(returnString, 'TEXT');
                            expression = expression.replace(callToThisFunction, returnString);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:substring") {
                            var string = String(parameters[0]);
                            var startChar = string.length < parameters[1] - 1 ? -1 : parameters[1];
                            var endChar = string.length < parameters[2] ? -1 : parameters[2];
                            if(startChar < 0 || endChar < 0) {
                                expression = expression.replace(callToThisFunction, "''");
                                expressionUpdated = true;
                            } else {
                                var returnString =  string.substring(startChar, endChar);
                                returnString = VariableService.processValue(returnString, 'TEXT');
                                expression = expression.replace(callToThisFunction, returnString);
                                expressionUpdated = true;
                            }
                        }
                        else if(dhisFunction.name === "d2:split") {
                            var string = String(parameters[0]);
                            var splitArray = string.split(parameters[1]);
                            var returnPart = "";
                            if (splitArray.length >= parameters[2]) {
                                returnPart = splitArray[parameters[2]];
                            }
                            returnPart = VariableService.processValue(returnPart, 'TEXT');
                            expression = expression.replace(callToThisFunction, returnPart);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:zScoreWFA") {
                            expression = expression.replace(callToThisFunction, getZScoreWFA(parameters[0],parameters[1],parameters[2]));
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:zScoreHFA") {
                            expression = expression.replace(callToThisFunction, getZScoreHFA(parameters[0],parameters[1],parameters[2]));
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:zScoreWFH") {
                            expression = expression.replace(callToThisFunction, getZScoreWFH(parameters[0],parameters[1],parameters[2]));
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:length") {
                            expression = expression.replace(callToThisFunction, String(parameters[0]).length);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:condition"){
                            var toEvaluate = parameters[0]+"? "+parameters[1]+" : "+parameters[2];
                            var result = eval(toEvaluate);
                            expression = expression.replace(callsToThisFunction,result);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:inOrgUnitGroup") {
                            var group = parameters[0];
                            var isInGroup = "false";
                            var orgUnitGroups = (selectedOrgUnit && selectedOrgUnit.g) || [];
                            var foundGroup = orgUnitGroups.find(function(o) {return o.id === group || o.code === group});
                            if(foundGroup)
                            {
                                isInGroup = "true"
                            }

                            expression = expression.replace(callToThisFunction, isInGroup);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:hasUserRole") {
                            var userRole = parameters[0];
                            var user = SessionStorageService.get('USER_PROFILE');
                            var valueFound = false;
                            angular.forEach(user.userCredentials.userRoles, function(role){
                                if(role.id === userRole) {
                                    valueFound = true;
                                }
                            });

                            //Replace the end evaluation of the dhis function:
                            expression = expression.replace(callToThisFunction, valueFound);
                            expressionUpdated = true;
                        }
                        else if(dhisFunction.name === "d2:extractDataMatrixValue") {
                            expression = expression.replace(callsToThisFunction, extractDataMatrixValue( parameters[0], parameters[1] ) );
                            expressionUpdated = true;
                        }
                    });
                });

                //We only want to continue looping until we made a successful replacement,
                //and there is still occurrences of "d2:" in the code. In cases where d2: occur outside
                //the expected d2: function calls, one unneccesary iteration will be done and the
                //successfulExecution will be false coming back here, ending the loop. The last iteration
                //should be zero to marginal performancewise.
                if(expressionUpdated && expression.indexOf("d2:") !== -1) {
                    continueLooping = true;
                } else {
                    continueLooping = false;
                }
            }
        }

        return expression;
    };

    var runExpression = function(expression, beforereplacement, identifier, flag, variablesHash, selectedOrgUnit){
        //determine if expression is true, and actions should be effectuated
        //If DEBUG mode, use try catch and report errors. If not, omit the heavy try-catch loop.:
        var answer = false;
        if(flag && flag.debug) {
            try{

                var dhisfunctionsevaluated = runDhisFunctions(expression, variablesHash, flag, selectedOrgUnit);
                answer = eval(dhisfunctionsevaluated);

                if(flag.verbose)
                {
                    $log.info("Expression with id " + identifier + " was successfully run. Original condition was: " + beforereplacement + " - Evaluation ended up as:" + expression + " - Result of evaluation was:" + answer);
                }
            }
            catch(e)
            {
                $log.warn("Expression with id " + identifier + " could not be run. Original condition was: " + beforereplacement + " - Evaluation ended up as:" + expression + " - error message:" + e);
            }
        }
        else {
            //Just run the expression. This is much faster than the debug route: http://jsperf.com/try-catch-block-loop-performance-comparison
            var dhisfunctionsevaluated = runDhisFunctions(expression, variablesHash, flag);
            answer = eval(dhisfunctionsevaluated);
        }
        return answer;
    };

    var determineValueType = function(value) {
        var valueType = 'TEXT';
        if(value === 'true' || value === 'false') {
            valueType = 'BOOLEAN';
        }
        else if((angular.isNumber(value) || !isNaN(value)) && (angular.isString(value) && value.substring(0,1) != '0')) {
            if(value % 1 !== 0) {
                valueType = 'NUMBER';
            }
            else {
                valueType = 'INTEGER';
            }
        }
        return valueType;
    };

    var performCreateEventAction = function(effect, selectedEntity, selectedEnrollment, currentEvents,executingEvent, programStage){
        var valArray = [];
        if(effect.data) {
            valArray = effect.data.split(',');
            var newEventDataValues = [];
            var idList = {active:false};

            angular.forEach(valArray, function(value) {
                var valParts = value.split(':');                
                if(valParts && valParts.length >= 1) {
                    var valId = valParts[0];

                    //Check wether one or more fields is marked as the id to use for comparison purposes:
                    if(valId.trim().substring(0, 4) === "[id]") {
                        valId = valId.substring(4,valId.length);
                        idList[valId] = true;
                        idList.active = true;
                    }

                    var valVal = "";
                    if(valParts.length > 1) {
                        valVal = valParts[1];
                    }
                    var valueType = determineValueType(valVal);

                    var processedValue = VariableService.processValue(valVal, valueType);
                    processedValue = $filter('trimquotes')(processedValue);
                    newEventDataValues.push({dataElement:valId,value:processedValue});
                    newEventDataValues[valId] = processedValue;
                }
            });

            var valuesAlreadyExists = false;
            angular.forEach(currentEvents, function(currentEvent) {
                var misMatch = false;
                angular.forEach(newEventDataValues, function(value) {
                    var valueFound = false;
                    angular.forEach(currentEvent.dataValues, function(currentDataValue) {
                        //Only count as mismatch if there is no particular ID to use, or the current field is part of the same ID
                        if(!idList.active || idList[currentDataValue.dataElement]){
                            if(currentDataValue.dataElement === value.dataElement) {
                                valueFound = true;
                                //Truthy comparison is needed to avoid false negatives for differing variable types:
                                if( currentDataValue.value != newEventDataValues[value.dataElement] ) {
                                    misMatch = true;
                                }
                            }
                        }
                    });
                    //Also treat no value found as a mismatch, but when ID fields is set, only concider ID fields
                    if((!idList.active || idList[value.dataElement] ) && !valueFound) {
                        misMatch = true;
                    }
                });
                if(!misMatch) {
                    //if no mismatches on this point, the exact same event already exists, and we dont create it.
                    valuesAlreadyExists = true;
                }
            });

            if(!valuesAlreadyExists) {
                var eventDate = DateUtils.getToday();
                var dueDate = DateUtils.getToday();

                var newEvent = {
                    trackedEntityInstance: selectedEnrollment.trackedEntityInstance,
                    program: selectedEnrollment.program,
                    programStage: effect.programStage.id,
                    enrollment: selectedEnrollment.enrollment,
                    orgUnit: selectedEnrollment.orgUnit,
                    dueDate: dueDate,
                    eventDate: eventDate,
                    notes: [],
                    dataValues: newEventDataValues,
                    status: 'ACTIVE',
                    event: dhis2.util.uid()
                };

                if(programStage && programStage.dontPersistOnCreate){
                    newEvent.notPersisted = true;
                    newEvent.executingEvent = executingEvent;
                    $rootScope.$broadcast("eventcreated", { event:newEvent });
                }
                else{
                    DHIS2EventFactory.create(newEvent).then(function(result){
                       $rootScope.$broadcast("eventcreated", { event:newEvent });
                    }); 
                }
                //1 event created
                return 1;
            }
            else
            {
                //no events created
                return 0;
            }
        } else {
            $log.warn("Cannot create event with empty content.");
        }
    };
    /**
     * 
     * @param {*} allProgramRules all program rules for the program
     * @param {*} executingEvent the event context for the program
     * @param {*} evs all events in the enrollment
     * @param {*} allDataElements all data elements(metadata)
     * @param {*} allTrackedEntityAttributes all tracked entity attributes(metadata)
     * @param {*} selectedEntity the selected tracked entity instance
     * @param {*} selectedEnrollment the selected enrollment
     * @param {*} optionSets all optionsets(matedata)
     * @param {*} flag execution flags
     */
    var internalFetchContextData = function(selectedEnrollment,executingEvent){
        return OrgUnitFactory.getFromStoreOrServer( selectedEnrollment ? selectedEnrollment.orgUnit : executingEvent.orgUnit )
            .then(function (orgUnit) {
                var data = { selectedOrgUnit: orgUnit, selectedProgramStage: null};
                if(executingEvent && executingEvent.program && executingEvent.programStage){
                    return MetaDataFactory.get("programs", executingEvent.program).then(function(program){
                        if(program && program.programStages){
                            data.selectedProgramStage = program.programStages.find(function(ps) { return ps.id === executingEvent.programStage });
                        }
                        return data;
                    });
                }
                return data;
            });
    }


    var internalExecuteRules = function(allProgramRules, executingEvent, evs, allDataElements, allTrackedEntityAttributes, selectedEntity, selectedEnrollment, optionSets, flag) {
        if(allProgramRules) {
            var variablesHash = {};

            //Concatenate rules produced by indicator definitions into the other rules:
            var rules = $filter('filter')(allProgramRules.programRules, {programStageId: null});

            if(executingEvent && executingEvent.programStage){
                if(!rules) {
                    rules = [];
                }
                rules = rules.concat($filter('filter')(allProgramRules.programRules, {programStageId: executingEvent.programStage}));
            }
            if(!rules) {
                rules = [];
            }
            if(allProgramRules.programIndicators) {
                rules = rules.concat(allProgramRules.programIndicators.rules);
            }

            //Run rules in priority - lowest number first(priority null is last)
            rules = orderByFilter(rules, 'priority');

            return internalFetchContextData(selectedEnrollment, executingEvent).then(function (data) {
                var selectedOrgUnit = data.selectedOrgUnit;
                var selectedProgramStage = data.selectedProgramStage;
                var variablesHash = VariableService.getVariables(allProgramRules, executingEvent, evs, allDataElements,
                    allTrackedEntityAttributes, selectedEntity, selectedEnrollment, optionSets, selectedOrgUnit, selectedProgramStage);
                
                if(angular.isObject(rules) && angular.isArray(rules)){
                    //The program has rules, and we want to run them.
                    //Prepare repository unless it is already prepared:
                    if(angular.isUndefined( $rootScope.ruleeffects ) ) {
                        $rootScope.ruleeffects = {};
                    }

                    var ruleEffectKey = executingEvent.event ? executingEvent.event : executingEvent;
                    if( executingEvent.event && angular.isUndefined( $rootScope.ruleeffects[ruleEffectKey] )){
                        $rootScope.ruleeffects[ruleEffectKey] = {};
                    }

                    if(!angular.isObject(executingEvent) && angular.isUndefined( $rootScope.ruleeffects[ruleEffectKey] )){
                        $rootScope.ruleeffects[ruleEffectKey] = {};
                    }

                    var updatedEffectsExits = false;
                    var eventsCreated = 0;

                    angular.forEach(rules, function(rule) {
                        var ruleEffective = false;

                        var expression = rule.condition;
                        //Go through and populate variables with actual values, but only if there actually is any replacements to be made(one or more "$" is present)
                        if(expression) {
                            if(expression.indexOf('{') !== -1) {
                                expression = replaceVariables(expression, variablesHash);
                            }

                            //run expression:
                            if( runExpression(expression, rule.condition, "rule:" + rule.id, flag, variablesHash, selectedOrgUnit) ){
                                ruleEffective = true;
                            }
                        } else {
                            $log.warn("Rule id:'" + rule.id + "'' and name:'" + rule.name + "' had no condition specified. Please check rule configuration.");
                        }

                        angular.forEach(rule.programRuleActions, function(action){
                            //In case the effect-hash is not populated, add entries
                            if(angular.isUndefined( $rootScope.ruleeffects[ruleEffectKey][action.id] )){
                                $rootScope.ruleeffects[ruleEffectKey][action.id] =  {
                                    id:action.id,
                                    option:action.option,
                                    optionGroup:action.optionGroup,
                                    location:action.location,
                                    action:action.programRuleActionType,
                                    dataElement:action.dataElement,
                                    trackedEntityAttribute:action.trackedEntityAttribute,
                                    programStage: action.programStage,
                                    programIndicator: action.programIndicator,
                                    programStageSection: action.programStageSection && action.programStageSection.id ? action.programStageSection.id : null,
                                    content:action.displayContent,
                                    data:action.data,
                                    ineffect:undefined
                                };
                            }

                            //In case the rule is effective and contains specific data,
                            //the effect be refreshed from the variables list.
                            //If the rule is not effective we can skip this step
                            if(ruleEffective && action.data)
                            {
                                //Preserve old data for comparison:
                                var oldData = $rootScope.ruleeffects[ruleEffectKey][action.id].data;

                                //The key data might be containing a dollar sign denoting that the key data is a variable.
                                //To make a lookup in variables hash, we must make a lookup without the dollar sign in the variable name
                                //The first strategy is to make a direct lookup. In case the "data" expression is more complex, we have to do more replacement and evaluation.

                                var nameWithoutBrackets = action.data.replace('#{','').replace('}','');
                                if(angular.isDefined(variablesHash[nameWithoutBrackets]))
                                {
                                    //The variable exists, and is replaced with its corresponding value
                                    $rootScope.ruleeffects[ruleEffectKey][action.id].data =
                                        variablesHash[nameWithoutBrackets].variableValue;
                                }
                                else if(action.data.indexOf('{') !== -1 || action.data.indexOf('d2:') !== -1)
                                {
                                    //Since the value couldnt be looked up directly, and contains a curly brace or a dhis function call,
                                    //the expression was more complex than replacing a single variable value.
                                    //Now we will have to make a thorough replacement and separate evaluation to find the correct value:
                                    $rootScope.ruleeffects[ruleEffectKey][action.id].data = replaceVariables(action.data, variablesHash);
                                    //In a scenario where the data contains a complex expression, evaluate the expression to compile(calculate) the result:
                                    $rootScope.ruleeffects[ruleEffectKey][action.id].data = runExpression($rootScope.ruleeffects[ruleEffectKey][action.id].data, action.data, "action:" + action.id, flag, variablesHash, selectedOrgUnit);
                                }

                                if(oldData !== $rootScope.ruleeffects[ruleEffectKey][action.id].data) {
                                    updatedEffectsExits = true;
                                }
                            }

                            //Update the rule effectiveness if it changed in this evaluation;
                            if($rootScope.ruleeffects[ruleEffectKey][action.id].ineffect !== ruleEffective)
                            {
                                //There is a change in the rule outcome, we need to update the effect object.
                                updatedEffectsExits = true;
                                $rootScope.ruleeffects[ruleEffectKey][action.id].ineffect = ruleEffective;
                            }

                            //In case the rule is of type CREATEEVENT, run event creation:
                            if($rootScope.ruleeffects[ruleEffectKey][action.id].action === "CREATEEVENT" && $rootScope.ruleeffects[ruleEffectKey][action.id].ineffect){
                                if(evs && evs.byStage){
                                    if($rootScope.ruleeffects[ruleEffectKey][action.id].programStage) {
                                        var createdNow = performCreateEventAction($rootScope.ruleeffects[ruleEffectKey][action.id], selectedEntity, selectedEnrollment, evs.byStage[$rootScope.ruleeffects[ruleEffectKey][action.id].programStage.id]);
                                        eventsCreated += createdNow;
                                    } else {
                                        $log.warn("No programstage defined for CREATEEVENT action: " + action.id);
                                    }
                                } else {
                                    $log.warn("Events to evaluate for CREATEEVENT action: " + action.id + ". Could it have been triggered at the wrong time or during registration?");
                                }
                            }
                            //In case the rule is of type "assign variable" and the rule is effective,
                            //the variable data result needs to be applied to the correct variable:
                            else if($rootScope.ruleeffects[ruleEffectKey][action.id].action === "ASSIGN" && $rootScope.ruleeffects[ruleEffectKey][action.id].ineffect){
                                //from earlier evaluation, the data portion of the ruleeffect now contains the value of the variable to be assigned.
                                //the content portion of the ruleeffect defines the name for the variable, when the qualidisers are removed:
                                var variabletoassign = $rootScope.ruleeffects[ruleEffectKey][action.id].content ?
                                    $rootScope.ruleeffects[ruleEffectKey][action.id].content.replace("#{","").replace("A{","").replace("}","") : null;

                                if(variabletoassign && !angular.isDefined(variablesHash[variabletoassign])){
                                    //If a variable is mentioned in the content of the rule, but does not exist in the variables hash, show a warning:
                                    $log.warn("Variable " + variabletoassign + " was not defined.");
                                }

                                if(variablesHash[variabletoassign]){
                                    var updatedValue = $rootScope.ruleeffects[ruleEffectKey][action.id].data;

                                    var valueType = variablesHash[variabletoassign].variableType || determineValueType(updatedValue);

                                    if($rootScope.ruleeffects[ruleEffectKey][action.id].dataElement) {
                                        updatedValue = VariableService.getDataElementValueOrCodeForValue(variablesHash[variabletoassign].useCodeForOptionSet, updatedValue, $rootScope.ruleeffects[ruleEffectKey][action.id].dataElement.id, allDataElements, optionSets);
                                    }
                                    updatedValue = VariableService.processValue(updatedValue, valueType);

                                    variablesHash[variabletoassign] = {
                                        variableValue:updatedValue,
                                        variableType:valueType,
                                        hasValue:true,
                                        variableEventDate:'',
                                        variablePrefix:variablesHash[variabletoassign].variablePrefix ? variablesHash[variabletoassign].variablePrefix : '#',
                                        allValues:[updatedValue]
                                    };

                                    if(variablesHash[variabletoassign].variableValue !== updatedValue) {
                                        //If the variable was actually updated, we assume that there is an updated ruleeffect somewhere:
                                        updatedEffectsExits = true;
                                    }
                                }
                            }
                        });
                    });
                    var result = { event: ruleEffectKey, callerId:flag.callerId, eventsCreated:eventsCreated };
                    //Broadcast rules finished if there was any actual changes to the event.
                    if(updatedEffectsExits){
                        $rootScope.$broadcast("ruleeffectsupdated", result);
                    }
                    return result;
                }
                return null;
            });
        }
        var def = $q.defer();
        def.resolve();
        return def.promise;
    };
    
    var internalProcessEventGrid = function( eventGrid ){
    	var events = [];
    	if( eventGrid && eventGrid.rows && eventGrid.headers ){    		
    		angular.forEach(eventGrid.rows, function(row) {
    			var ev = {};
    			var i = 0;
        		angular.forEach(eventGrid.headers, function(h){
        			ev[h] = row[i];
        			i++;
        		});                            
            });
    	}
    	return events;
    };

    var clearDataElementValueForShowHideOptionActions = function(dataElements, affectedEvent, optionVisibility, prStDes, optionSets){
        angular.forEach(dataElements, function(de){
            var value = affectedEvent[de];
            //Only process if has selected value
            if(angular.isDefined(value) && value !== "") {
                var optionSet = optionSets[prStDes[de].dataElement.optionSet.id];
                //Find selectedOption by displayName
                var selectedOption = optionSet.options.find(function(o) { return o.displayName === value });
                var shouldClear = !selectedOption;
                
                //If has selected option and a option is not in showOnly or is in hidden, field should be cleared.
                if(selectedOption){
                    shouldClear = (optionVisibility[de].showOnly && !optionVisibility[de].showOnly[selectedOption.id]) || optionVisibility[de].hidden[selectedOption.id];
                }
    
                if(shouldClear){
                    var message = (prStDes[de].dataElement.displayName + ' was blanked out because the option "'+value+'" got hidden by your last action');
                    alert(message);
                    affectedEvent[de] = "";
                }
            }
        });
    }

    var clearAttributeValueForShowHideOptionActions = function(attributes, affectedTei, optionVisibility, attributesById, optionSets){
        angular.forEach(attributes, function(attr){
            var value = affectedTei[attr];
            //Only process if has selected value
            if(angular.isDefined(value) && value !== "") {
                var optionSet = optionSets[attributesById[attr].optionSet.id];
                //Find selectedOption by displayName
                var selectedOption = optionSet.options.find(function(o) { return o.displayName === value });
                var shouldClear = !selectedOption;
                
                //If has selected option and a option is not in showOnly or is in hidden, field should be cleared.
                if(selectedOption){
                    shouldClear = (optionVisibility[attr].showOnly && !optionVisibility[attr].showOnly[selectedOption.id]) || optionVisibility[attr].hidden[selectedOption.id];
                }
    
                if(shouldClear){
                    var message = (attributesById[attr].displayName + ' was blanked out because the option "'+value+'" got hidden by your last action');
                    alert(message);
                    affectedTei[attr] = "";
                }
            }
        });
    }

    return {
        executeRules: function(allProgramRules, executingEvent, evs, allDataElements, allTrackedEntityAttributes, selectedEntity, selectedEnrollment, optionSets, flags) {
            return internalExecuteRules(allProgramRules, executingEvent, evs, allDataElements, allTrackedEntityAttributes, selectedEntity, selectedEnrollment, optionSets, flags);
        },
        processRuleEffectsForTrackedEntityAttributes: function(context, currentTei, teiOriginalValues, attributesById, optionSets,optionGroupsById) {
            var hiddenFields = {};
            var assignedFields = {};
            var hiddenSections = {};
            var mandatoryFields = {};
            var warningMessages = [];
            var optionVisibility = { showOnly: null, hidden: {}};
            
            var attributeOptionsChanged = [];

            angular.forEach($rootScope.ruleeffects[context], function (effect) {
                if (effect.ineffect) {
                    if (effect.action === "HIDEFIELD" && effect.trackedEntityAttribute) {
                        if (currentTei[effect.trackedEntityAttribute.id]) {
                            //If a field is going to be hidden, but contains a value, we need to take action;
                            if (effect.content) {
                                //TODO: Alerts is going to be replaced with a proper display mecanism.
                                alert(effect.content);
                            }
                            else {
                                //TODO: Alerts is going to be replaced with a proper display mecanism.
                                alert(attributesById[effect.trackedEntityAttribute.id].displayName + " - was blanked out and hidden by your last action");
                            }

                            //Blank out the value:
                            currentTei[effect.trackedEntityAttribute.id] = "";
                        }

                        hiddenFields[effect.trackedEntityAttribute.id] = true;
                    } else if (effect.action === "SHOWERROR" && effect.trackedEntityAttribute) {
                        if(effect.ineffect) {
                            var headerText =  $translate.instant('validation_error');
                            var bodyText = effect.content + (effect.data ? effect.data : "");

                            NotificationService.showNotifcationDialog(headerText, bodyText);
                            if( effect.trackedEntityAttribute ) {
                                currentTei[effect.trackedEntityAttribute.id] = teiOriginalValues[effect.trackedEntityAttribute.id];
                            }
                        }
                    } else if (effect.action === "SHOWWARNING" && effect.trackedEntityAttribute) {
                        if(effect.ineffect) {
                            var message = effect.content + (angular.isDefined(effect.data) ? effect.data : "");
                            
                            if( effect.trackedEntityAttribute ) {
                                warningMessages[effect.trackedEntityAttribute.id] = message;
                            }
                            else
                            {
                                warningMessages.push(message);
                            }
                        }
                    }
                    else if (effect.action === "ASSIGN" && effect.trackedEntityAttribute) {
                        var processedValue = $filter('trimquotes')(effect.data);

                        if(attributesById[effect.trackedEntityAttribute.id]
                                && attributesById[effect.trackedEntityAttribute.id].optionSet) {
                            processedValue = OptionSetService.getName(
                                    optionSets[attributesById[effect.trackedEntityAttribute.id].optionSet.id].options, processedValue)
                        }

                        processedValue = processedValue === "true" ? true : processedValue;
                        processedValue = processedValue === "false" ? false : processedValue;

                        //For "ASSIGN" actions where we have a dataelement, we save the calculated value to the dataelement:
                        currentTei[effect.trackedEntityAttribute.id] = processedValue;
                        assignedFields[effect.trackedEntityAttribute.id] = true;
                    }else if(effect.action === "SETMANDATORYFIELD" && effect.trackedEntityAttribute){
                        mandatoryFields[effect.trackedEntityAttribute.id] = effect.ineffect;
                    }
                    else if(effect.action === "HIDEOPTION"){
                        if(effect.ineffect && effect.trackedEntityAttribute && effect.option){
                            if(!optionVisibility[effect.trackedEntityAttribute.id]) optionVisibility[effect.trackedEntityAttribute.id] = { hidden: {}};
                            optionVisibility[effect.trackedEntityAttribute.id].hidden[effect.option.id] = {id: effect.option.id };
                            if(attributeOptionsChanged.indexOf(effect.trackedEntityAttribute.id) === -1) attributeOptionsChanged.push(effect.trackedEntityAttribute.id);
                        }
                    }
                    else if(effect.action === "SHOWOPTIONGROUP"){
                        if(effect.ineffect && effect.trackedEntityAttribute && effect.optionGroup){
                            if(!optionVisibility[effect.trackedEntityAttribute.id]) optionVisibility[effect.trackedEntityAttribute.id] = { hidden: {}};
                            var optionGroup = optionGroupsById[effect.optionGroup.id];
                            if(optionGroup){
                                if(!optionVisibility[effect.trackedEntityAttribute.id].showOnly) optionVisibility[effect.trackedEntityAttribute.id].showOnly = {};
                                angular.extend(optionVisibility[effect.trackedEntityAttribute.id].showOnly, optionGroup.optionsById);
                                if(attributeOptionsChanged.indexOf(effect.trackedEntityAttribute.id) === -1) attributeOptionsChanged.push(effect.trackedEntityAttribute.id);
                            }else{
                                $log.warn("OptionGroup "+effect.optionGroup.id+" was not found");
                            }

                        }
                    }
                    else if(effect.action === "HIDEOPTIONGROUP"){
                        if(effect.ineffect && effect.trackedEntityAttribute && effect.optionGroup){
                            if(!optionVisibility[effect.trackedEntityAttribute.id]) optionVisibility[effect.trackedEntityAttribute.id] = { hidden: {}};
                            var optionGroup = optionGroupsById[effect.optionGroup.id];
                            if(optionGroup){
                                angular.extend(optionVisibility[effect.trackedEntityAttribute.id].hidden, optionGroup.optionsById);
                                if(attributeOptionsChanged.indexOf(effect.trackedEntityAttribute.id) === -1) attributeOptionsChanged.push(effect.trackedEntityAttribute.id);
                            }else{
                                $log.warn("OptionGroup "+effect.optionGroup.id+" was not found");
                            }

                        }
                    }
                }
            });
            clearAttributeValueForShowHideOptionActions(attributeOptionsChanged, currentTei,optionVisibility,attributesById,optionSets);
            return {currentTei: currentTei, hiddenFields: hiddenFields, hiddenSections: hiddenSections, warningMessages: warningMessages, assignedFields: assignedFields, mandatoryFields: mandatoryFields, optionVisibility: optionVisibility};
        },
        processRuleEffectsForEvent: function(eventId, currentEvent, currentEventOriginalValues, prStDes, optionSets,optionGroupsById) {
            var hiddenFields = {};
            var assignedFields = {};
            var mandatoryFields = {};
            var hiddenSections = {};
            var warningMessages = [];
            var optionVisibility = { showOnly: null, hidden: {}};

            var dataElementOptionsChanged = [];
            angular.forEach($rootScope.ruleeffects[eventId], function (effect) {
                if (effect.ineffect) {
                    if (effect.action === "HIDEFIELD" && effect.dataElement) {
                        if(currentEvent[effect.dataElement.id]) {
                            //If a field is going to be hidden, but contains a value, we need to take action;
                            if(effect.content) {
                                //TODO: Alerts is going to be replaced with a proper display mecanism.
                                alert(effect.content);
                            }
                            else {
                                //TODO: Alerts is going to be replaced with a proper display mecanism.
                                alert(prStDes[effect.dataElement.id].dataElement.displayFormName + " - was blanked out and hidden by your last action");
                            }

                        }
                        currentEvent[effect.dataElement.id] = "";
                        hiddenFields[effect.dataElement.id] = true;
                    }
                    else if(effect.action === "HIDESECTION") {
                        if(effect.programStageSection){
                            hiddenSections[effect.programStageSection] = effect.programStageSection;
                        }
                    }
                    else if(effect.action === "SHOWERROR" && effect.dataElement.id){
                        var headerTxt =  $translate.instant('validation_error');
                        var bodyTxt = effect.content + (effect.data ? effect.data : "");
                        NotificationService.showNotifcationDialog(headerTxt, bodyTxt);

                        currentEvent[effect.dataElement.id] = currentEventOriginalValues[effect.dataElement.id];
                    }
                    else if(effect.action === "SHOWWARNING"){
                        warningMessages.push(effect.content + (effect.data ? effect.data : ""));
                    }
                    else if (effect.action === "ASSIGN" && effect.dataElement) {
                        var processedValue = $filter('trimquotes')(effect.data);

                        if(prStDes[effect.dataElement.id] 
                                && prStDes[effect.dataElement.id].dataElement.optionSet) {
                            processedValue = OptionSetService.getName(
                                    optionSets[prStDes[effect.dataElement.id].dataElement.optionSet.id].options, processedValue)
                        }

                        processedValue = processedValue === "true" ? true : processedValue;
                        processedValue = processedValue === "false" ? false : processedValue;

                        currentEvent[effect.dataElement.id] = processedValue;
                        assignedFields[effect.dataElement.id] = true;
                    }
                    else if (effect.action === "SETMANDATORYFIELD" && effect.dataElement) {
                        mandatoryFields[effect.dataElement.id] = effect.ineffect;
                    }
                    else if(effect.action === "HIDEOPTION"){
                        if(effect.ineffect && effect.dataElement && effect.option){
                            if(!optionVisibility[effect.dataElement.id]) optionVisibility[effect.dataElement.id] = { hidden: {}};
                            if(!optionVisibility[effect.dataElement.id].hidden) optionVisibility[effect.dataElement.id].hidden = {};
                            optionVisibility[effect.dataElement.id].hidden[effect.option.id] = effect.ineffect;
                            if(dataElementOptionsChanged.indexOf(effect.dataElement.id) === -1) dataElementOptionsChanged.push(effect.dataElement.id);
                        }
                    }
                    else if(effect.action === "SHOWOPTIONGROUP"){
                        if(effect.ineffect && effect.dataElement && effect.optionGroup){
                            if(!optionVisibility[effect.dataElement.id]) optionVisibility[effect.dataElement.id] = { hidden: {}};
                            var optionGroup = optionGroupsById[effect.optionGroup.id];
                            if(optionGroup){
                                if(!optionVisibility[effect.dataElement.id].showOnly) optionVisibility[effect.dataElement.id].showOnly = {};
                                angular.extend(optionVisibility[effect.dataElement.id].showOnly, optionGroup.optionsById);
                                if(dataElementOptionsChanged.indexOf(effect.dataElement.id) === -1) dataElementOptionsChanged.push(effect.dataElement.id);
                            }else{
                                $log.warn("OptionGroup "+effect.optionGroup.id+" was not found");
                            }

                        }
                    }
                    else if(effect.action === "HIDEOPTIONGROUP"){
                        if(effect.ineffect && effect.dataElement && effect.optionGroup){
                            if(!optionVisibility[effect.dataElement.id]) optionVisibility[effect.dataElement.id] = { hidden: {}};
                            var optionGroup = optionGroupsById[effect.optionGroup.id];
                            if(optionGroup){
                                angular.extend(optionVisibility[effect.dataElement.id].hidden, optionGroup.optionsById);
                                if(dataElementOptionsChanged.indexOf(effect.dataElement.id) === -1) dataElementOptionsChanged.push(effect.dataElement.id);
                            }else{
                                $log.warn("OptionGroup "+effect.optionGroup.id+" was not found");
                            }
                        }
                    }
                }
            });
            clearDataElementValueForShowHideOptionActions(dataElementOptionsChanged, currentEvent,optionVisibility,prStDes,optionSets);
            return {currentEvent: currentEvent, hiddenFields: hiddenFields, hiddenSections: hiddenSections, warningMessages: warningMessages, assignedFields: assignedFields, mandatoryFields: mandatoryFields, optionVisibility: optionVisibility};
        },
        processRuleEffectAttribute: function(context, selectedTei, tei, currentEvent, currentEventOriginialValue, affectedEvent, attributesById, prStDes,optionSets,optionGroupsById){
            //Function used from registration controller to process effects for the tracked entity instance and for the events in the same operation
            var teiAttributesEffects = this.processRuleEffectsForTrackedEntityAttributes(context, selectedTei, tei, attributesById, optionSets,optionGroupsById);
            teiAttributesEffects.selectedTei = teiAttributesEffects.currentTei;
            
            if(context === "SINGLE_EVENT" && currentEvent && prStDes ) {
                var eventEffects = this.processRuleEffectsForEvent("SINGLE_EVENT", currentEvent, currentEventOriginialValue, prStDes, optionSets,optionGroupsById);
                teiAttributesEffects.warningMessages = angular.extend(teiAttributesEffects.warningMessages,eventEffects.warningMessages);
                teiAttributesEffects.hiddenFields[context] = eventEffects.hiddenFields;
                teiAttributesEffects.hiddenSections[context] = eventEffects.hiddenSections;
                teiAttributesEffects.assignedFields[context] = eventEffects.assignedFields;
                teiAttributesEffects.mandatoryFields[context] = eventEffects.mandatoryFields;
                teiAttributesEffects.optionVisibility[context] = eventEffects.optionVisibility;
                teiAttributesEffects.currentEvent = eventEffects.currentEvent;
            }
            
            return teiAttributesEffects;
        }
    };
})

/* service for dealing with events */
.service('DHIS2EventService', function(DateUtils){
    return {
        //for simplicity of grid display, events were changed from
        //event.datavalues = [{dataElement: dataElement, value: value}] to
        //event[dataElement] = value
        //now they are changed back for the purpose of storage.
        reconstructEvent: function(event, programStageDataElements){
            var e = {};

            e.event         = event.event;
            e.status        = event.status;
            e.program       = event.program;
            e.programStage  = event.programStage;
            e.orgUnit       = event.orgUnit;
            e.eventDate     = event.eventDate;

            var dvs = [];
            angular.forEach(programStageDataElements, function(prStDe){
                if(event.hasOwnProperty(prStDe.dataElement.id)){
                    dvs.push({dataElement: prStDe.dataElement.id, value: event[prStDe.dataElement.id]});
                }
            });

            e.dataValues = dvs;

            if(event.coordinate){
                e.coordinate = {latitude: event.coordinate.latitude ? event.coordinate.latitude : '',
                    longitude: event.coordinate.longitude ? event.coordinate.longitude : ''};
            }

            return e;
        },
        refreshList: function(eventList, currentEvent){
            if(!eventList || !eventList.length){
                return;
            }
            var continueLoop = true;
            for(var i=0; i< eventList.length && continueLoop; i++){
                if(eventList[i].event === currentEvent.event ){
                    eventList[i] = currentEvent;
                    continueLoop = false;
                }
            }
            return eventList;
        },
        getEventExpiryStatus : function (event, program, selectedOrgUnit) {
            var completedDate, today, daysAfterCompletion;

            if ((event.orgUnit !== selectedOrgUnit) || ( program.completeEventsExpiryDays === 0) ||
                !event.status) {
                return false;
            }

            completedDate = moment(event.completedDate,'YYYY-MM-DD');
            today = moment(DateUtils.getToday(),'YYYY-MM-DD');
            daysAfterCompletion = today.diff(completedDate, 'days');
            if (daysAfterCompletion < program.completeEventsExpiryDays) {
                return false;
            }
            return true;
        }
    };
})

/* current selections */
.service('CurrentSelection', function(){
    this.currentSelection = {};
    this.relationshipInfo = {};
    this.optionSets = null;
    this.attributesById = null;
    this.ouLevels = null;
    this.sortedTeiIds = [];
    this.selectedTeiEvents = null;
    this.relationshipOwner = {};
    this.selectedTeiEvents = [];
    this.fileNames = {};
    this.orgUnitNames = {};
    this.frontPageData = {};
    this.location = null;
    this.advancedSearchOptions = null;
    this.frontPageData = null;
    this.trackedEntityTypes = null;
    this.optionGroupsById = null;

    this.set = function(currentSelection){
        this.currentSelection = currentSelection;
    };
    this.get = function(){
        return this.currentSelection;
    };

    this.setRelationshipInfo = function(relationshipInfo){
        this.relationshipInfo = relationshipInfo;
    };
    this.getRelationshipInfo = function(){
        return this.relationshipInfo;
    };

    this.setOptionSets = function(optionSets){
        this.optionSets = optionSets;
    };
    this.getOptionSets = function(){
        return this.optionSets;
    };

    this.setAttributesById = function(attributesById){
        this.attributesById = attributesById;
    };
    this.getAttributesById = function(){
        return this.attributesById;
    };

    this.setOuLevels = function(ouLevels){
        this.ouLevels = ouLevels;
    };
    this.getOuLevels = function(){
        return this.ouLevels;
    };

    this.setSortedTeiIds = function(sortedTeiIds){
        this.sortedTeiIds = sortedTeiIds;
    };
    this.getSortedTeiIds = function(){
        return this.sortedTeiIds;
    };

    this.setSelectedTeiEvents = function(selectedTeiEvents){
        this.selectedTeiEvents = selectedTeiEvents;
    };
    this.getSelectedTeiEvents = function(){
        return this.selectedTeiEvents;
    };

    this.setRelationshipOwner = function(relationshipOwner){
        this.relationshipOwner = relationshipOwner;
    };
    this.getRelationshipOwner = function(){
        return this.relationshipOwner;
    };

    this.setFileNames = function(fileNames){
        this.fileNames = fileNames;
    };
    this.getFileNames = function(){
        return this.fileNames;
    };
    
    this.setOrgUnitNames = function(orgUnitNames){
        this.orgUnitNames = orgUnitNames;
    };
    this.getOrgUnitNames = function(){
        return this.orgUnitNames;
    };
    
    this.setLocation = function(location){
        this.location = location;
    };
    this.getLocation = function(){
        return this.location;
    };
    this.setTrackedEntityTypes = function (trackedEntityTypes) {
        this.trackedEntityTypes = trackedEntityTypes;
        if(this.frontPageData && this.frontPageData.trackedEntityList){
            this.frontPageData.trackedEntityList.data = this.trackedEntityTypes;
        }
    };
    this.getTrackedEntityTypes = function () {
        return this.trackedEntityTypes;
    };

    this.setFrontPageData = function(frontPageData){
        this.frontPageData = frontPageData;
        if(this.frontPageData && this.frontPageData.trackedEntityList && this.frontPageData.trackedEntityList.data){
            this.setTrackedEntityTypes(this.frontPageData.trackedEntityList.data);
        }
    }
    this.getFrontPageData = function(){
        return this.frontPageData;
    }
    this.setFrontPageRefresh = function(refresh){
        if(this.frontPageData && this.frontPageData.trackedEntityList){
            this.frontPageData.trackedEntityList.refresh = refresh;
        }
    }

    this.getOptionGroupsById = function(){
        return this.optionGroupsById;
    }

    this.setOptionGroupsById = function(optionGroupsById){
        this.optionGroupsById = optionGroupsById;
    }
})

.service('AuditHistoryDataService', function( $http, $translate, NotificationService, DHIS2URL ) {
    this.getAuditHistoryData = function(dataId, dataType ) {
        var url="";
        if (dataType === "attribute") {
            url="/audits/trackedEntityAttributeValue?tei="+dataId+"&skipPaging=true";
            
        } else {
            url="/audits/trackedEntityDataValue?psi="+dataId+"&skipPaging=true";
        }

        var promise = $http.get(DHIS2URL + url).then(function( response ) {
            return response.data;
        }, function( response ) {
            if( response && response.data && response.data.status === 'ERROR' ) {
                var headerText = response.data.status;
                var bodyText = response.data.message ? response.data.message : $translate.instant('unable_to_fetch_data_from_server');
                NotificationService.showNotifcationDialog(headerText, bodyText);
            }
        });
        return promise;
    }
})



/* Factory for fetching OrgUnit */
.factory('OrgUnitFactory', function($http, DHIS2URL, $q, $window, $translate, SessionStorageService, DateUtils, CurrentSelection) {
    var orgUnit, orgUnitPromise, rootOrgUnitPromise,orgUnitTreePromise;
    var indexedDB = $window.indexedDB;
    var db = null;
    function openStore(){
        var deferred = $q.defer();
        var request = indexedDB.open("dhis2ou");

        request.onsuccess = function(e) {
            db = e.target.result;
            deferred.resolve();
        };

        request.onerror = function(){
            deferred.reject();
        };

        return deferred.promise;
    }
    return {
        getChildren: function(uid){
            if( orgUnit !== uid ){
                orgUnitPromise = $http.get( DHIS2URL + '/organisationUnits/'+ uid + '.json?fields=id,path,programs[id],level,children[id,displayName,programs[id],level,children[id]]&paging=false' ).then(function(response){
                    orgUnit = uid;
                    return response.data;
                });
            }
            return orgUnitPromise;
        },
        get: function(uid){
            if( orgUnit !== uid ){
                orgUnitPromise = $http.get( DHIS2URL + '/organisationUnits/'+ uid + '.json?fields=id,displayName,programs[id],level,path' ).then(function(response){
                    orgUnit = uid;
                    return response.data;
                });
            }
            return orgUnitPromise;
        },
        getByName: function(name){            
            var promise = $http.get( DHIS2URL + '/organisationUnits.json?paging=false&fields=id,displayName,path,level,children[id,displayName,path,level,children[id]]&filter=displayName:ilike:' + name ).then(function(response){
                return response.data;
            });
            return promise;        
        },
        getViewTreeRoot: function(){
            var def = $q.defer();            
            var settings = SessionStorageService.get('USER_PROFILE');            
            if( settings && settings.organisationUnits ){
                var ous = {};
                ous.organisationUnits = settings && settings.dataViewOrganisationUnits && settings.dataViewOrganisationUnits.length > 0 ? settings.dataViewOrganisationUnits : settings && settings.organisationUnits ? settings.organisationUnits : [];                
                def.resolve( ous );
            }
            else{
                var url = DHIS2URL + '/me.json?fields=organisationUnits[id,displayName,level,path,children[id,displayName,level,children[id]]],dataViewOrganisationUnits[id,displayName,level,path,children[id,displayName,level,children[id]]]&paging=false';
                $http.get( url ).then(function(response){
                    response.data.organisationUnits = response.data.dataViewOrganisationUnits && response.data.dataViewOrganisationUnits.length > 0 ? response.data.dataViewOrganisationUnits : response.data.organisationUnits;
                    delete response.data.dataViewOrganisationUnits;
                    def.resolve( response.data );
                });
            }            
            return def.promise;
        },
        getSearchTreeRoot: function(){
            var def = $q.defer();            
            var settings = SessionStorageService.get('USER_PROFILE');            
            if( settings && settings.organisationUnits ){
                var ous = {};
                ous.organisationUnits = settings && settings.teiSearchOrganisationUnits && settings.teiSearchOrganisationUnits.length > 0 ? settings.teiSearchOrganisationUnits : settings && settings.organisationUnits ? settings.organisationUnits : [];
                def.resolve( ous );
            }
            else{
                var url = DHIS2URL + '/me.json?fields=organisationUnits[id,displayName,programs[id],level,path,children[id,displayName,programs[id],level,children[id]]],teiSearchOrganisationUnits[id,displayName,programs[id],level,path,children[id,displayName,programs[id],level,children[id]]]&paging=false';
                $http.get( url ).then(function(response){
                    response.data.organisationUnits = response.data.teiSearchOrganisationUnits && response.data.teiSearchOrganisationUnits.length > 0 ? response.data.teiSearchOrganisationUnits : response.data.organisationUnits;
                    delete response.data.teiSearchOrganisationUnits;
                    def.resolve( response.data );
                });
            }            
            return def.promise;
        },
        getOrgUnits: function(uid,fieldUrl){
            var url = DHIS2URL + '/organisationUnits.json?filter=id:eq:'+uid+'&'+fieldUrl+'&paging=false';
            orgUnitTreePromise = $http.get(url).then(function(response){
                return response.data;
            });
            return orgUnitTreePromise;
        },
        getOrgUnit: function(uid) {
            var def = $q.defer();
            var selectedOrgUnit = CurrentSelection.get()["orgUnit"];//SessionStorageService.get('SELECTED_OU');
            if (selectedOrgUnit && selectedOrgUnit.id === uid ) {
                def.resolve( selectedOrgUnit );
            }
            else if(uid){
                this.get(uid).then(function (response) {
                    def.resolve( response ? response : null );
                });
            }
            else {
                def.resolve(null);
            }
            return def.promise;
        },
        getOrgUnitReportDateRange: function(orgUnit) {
            var reportDateRange = { maxDate: DateUtils.getToday(), minDate: ''};
            var cdate = orgUnit.cdate ? orgUnit.cdate : orgUnit.closedDate ? DateUtils.getDateFromUTCString(orgUnit.closedDate) : null;
            var odate = orgUnit.odate ? orgUnit.odate : orgUnit.openingDate ? DateUtils.getDateFromUTCString(orgUnit.openingDate) : null;
            if (odate) {
                /*If the orgunit has an opening date, then it is taken as the min-date otherwise the min-date is open*/
                reportDateRange.minDate = DateUtils.formatFromApiToUser(odate);
            }
            if (cdate) {
                /*If closed date of the org-unit is later than today then today's date is taken as the max-date otherwise
                * the closed date of the org-unit is taken as the max-date*/
                if (DateUtils.isBeforeToday(cdate)) {
                    reportDateRange.maxDate = DateUtils.formatFromApiToUser(cdate);
                }
            }
            return reportDateRange;
        },
        getFromStoreOrServer: function(uid){
            var deferred = $q.defer();
            var orgUnitFactory = this;
            if (db === null) {
                openStore().then(getOu, function () {
                    deferred.reject("DB not opened");
                });
            }
            else {                
                getOu();                
            }

            function getOu() {
                var tx = db.transaction(["ou"]);
                var store = tx.objectStore("ou");
                var query = store.get(uid);

                query.onsuccess = function(e){
                    if(e.target.result){
                        e.target.result.closedStatus = getOrgUnitClosedStatus(e.target.result);
                        e.target.result.reportDateRange = orgUnitFactory.getOrgUnitReportDateRange(e.target.result);
                        e.target.result.id = uid;
                        e.target.result.displayName = e.target.result.n;
                        delete(e.target.result.n);
                        deferred.resolve(e.target.result);
                    }
                    else{
                        var t = db.transaction(["ouPartial"]);
                        var s = t.objectStore("ouPartial");
                        var q = s.get(uid);
                        q.onsuccess = function(e){
                            if( e.target.result ){
                                e.target.result.closedStatus = getOrgUnitClosedStatus(e.target.result);
                                e.target.result.reportDateRange = orgUnitFactory.getOrgUnitReportDateRange(e.target.result);
                                e.target.result.id = uid;
                                e.target.result.displayName = e.target.result.n;
                                delete(e.target.result.n);
                                deferred.resolve(e.target.result);
                            }
                            else{
                                $http.get( DHIS2URL + '/organisationUnits/'+ uid + '.json?fields=id,displayName,code,closedDate,openingDate,organisationUnitGroups[id,code,name]' ).then(function(response){
                                    if( response && response.data ){
                                        deferred.resolve({
                                            id: response.data.id,
                                            displayName: response.data.displayName,
                                            cdate: response.data.closedDate,
                                            odate: response.data.openingDate,
                                            code: response.data.code,
                                            closedStatus: getOrgUnitClosedStatus(response.data),
                                            reportDateRange: orgUnitFactory.getOrgUnitReportDateRange(response.data),
                                            g: response.data.organisationUnitGroups
                                        });
                                    }
                                });
                            }
                        };
                        q.onerror = function(e){                            
                            deferred.reject();
                        };
                    }
                };
                query.onerror = function(e){
                    deferred.reject();
                };
            }



            function getOrgUnitClosedStatus(ou){
                var closed = false;
                if( ou ){
                    if( ou.cdate ){
                        closed = DateUtils.isBeforeToday( ou.cdate ) ? true : false;
                    }
                    if(!closed && ou.odate ){
                        closed = DateUtils.isAfterToday( ou.odate ) ? true : false;
                    }
                }
                if(closed) {
                    setHeaderDelayMessage($translate.instant("orgunit_closed"));
                } else {
                    hideHeaderMessage();
                }
                return closed;
            }
            return deferred.promise;
        }
    };
})
.service('UserDataStoreService', function ($http, $q, DHIS2URL, $translate, SessionStorageService, NotificationService) {
    var baseUrl = DHIS2URL+'/userDataStore';
    var cached = {};
    var getUrl = function(container, name){
        return baseUrl + "/" + container + "/" + name;
    }

    var setCached = function(container, name, data){
        if(!cached[container]) cached[container] = {};
        cached[container][name] = data;
    }
    return {
        set: function (data, container, name) {
            var deferred = $q.defer();
            var httpMessage = {
                method: "put",
                url: getUrl(container, name),
                data: data,
                headers: {'Content-Type': 'application/json;charset=UTF-8'}
            };

            $http(httpMessage).then(function (response) {
                setCached(data);
                deferred.resolve(response.data);
            },function (error) {
                httpMessage.method = "post";
                $http(httpMessage).then(function (response) {
                    setCached(data);
                    deferred.resolve(response.data);
                }, function (error) {
                    if (error && error.data) {
                        deferred.reject(error.data);
                    } else {
                        deferred.reject(null);
                    }
                });
            });
            return deferred.promise;
        },
        get: function (container, name) {
            var deferred = $q.defer();

            if(cached[container] && angular.isDefined(cached[container][name])){
                deferred.resolve(cached[container][name]);
            }else{
                $http.get(getUrl(container,name)).then(function (response) {
                    if (response && response.data) {
                        setCached(container, name, response.data);
                        deferred.resolve(response.data);
                    } else {
                        deferred.resolve(null);
                    }
                }, function (error) {
                    setCached(container,name, null);
                    deferred.resolve(null);
                });
                
            }

            return deferred.promise;
        }
    };
})
.factory("AttributeUtils", function($http,DHIS2URL){
    var getValueUrl = function(valueToSet, selectedTei, program, orgUnit, required){
        var valueUrlBase = valueToSet+"=";
        var valueUrl = null;
        switch(valueToSet){
            case "ORG_UNIT_CODE":
                if(orgUnit && orgUnit.code) valueUrl = valueUrlBase+orgUnit.code;
                break;
            default:
                return null;
        }
        if(required && !valueUrl) throw "value "+valueToSet+ "not found";
        return valueUrl;
    }
    return {
        generateUniqueValue: function(attribute, selectedTei, program, orgUnit) {
            var getValueUrl = function(valueToSet, selectedTei, program, orgUnit, required){
                var valueUrlBase = valueToSet+"=";
                var valueUrl = null;
                switch(valueToSet){
                    case "ORG_UNIT_CODE":
                        if(orgUnit && orgUnit.code) valueUrl = valueUrlBase+orgUnit.code;
                        break;
                    default:
                        return null;
                }
                if(required && !valueUrl) throw "value "+valueToSet+ "not found";
                return valueUrl;
            }
    
            return $http.get(DHIS2URL + '/trackedEntityAttributes/'+attribute+'/requiredValues').then(function(response){
                var paramsUrl = "?";
                if(response && response.data){
                    if(response.data.REQUIRED){
                        angular.forEach(response.data.REQUIRED, function(requiredValue){
                            var valueUrl = getValueUrl(requiredValue, selectedTei, program, orgUnit,true);
                            paramsUrl+="&"+valueUrl;
                        });
                    }
                    if(response.data.OPTIONAL){
                        angular.forEach(response.data.OPTIONAL, function(optionalValue){
                            var valueUrl = getValueUrl(optionalValue, selectedTei, program, orgUnit,false);
                            if(valueUrl) paramsUrl += "&"+valueUrl;
                        });
                    }
                }
                if(paramsUrl.length >= 2 && paramsUrl.charAt(1) === "&") paramsUrl = paramsUrl.slice(0,1)+paramsUrl.slice(2);
                return $http.get(DHIS2URL + '/trackedEntityAttributes/' + attribute + '/generate'+paramsUrl).then(function (response) {
                    if (response && response.data && response.data.value) {
                        return response.data.value;
                    }
                    return null;
                }, function (response) {
                    return response.data;
                });
            });
        }
    }

});
