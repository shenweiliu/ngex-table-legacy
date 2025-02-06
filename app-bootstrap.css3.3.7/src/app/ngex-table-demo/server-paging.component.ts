import { Component, ViewChild, OnInit, OnDestroy, ElementRef, Renderer2, ViewChildren, QueryList } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpDataService } from './services/httpclient-data.service';
import {
    TableMainDirective, PaginationComponent, NgExTableConfig, PagingParams, ClientPaginationOutput,
    TableChange, PaginationType
} from 'ngex-table';
import { ServerMockDataService } from './services/server-mock-data.service';
import { ApiUrlForProductList, ServerPagingDataSource } from './services/app.config';
import * as glob from './services/globals';

@Component({
    moduleId: module.id.toString(),
    selector: 'server-paging',
    templateUrl: './server-paging.component.html'
})
export class ServerPagingComponent implements OnInit, OnDestroy {
    config: any;
    paginationType: PaginationType = PaginationType.server;
    searchEnabled: boolean = true;
    pagingEnabled: boolean = true; 
    
    pagingParams: PagingParams;    
    numPages: number = 1;
    totalLength: number = 0;
    pagedLength: number = 0;

    searchParams: any;
    showProductList: boolean = false;    
    productList: Array<any>;
    errorMsg: string = '';
    showGroupingLines_0: string;

    //Row group lines.
    @ViewChild('trHead', { static: true }) trHead: ElementRef;
    @ViewChildren('trItems') trItems: QueryList<any>;

    @ViewChild(TableMainDirective, { static: true }) tableMainDirective: TableMainDirective;
    @ViewChild(PaginationComponent, { static: false }) paginationComponent: PaginationComponent;    

    constructor(private ngExTableConfig: NgExTableConfig, private httpDataService: HttpDataService,
        private serverMockDataService: ServerMockDataService, private renderer: Renderer2) {        
    }

    ngOnInit():void {
        glob.caches.serverPagingThis = this;
        this.config = this.ngExTableConfig.main;

        //Set for showing search panel only and then load filtered data later.
        this.tableMainDirective.isFilterForInit = true;

        //---------------------------------------
        //Component-level sorting configurations.
        //this.tableMainDirective.sortingRunMode = 1; //0: single/multiple column sorting (default), or 1: single column sorting only.
        //this.tableMainDirective.sortingTypeSwitch = 1; //0: Ctrl-key mode (default), or 1: dropdown selection mode; Userd only for sortingRunMode = 0.
        this.tableMainDirective.enableOptionBoard = 'yes'; //'yes' or 'no'(default; '' the same as 'no'); Used only for sortingTypeSwitch = 0.
        //this.tableMainDirective.showOptionBoardContent = 'yes'; //'yes' or 'no' (default; '' the same as 'no'); Used only for sortingTypeSwitch = 0.
        //this.tableMainDirective.showGroupingLines = 'yes'; //'yes' or 'no' (default; '' the same as 'no').
        //---------------------------------------

        //Set initial pagingParams.
        let pageSize = this.config.pageSize;
        this.pagingParams = {
            //pageSize: overwrite default setting in ngex-table.config.ts.
            pageSize: pageSize !== undefined ? pageSize : 10,
            pageNumber: 1,
            sortList: [],            
            changeType: TableChange.init
        }        
    }

    ngOnDestroy() {        
    }
    
    //Before data access.
    onChangeSearch(searchParams: any) {
        this.pagingParams.changeType = TableChange.search;
        this.searchParams = searchParams;

        //For TableChange.search, need to re-set pagingParams here for some conditions and based on config settings.
        this.tableMainDirective.setPagingParamsBeforeData(this.pagingParams);

        this.getProductList();
    }

    onChangeOptions(optionType: string) {
        if (optionType == 'grouping') {
            this.getProductList();
        }
    }
    
    onChangeTable() {
        this.getProductList();     
    }
    
    getProductList() {
        let pThis = this;
        if (ServerPagingDataSource == 'server') {
            let input = this.getProductListRequest();
            this.httpDataService.post(ApiUrlForProductList, input) //Real server data
            .subscribe(data => {
                pThis.processDataReturn(data);
            },
            (err: HttpErrorResponse) => {
                pThis.errorMsg = pThis.httpDataService.parseErrorMessage(err);
            });
        }
        else if (ServerPagingDataSource == 'mock') { 
            //Mock server data
            this.serverMockDataService.getPagedDataList(this.searchParams, this.pagingParams)  
            .subscribe(data => {
                pThis.processDataReturn(data);
            },
            (err: HttpErrorResponse) => {
                pThis.errorMsg = pThis.httpDataService.parseErrorMessage(err);
            });
        }        
    } 

    processDataReturn(data: any) {        
        if (data) {
            this.productList = data.Products;
            this.totalLength = data.TotalCount;

            //TotalItems needs to be directly updated with component reference.
            //Passing it to child @Input doesn't work since pager processes already done.
            this.paginationComponent.totalItems = data.TotalCount;

            //Change in pagedLength will trigger PaginationComponnet.ngOnChanges to reset endItemNumber.                    
            this.pagedLength = this.productList.length;

            //Call library method to update pager. Also need to pass current data length.
            this.tableMainDirective.updatePagerAfterData(this.pagingParams, this.totalLength);

            //Show first sortBy group lines in grid. 
            this.tableMainDirective.setRowGroupLines(this.trHead, this.trItems);

            this.showProductList = true;
        }
        else {
            this.errorMsg = 'Something was wrong when obtaining the data.';
        }
    }
        
    //Parameters for data access.
    getProductListRequest(): any {
        let req: any = {
            productSearchFilter: {},
            priceSearchFilter: {},
            dateSearchFilter: {},
            statusCode: '',
            paginationRequest: {
                sortList: []
            },
        };
        if (this.searchParams.searchType != '' && this.searchParams.searchText != '') {
            req.productSearchFilter = {
                productSearchField: this.searchParams.searchType,
                productSearchText: this.searchParams.searchText
            };
        }

        if (this.searchParams.priceLow != '') {
            req.priceSearchFilter.searchPriceLow = this.searchParams.priceLow;
        }
        if (this.searchParams.priceHigh != '') {
            req.priceSearchFilter.searchPriceHigh = this.searchParams.priceHigh;
        }

        if (this.searchParams.dateFrom && this.searchParams.dateFrom != '') {
            req.dateSearchFilter.searchDateFrom = this.searchParams.dateFrom.singleDate.jsDate;
        }
        if (this.searchParams.dateTo && this.searchParams.dateTo != '') {
            req.dateSearchFilter.searchDateTo = this.searchParams.dateTo.singleDate.jsDate;
        }

        if (this.searchParams.statusCode != '') {
            req.statusCode = this.searchParams.statusCode;
        }

        if (this.pagingParams.pageNumber > 0) {
            req.paginationRequest.pageIndex = this.pagingParams.pageNumber - 1;
        }
        if (this.pagingParams.pageSize > 0) {
            req.paginationRequest.pageSize = this.pagingParams.pageSize;
        }
        if (this.pagingParams.sortList.length > 0) {
            req.paginationRequest.sortList = this.pagingParams.sortList;
        }
        return req;
    };
}
