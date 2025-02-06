import { Routes } from '@angular/router';
import { ClientPagingComponent } from './client-paging.component';
import { ServerPagingComponent } from './server-paging.component';

export const routes: Routes = [
    { path: "", redirectTo: "client-paging", pathMatch: "full" },    
    { path: 'client-paging', component: ClientPagingComponent },
    { path: 'server-paging', component: ServerPagingComponent }
];