import { TableChange, PaginationType } from './constants';

export interface PagingParams {
    pageSize: number;
    pageNumber: number;
    sortList: Array<SortItem>;
    changeType: any;
}

export interface ParamsToUpdatePager {
    changeType: TableChange;
    pageNumber: number;
}

export interface ClientPaginationOutput {
    pagingParams: PagingParams;
    dataList: Array<any>;        
}

export interface NameValueItem {
    name: string;
    value: any;
}

export interface ChangeWith {
    pageNumber: number;
    pageSize: number;
    sorting: number;
}

export interface SortableItem {    
    sortBy: string;
    sortDirection: string;
    sequence: number;
}

export interface SortItem {
    sortBy: string;
    sortDirection: string;
}

