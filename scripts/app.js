import L from 'leaflet';
import 'leaflet-geocoder-mapzen';
import 'leaflet-contextmenu';

L.Icon.Default.imagePath = '../dhis-web-commons/leaflet/images';

/* App Module */
var trackerCapture = angular.module('trackerCapture',
        ['ui.bootstrap', 
         'ngRoute', 
         'ngCookies',
         'ngSanitize',
         'ngMessages',
         'trackerCaptureServices',
         'trackerCaptureFilters',
         'trackerCaptureDirectives',
         'd2Directives',
         'd2Filters',
         'd2Services',
         'd2Controllers',
         'angularLocalStorage',
         'ui.select',
         'ui.select2',
         'infinite-scroll',
         'd2HeaderBar',
         'sticky',
         'nvd3ChartDirectives',
         'pascalprecht.translate',
         'leaflet-directive',
         'angularCSS'])
              
.value('DHIS2URL', '../api')

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
