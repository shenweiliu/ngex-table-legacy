import { Injectable } from '@angular/core';

@Injectable()
export class ClientDataFilterService {
    constructor() { }

    getFilteredDataList(dataList: Array<any>, filterParams: any): Array<any> {
        let pThis: any = this;
        let columnName: string = "";
        let itemValue: any;
        let rtn: boolean;

        //String type selected query parameters.            
        if (filterParams.searchType != "" && filterParams.searchText != "") {
            //Default to return rows.
            rtn = true;
            dataList = dataList.filter((itemData: any) => {
                itemValue = itemData[filterParams.searchType];
                if (itemValue) {
                    if (typeof itemValue === 'string') {
                        rtn = (itemValue.indexOf(filterParams.searchText) >= 0);
                    }
                    else {
                        itemValue = itemValue.toString();
                        rtn = (itemValue === filterParams.searchText);
                    }
                }
                else {
                    rtn = false;
                }
                return rtn;
            });
        }
        //Price range query parameters.
        if (filterParams.priceLow != "" || filterParams.priceHigh != "") {
            columnName = "UnitPrice";
            rtn = true;
            dataList = dataList.filter((itemData: any) => {
                if (itemData[columnName]) {
                    if (filterParams.priceLow == "" && filterParams.priceHigh == "") {
                        rtn = true;
                    }
                    else if (filterParams.priceLow != "" && filterParams.priceHigh != "") {
                        rtn = (itemData[columnName] >= parseFloat(filterParams.priceLow) &&
                            itemData[columnName] <= parseFloat(filterParams.priceHigh));
                    }
                    else if (filterParams.priceLow != "" && filterParams.priceHigh == "") {
                        rtn = (itemData[columnName] >= parseFloat(filterParams.priceLow));
                    }
                    else if (filterParams.priceLow == "" && filterParams.priceHigh == "") {
                        rtn = (itemData[columnName] <= parseFloat(filterParams.priceHigh));
                    }
                    return rtn;
                }
                else {
                    return false;
                }
            });
        }
        //Date range query parameters.
        if (filterParams.dateFrom != "" || filterParams.dateTo != "") {
            columnName = "AvailableSince";
            rtn = true;
            dataList = dataList.filter((itemData: any) => {
                //Date type query parameters when using MyDatePicker.
                //Return date - object: valid date; null: invalid date; "": blank entry.
                //filterParams[key].formatted
                if (itemData[columnName]) {
                    if (filterParams.dateFrom == "" && filterParams.dateTo == "") {
                        rtn = true;
                    }
                    else if (filterParams.dateFrom && filterParams.dateTo) {
                        rtn = (new Date(itemData[columnName]) >= filterParams.dateFrom.singleDate.jsDate &&
                            new Date(itemData[columnName]) <= filterParams.dateTo.singleDate.jsDate);
                    }
                    else if (filterParams.dateFrom && !filterParams.dateTo) {
                        rtn = (new Date(itemData[columnName]) >= filterParams.dateFrom.singleDate.jsDate);
                    }
                    else if (!filterParams.dateFrom && filterParams.dateTo) {
                        rtn = (new Date(itemData[columnName]) <= filterParams.dateTo.singleDate.jsDate);
                    }
                    return rtn;
                }
                else {
                    return false;
                }
            });
        }
        //Iterate other query parameters
        Object.keys(filterParams).forEach(function (key: string) {
            rtn = true;
            //Do not include any parameter that has no value.
            if (filterParams[key] != null && filterParams[key] != "") {
                if (key == "searchType" || key == "searchText" ||
                    key == "priceLow" || key == "priceHigh" ||
                    key == "dateFrom" || key == "dateTo") {
                    //Do nothing.
                }
                else {
                    //Add here if manual mapping is needed.
                    //Generic mapping.
                    columnName = pThis.camelize(key);

                    dataList = dataList.filter((itemData: any) => {
                        itemValue = itemData[columnName];
                        if (itemValue) {
                            if (typeof itemValue === 'string') {
                                rtn = (itemValue.indexOf(filterParams[key]) >= 0);
                            }
                            else {
                                itemValue = itemValue.toString();
                                rtn = (itemValue === filterParams[key]);
                            }
                        }
                        return rtn;
                    });
                }
            }
        });
        return dataList;
    }

    //Convert to UpperCamelCase.
    camelize(str: string): string {
        return str.replace(/\b\w/g, chr => chr.toUpperCase()).replace(/ /g, "");
    }

}
