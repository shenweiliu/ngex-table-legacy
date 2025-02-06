import {
    OnChanges, SimpleChange, Component, EventEmitter, ViewChild, ElementRef, Input, Output, OnInit, Renderer2
} from '@angular/core';
import { TableMainDirective } from './table-main.directive';
import { NgExTableConfig } from './ngex-table.config';
import { PagingParams, SortableItem, NameValueItem } from './model-interface';
import { TableChange, SortChangedType } from './constants';
import * as commonMethods from './common-methods';

@Component({    
    //moduleId: module.id.toString(),
    selector: 'column-sort',
    templateUrl: './column-sorting.component.html'
})
export class ColumnSortingComponent implements OnInit, OnChanges {
    config: any;
    sortableItem: SortableItem;
    sequenceOptions: Array<any> = []; 
    sequenceSelected: any = {}; 
    showSequenceOption: boolean = false;
    toggleWithOriginalDataOrder: boolean;
    ctrlKeyHint: string = '';
    ctrlKeyHintText: string = 'Press Ctrl + click enable multiple column sorting';

    @Input() sortBy: string;
    @Input() sortDirection: string;
    @Input() sequence: number;
    @ViewChild('sortIcon', { static: true }) sortIcon: ElementRef;
    @ViewChild('sequenceDiv', { static: false }) sequenceDiv: ElementRef; 
    @ViewChild('sequenceSelect', { static: false }) sequenceSelect: ElementRef;     

    constructor(private ngExTableConfig: NgExTableConfig, private tableMainDirective: TableMainDirective,
                private renderer: Renderer2) {        
        let pThis: any = this;
        //Method called from TableMainDirective to reset sorting UI.
        this.tableMainDirective.columnSortComponent$.subscribe((params: NameValueItem) => {            
            if (params.name == 'refreshSequenceSelected') {
                pThis.refreshSequenceSelected();
            }
            else if (params.name == 'refreshSortingIcon') {
                pThis.refreshSortingIcon();
            }             
        });
    }  

    ngOnInit(): void {
        this.config = this.ngExTableConfig.main;
        if (this.config.toggleWithOriginalDataOrder !== undefined) {
            this.toggleWithOriginalDataOrder = this.config.toggleWithOriginalDataOrder;
        }

        //Set sorting icon styles.
        this.renderer.addClass(this.sortIcon.nativeElement, this.config.sortingIconCssLib);        
        this.renderer.setStyle(this.sortIcon.nativeElement, 'color', this.config.sortingIconColor);
        if (this.config.sortingIconLocation == 'column-right') {
            this.renderer.addClass(this.sortIcon.nativeElement, 'float-pad-right');
        }

        //Populate sortableItem and add sortable column to sortableList in parent.
        this.sortableItem = {
            sortBy: this.sortBy,
            sortDirection: this.sortDirection || '',
            sequence: this.sequence || -1
        };
        if (this.tableMainDirective.sortingOption == 'single' && this.sortableItem.sortDirection != '' && this.sortableItem.sequence == undefined) {
            this.sortableItem.sequence == 1;
        }
        this.tableMainDirective.initSortableList(this.sortableItem);                         
    }

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {        
    }
    
    toggleSort($event: any) {
        let pThis: any = this;                

        //2/16/2021 Change setting values to 1 from 0 for both flags (see details in table-main.directive.ts) 
        if (this.tableMainDirective.sortingRunMode == 0 && this.tableMainDirective.sortingTypeSwitch == 0 &&
            ($event.ctrlKey || $event.shiftKey) && !this.tableMainDirective.baseSequenceOptions.find(a => a.value > 1)) {
            if (this.tableMainDirective.sortingOption == 'single') {
                //Switch to multiple mode.
                this.tableMainDirective.sortingOption = 'multiple';
            }
        }       

        switch (this.sortableItem.sortDirection) {
            case 'asc':
                this.sortableItem.sortDirection = 'desc';
                break;
            case 'desc':
                //Toggle for "no-sort" status is not needed for multi-column sorting if > 1 columns are selected. 
                if (this.tableMainDirective.sortingOption == 'multiple' && this.sequenceOptions.find(a => a.value > 1)) {
                    this.sortableItem.sortDirection = 'asc';
                }
                else {
                    this.sortableItem.sortDirection = this.toggleWithOriginalDataOrder ? '' : 'asc';
                }                
                break;
            default:
                //Existing sortDirection is ''.
                this.sortableItem.sortDirection = 'asc';
                break;
        }
                  
        if (this.tableMainDirective.sortingOption == 'single') {
            //For single column sorting - set sequence for this item and remove sequence values for all othsers.
            this.tableMainDirective.sortableList.forEach((item: any, index: number) => {
                if (item === pThis.sortableItem) {
                    //This ColumnSortComponent item.
                    if (this.sortableItem.sortDirection != '') {
                        item.sequence = 1;
                    }
                    else {
                        item.sequence = -1;
                    }
                }
                else {
                    //Other ColumnSortComponent items.
                    item.sequence = -1;
                }
            });            
        }
        else if (this.tableMainDirective.sortingOption == 'multiple') {
            if (this.sortableItem.sortDirection == '') {                
                //Condition changes from sorting to no sorting.
                if (this.sortableItem.sequence != -1) {
                    let oldSeq: number = this.sortableItem.sequence;
                    this.sortableItem.sequence = -1;                  

                    //Call to re-arrange sequence numbers. 
                    this.tableMainDirective.rearrangeSequence(oldSeq, this.sortableItem.sequence, this.sortBy);                    
                }              
            }
            else {
                //Auto check and set sequence num, if not already set, for this item.
                if (this.sortableItem.sequence == -1) {
                    this.sortableItem.sequence = this.tableMainDirective.pagingParams.sortList.length + 1;                    
                }
            }            
        }

        //Call TableMainDirective and then back call each ColumnSortComponent to reset sorting settings if changed.
        this.tableMainDirective.refreshSortSettings();

        //Refresh pagingParams.sortList and open multiSortCommand panel.
        this.tableMainDirective.sortChanged(SortChangedType.column);
    }
        
