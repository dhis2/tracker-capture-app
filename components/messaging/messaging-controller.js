/* global trackerCapture, angular */

import {createNotificationForSms} from "../../ks_patches/create_notification_for_sms";

var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('MessagingController',
        function($scope, $translate,
                MessagingService,
                CurrentSelection,
                EnrollmentService,
                DateUtils,
                SessionStorageService) {

    $scope.messagingForm = {};
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
                if ($scope.selectedTei.attributes[i].valueType === 'PHONE_NUMBER' ||
                        $scope.selectedTei.attributes[i].code == "phone_local") {
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

    $scope.sendMessage = function(messagingForm){
        var message;
        //check for form validity
        $scope.messagingForm = messagingForm;
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

        MessagingService.sendMessage(message).then(response => {
            if(response&& response.summaries && response.summaries[0] && response.summaries[0].status === "COMPLETED") {
                createNotificationForSms($scope.message.smsMessage, $scope.message.phoneNumber, DateUtils, CurrentSelection, SessionStorageService, EnrollmentService, $scope);
                $scope.clear();
            }
        });

    };

    $scope.clear = function(){
        $scope.messagingForm.submitted = false;
        $scope.message = {};
    };
    
    $scope.showMessaging = function(){        
        $scope.showMessagingDiv = !$scope.showMessagingDiv;
    };
});
