# ngex-table

This is an Angular data grid library configured with the starting attribute directive in normal HTML table element. It supports applications with Angular versions 8 - 11. The libray was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.

## Installation

Run `npm install ngex-table` to add the library into your project directory,, or add `"ngex-table": "^11.0.2"` to the package.json file and then run `npm install` to update the existing package.

## Details and Use Cases

To see how to use the grid tool in details, please view the articles [https://www.codeproject.com/Articles/1228928/Client-and-Server-Side-Data-Filtering-Sorting-and](Client and Server-Side Data Filtering, Sorting, and Pagination with Angular NgExTable) and [Multiple Column Sorting: from Angular NgExTable to Source Data List Management](https://www.codeproject.com/Articles/5166021/Multiple-Column-Sorting-from-Angular-NgExTable-to).

The sample applications with the article also include those that directly use the TypeScript code of the  modules and components in the *NgExTable* (will update to *ngex-table*) directory. 

## Demo Application

The source code can be downloaded from the [github repository](https://github.com/shenweiliu/ngex-table).


## Notes on Styles

The grid tool depends on the bootstrap css library. The tool supports the *bootstrap.css* versions 3.3.7 to 4.3.1. You can add the `bootstrap` into your package.json file, for example `"bootstrap": "4.3.1"`, and then update the `node_modules`. 

The *ngex-table.css* file containing all base style settings for the grid tool is not included in the installed library. You may need to have it under the *app-bootstrap.css{verion}/src/assets/css* folder from the [github repository](https://github.com/shenweiliu/ngex-table). 
