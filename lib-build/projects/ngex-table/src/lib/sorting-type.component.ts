import { Component, OnInit, OnChanges, SimpleChange, Input, Output, EventEmitter, Renderer2 } from '@angular/core';
import { NgExTableConfig } from './ngex-table.config';
import { TableMainDirective } from './table-main.directive';
import { SortingTypeLocation } from './constants';
import { NameValueItem } from './model-interface';

@Component({    
    //moduleId: module.id.toString(),
    selector: 'sorting-type',
    templateUrl: "./sorting-type.component.html"    
})
export class SortingTypeComponent implements OnInit {     
    config: any;    
    showSortingOptions: boolean;
    sortingOption: string; //ngModel for dropdown. 

    @Input() sortingTypeLocation: SortingTypeLocation;
   
    constructor(private ngExTableConfig: NgExTableConfig, private tableMainDirective: TableMainDirective, 
        private renderer: Renderer2) {
        let pThis: any = this;

        //Called from TableMainDirective to open this panel.
        this.tableMainDirective.sortingTypeComponent$.subscribe(
            (subjectParam: NameValueItem) => {
                if (subjectParam.name == 'resetSortingType') {
                    this.sortingOption = subjectParam.value;
                }
            }
        );
    }

    ngOnInit(): void {
        this.config = this.ngExTableConfig.main; 
        
        if (this.tableMainDirective.sortingRunMode == 0) {
            //single/multiple mode.
            if (this.sortingTypeLocation == SortingTypeLocation.optionPanel) {
                if (this.tableMainDirective.sortingTypeSwitch == 1) {
                    //Dropdown type.
                    this.showSortingOptions = true;
                }
                else if (this.tableMainDirective.sortingTypeSwitch == 0) {
                    //Ctrl-key type.
                    this.showSortingOptions = false;
                }                
            }
            else if (this.sortingTypeLocation == SortingTypeLocation.commandPanel) {
                if (this.tableMainDirective.sortingTypeSwitch == 0) {
                    //crtl-key type.
                    this.showSortingOptions = true;
                }
                else if (this.tableMainDirective.sortingTypeSwitch == 1) {
                    //Dropdown type.
                    this.showSortingOptions = false; 
                }                
            }
            this.sortingOption = this.tableMainDirective.sortingOption;
        }
        else {
            //single only mode.
            this.showSortingOptions = false;
        } 
    }

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {       
    }

    onSortingOptionChange($event: any) {
        this.tableMainDirective.sortingOption = this.sortingOption;        
        this.tableMainDirective.switchSortingOption();
    }    
}
