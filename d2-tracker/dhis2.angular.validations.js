angular.module("d2Directives")
.directive('d2NumberValidator', function() {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function (scope, element, attrs, ngModel) {
            
            function setValidity(numberType, isRequired){
                if(numberType === 'NUMBER'){
                    ngModel.$validators.number = function(value) {
                    	value = value === 0 ? value.toString(): value; 
                        return value === 'null' || !value ? !isRequired : dhis2.validation.isNumber(value);
                    };
                }
                else if(numberType === 'INTEGER_POSITIVE'){
                    ngModel.$validators.posInt = function(value) {
                    	value = value === 0 ? value.toString(): value; 
                        return value === 'null' || !value ? !isRequired : dhis2.validation.isPositiveInt(value);
                    };
                }
                else if(numberType === 'INTEGER_NEGATIVE'){
                    ngModel.$validators.negInt = function(value) {
                    	value = value === 0 ? value.toString(): value;
                        return value === 'null' || !value ? !isRequired : dhis2.validation.isNegativeInt(value);
                    };
                }
                else if(numberType === 'INTEGER_ZERO_OR_POSITIVE'){
                    ngModel.$validators.zeroPositiveInt = function(value) {
                    	value = value === 0 ? value.toString(): value; 
                        return value === 'null' || !value ? !isRequired : dhis2.validation.isZeroOrPositiveInt(value);
                    };
                }
                else if(numberType === 'INTEGER'){
                    ngModel.$validators.integer = function(value) {
                    	value = value === 0 ? value.toString(): value;
                        return value === 'null' || !value ? !isRequired : dhis2.validation.isInt(value);
                    };
                }
                if(numberType === 'PERCENTAGE'){
                    ngModel.$validators.percentValue = function(value) {
                        if (value < 0 || value > 100) {
                            return false;
                        }
                        value = value === 0 ? value.toString(): value;
                        return value === 'null' || !value ? !isRequired : dhis2.validation.isNumber(value);
                    };
                }
            }

            var numberType = attrs.numberType;
            var isRequired = attrs.ngRequired === 'true';            
            setValidity(numberType, isRequired);
        }
    };
})

.directive("d2DateValidator", function(DateUtils, CalendarService, $parse) {
    return {
        restrict: "A",         
        require: "ngModel",         
        link: function(scope, element, attrs, ngModel) {
        	
            var calendarSetting = CalendarService.getSetting();
            var isRequired = attrs.ngRequired === 'true';
        	
            ngModel.$validators.dateValidator = function(value) {
                if(!value){
                    return !isRequired;
                }                
                var convertedDate = DateUtils.format(angular.copy(value));
                var isValid = value === convertedDate;
                return isValid;
            };
            
            ngModel.$validators.futureDateValidator = function(value) {
                if(!value){
                    return !isRequired;
                }
                var maxDate = $parse(attrs.maxDate)(scope);
                var convertedDate = DateUtils.format(angular.copy(value));
                var isValid = value === convertedDate;
                if(isValid){
                    isValid = maxDate === 0 ? !moment(convertedDate, calendarSetting.momentFormat).isAfter(moment(DateUtils.getToday(), calendarSetting.momentFormat)) : isValid;
                }
                return isValid;
            };
        }
    };
})

.directive("d2TimeValidator", function() {
    return {
        restrict: "A",         
        require: "ngModel",         
        link: function(scope, element, attrs, ngModel) {        	
           
            var isRequired = attrs.ngRequired === 'true';
        	
            ngModel.$validators.timeValidator = function(value) {
                if(!value){
                    return !isRequired;
                }
                return /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(value);                
            };
        }
    };
})

.directive("d2TimeAmPmValidator", function() {
    return {
        restrict: "A",         
        require: "ngModel",         
        link: function(scope, element, attrs, ngModel) {        	
           
            var isRequired = attrs.ngRequired === 'true';

            ngModel.$validators.timeValidator = function(value) {
                if(!value){
                    return !isRequired;
                }
                return /^(0[1-9]|1[0-2]):[0-5][0-9]$/.test(value);                
            };
        }
    };
})

.directive("d2UrlValidator", function() {
    return {
        restrict: "A",         
        require: "ngModel",         
        link: function(scope, element, attrs, ngModel) {
        	
            var isRequired = attrs.ngRequired === 'true';
        	
            ngModel.$validators.urlValidator = function(value) {
                if(!value){
                    return !isRequired;
                }
                if(value.match(/^(http|https):\/\/[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,6}(:[0-9]{1,5})?(\/.*)?$/)) {
                    return true;
                }
                return false;
            };
        }
    };
})

