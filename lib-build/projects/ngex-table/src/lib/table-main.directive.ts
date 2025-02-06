import { Directive, ViewChild, EventEmitter, SimpleChange, OnInit, OnDestroy, OnChanges, Input, Output, ElementRef, QueryList, Renderer2} from "@angular/core";
import { PagingParams, ParamsToUpdatePager, SortableItem, SortItem, NameValueItem } from './model-interface';
import { TableChange, SortChangedType } from './constants';
import { MessageTransferService } from './message-transfer.service';
import { ClientPaginationService } from './client-pagination.service'
import { NgExTableConfig } from './ngex-table.config';
import { Subject, Subscription } from 'rxjs';
import * as commonMethods from './common-methods';

@Directive({
    selector: 'table[table-main]',
    exportAs: 'ngExTable'
})
export class TableMainDirective implements OnInit, OnDestroy {
    config: any;
    //Call from other structures via message service.
    private subscription_1: Subscription;

    isFilterForInit: boolean = false;
    hasInitDone: boolean = false;
    sortingOption: string = 'multiple'; //'single' or 'multiple' (initial loading type used only for sortingRunMode = 0).

    //----------------------------------------------------------
    //Values here are defaults and can be overwritted from table-hosting component-level settings.    
    sortingRunMode: number = 0; //0: single/multiple column sorting, or 1: single column sorting only.
    sortingTypeSwitch: number = 0; //0: Ctrl/Shift key mode (used only for sortingRunMode = 0), or 1: dropdown selection mode.
    enableOptionBoard: string = ''; //'yes' or 'no'('' the same as 'no').
    showOptionBoardContent: string = ''; //'yes' or 'no'('' the same as 'no').
    showGroupingLines: string = ''; //yes' or 'no'('' the same as 'no').
    //----------------------------------------------------------

    prevSortingOption: string = '';
    sortableList: Array<SortableItem> = new Array<SortableItem>();    
    sortableListBk: Array<SortableItem> = [];
    sortableListInit: Array<SortableItem> = [];
    sortableColumnCount: number;     
    baseSequenceOptions: Array<any> = [{
        value: -1, text: 'x'
    }];
    
    @Input("table-main") pagingParams: PagingParams;
    @Output() tableChanged: EventEmitter<PagingParams> = new EventEmitter<PagingParams>();
    
    //Calling components.
    private columnSortComponent = new Subject<any>();
    columnSortComponent$ = this.columnSortComponent.asObservable();

    private multiSortCommandComponent = new Subject<any>();
    multiSortCommandComponent$ = this.multiSortCommandComponent.asObservable();

    private sortingTypeComponent = new Subject<any>();
    sortingTypeComponent$ = this.sortingTypeComponent.asObservable();

    constructor(private element: ElementRef, private ngExTableConfig: NgExTableConfig,
        private clientPaginationService: ClientPaginationService, private messageService: MessageTransferService,
        private renderer: Renderer2) {
    }

    ngOnInit() {    
        this.config = this.ngExTableConfig.main;

        //2/16/2021 Change sortingRunMode and sortingTypeSwitch values from 1 to 0 (see details in table-main.directive.ts)
        //Switch default sortingOption 'multiple' to 'single' for below conditions.
        if (this.sortingRunMode == 0) {
            //single/multiple mode.
            if (this.sortingTypeSwitch == 0) {
                //crtl-key type: initially set to 'single'. Will update after table loading in initSortableList().
                this.sortingOption = 'single';
            }
            else { //if (this.sortingTypeSwitch == 1) {
                //Dropdown type: must set enableOptionBoard and showOptionBoardContent in case not set.
                this.enableOptionBoard = 'yes';
                this.showOptionBoardContent = 'yes';
            }
        }
        else {
            this.sortingOption = 'single';
        }

        this.prevSortingOption = this.sortingOption;
        this.sortableColumnCount = this.element.nativeElement.getElementsByTagName('column-sort').length;

        let pThis: any = this;
        //Call from other structures via message service to set pagingParams before data loading.
        this.subscription_1 = this.messageService.subscribe('tableMain_setPagingParamsBeforeData', (eventData) => {
            pThis.setPagingParamsBeforeData();
        });
    }

