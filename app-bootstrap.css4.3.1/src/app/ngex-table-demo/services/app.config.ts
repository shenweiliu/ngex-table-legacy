export const ServerPagingDataSource: string = 'mock';
//export const ServerPagingDataSource: string = 'server';

export const WebApiRootUrl: string = "http://localhost:7200/api/";  //Core 5.0
//export const WebApiRootUrl: string = "http://localhost:6600/api/";  //Core 3.1
//export const WebApiRootUrl: string = "http://localhost:5112/api/";  //Core 2.1
//export const WebApiRootUrl: string = "http://storecoredataservice/api/";


//export const ApiUrlForProductList: string = WebApiRootUrl + 'getproductlist_p'; //Backward compatibility.
export const ApiUrlForProductList: string = WebApiRootUrl + 'getpagedproductlist'; //Support multi-colulmn sorting.
//export const ApiUrlForProductList: string = WebApiRootUrl + 'getpagedproductlistbysp'; //Support multi-colulmn sorting.


//Merge to NgExTableConfig in AppComponent and take settings here as precedence.
//Remove or comment out item for using default setting.
export const TableConfig: any = {    
    //pageSize: 10, /* number: number of rows per page */
    toggleWithOriginalDataOrder: true, /*boolean: true: no order, ascending, and descending; false: ascending and descending */
    //previousText: '&laquo;', /*string: page previous button label. Could be 'PREV' */
    //nextText: '&raquo;', /*string: page next button label. Could be 'NEXT' */
    //paginationMaxBlocks: 5, /* number: maximum number of page number buttons if '...' shown on both sides */
    //paginationMinBlocks: 2,  /* number: minimum number of page number buttons if '...' shown on both sides */

    pageNumberWhenPageSizeChange: -1, /*number: 1: reset to first page when changing page size; -1: use current pageNumber */
    pageNumberWhenSortingChange: 1, /*number: 1: reset to first page when changing column sorting; -1: use current pageNumber */
    sortingWhenPageSizeChange: '', /*string: '': reset to default order when changing page size; 'current': use current sorting */
    
    //Related to data search (no default setting in library-level, NgExTableConfig base).
    //-------------------------------
    pageNumberWhenSearchChange: 1, /*number: 1: reset to first page when search or filtering change; -1: use current pageNumber */
    sortingWhenSearchChange: 'current', /*string: '': reset to default order when search or filtering change; 'current': use current sorting */
    //-------------------------------
    
    //sortingIconCssLib: 'fa', /*string: 'fa', or custom value */  
    //sortingAscIcon: 'fa-chevron-up', /*string: 'fa-chevron-up' (for 'fa'), or custom value */
    //sortingDescIcon: 'fa-chevron-down', /*string: 'fa-chevron-down' (for 'fa'), or custom value */ 
    //sortingBaseIcon: 'fa-sort', /*string: 'fa-sort' (for 'fa'), or you define */ 
    //sortingIconColor: '#c5c5c5' /*string: '#c5c5c5' (default), '#999999', or custom value */    
};

export const PageSizeList: Array<any> = [
    //{ value: 5, text: '5' },
    //{ value: 10, text: '10' },
    //{ value: 25, text: '25' },
    //{ value: 50, text: '50' },
    //{ value: 100, text: '100' },
    //{ value: -1, text: 'both' }
];

import { IAngularMyDpOptions, IMyMarkedDate } from 'angular-mydatepicker';
export const MyDatePickConfig: IAngularMyDpOptions = {
    dateFormat: 'mm/dd/yyyy',
    firstDayOfWeek: 'su',
    sunHighlight: false,
    markCurrentDay: true,
    alignSelectorRight: false,
    openSelectorTopOfInput: false,
    minYear: 1970,
    maxYear: 2200,
    showSelectorArrow: false,
    monthSelector: true,
    yearSelector: true,
    satHighlight: false,
    highlightDates: [],
    disableDates: [],
    disableHeaderButtons: true,
    showWeekNumbers: false,
    disableDateRanges: [],
    markDates: [],
    markWeekends: <IMyMarkedDate>{},
    selectorHeight: '15rem', //'230px',
    selectorWidth: '16rem', //'250px',
    closeSelectorOnDateSelect: true,
    closeSelectorOnDocumentClick: true,
    appendSelectorToBody: true
};
