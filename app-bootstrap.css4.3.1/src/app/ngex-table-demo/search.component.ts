import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChange, ViewChild } from '@angular/core';
import { AngularMyDatePickerDirective, IAngularMyDpOptions, IMyDateModel, IMyInputFieldChanged, IMyCalendarViewChanged, IMyMarkedDate, IMyDate, IMyDefaultMonth } from 'angular-mydatepicker';
import { PaginationType } from 'ngex-table';
import { MyDatePickConfig } from './services/app.config';
import { ProductSearchTypes, ProductStautsTypes } from './services/local-data';
import { ClientDataFilterService } from './services/client-data-filter.service';
import * as commonMethods from 'ngex-table';
import * as glob from './services/globals';

@Component({
    moduleId: module.id.toString(),
    selector: 'search',
    templateUrl: "./search.component.html",
    styleUrls: ["./search.component.css"]
})
export class SearchComponent implements OnInit {

    @Input() paginationType: any; //client or server.
    @Input() clientDataList: Array<any>; //For client pagination.
    @Input() searchParams: any;  //For server pagination.
    @Output() searchChanged: EventEmitter<any> = new EventEmitter<any>();

    
    searchTitle: string = "Search Products";
    errorMessage: string = "";
    search: any = {};
    previousSearch: any = {};
    productSearchTypes: any;
    productStatusTypes: any;    

    //MyDatePicker.
    myDatePickerOptions: IAngularMyDpOptions = MyDatePickConfig;
    @ViewChild('dpFrom') dpFrom: AngularMyDatePickerDirective;
    @ViewChild('dpTo') dpTo: AngularMyDatePickerDirective;

    defMonth: IMyDefaultMonth = {
        defMonth: ''
    };
    dpDisabled: boolean = false;
    //End of MyDatePicker.

    constructor(private dataFilterService: ClientDataFilterService) {
    }

    ngOnInit(): void {
        this.setDefaultSearchItems();
        this.productSearchTypes = ProductSearchTypes;
        this.productStatusTypes = ProductStautsTypes;

        //Set title for client data filter.
        if (this.paginationType == PaginationType.client) {
            this.searchTitle = "Filter Products";
        }
    }

    onChange(newValue) {
        //Clear value if any when selecting none.
        if (newValue == "") {
            this.search.searchText = "";
        }        
    }

    setDefaultSearchItems() {
        //Dropdowns.
        this.search.searchType = "";
        this.search.statusCode = "";

        //Search parameter.
        this.search.searchText = "";
        this.search.priceLow = "";
        this.search.priceHigh = "";
        this.search.dateFrom = "";
        this.search.dateTo = "";

        this.errorMessage = "";
        //this.showProductList = false;
    }
    
    searchGo(event?: Event): void {
        //Clear error message if any.
        this.errorMessage = ""; 

        //Check if search parameters change.
        if (JSON.stringify(this.search) === JSON.stringify(this.searchParams)) {
            return;
        }

        //Validate search inputs.
        let isValid: boolean = false;

        if ((this.search.searchType != "" && this.search.searchText == "") ||
            (this.search.searchType == "" && this.search.searchText != "")) {
            this.errorMessage = "Invalid Search by values.";
        }

        if (this.search.priceLow != "" || this.search.priceHigh != "") {
            let priceLow = this.search.priceLow;
            if (priceLow != "" && !glob.isNumeric(priceLow)) {
                this.errorMessage += "Invalid Price Low value.\n";
                //priceLow = ""; //Enable this if non-obstructive.
            }
            let priceHigh = this.search.priceHigh;
            if (priceHigh != "" && !glob.isNumeric(priceHigh)) {
                this.errorMessage += "Invalid Price High value.\n";
                //priceHigh = ""; //Enable this if non-obstructive.
            }
            //High should not be smaller than Low.
            if (priceLow != "" && priceHigh != "") {
                if (parseFloat(priceLow) > parseFloat(priceHigh)) {
                    this.errorMessage += "Price High should be greater or equal to Price Low.\n";
                }
            }
        }
        //Datepicker input ngModel:
        //object: valid date; null: invalid date; "": blank entry. 
        if (this.search.dateFrom != "" || this.search.dateTo != "") {
            let dateFrom = this.search.dateFrom;
            if (dateFrom == null) {
                //validate some values such as "02/30/2014" as invalid.
                this.errorMessage += "Invalid Available From date.\n";
            }
            let dateTo = this.search.dateTo;
            if (dateTo == null) {
                this.errorMessage += "Invalid Available To date.\n";
            }
            //From should not be later than To.
            if (dateFrom && dateFrom != "" && dateTo && dateTo != "") {
                if (dateFrom.singleDate.jsDate > dateTo.singleDate.jsDate) {
                    this.errorMessage += "Available To date should be greater or equal to Available From date.\n";
                }
            }
        }
        if (this.errorMessage != "") {
            return;
        }

        //Clone search to searchParams.
        this.searchParams = commonMethods.deepClone(this.search); 

        //Call to process client or server search items.
        if (this.paginationType == PaginationType.client && this.clientDataList) {
            this.processClientSearch();
        }
        else {
            this.processServerSearch();
        }        
    }

    processClientSearch() {        
        //Clone a new data list to be used and do not change existing data list.
        let filteredDataList: Array<any> = commonMethods.deepClone(this.clientDataList);
        filteredDataList = this.dataFilterService.getFilteredDataList(filteredDataList, this.search);
                
        this.searchChanged.emit(filteredDataList);
    }

    processServerSearch() {
        this.searchChanged.emit(this.search);       
    }    
}