    ngOnDestroy() {
        this.subscription_1.unsubscribe();
    }

    //ngOnChanges(changes: { [key: string]: SimpleChange }): any {
    //    let tc = changes;
    //    let te = this.pagingParams;
    //}

    //Called from each columnSortComponent.
    initSortableList(sortableItem: SortableItem) {
        //If no active sort item specified in HTML template, then check for default init settings in grid component ts.
        if (sortableItem.sequence == -1 || sortableItem.sortDirection == '') {
            if (this.pagingParams.sortList.length > 0) {
                for (let seq: number = 1; seq <= this.pagingParams.sortList.length; seq++) {
                    if (this.pagingParams.sortList[seq].sortBy == sortableItem.sortBy) {
                        sortableItem.sortDirection = this.pagingParams.sortList[seq].sortDirection;
                        sortableItem.sequence = seq;
                        break;
                    }
                }
            }
        }

        //In case more than one sorted columns for 'single' sorting option.
        if (this.sortingOption == 'single' && sortableItem.sequence > 1) {
            if (this.sortingTypeSwitch == 0) {
                //crtl-key type multi-column sorting - set to 'single' in onInit() as for most cases.
                //But need to set to 'multiple' in case it sets multi columns in table template.
                this.sortingOption = 'multiple';
            }
            else {
                sortableItem.sortDirection = '';
                sortableItem.sequence = -1;
            }            
        }

        this.sortableList.push(sortableItem); 

        //Set all init sorting parameters when completed building sortableList.
        if (this.sortableList.length == this.sortableColumnCount) {
            //Set sequenceOptions.
            this.refreshSortSettings();

            //Transfer active sortable items to pagingParams.sortList.
            this.updatePagingParamsWithSortSettings();

            //Cache pagingParams.sortList for getting init settings when needed later.
            this.sortableListInit = commonMethods.deepClone(this.sortableList);

            //Cache for cancel action.
            this.sortableListBk = commonMethods.deepClone(this.sortableList);            

            //For server-side pagination and when all init sortableItems have been loaded.
            //if (this.paginationType == PaginationType.server) {
            //    this.initDataLoadWithSorting();
            //}            
        }       
    }
        
    initDataLoadWithSorting() {
        //In init phase and with isFilterForInit = false, call this method will directly load data and show the grid.
        //If filtering data for init data loading with isFilterForInit = true, then see the setPagingParamsBeforeData() method.
        if (!this.isFilterForInit) {
            this.tableChanged.emit(this.pagingParams); 
            this.hasInitDone = true;
        }               
    }    

    refreshSortSettings() {
        //Reset sequence options.
        this.baseSequenceOptions.length = 1;
                
        if (this.sortingOption == 'multiple') {
            //type: init or column. Build sequenceOptions.
            for (let seq: number = 1; seq <= this.sortableList.length; seq++) {
                for (let idx: number = 0; idx < this.sortableList.length; idx++) {
                    if (this.sortableList[idx].sequence == seq) {
                        this.baseSequenceOptions.push({
                            value: seq, text: seq.toString()
                        });
                        break;
                    }
                }
            }
        }

        //Refresh sequence selected,
        let params: NameValueItem = {
            name: 'refreshSequenceSelected',
            value: undefined
        }
        this.columnSortComponent.next(params);

        //Refresh sorting icons, both single and multiple.
        params = {
            name: 'refreshSortingIcon',
            value: undefined
        }
        this.columnSortComponent.next(params);        
    }

    private updatePagingParamsWithSortSettings() {
        //Transfer active sortable items to pagingParams.sortList.
        this.pagingParams.sortList = [];
        for (let num: number = 1; num <= this.sortableList.length; num++) {
            for (let idx: number = 0; idx < this.sortableList.length; idx++) {
                if (this.sortableList[idx].sequence == num) {
                    let sortItem: SortItem = {
                        sortBy: this.sortableList[idx].sortBy,
                        sortDirection: this.sortableList[idx].sortDirection
                    };
                    this.pagingParams.sortList.push(sortItem);
                    break;
                }
            }
            if (this.sortingOption == 'single' && num == 1) {
                break;
            }
        }
    }

