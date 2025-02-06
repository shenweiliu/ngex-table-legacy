import { Injectable } from '@angular/core';

@Injectable()
export class NgExTableConfig {    
    main: any; 
    //Base settings.
    base: any = {
        pageSize: 10,   
        toggleWithOriginalDataOrder: false,
        previousText: '&laquo;', //'PREV'
        nextText: '&raquo;',    //'NEXT'    
        paginationMaxBlocks: 5, 
        paginationMinBlocks: 2,

        pageNumberWhenPageSizeChange: 1,  
        //pageNumberWhenPageSizeChange: -1, //use current.
        pageNumberWhenSortingChange: 1,
        //pageNumberWhenSortingChange: -1, //use current.
        sortingWhenPageSizeChange: '',   //use defalult sorting. 
        //sortingWhenPageSizeChange: 'current', //use current sorting. 
        
		sortingIconCssLib: 'fa',       
        sortingAscIcon: 'fa-chevron-up',         
        sortingDescIcon: 'fa-chevron-down',
        //sortingAscIcon: 'fa-caret-up',
        //sortingDescIcon: 'fa-caret-down',
        //sortingAscIcon: 'fa-sort-asc',
        //sortingDescIcon: 'fa-sort-desc',
        sortingBaseIcon: 'fa-sort',  
        sortingIconColor: '#c5c5c5'
        //sortingIconColor: '#999999'
    };   

    private _appConfig: any = {};
    get appConfig(): any {
        return this._appConfig;
    }
    set appConfig(v: any) {
        this._appConfig = v;
        this.main = Object.keys(this._appConfig).length ? Object.assign(this.base, this._appConfig) : this.base;
    }
        
    //Page size list data.
    pageSizeList: Array<any>;
    pageSizeListBase: Array<any> = [
        { value: 5, text: '5' },
        { value: 10, text: '10' },
        { value: 25, text: '25' },
        { value: 50, text: '50' },
        { value: 100, text: '100' },
        { value: -1, text: 'both' }
    ];
    
    private _appPageSizeList: Array<any> = [];
    get appPageSizeList(): any {
        return this._appPageSizeList;
    }
    set appPageSizeList(v: any) {
        this._appPageSizeList = v;
        this.pageSizeList = Object.keys(this._appPageSizeList).length ? Object.assign(this.pageSizeListBase, this._appPageSizeList) : this.pageSizeListBase;
    }      

    constructor() {
        this.main = this.base;
        this.pageSizeList = this.pageSizeListBase;
    } 
}

