import { Component, Output, EventEmitter, HostListener, ViewChild, ElementRef } from '@angular/core';

@Component({
    moduleId: module.id.toString(),
    selector: 'side-menu',
    templateUrl: "./side-menu.component.html",
    styleUrls: ["./side-menu.component.css"]
})
export class SideMenuComponent {    
    @ViewChild('menuItems', { static: true }) menuItems: ElementRef;    
    @Output() menuItemVisited: EventEmitter<boolean> = new EventEmitter<boolean>();
    constructor() {
    }

    menuItemClicked() {
        this.menuItemVisited.emit(true);
    }
}