.directive("d2CustomCoordinateValidator", function() {
    return {
        restrict: "A",         
        require: "ngModel",         
        link: function(scope, element, attrs, ngModel) {
            
            var isRequired = attrs.ngRequired === 'true';
            
            ngModel.$validators.customCoordinateValidator = function(value) {
                if(!value){
                    return !isRequired;
                }
                
                var coordinate = value.split(",");
                
                if( !coordinate || coordinate.length !== 2 ){
                    return false;
                }

                if( !dhis2.validation.isNumber(coordinate[0]) ){
                    return false;
                }
                
                if( !dhis2.validation.isNumber(coordinate[1]) ){
                    return false;
                }
                
                return coordinate[0] >= -180 && coordinate[0] <= 180 && coordinate[1] >= -90 && coordinate[1] <= 90;
            };           
        }
    };
})

.directive("d2CoordinateValidator", function() {
    return {
        restrict: "A",         
        require: "ngModel",         
        link: function(scope, element, attrs, ngModel) {
            
            var isRequired = attrs.ngRequired === 'true';
            
            if(attrs.name === 'latitude'){
                ngModel.$validators.latitudeValidator = function(value) {
                    if(!value){
                        return !isRequired;
                    }

                    if(!dhis2.validation.isNumber(value)){
                        return false;
                    }
                    return value >= -90 && value <= 90;
                };
            }
            
            if(attrs.name === 'longitude'){
                ngModel.$validators.longitudeValidator = function(value) {
                    if(!value){
                        return !isRequired;
                    }

                    if(!dhis2.validation.isNumber(value)){
                        return false;
                    }
                    return value >= -180 && value <= 180;
                };
            }            
        }
    };
})

.directive("d2OptionValidator", function($translate, NotificationService) {
    return {
        restrict: "A",         
        require: "ngModel",         
        link: function(scope, element, attrs, ngModel) {
        	
            var isRequired = attrs.ngRequired === 'true';
            
            ngModel.$validators.optionValidator = function(value) {               
                
                var res = !value ? !isRequired : true;
                
                if(!res){
                    var headerText = $translate.instant("validation_error");
                    var bodyText = $translate.instant("option_required");
                    NotificationService.showNotifcationDialog(headerText, bodyText);
                }
                return res;
            };
        }
    };
})

.directive("d2AttributeValidator", function($q, TEIService, SessionStorageService) {
    return {
        restrict: "A",         
        require: "ngModel",
        link: function(scope, element, attrs, ngModel) {            
            
            function uniqunessValidatior(attributeData){
                element.on('blur', function() {
                    var deferred = $q.defer(), currentValue = ngModel.$modelValue, programOrTetUrl = null, ouMode = 'ACCESSIBLE';
                    
                    if (currentValue) {
                        
                        attributeData.value = currentValue;                        
                        var attUrl = 'filter=' + attributeData.id + ':EQ:' + attributeData.value;
                        var ouId = SessionStorageService.get('ouSelected');
                        
                        if(attrs.selectedProgramId){
                            programOrTetUrl = 'program=' + attrs.selectedProgramId;
                        }else{
                            programOrTetUrl = "trackedEntityType="+attrs.selectedTet;
                        }
                        
                        if(attributeData.orgunitScope){
                            ouMode = 'SELECTED';
                        }                        

                        TEIService.search(ouId, ouMode, null, programOrTetUrl, attUrl, null, false).then(function(data) {
                            if(attrs.selectedTeiId){
                                if(data && data.rows && data.rows.length && data.rows[0] && data.rows[0].length && data.rows[0][0] !== attrs.selectedTeiId){
                                    ngModel.$setValidity('uniqunessValidator', false);
                                    return;
                                }
                            }
                            else{
                                if (data.rows.length > 0) {    
                                    ngModel.$setValidity('uniqunessValidator', false);
                                    return 
                                    ;
                                }
                            }                            
                            ngModel.$setValidity('uniqunessValidator', true);
                        }).catch(function(){
                            ngModel.$setValidity('uniqunessValidator', false);
                        });
                    }
                });
            }                    
            
            scope.$watch(attrs.ngDisabled, function(value){
                var attributeData = scope.$eval(attrs.attributeData);
                if(!value){
                    if( attributeData && attributeData.unique && !value ){
                        uniqunessValidatior(attributeData);
                    }
                }              
            });     
        }
    };
});