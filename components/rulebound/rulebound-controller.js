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
                RuleBoundFactory,
                CurrentSelection) {


    $scope.availableTopBarFields = [];

    $scope.widget = $rootScope.getCurrentWidget($scope);

    $scope.widgetTitle = $scope.widget.title;
    $scope.emptyFeedbackListLabel = $translate.instant('no_feedback_exist');
    $scope.emptyIndicatorListLabel = $translate.instant('no_indicators_exist');
    

    $scope.lastEventUpdated = null;
    $scope.widgetTitleLabel = $translate.instant($scope.widgetTitle);
    
    $scope.displayTextEffects = [];
    $scope.displayKeyDataEffects = [];
    
    var currentEventId = null;

    var selections = {};

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
        setOrderedData(RuleBoundFactory.getDisplayEffects($scope.data, args.event, $rootScope.ruleeffects, $scope.widgetTitle));
    });

    $scope.$on('dataEntryEventChanged', function(event,args){
        if(currentEventId !== args.event){
            currentEventId = args.event;
            setOrderedData(RuleBoundFactory.getDisplayEffects($scope.data,currentEventId, $rootScope.ruleeffects, $scope.widgetTitle));
        }
        
    });

    var setOrderedData = function(data) {
        $scope.displayTextEffects = [];
        $scope.displayKeyDataEffects = [];

        angular.forEach(Object.keys(data.displayKeyDataEffects), function(key){
            if(data.displayKeyDataEffects[key].ineffect) {
                $scope.displayKeyDataEffects.push({title: data.displayKeyDataEffects[key].content, value:data.displayKeyDataEffects[key].data});
            }
        });

        angular.forEach(Object.keys(data.displayTextEffects), function(key){
            if(data.displayTextEffects[key].ineffect) {
                $scope.displayTextEffects.push({title: data.displayTextEffects[key].content, value:data.displayTextEffects[key].data});
            }
        });
    }
});
