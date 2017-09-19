import './trackerCaptureModule';

// Tracker core
import 'd2-tracker/lib/dhis2.angular.services.js';
import 'd2-tracker/lib/dhis2.angular.directives.js';
import 'd2-tracker/lib/dhis2.angular.validations.js';
import 'd2-tracker/lib/dhis2.angular.filters.js';
import 'd2-tracker/lib/dhis2.angular.controllers.js';
import 'd2-tracker/lib/dhis2.angular.templates.js';

// App files
import '../scripts/services.js';
import '../scripts/filters.js';
import '../scripts/directives.js';
import '../scripts/controllers.js';
import '../scripts/leftbar-menu-controller.js';
import '../scripts/report-types-controller.js';
import '../scripts/display-mode-controller.js';
import '../scripts/sticky.min.js';
import '../scripts/ng-csv.js';
import '../components/dashboard/dashboard-controller.js';
import '../components/dashboard/dashboard-widgets-controller.js';
import '../components/registration/registration-controller.js';
import '../components/enrollment/enrollment-controller.js';
import '../components/dataentry/dataentry-controller.js';
import '../components/dataentry/referral-controller.js';
import '../components/dataentry/modal-default-form-controller.js';
import '../components/dataentry/new-event-controller.js';
import '../components/dataentry/event-cocbo-controller.js';
import '../components/report/tei-report-controller.js';
import '../components/report/program-summary-controller.js';
import '../components/report/program-statistics-controller.js';
import '../components/report/overdue-events-controller.js';
import '../components/report/upcoming-events-controller.js';
import '../components/selected/selected-controller.js';
import '../components/relationship/relationship-controller.js';
import '../components/teiadd/tei-add-controller.js';
import '../components/profile/profile-controller.js';
import '../components/notes/notes-controller.js';
import '../components/rulebound/rulebound-controller.js';
import '../components/messaging/messaging-controller.js';

import L from 'leaflet';
import 'leaflet-geocoder-mapzen';
import 'leaflet-contextmenu';
import 'd2-tracker/lib/Google.js';

L.Icon.Default.imagePath = '../dhis-web-commons/leaflet/images';

/* App Module */
angular.module('trackerCapture')

.value('DHIS2URL', '../api/28')

.value('DHIS2COORDINATESIZE', 6)

.config(function($httpProvider, $routeProvider, $translateProvider, $logProvider) {

    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];

    $routeProvider.when('/', {
        templateUrl:'views/home.html',
        controller: 'SelectionController'
    }).when('/dashboard',{
        templateUrl:'components/dashboard/dashboard.html',
        controller: 'DashboardController'
    }).when('/report-types',{
        templateUrl:'views/report-types.html',
        controller: 'ReportTypesController'
    }).when('/program-summary',{
        templateUrl:'components/report/program-summary.html',
        controller: 'ProgramSummaryController'
    }).when('/program-statistics',{
        templateUrl:'components/report/program-statistics.html',
        controller: 'ProgramStatisticsController',
        css: '../dhis-web-commons/javascripts/nvd3/nv.d3.css'
    }).when('/overdue-events',{
        templateUrl:'components/report/overdue-events.html',
        controller: 'OverdueEventsController'
    }).when('/upcoming-events',{
        templateUrl:'components/report/upcoming-events.html',
        controller: 'UpcomingEventsController'
    }).otherwise({
        redirectTo : '../dhis-web-commons/security/login.action'
    });

    $translateProvider.preferredLanguage('en');
    $translateProvider.useSanitizeValueStrategy('escaped');
    $translateProvider.useLoader('i18nLoader');

    $logProvider.debugEnabled(false);

})

.run(function($templateCache, $http, $rootScope){
    $http.get('components/dataentry/inner-form.html').then(function(page){
        $templateCache.put('components/dataentry/inner-form.html', page.data);
    });
    $http.get('components/dataentry/section-inner-form.html').then(function(page){
        $templateCache.put('components/dataentry/section-inner-form.html', page.data);
    });

    $rootScope.maxGridColumnSize = 1;
    $rootScope.maxOptionSize = 30;
});
