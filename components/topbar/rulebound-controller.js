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
    
    $scope.displayTextEffects = {};
    $scope.displayKeyDataEffects = {};

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
        if( args.event !== 'registration' ) {
            $scope.data = RuleBoundFactory.getDisplayEffects($scope.data, args.event, $rootScope.ruleeffects, $scope.widgetTitle);
        }
    });
});