    onSequenceChange(event: any) {
        //Click dropdown and can only select "x" (close) or switch sequence number used by other columns. 
        if (event.value == this.sortableItem.sequence) {
            return;
        }
        else {
            let oldSeq: number = this.sortableItem.sequence;
            this.sortableItem.sequence = event.value;
                        
            //Call to re-arrange sequence numbers. 
            this.tableMainDirective.rearrangeSequence(oldSeq, this.sortableItem.sequence, this.sortBy);                
            
            //Call TableMainDirective and then back call each ColumnSortComponent to reset sorting settings if changed.
            this.tableMainDirective.refreshSortSettings();
            
            //Refresh pagingParams.sortList and open multiSortCommand panel.
            this.tableMainDirective.sortChanged(SortChangedType.column);   
        }             
    }    

    refreshSequenceSelected() {
        if (this.tableMainDirective.sortingOption == 'single') {
            this.showSequenceOption = false;
        }
        else if (this.tableMainDirective.sortingOption == 'multiple') {
            //Refreshing sequenceSelected.
            if (this.sortableItem.sequence != -1) { // && this.sortableItem.sequence != this.sequenceSelected.value) {
                //Load current sequenceOptions dropdown.
                this.sequenceOptions = commonMethods.deepClone(this.tableMainDirective.baseSequenceOptions);

                for (let idx: number = 0; idx < this.sequenceOptions.length; idx++) {
                    if (this.sequenceOptions[idx].value == this.sortableItem.sequence) {
                        this.sequenceSelected = this.sequenceOptions[idx];
                        //Hide sequence if only one sorted column.
                        if (this.sequenceOptions.find(a => a.value > 1)) {
                            this.showSequenceOption = true;
                        }
                        else {
                            this.showSequenceOption = false;

                            //Switch to single column sorting for ctrl-key type.
                            //2/16/2021 changed two flag from 1 to 0 (see details in table - main.directive.ts).
                            if (this.tableMainDirective.sortingRunMode == 0 && this.tableMainDirective.sortingTypeSwitch == 0) {
                                this.tableMainDirective.sortingOption = 'single';
                                this.tableMainDirective.setShowMultiSortPanelFlag(false);
                            }
                        }                        
                        break;
                    }
                }
            }
            else { //if (this.sortableItem.sequence == -1 && this.sequenceOptions) {
                if (this.sequenceOptions && this.sequenceOptions.length > 1) {
                    this.sequenceOptions.length = 1;
                }
                this.showSequenceOption = false;
            }
        }
    }

    refreshSortingIcon() {
        //For both single and multiple column sorting.
        if (this.sortableItem.sequence == -1) {
            this.sortableItem.sortDirection = '';
        }

        if (this.sortableItem.sortDirection == '') {
            this.renderer.removeClass(this.sortIcon.nativeElement, this.config.sortingAscIcon);
            this.renderer.removeClass(this.sortIcon.nativeElement, this.config.sortingDescIcon);
            this.renderer.addClass(this.sortIcon.nativeElement, this.config.sortingBaseIcon);
        }
        else if (this.sortableItem.sortDirection == 'asc') {
            this.renderer.removeClass(this.sortIcon.nativeElement, this.config.sortingBaseIcon);
            this.renderer.removeClass(this.sortIcon.nativeElement, this.config.sortingDescIcon);
            this.renderer.addClass(this.sortIcon.nativeElement, this.config.sortingAscIcon);
        }
        else if (this.sortableItem.sortDirection == 'desc') {
            this.renderer.removeClass(this.sortIcon.nativeElement, this.config.sortingBaseIcon);
            this.renderer.removeClass(this.sortIcon.nativeElement, this.config.sortingAscIcon);
            this.renderer.addClass(this.sortIcon.nativeElement, this.config.sortingDescIcon);
        }

        //Set ctrlKeyHint.
        if (this.tableMainDirective.sortingTypeSwitch == 0 &&
            this.tableMainDirective.sortingOption == 'single' &&
            this.tableMainDirective.sortableList.find(a => a.sequence > 0 && a.sequence < 2) &&
            this.sortableItem.sequence == -1) {
            this.ctrlKeyHint = this.ctrlKeyHintText;
        }
        else {
            this.ctrlKeyHint = '';
        }
    }
}
