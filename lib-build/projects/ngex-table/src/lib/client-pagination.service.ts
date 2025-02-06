import { Injectable } from '@angular/core';
import { MessageTransferService } from './message-transfer.service';
import { PagingParams, SortItem, ClientPaginationOutput } from './model-interface';
import { NgExTableConfig } from './ngex-table.config';
import * as commonMethods from './common-methods';

@Injectable()
export class ClientPaginationService {
    config: any;
    //initSortList: Array<SortItem>; 
    
    constructor(ngExTableConfig: NgExTableConfig) {
        this.config = ngExTableConfig.main;
    }

    processData(pagingParams: PagingParams, dataList: Array<any>): ClientPaginationOutput {
        let sortedData: Array<any>;
        let dataListClone: Array<any>;

        //Keep passed dataList unchanged after sorting.
        dataListClone = commonMethods.deepClone(dataList);
        
        //Get sortList from column-sort.component html template if specified there.


        let output: ClientPaginationOutput = {
            pagingParams: {
                pageSize: pagingParams.pageSize,
                pageNumber: pagingParams.pageNumber,
                sortList: pagingParams.sortList,                
                changeType: pagingParams.changeType
            },
            dataList: []
        };  
        if (pagingParams) {
            //single sort.
            if (pagingParams.sortList.length == 0) {
                //Initial.
                sortedData = dataList;
            }
            else if (pagingParams.sortList.length > 0) {
                sortedData = this.changeSort(pagingParams, dataListClone);
            }            
            output = this.getPagedData(pagingParams, sortedData);

            //Return refreshed pagingParams.
            output.pagingParams.sortList = pagingParams.sortList;            
            
            return output;
        }
    }

    //Sorting logic.
    changeSort(pagingParams: PagingParams, data: Array<any>): Array<any> {        
        let pThis: any = this;
        let rtnArr: any = data.sort((previous: any, current: any) => {
            //Sort firstly-available column with different comparison items along the sortList.
            let idx: number = 0; 
            while (idx < pagingParams.sortList.length) {
                if (current[pagingParams.sortList[idx].sortBy] !== previous[pagingParams.sortList[idx].sortBy]) {
                    return pThis.doSort(previous, current, pagingParams.sortList, idx);
                }
                idx++;
            }            
            return 0;            
        });        
        return rtnArr;
    }        

    private doSort(previous: any, current: any, sortList: Array<SortItem>, idx: number): number {        
        //Null is sorted to the last for both asc and desc.
        if (previous[sortList[idx].sortBy] === null) {
            return 1;
        }
        else if (current[sortList[idx].sortBy] === null) {
            return -1;
        }
        else if (previous[sortList[idx].sortBy] > current[sortList[idx].sortBy]) {
            return sortList[idx].sortDirection === 'desc' ? -1 : 1;
        }
        else if (previous[sortList[idx].sortBy] < current[sortList[idx].sortBy]) {
            return sortList[idx].sortDirection === 'asc' ? -1 : 1;
        }
        return 0;
    }

    getPagedData(pagingParams: PagingParams, sortedData: Array<any>): ClientPaginationOutput {
        let pagedData: Array<any>;
        let output: ClientPaginationOutput = {
            pagingParams: {
                pageSize: pagingParams.pageSize,
                pageNumber: pagingParams.pageNumber,
                sortList: pagingParams.sortList,                
                changeType: pagingParams.changeType 
            },
            dataList: []
        };

        if (!sortedData) {
            return output;
        }

        if (pagingParams && pagingParams.pageNumber && pagingParams.pageSize) {            

            //Handle pageNumber no available for data length.
            let allowedPageNumber: number = Math.ceil(sortedData.length / pagingParams.pageSize);
            if (allowedPageNumber < pagingParams.pageNumber) {
                pagingParams.pageNumber = allowedPageNumber;
            }
            let start = (pagingParams.pageNumber - 1) * pagingParams.pageSize;
            let end = pagingParams.pageSize > -1 ? (start + pagingParams.pageSize) : sortedData.length;
            output.dataList = sortedData.slice(start, end);

            //Return refreshed pagingParams.
            output.pagingParams.pageNumber = pagingParams.pageNumber;
            output.pagingParams.pageSize = pagingParams.pageSize;
        }
        else {
            output.dataList = sortedData;
        } 
        return output;
    }
}