    sortChanged(type: SortChangedType) {
        //Call to transfer active sortable items to pagingParams.sortList.
        this.updatePagingParamsWithSortSettings();
              
        this.pagingParams.changeType = TableChange.sorting;

        //Set pagingParams before data loading based on config value.
        this.setPagingParamsBeforeData();

        if (this.sortingOption == 'single') {
            //First time select sorting column for ctrl-key type (no need to call again if sortChangedType.cancel).
            if (this.sortingTypeSwitch == 0 && type != SortChangedType.cancel) {
                //Save Bk arrays from last action for possible cancel action later.
                this.sortableListBk = commonMethods.deepClone(this.sortableList);
            }

            //Call table consumer with updated pagingParams.
            this.tableChanged.emit();
        }
        else if (this.sortingOption == 'multiple') {
            switch (type) {
                case SortChangedType.column:
                    if (this.pagingParams.sortList.length == 1) {
                        //Directly submit changes and do not show command panel.
                        this.tableChanged.emit();
                        this.setShowMultiSortPanelFlag(false);

                        //Save Bk arrays from last action for possible cancel action later.
                        this.sortableListBk = commonMethods.deepClone(this.sortableList);
                    }
                    else if (this.pagingParams.sortList.length > 1) {
                        //Call multiSortCommandComponent method to show panel which will emit tableChanged there.                
                        this.setShowMultiSortPanelFlag(true);
                    }
                    else {
                        //Close multi sort panel if no sorted column selected.
                        this.setShowMultiSortPanelFlag(false);
                    }
                    break;
                case SortChangedType.option:
                    this.tableChanged.emit();
                    this.setShowMultiSortPanelFlag(false);
                    break;
                case SortChangedType.clearAll:
                    this.tableChanged.emit();
                    break;
                default:
                    //Do nothing, such as SortChangedType.cancel                    
            }
        }
    }

    getShowMultiSortPanelFlag(): boolean {
        let subjectParam: NameValueItem = {
            name: 'getShowMultiSortPanelFlag',
            value: undefined
        }
        this.multiSortCommandComponent.next(subjectParam);
        return subjectParam.value;
    }

    setShowMultiSortPanelFlag(flagValue: boolean) {
        //Reset sortingType to 'multiple' when opening command panel from previous selecting 'single'.
        if (this.sortingTypeSwitch == 0 && flagValue) {
            this.resetSortingType();
        }

        let subjectParam: NameValueItem = {
            name: 'setShowMultiSortPanelFlag',
            value: flagValue
        }
        this.multiSortCommandComponent.next(subjectParam);
    }

    resetSortingType() {
        let subjectParam: NameValueItem = {
            name: 'resetSortingType',
            value: this.sortingOption
        }
        this.sortingTypeComponent.next(subjectParam);
    } 

    //Multipe sorting.
    rearrangeSequence(oldSeq: number, newSeq: number, sortBy: string) {
        if (oldSeq > 0 && newSeq == -1) {
            //Re-arrange sequence if any sortableItem.sequence reset to -1.
            this.sortableList.forEach((item: SortableItem, index: number) => {
                if (item.sequence > oldSeq) {
                    item.sequence--;
                }
            });
        }
        else {
            //Change any sequence number in positive range.
            this.sortableList.forEach((item: SortableItem, index: number) => {
                if (item.sortBy != sortBy) {
                    if (item.sequence >= newSeq && item.sequence < oldSeq) {
                        item.sequence++;
                    }
                    else if (item.sequence <= newSeq && item.sequence > oldSeq) {
                        item.sequence--;
                    }
                }
            });            
        }              
    }
        
    submitMultiSortAction() {
        //Send actual multi sorting command to grid page.
        this.tableChanged.emit(this.pagingParams);

        //Save Bk arrays from last action for possible cancel action later.
        this.sortableListBk = commonMethods.deepClone(this.sortableList);
    }

    cancelMultiSortAction() {
        //Need to assign BK object back one by one. Use deepClone will lose object reference.
        this.sortableListBk.forEach((item: SortableItem, index: number) => {
            this.sortableList[index].sortDirection = item.sortDirection;
            this.sortableList[index].sequence = item.sequence;
        });
        this.refreshSortSettings();
        this.sortChanged(SortChangedType.cancel);

        //Reset to single type if sorting seq value is 1 for Ctrl/Shift key mode.
        //2/16/2021 Change flag value from 1 to 0 (see details in table-main.directive.ts)
        if (this.sortingTypeSwitch == 0 && !this.baseSequenceOptions.find(a => a.value > 1)) {
            this.sortingOption = 'single';
        }
    }

