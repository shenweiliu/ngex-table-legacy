import {    
    Component, OnInit, OnDestroy, OnChanges, SimpleChange, ElementRef, EventEmitter, Input, Output, Renderer2, Self, forwardRef
} from '@angular/core';
import { Subscription } from 'rxjs';
import { NgExTableConfig } from './ngex-table.config';
import { MessageTransferService } from './message-transfer.service';
import { PagingParams, ParamsToUpdatePager } from './model-interface';
import { TableChange } from './constants';
import * as commonMethods from './common-methods';

@Component({    
    //moduleId: module.id.toString(),
    selector: 'pagination',
    templateUrl: "./pagination.component.html"    
})
export class PaginationComponent implements OnInit, OnDestroy, OnChanges {
    config: any;
    //Service call from tableMainDirective.
    private subscription_1: Subscription;

    /**Existing params passed from parent component. */
    @Input() pagingParams: PagingParams;    

    /** total number of items in all pages */
    private _totalItems: number;
    @Input()
    get totalItems(): number {
        return this._totalItems;
    }
    set totalItems(v: number) {
        this._totalItems = v;
        this.totalPages = this.calculateTotalPages();
    }

    /**For calculating endItemNumnber */
    @Input() pagedLength: number;
    
    /** fired when total pages count changes, $event:number equals to total pages count */
    @Output() numPages: EventEmitter<number> = new EventEmitter<number>();
    /** fired when page was changed, $event:{page, pageSize} equals to object with current page index and number of items per page */
    @Output() pageChanged: EventEmitter<PagingParams> = new EventEmitter<PagingParams>();
    
    addNewLoad: boolean;
    sizeSelected: any = {};
    pages: any[]; 
    
    /** maximum number of items per page. If value less than 1 will display all items on one page */
    private _pageSize: number = 10; 
    get pageSize(): number {
        return this._pageSize;
    }
    set pageSize(v: number) {
        this._pageSize = v;
        //this.totalPages = this.calculateTotalPages();
    }
    
    private _totalPages: number;
    get totalPages(): number {
        return this._totalPages;
    }
    set totalPages(v: number) {
        this._totalPages = v;   
    }

    private _pageNumber: number = 1;
    get pageNumber(): number {
        return this._pageNumber;
    }
    set pageNumber(value: number) {
        this._pageNumber = (value > this.totalPages) ? this.totalPages : (value || 1);
    }

    private _paginationMaxBlocks: number = 5;    
    get paginationMaxBlocks(): number {
        return this._paginationMaxBlocks;
    }
    set paginationMaxBlocks(v: number) {
        this._paginationMaxBlocks = v;
    }

    private _paginationMinBlocks: number = 2;    
    get paginationMinBlocks(): number {
        return this._paginationMinBlocks;
    }
    set paginationMinBlocks(v: number) {
        this._paginationMinBlocks = v;
    }

    private _startItemNumber: number = 0;    
    get startItemNumber(): number {
        return this._startItemNumber;
    }
    set startItemNumber(v: number) {
        this._startItemNumber = v;
    }

    private _endItemNumber: number = 0;    
    get endItemNumber(): number {
        return this._endItemNumber;
    }
    set endItemNumber(v: number) {
        this._endItemNumber = v;
    }

    private _sizeOptions: Array<any> = [];
    get sizeOptions(): any {
        return this._sizeOptions;
    }
    set sizeOptions(v: any) {
        this._sizeOptions = v;
    }
    
    constructor(private ngExTableConfig: NgExTableConfig, private messageService: MessageTransferService) {
    }    

    ngOnInit(): void {
        let pThis: any = this;
        this.config = this.ngExTableConfig.main;
        
        //Get default pageSize.
        if (this.pagingParams && this.pagingParams.pageSize) {
            this.pageSize = this.pagingParams.pageSize;
        }
        else {
            this.pageSize = typeof this.config.pageSize !== undefined
                ? this.config.pageSize
                : this.pageSize;
        } 
        this.pageNumber = this.pagingParams.pageNumber || 1;
        this.totalPages = this.calculateTotalPages();
        
        //Pager settings.
        this.paginationMaxBlocks = this.config.paginationMaxBlocks || this._paginationMaxBlocks;
        this.paginationMinBlocks = this.config.paginationMinBlocks || this._paginationMinBlocks;
        this.setStartItemNumber();
        this.setEndItemNumber();
        this.sizeOptions = this.ngExTableConfig.pageSizeList;        

        this.sizeOptions.forEach((option: any) => {
            if (option.value == pThis.pageSize) {
                pThis.sizeSelected = option; //this.sizeOptions[1];
                return;               
            }
        });

        //Service call from tableMainDirective to update pager after data loading.
        this.subscription_1 = this.messageService.subscribe('tableMain_paginationComponent', (eventData) => {            
            if (eventData.changeType == TableChange.search) {
                pThis.pagingParams.changeType = TableChange.search;
                pThis.selectPage(eventData.pageNumber);
            }
            else {
                if (eventData.changeType == TableChange.sorting) {
                    pThis.pagingParams.changeType = TableChange.sorting;
                    pThis.selectPage(eventData.pageNumber);
                }
                else if (eventData.changeType == TableChange.pageSize) {
                    pThis.setPagerForSizeChange();
                }
            }            
        });
    }

