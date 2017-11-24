/* global angular, trackerCapture */

var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('TopBarController',
        function(
                $rootScope,
                $scope,
                $translate,
                $log,
                $modal,
                RuleBoundFactory,
                MetaDataFactory,
                CurrentSelection) {

    
    var feedbackFieldSelection = {};
    var indicatorsFieldSelection = {};
    var attributesFieldSelection = {};

    var feedbackTextEffectValues = {};
    var feedbackKeyDataEffectValues = {};
    var indicatorsTextEffectValues = {};
    var indicatorsKeyDataEffectValues= {};
    var attributesValues = {};
    
    $scope.topBarConfig = $scope.topBarConfig;
    $scope.topBarConfig.openSettings = function(){

        var i = $scope;

        return $modal.open({
            resolve: {
                topBarSettings: function() { return angular.copy($scope.topBarConfig.settings)},
                feedbackFieldSelection: function() { return feedbackFieldSelection},
                indicatorsFieldSelection: function() { return indicatorsFieldSelection},
                attributesFieldSelection: function() { return attributesFieldSelection}
            },
            templateUrl: "components/topbar/topbar-settings.html",
            controller: function($scope, $modalInstance, $rootScope, topBarSettings, feedbackFieldSelection, indicatorsFieldSelection, attributesFieldSelection)
            {
                $scope.topBarSettings = topBarSettings ? topBarSettings : { selectedFields: {}};
                $scope.feedbackFieldSelection = feedbackFieldSelection;
                $scope.indicatorsFieldSelection = indicatorsFieldSelection;
                $scope.attributesFieldSelection = attributesFieldSelection;

                $scope.onShowUnshowField = function(key, topBarField){
                    if(!topBarField.show){
                        delete $scope.topBarSettings.selectedFields[key];
                    }else{
                        var fields = $scope.topBarSettings.selectedFields;
                        var highestOrder = 0;
                        for(var k in fields){
                            if(fields[k].order && fields[k].order > highestOrder){
                                highestOrder = fields[k].order;
                            }
                        }
                        topBarField.order = highestOrder+1;
                    }
                }
                $scope.save = function () {
                    var fields = $scope.topBarSettings.selectedFields;
                    var highestOrder = 0;
                    var emptyOrderFields = [];
                    for(var k in fields){
                        if(fields[k].order && fields[k].order > highestOrder){
                            highestOrder = fields[k].order;
                        }
                        else if(!fields[k].order){
                            emptyOrderFields.push(k);
                        }
                    }
                    angular.forEach(emptyOrderFields, function(key){
                        fields[key].order = highestOrder+1;
                        highestOrder = fields[key].order;
                    });
                    $modalInstance.close($scope.topBarSettings);
                };

                $scope.close = function() {
                    $modalInstance.dismiss('cancel');
                };
                
                $scope.isEmptyObject = function(obj){
                    return Object.keys(obj).length === 0;
                }
            }
        }).result;
    }

    $scope.topBarValuesFilter = function(topBarValue){
        if($scope.topBarConfig.settings.selectedFields, $scope.topBarConfig.settings.selectedFields[topBarValue.id]){
            return $scope.topBarConfig.settings.selectedFields[topBarValue.id].show;
        }
        return false;
    }

    $scope.topBarValuesOrder = function(topBarValue){
        return $scope.topBarConfig.settings.selectedFields[topBarValue.id].order ? $scope.topBarConfig.settings.selectedFields[topBarValue.id].order: 0;
    }

        //listen for updated rule effects
    $scope.$on('ruleeffectsupdated', function(event, args) {
        var values = {};
        $scope.feedbackRuleBoundData = RuleBoundFactory.getDisplayEffects($scope.feedbackRuleBoundData, args.event, $rootScope.ruleeffects, 'feedback');
        if($scope.feedbackRuleBoundData){
            feedbackTextEffectValues = getDisplayTextEffectValues($scope.feedbackRuleBoundData);
            feedbackKeyDataEffectValues = getDisplayKeyDataEffectValues($scope.feedbackRuleBoundData);
        }

        $scope.indicatorsRuleBoundData = RuleBoundFactory.getDisplayEffects($scope.indicatorsRuleBoundData, args.event, $rootScope.ruleeffects, 'indicators');
        if($scope.indicatorsRuleBoundData){
            indicatorsTextEffectValues = getDisplayTextEffectValues($scope.indicatorsRuleBoundData);
            indicatorsKeyDataEffectValues = getDisplayKeyDataEffectValues($scope.indicatorsRuleBoundData);
        }


        setValues();
    });

    var setValues = function(){
        var valuesObj = Object.assign({}, feedbackTextEffectValues, feedbackKeyDataEffectValues, indicatorsTextEffectValues, indicatorsKeyDataEffectValues, attributesValues);
        var topBarValues = [];
        for(var key in valuesObj){
            if(valuesObj.hasOwnProperty(key)){
                topBarValues.push(valuesObj[key]);
            }
        }
        $scope.topBarValues = topBarValues;
    }



    var getDisplayTextEffectValues = function(ruleBoundData){
        var values = {};
        if(ruleBoundData.textInEffect){
            for(var key in ruleBoundData.displayTextEffects){
                if(ruleBoundData.displayTextEffects.hasOwnProperty(key) && ruleBoundData.displayTextEffects[key].ineffect){
                    values[key] = { id: key, name: ruleBoundData.displayTextEffects[key].content, value: ruleBoundData.displayTextEffects[key].data};
                }
            }
        }
        return values;
    }

    var getDisplayKeyDataEffectValues = function(ruleBoundData){
        var values = {};
        if(ruleBoundData.keyDataInEffect){
            for(var key in ruleBoundData.displayKeyDataEffects){
                if(ruleBoundData.displayKeyDataEffects.hasOwnProperty(key) && ruleBoundData.displayKeyDataEffects[key].ineffect){
                    values[key] = { id: key, name: ruleBoundData.displayKeyDataEffects[key].content, value: ruleBoundData.displayKeyDataEffects[key].data};
                }
            }
        }
        return values;
    }

    $scope.$on('dashboardWidgets', function(event, args) {
        var selections = CurrentSelection.get();
        $scope.attributesById = CurrentSelection.getAttributesById();
        var attributeFields = {};
        var tei = selections.tei;
        angular.forEach(tei.attributes, function(attr){
            tei[attr.attribute] = attr.value;
        });
        var selectedProgram = selections.pr;


        var values = {};
        for (var key in $scope.attributesById) {
            if($scope.attributesById.hasOwnProperty(key)){
                attributeFields[key] = $scope.attributesById[key].displayName;
            }
            if(tei && tei[key]){
                values[key] = {id: key, name: $scope.attributesById[key].displayName, value: tei[key]};
            }
        }
        attributesValues = values;
        setValues();
        attributesFieldSelection = attributeFields;


        MetaDataFactory.getByProgram("programRules", selectedProgram.id).then(function(rules){
            var feedBackFields = {};
            var inidicatorFields = {};
            angular.forEach(rules, function(rule){
                if(rule.programRuleActions){
                    angular.forEach(rule.programRuleActions, function(action){
                        if(action.location && (action.programRuleActionType === 'DISPLAYTEXT' || action.programRuleActionType === 'DISPLAYKEYVALUEPAIR')){
                            if(action.location ==='feedback'){
                                feedBackFields[action.id] = action.content;
                            }else if(action.location ==='indicators'){
                                inidicatorFields[action.id] = action.content;
                            }
                        }
                    });
                }
            });
            feedbackFieldSelection = feedBackFields;
            indicatorsFieldSelection = inidicatorFields;
        });
    });

});
