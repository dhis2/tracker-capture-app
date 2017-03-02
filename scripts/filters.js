'use strict';

/* Filters */

var trackerCaptureFilters = angular.module('trackerCaptureFilters', [])

.filter('eventListFilter', function($filter){    
    
    return function(pagedList, fullList, filterText){

        if(!pagedList ){
            return;
        }
        
        if(!filterText){
            return pagedList;
        }        
           
        var filteredData = fullList && fullList.length ? fullList : pagedList;
        filteredData = $filter('filter')(filteredData, filterText);
        return filteredData;
    }; 
})

.filter('removeFuturePeriod', function($filter, CalendarService, DateUtils){

    return function(periods, endDate){
        
        if(!periods){
            return;
        }
        
        if(!endDate){
            return periods;
        }
        
        var calendarSetting = CalendarService.getSetting();
        periods = $filter('filter')(periods, function(period){            
            return moment(DateUtils.getToday(), calendarSetting.momentFormat).isAfter(moment(period.startDate, calendarSetting.momentFormat)) || moment(DateUtils.getToday(), calendarSetting.momentFormat).isSame(moment(period.startDate, calendarSetting.momentFormat));
        });

        return periods;        
           
    };
});