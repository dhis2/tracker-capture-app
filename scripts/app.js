import './trackerCaptureModule';

// Tracker core
import '../d2-tracker/dhis2.tracker-metadata.js';
import '../d2-tracker/dhis2.angular.services.js';
import '../d2-tracker/dhis2.angular.directives.js';
import '../d2-tracker/dhis2.angular.validations.js';
import '../d2-tracker/dhis2.angular.filters.js';
import '../d2-tracker/dhis2.angular.controllers.js';
import '../d2-tracker/style.css';


// App files
import '../scripts/services.js';
import '../scripts/filters.js';
import '../scripts/directives.js';
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
import '../components/home/home-controller.js';
import '../components/home/lists/lists-controller.js';
import '../components/home/search/search-controller.js';
import '../components/topbar/topbar-controller.js';
import '../components/teiAudit/tei-audit-controller.js';

import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

import 'angular-vs-repeat';

import 'leaflet-contextmenu';
import '../d2-tracker/Google.js';

import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.js';

import 'leaflet-draw/dist/leaflet.draw.js';
import 'leaflet-draw/dist/leaflet.draw.css';

import 'leaflet/dist/leaflet.css';
import 'leaflet-contextmenu/dist/leaflet.contextmenu.css';

/* App Module */
angular.module('trackerCapture')

.value('DHIS2URL', '../api')

.value('DHIS2COORDINATESIZE', 6)

.config(function($httpProvider, $routeProvider, $translateProvider, $logProvider) {

    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];

    $routeProvider.when('/', {
        templateUrl:'components/home/home.html',
        controller: 'HomeController',
        reloadOnSearch: true
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
    Array.prototype.toHashMap = function(key, objFunc){
        var hashmap = this.reduce(function(map, obj) {
            if(objFunc) objFunc(map,obj,key);
            if(obj[key] ==='jYDntjPUD5C'){
                var g = 1;
            }
            map[obj[key]] = obj;
            return map;
        },{});
        return hashmap;
    }

    $http.get('components/dataentry/inner-form.html').then(function(page){
        $templateCache.put('components/dataentry/inner-form.html', page.data);
    });
    $http.get('components/dataentry/section-inner-form.html').then(function(page){
        $templateCache.put('components/dataentry/section-inner-form.html', page.data);
    });

    $rootScope.maxGridColumnSize = 1;
    $rootScope.maxOptionSize = 100;
});
