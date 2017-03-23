/* global trackerCapture, angular */

var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('MessagingController',
        function($scope, $translate,
                MessagingService,
                CurrentSelection) {

    //$scope.messagingForm = {};
    $scope.note = {};
    $scope.message = {};
    $scope.showMessagingDiv = false;
    $scope.showNotesDiv = true;
    $scope.model = {messageTypes:["sms","email"], selectedMessageType:"sms", smsMessage:"", emailMessage:""};
    $scope.$on('dashboardWidgets', function() {
        $scope.selectedEnrollment = null;
        $scope.selections = CurrentSelection.get();
        $scope.selectedTei = $scope.selections.tei;
        $scope.selectedOrgUnit = $scope.selections.orgUnit;
        if ($scope.selectedTei) {
            //check if the selected TEI has any of the contact attributes
            //that can be used for messaging
            var foundPhoneNumber = false;
            var foundEmailId = false;
            for (var i = 0; i < $scope.selectedTei.attributes.length; i++) {
                if ($scope.selectedTei.attributes[i].valueType === 'PHONE_NUMBER') {
                    $scope.message.phoneNumber = $scope.selectedTei.attributes[i].value;
                    foundPhoneNumber = true;
                }
                if ($scope.selectedTei.attributes[i].displayName === 'Email') {
                    $scope.message.emailId = $scope.selectedTei.attributes[i].value;
                    foundEmailId = true;
                }
                if (foundPhoneNumber && foundEmailId) {
                    break;
                }
            }
        }
    });

    $scope.sendMessage = function(){
        var message;
        //check for form validity
        $scope.messagingForm.submitted = true;
        if ($scope.messagingForm.$invalid) {
            return false;
        }

        //form is valid...

        if ($scope.model.selectedMessageType === "email") {
            message = {
                "programMessages": [{
                    "recipients": {
                        "emailAddresses": [$scope.message.emailId]
                    },
                    "programInstance": {
                        "id": $scope.selectedProgramId
                    },
                    "deliveryChannels": ["EMAIL"],
                    "subject": $scope.message.emailSubject,
                    "text": $scope.message.emailMessage,
                    "storeCopy": false
                }]
            };
        } else if ($scope.model.selectedMessageType === "sms") {
            message = {
                "programMessages": [{
                    "recipients": {
                        "phoneNumbers": [$scope.message.phoneNumber]
                    },
                    "programInstance": {
                        "id": $scope.selectedProgramId
                    },
                    "deliveryChannels": ["SMS"],
                    "text": $scope.message.smsMessage,
                    "storeCopy": false
                }]
            };
        }

        MessagingService.sendMessage(message);

    };

    $scope.clear = function(){
        $scope.messagingForm.submitted = false;
        $scope.message = {};
    };
    
    $scope.showMessaging = function(){        
        $scope.showMessagingDiv = !$scope.showMessagingDiv;
    };
});
