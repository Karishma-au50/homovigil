import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '../../core/auth/auth.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    private authService = inject(AuthService);
    model: MenuItem[] = [];

    ngOnInit() {
        const userRole = this.authService.currentUser?.role;
        // console.log(userRole);

        const fullMenu = [
            {
                label: 'Overview',
                role: 'Admin',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/home'] },
                    { label: 'User Management', icon: 'pi pi-fw pi-user', routerLink: ['/users'] }
                ]
            },
            {
                label: 'Patient Management',
                role: 'Admin',
                items: [
                    // { label: 'New Patient Entry', icon: 'pi pi-fw pi-users', routerLink: ['/patient'] },
                    { label: 'Patient List', icon: 'pi pi-fw pi-users', routerLink: ['/allPatient'] }
                ]
            },
            {
                label: 'Bag Management',
                role: 'Admin',
                items: [
                    { label: 'Allocate Bag', icon: 'pi pi-fw pi-sitemap', routerLink: ['/allocateBag'] },
                    { label: 'Issue Bag', icon: 'pi pi-fw pi-sitemap', routerLink: ['/releaseBag'] },
                    { label: 'Blood Component Management', icon: 'pi pi-fw pi-sitemap', routerLink: ['/allocationHistory'] },
                    { label: 'Transfusion Update', icon: 'pi pi-fw pi-sitemap', routerLink: ['/transfusionUpdate'] }
                ]
            },
            {
                label: 'Sales Management',
                role: 'ward', // Custom property for filtering
                items: [
                    { label: 'Sales', icon: 'pi pi-fw pi-user', routerLink: ['/sales'] }
                ]
            },
            {
                label: 'Sales Management',
                role: 'sales', // Custom property for filtering
                items: [
                    { label: 'Sales', icon: 'pi pi-fw pi-user', routerLink: ['/sales'] }
                ]
            }
        ];

        this.model = this.filterMenuByRole(fullMenu, userRole);
    }

    // Inside AppMenu class
    filterMenuByRole(menu: any[], role: string | undefined): MenuItem[] {
        // 1. Normalize the role to lowercase for safe comparison
        const currentRole = role?.toLowerCase();

        // 2. Define privileged roles in lowercase
        const privilegedRoles = ['admin', 'user', 'ward'];

        return menu
            .filter(item => {
                const itemRole = item.role?.toLowerCase();

                if (item.label === 'User Management' && currentRole === 'user') {
                    return false;
                }
                
                // 3. Explicitly check for the 'sales' role restriction. 
                // If the item is marked for sales, ONLY sales can see it.
                if (itemRole === 'ward') {
                    return currentRole === 'ward';
                }

                if (itemRole === 'sales') {
                    return currentRole === 'sales';
                }

                // 4. If the user is an admin, they can see all OTHER items
                if (currentRole && privilegedRoles.includes(currentRole)) {
                    return true;
                }

                // 5. Otherwise, the item must either be public (no role) or match the user's role
                return !itemRole || itemRole === currentRole;
            })
            .map(item => {
                // Use .map to return a new object so we don't mutate the original fullMenu
                const newItem = { ...item };
                if (newItem.items) {
                    // Recursively filter sub-items
                    newItem.items = this.filterMenuByRole(newItem.items, role);
                }
                return newItem;
            });
    }

}