    clearMultiSortings() {
        this.sortableList.forEach((item: SortableItem, index: number) => {
            item.sequence = -1;
            item.sortDirection = '';
        }); 
        this.refreshSortSettings();
        this.sortChanged(SortChangedType.clearAll);  

        //Reset to single type for using Ctrl/Shift key mode.
        //2/16/2021 changed flag from 1 to 0 (see table-main.directive.ts)
        if (this.sortingTypeSwitch == 0) {
            this.sortingOption = 'single';
        }
    }

    toSingleColumnSorting_S1() {
        this.sortingOption = 'single';
        this.switchSortingOption();

        //Save Bk arrays from last action for possible cancel action later.
        this.sortableListBk = commonMethods.deepClone(this.sortableList);
    }    

    switchSortingOption() {
        //2/16/2021 Change two flag values from 1 to 0 (see details in table-main.directive.ts)
        if (this.sortingRunMode == 0 && this.sortingTypeSwitch == 1 && this.sortingOption == this.prevSortingOption) {
            //Do not proceed if no change is made for multiple column sorting with dropdown selection type.
            return;
        }
        if (this.sortingOption == 'single') {
            let pThis: any = this;
            this.sortableList.forEach((item: SortableItem, index: number) => {
                if (item.sequence != 1) {
                    item.sequence = -1;
                    item.sortDirection = '';
                }
            });          

            //Close multi sort panel if opened.
            this.setShowMultiSortPanelFlag(false); 
        }
        else if (this.sortingOption == 'multiple') {
            //Set the active sortableItem.sequence to 1.
            for (let idx: number = 0; idx < this.sortableList.length; idx++) {
                if (this.sortableList[idx].sortDirection != '') {
                    this.sortableList[idx].sequence = 1; 
                    break;
                }
            }
        }
        this.refreshSortSettings();
        this.sortChanged(SortChangedType.option); 
        this.prevSortingOption = this.sortingOption;
    }

    private undoSortSettingsAndSortList() {
        //Need to assign BK object back one by one. Use deepClone will lose object reference.
        this.sortableListBk.forEach((item: SortableItem, index: number) => {
            this.sortableList[index].sortDirection = item.sortDirection;
            this.sortableList[index].sequence = item.sequence;
        });
        this.refreshSortSettings();
        this.updatePagingParamsWithSortSettings();
    }

    private resetToInitSortList() {
        //Not called for init step. 
        if (this.hasInitDone) {
            this.sortableListInit.forEach((item: SortableItem, index: number) => {               
                if (this.sortingOption == 'multiple' ||
                    (this.sortingOption == 'single' && item.sequence == 1)) {
                    this.sortableList[index].sortDirection = item.sortDirection;
                    this.sortableList[index].sequence = item.sequence;
                }
                else {
                    this.sortableList[index].sortDirection = '';
                    this.sortableList[index].sequence = -1;
                }
                
            });
            this.refreshSortSettings();
            this.updatePagingParamsWithSortSettings();            
        }
        else {
            this.hasInitDone = true;
        }
    }

