/* global angular, trackerCapture */

var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('RuleBoundController',
        function(
                $rootScope,
                $scope,
                $translate,
                $log,
                $attrs,
                MetaDataFactory,
                CurrentSelection) {



    /*$scope.$watch('widget.useAsTopBar', function(event, args){
        listenToBroadCast();
    });*/

    /*$scope.widget = $rootScope.getWidget("profile");
    $scope.widget.getTopBarFields = function(){
        var fields = [];
        angular.forEach($scope.selectedTei.attributes, function(attr)
        {
            fields.push({ name: attr.displayName, id: attr.attribute});
        });
        return fields;
    };*/
    $scope.availableTopBarFields = [];

    $scope.widget = $rootScope.getCurrentWidget($scope);

    $scope.widgetTitle = null;
    if($scope.widget){
        $scope.widget.getTopBarFields = function(){
            return $scope.availableTopBarFields;
        };
        $scope.widgetTitle = $scope.widget.title;
    }
    $scope.emptyFeedbackListLabel = $translate.instant('no_feedback_exist');
    $scope.emptyIndicatorListLabel = $translate.instant('no_indicators_exist');
    

    $scope.lastEventUpdated = null;
    $scope.widgetTitleLabel = $translate.instant($scope.widgetTitle);
    
    $scope.displayTextEffects = {};
    $scope.displayKeyDataEffects = {};

    var selections = {};

    $scope.topBarFilter = function(field){
        if($scope.widget && $scope.widget.topBarFields && $scope.widget.topBarFields[field.id] && $scope.widget.topBarFields[field.id].show){
            var item = $scope.displayTextEffects[field.id] ? $scope.displayTextEffects[field.id] : $scope.displayKeyDataEffects[field.id];
            if(item) return item.ineffect;
        }
        return false;
    }
    $scope.topBarOrder = function(field){
        return $scope.widget.topBarFields[field.id].order;
    }


    $scope.$on('dashboardWidgets', function(event, args) {    
        loadAvailableFields();
    });

    $scope.$watch('widget.useAsTopBar', function(event, args){
        loadAvailableFields();
        updateEffects($rootScope.lastEventUpdated);
    });

    var loadAvailableFields = function(){
        selections = CurrentSelection.get();
        $scope.selectedProgram = selections.pr;
        MetaDataFactory.getByProgram("programRules", $scope.selectedProgram.id).then(function(rules){
            var fields = [];
            angular.forEach(rules, function(rule){
                if(rule.programRuleActions){
                    angular.forEach(rule.programRuleActions, function(action){
                        if(action.location && action.location === $scope.widgetTitle && (action.programRuleActionType === 'DISPLAYTEXT' || action.programRuleActionType === 'DISPLAYKEYVALUEPAIR')){
                            fields.push({ id: action.id, name: action.content});
                        }
                    });
                }
            });
            $scope.availableTopBarFields = fields;
        });
    }

        //listen for updated rule effects
    $scope.$on('ruleeffectsupdated', function(event, args) {
        updateEffects(args.event);
    });
    
    var updateEffects = function(event)
    {
        var textInEffect = false;
        var keyDataInEffect = false;
        
        if(event === 'registration') return;

        //In case the 
        if($scope.lastEventUpdated !== event) {
            $scope.displayTextEffects = {};
            $scope.displayKeyDataEffects = {};
            $scope.lastEventUpdated = $rootScope.lastEventUpdated = event;
        }
        
        if($rootScope.ruleeffects && $rootScope.ruleeffects[event]){
            angular.forEach($rootScope.ruleeffects[event], function(effect) {
                var g= 1;
                var u = g+1;
                if(effect.location === $scope.widgetTitle){
                    //This effect is affecting the local widget
                    
                    //Round data to two decimals if it is a number:
                    if(dhis2.validation.isNumber(effect.data)){
                        effect.data = Math.round(effect.data*100)/100;
                    }
                    
                    if(effect.action === "DISPLAYTEXT") {
                        //this action is display text. Make sure the displaytext is
                        //added to the local list of displayed texts
                        if(!angular.isObject($scope.displayTextEffects[effect.id])){
                            $scope.displayTextEffects[effect.id] = effect;
                        }
                        if(effect.ineffect)
                        {
                            textInEffect = true;
                        }
                    }
                    else if(effect.action === "DISPLAYKEYVALUEPAIR") {                    
                        //this action is display text. Make sure the displaytext is
                        //added to the local list of displayed texts
                        if(!angular.isObject($scope.displayTextEffects[effect.id])){
                            $scope.displayKeyDataEffects[effect.id] = effect;
                        }
                        if(effect.ineffect)
                        {
                            keyDataInEffect = true;
                        }
                    }
                    else if(effect.action === "ASSIGN") {
                        //the dataentry control saves the variable and or dataelement
                    }
                    else {
                        $log.warn("action: '" + effect.action + "' not supported by rulebound-controller.js");
                    }
                }
            });
        }
        
        
        $scope.showKeyDataSection = keyDataInEffect;
        $scope.showTextSection = textInEffect;   

    } 
});
