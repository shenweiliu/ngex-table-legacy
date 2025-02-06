import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
//import { HttpModule } from "@angular/http";
import { HttpClientModule } from '@angular/common/http';
import { routes } from './app.routes';
import { NgExTableModule } from 'ngex-table';
import { ClientPaginationService } from 'ngex-table';
import { AppComponent } from './app.component';
import { SideMenuComponent } from "./side-menu.component";
import { ClientPagingComponent } from './client-paging.component';
import { ServerPagingComponent } from './server-paging.component';
import { SearchComponent } from './search.component';
import { AngularMyDatePickerModule } from 'angular-mydatepicker';
import { HttpDataService } from './services/httpclient-data.service';
import { ClientDataFilterService } from './services/client-data-filter.service';
import { ServerMockDataService } from './services/server-mock-data.service';
import { MessageTransferService } from './services/message-transfer.service';

@NgModule({
    declarations: [
        AppComponent,        
        SideMenuComponent,
        ClientPagingComponent,
        ServerPagingComponent,
        SearchComponent
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        FormsModule,
        NgExTableModule,
        CommonModule,
        RouterModule.forRoot(routes),
        AngularMyDatePickerModule
    ],
    providers: [
        HttpDataService, 
        MessageTransferService,
        ClientPaginationService,
        ClientDataFilterService,
        ServerMockDataService
    ],
    entryComponents: [
    ],
    bootstrap: [AppComponent]
})

export class AppModule {
}