    //Method called from table-hosting component before data retrieval.
    setPagingParamsBeforeData(pagingParams?: PagingParams) {
        if (pagingParams == undefined) {
            pagingParams = this.pagingParams;
        }
        if (pagingParams.changeType == TableChange.search) {
            //Set pageNumber based on config.
            if (this.config.pageNumberWhenSearchChange != -1) {
                pagingParams.pageNumber = this.config.pageNumberWhenSearchChange;
            }

            //Set to init sortList if not using current.
            if (this.config.sortingWhenSearchChange != "current") {
                this.resetToInitSortList();
            }
            else {
                if (this.sortingOption == 'multiple' && this.getShowMultiSortPanelFlag() == true) {
                    this.undoSortSettingsAndSortList();
                }
            }
            if (this.sortingOption == 'multiple' && this.getShowMultiSortPanelFlag() == true) {
                //Closing the multi sort panel if it's open.
                this.setShowMultiSortPanelFlag(false);
            }
        }
        else if (pagingParams.changeType == TableChange.sorting) {
            ////For sorting change, set pageNumber based on config.
            if (this.config.pageNumberWhenSortingChange != -1) {
                pagingParams.pageNumber = this.config.pageNumberWhenSortingChange;
            }
        }
        else if (pagingParams.changeType == TableChange.pageSize) {
            //Set to init sortList if not using current.
            if (this.config.sortingWhenPageSizeChange != "current") {
                this.resetToInitSortList();
            }
            else {
                if (this.sortingOption == 'multiple' && this.getShowMultiSortPanelFlag() == true) {
                    this.undoSortSettingsAndSortList();
                }
            }
            if (this.sortingOption == 'multiple' && this.getShowMultiSortPanelFlag() == true) {
                //Closing the multi sort panel if it's open.
                this.setShowMultiSortPanelFlag(false);
            }
        }
        else if (pagingParams.changeType == TableChange.pageNumber) {
            //Undo sort settings and close multi sort panel if it's open.
            if (this.sortingOption == 'multiple' && this.getShowMultiSortPanelFlag() == true) {
                this.undoSortSettingsAndSortList();
                this.setShowMultiSortPanelFlag(false);
            }
        }
    }    
    
    //Method called from table-hosting component after obtaining data. No need for TableChange.init.
    updatePagerAfterData(pagingParams: PagingParams, totalLength: number) {
        if (pagingParams.changeType == TableChange.search) {
            //Data items can only fit page 1.
            if (totalLength && (totalLength <= pagingParams.pageSize && pagingParams.pageNumber != 1)) {
                pagingParams.pageNumber = 1;
            }
            //Call PaginationComponent to set changeType and run selectPage method.
            this.updatePagerForChangeType(pagingParams.changeType, pagingParams.pageNumber);
        }
        else {
            //For sorting or pageSize change, set pageNumber based on config.
            if (pagingParams.changeType == TableChange.sorting ||
                pagingParams.changeType == TableChange.pageSize) {
                this.updatePagerForChangeType(pagingParams.changeType, pagingParams.pageNumber);
            }
        }        
    }

    //Generic method.
    private updatePagerForChangeType(changeType: TableChange, pageNumber: number) {
        //Call PaginationComponent to set changeType and run selectPage method.
        let paramesToUpdatePager: ParamsToUpdatePager = {
            changeType: changeType,
            pageNumber: pageNumber
        };
        this.messageService.broadcast('tableMain_paginationComponent', paramesToUpdatePager);
    }

    setRowGroupLines(trHead: ElementRef, trItems: QueryList<any>) {
        let pThis: any = this;
        let sortColumnIndex: number = -1;

        //Remove any exist grouping line.
        trItems.changes.subscribe(trList => {
            trList.forEach((tr: any, index: number) => {
                pThis.renderer.removeClass(tr.nativeElement, 'row-group-line');
            });
        });

        if (this.showGroupingLines == 'yes' && this.pagingParams.sortList.length > 0) {
            //Need conversion to true array.
            let thItems: any = Array.prototype.slice.call(trHead.nativeElement.childNodes);
            for (let idx: number = 0; idx < thItems.length; idx++) {
                if (thItems[idx].innerHTML.indexOf(this.pagingParams.sortList[0].sortBy) > 0) {
                    sortColumnIndex = idx;
                    break;
                }
            }

            trItems.changes.subscribe(trList => {
                //let trList = this.tableRows.nativeElement.getElementsByTagName("tr");               
                let prevInnerText: string = trList.first.nativeElement.childNodes[sortColumnIndex].innerText;
                let isSameCount: number = 1;

                trList.forEach((tr: any, index: number) => {                    
                    if (index > 0 && tr.nativeElement.childNodes[sortColumnIndex].innerText != prevInnerText) {
                        pThis.renderer.addClass(tr.nativeElement, 'row-group-line');                        
                    }
                    prevInnerText = tr.nativeElement.childNodes[sortColumnIndex].innerText;
                });
            });
        }
    }
}
