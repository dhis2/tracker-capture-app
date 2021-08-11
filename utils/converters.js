export function convertToCorrectDateString(datestring, dateformat) {
    var day;
    var month;
    var year;
    var matched = false;

    // format dd-mm-yy
    if(datestring.match(/^\d{2}\-\d{2}\-\d{2}$/)) {
        day = datestring.substr(0,2);
        month = datestring.substr(3,2);
        year = getFullYear(datestring.substr(6,2));
        matched = true;
    }

    // format dd-mm-yyyy
    if(datestring.match(/^\d{2}\-\d{2}\-\d{4}$/)) {
        day = datestring.substr(0,2);
        month = datestring.substr(3,2);
        year = datestring.substr(6,4);
        matched = true;
    }

    // format dd.mm.yy
    if(datestring.match(/^\d{2}\.\d{2}\.\d{2}$/)) {
        day = datestring.substr(0,2);
        month = datestring.substr(3,2);
        year = getFullYear(datestring.substr(6,2));
        matched = true;
    }

    // format dd.mm.yyyy
    if(datestring.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
        day = datestring.substr(0,2);
        month = datestring.substr(3,2);
        year = datestring.substr(6,4);
        matched = true;
    }

    // format ddmmyy
    if(datestring.match(/^\d{2}\d{2}\d{2}$/)) {
        day = datestring.substr(0,2);
        month = datestring.substr(2,2);
        year = getFullYear(datestring.substr(4,2));
        matched = true;
    }

    // format ddmmyyyy
    if(datestring.match(/^\d{2}\d{2}\d{4}$/)) {
        day = datestring.substr(0,2);
        month = datestring.substr(2,2);
        year = datestring.substr(4,2);
        matched = true;
    }
    // format dd/mm/yy
    if(datestring.match(/^\d{2}\/\d{2}\/\d{2}$/)) {
        day = datestring.substr(0,2);
        month = datestring.substr(3,2);
        year = getFullYear(datestring.substr(6,2));
        matched = true;

    }
    // format dd/mm/yyyy
    if(datestring.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        day = datestring.substr(0,2);
        month = datestring.substr(3,2);
        year = datestring.substr(6,4);
        matched = true;
    }

    if(!matched || !isValidDate(day, month, year)) {
        return undefined;
    }

    if(dateformat == 'yyyy-mm-dd') {
        return year + '-' + month + '-' + day;
    }

    return day + '-' + month + '-' + year;
}

export function getFullYear(year) {
    if(year.length == 4) {
        return year;
    }

    var thisYear =  new Date().getFullYear() - 2000; // Gets two digit year of today

    if (year <= thisYear) {
        return '20' + year;
    }
    return '19' + year;
}

function isValidDate(day, month, year) {
    if(day <= 0 || day > 31) {
        return false;
    }
    if(month <= 0 || month > 12) {
        return false;
    }

    if(year < 1000 || year > 3000) {
        return false;
    }

    return true;
}

export function convertDatestringToDDMMYYYY(datestring) {
    var date = new Date(Date.parse(datestring));
    var day = date.getDate();
    day = day > 9 ? day : '0' + day;
    var month = date.getMonth() + 1; // Month starts indexing on 0
    month = month > 9 ? month : '0' + month;
    var year = date.getFullYear();

    return day + '-' + month + '-' + year;
}

export function convertDatestringToFullTime(datestring) {
    return new Intl.DateTimeFormat('nb-no', {dateStyle: 'short', timeStyle: 'short'}).format(new Date(datestring));
}