    ngOnDestroy() {
        this.subscription_1.unsubscribe();
    }

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {        
        //When changing pages, changed pagedLength value is not passed from parent at select-page time.
        //Need to get real EndItemNumber after pagedLength value is changed in this event.
        if (changes["pagedLength"]) {
            this.setEndItemNumber();            
        } 
    }
    
    //Pager command from HTML template. Can also be called from parent.
    selectPage(pageNumber: number, event?: Event): void {
        if (event) {
            //Set change type.
            this.pagingParams.changeType = TableChange.pageNumber;

            //If clicking the same page button.
            if (pageNumber == this.pageNumber) return;

            event.preventDefault();            
        }
        if (event && event.target) {
            let target: any = event.target;
            target.blur();
        }        

        this.pageNumber = pageNumber;

        //Update value in base pagingParams.
        this.pagingParams.pageNumber = this.pageNumber;

        //Set pagers.
        this.pages = this.getPages(); 

        this.setStartItemNumber();
        this.setEndItemNumber(); 
        
        //Fire event for pageNumber changeType.
        if (this.pagingParams.changeType == TableChange.pageNumber) { 
            //Call tableMainDirective to set pagingParams before data loading.
            this.messageService.broadcast('tableMain_setPagingParamsBeforeData', this.pagingParams);

            this.pageChanged.emit();
        }        
    }
    
    calculateTotalPages(): number {
        let totalPages = this.pageSize < 1 ? 1 : Math.ceil(this.totalItems / this.pageSize);
        return Math.max(totalPages || 0, 1);
    }  
        
    getPages(
        currentPage: number = this.pageNumber,
        totalItems: number = this.totalItems,
        pageSize: number = this.pageSize) {
        
        let pages: any = [];
        let numPages: number = Math.ceil(totalItems / pageSize);
        if (numPages > 1) {
            pages.push({
                type: 'prev',
                number: Math.max(1, currentPage - 1),
                active: currentPage > 1
            });
            pages.push({
                type: 'first',
                number: 1,
                active: currentPage > 1,
                current: currentPage === 1
            });

            let maxPivotPages: number = Math.round((this.paginationMaxBlocks - this.paginationMinBlocks) / 2);
            let minPage: number = Math.max(2, currentPage - maxPivotPages);
            let maxPage: number = Math.min(numPages - 1, currentPage + maxPivotPages * 2 - (currentPage - minPage));
            minPage = Math.max(2, minPage - (maxPivotPages * 2 - (maxPage - minPage)));

            let i: number = minPage;
            while (i <= maxPage) {
                if ((i === minPage && i !== 2) || (i === maxPage && i !== numPages - 1)) {
                    pages.push({
                        type: 'more',
                        active: false
                    });
                } else {
                    pages.push({
                        type: 'page',
                        number: i,
                        active: currentPage !== i,
                        current: currentPage === i
                    });
                }
                i++;
            }
            pages.push({
                type: 'last',
                number: numPages,
                active: currentPage !== numPages,
                current: currentPage === numPages
            });
            pages.push({
                type: 'next',
                number: Math.min(numPages, currentPage + 1),
                active: currentPage < numPages
            });
        }
        return pages;
    };

    onSizeChange(event: any) {
        if (event.value == this.pageSize) {
            return;
        }
        else {
            this.pageSize = event.value;
            this.pagingParams.pageSize = this.pageSize;
        }

        //Refresh pager with page number based on config.
        if (this.config.pageNumberWhenPageSizeChange && this.config.pageNumberWhenPageSizeChange != -1) {
            this.pageNumber = this.config.pageNumberWhenPageSizeChange;
            this.pagingParams.pageNumber = this.pageNumber;
        }

        this.pagingParams.changeType = TableChange.pageSize;

        //Call tableMainDirective to set pagingParams before data loading.
        this.messageService.broadcast('tableMain_setPagingParamsBeforeData', this.pagingParams);
        
        //Emit event for refresh data and pager.
        this.pageChanged.emit();
    }

    //Called from parent via service.
    setPagerForSizeChange() {                    
        //In case changing pageSize from small to large and data items can only fit page 1.
        if (this.totalItems <= this.pagingParams.pageSize && this.pagingParams.pageNumber != 1) {
            this.pagingParams.pageNumber = 1;
        }
        else if (this.pagingParams.pageNumber > this.totalPages) {
            //Set to last page if pageNumber is out of range.
            this.pagingParams.pageNumber = this.totalPages;
        }        
        this.selectPage(this.pagingParams.pageNumber);
    }

    setStartItemNumber(pageNum: number = undefined) {
        let currentPageNum = pageNum != undefined ? pageNum : this.pageNumber;
        this.startItemNumber = (currentPageNum - 1) * this.pageSize + 1;
    }
    setEndItemNumber(pagedCount: number = undefined) {
        let currentLength = pagedCount != undefined ? pagedCount : this.pagedLength;
        this.endItemNumber = this.startItemNumber + currentLength - 1;
    }    
}
