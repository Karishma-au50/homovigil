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
                    { label: 'Release Bag', icon: 'pi pi-fw pi-sitemap', routerLink: ['/releaseBag'] },
                    { label: 'Blood Component Management', icon: 'pi pi-fw pi-sitemap', routerLink: ['/allocationHistory'] }
                ]
            },
            {
                label: 'Sales Management',
                role: 'sales', // Custom property for filtering
                items: [
                    { label: 'Sales', icon: 'pi pi-fw pi-user', routerLink: ['/sales'] }
                ]
            }
            //  {
            //     label:'Documentation',
            //     items: [{ label: 'Documentation', icon: 'pi pi-fw pi-file', routerLink: ['']}],

            // },

            // {
            //     label: 'Home',
            //     items: [{ label: 'Dashboard Pre Built', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
            // },
            // {
            //     label: 'UI Components',
            //     items: [
            //         { label: 'Form Layout', icon: 'pi pi-fw pi-id-card', routerLink: ['/uikit/formlayout'] },
            //         { label: 'Input', icon: 'pi pi-fw pi-check-square', routerLink: ['/uikit/input'] },
            //         { label: 'Button', icon: 'pi pi-fw pi-mobile', class: 'rotated-icon', routerLink: ['/uikit/button'] },
            //         { label: 'Table', icon: 'pi pi-fw pi-table', routerLink: ['/uikit/table'] },
            //         { label: 'List', icon: 'pi pi-fw pi-list', routerLink: ['/uikit/list'] },
            //         { label: 'Tree', icon: 'pi pi-fw pi-share-alt', routerLink: ['/uikit/tree'] },
            //         { label: 'Panel', icon: 'pi pi-fw pi-tablet', routerLink: ['/uikit/panel'] },
            //         { label: 'Overlay', icon: 'pi pi-fw pi-clone', routerLink: ['/uikit/overlay'] },
            //         { label: 'Media', icon: 'pi pi-fw pi-image', routerLink: ['/uikit/media'] },
            //         { label: 'Menu', icon: 'pi pi-fw pi-bars', routerLink: ['/uikit/menu'] },
            //         { label: 'Message', icon: 'pi pi-fw pi-comment', routerLink: ['/uikit/message'] },
            //         { label: 'File', icon: 'pi pi-fw pi-file', routerLink: ['/uikit/file'] },
            //         { label: 'Chart', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/uikit/charts'] },
            //         { label: 'Timeline', icon: 'pi pi-fw pi-calendar', routerLink: ['/uikit/timeline'] },
            //         { label: 'Misc', icon: 'pi pi-fw pi-circle', routerLink: ['/uikit/misc'] }
            //     ]
            // },
            // {
            //     label: 'Pages',
            //     icon: 'pi pi-fw pi-briefcase',
            //     routerLink: ['/pages'],
            //     items: [
            //         {
            //             label: 'Landing',
            //             icon: 'pi pi-fw pi-globe',
            //             routerLink: ['/landing']
            //         },
            //         {
            //             label: 'Auth',
            //             icon: 'pi pi-fw pi-user',
            //             items: [
            //                 {
            //                     label: 'Login',
            //                     icon: 'pi pi-fw pi-sign-in',
            //                     routerLink: ['/auth/login']
            //                 },
            //                 {
            //                     label: 'Error',
            //                     icon: 'pi pi-fw pi-times-circle',
            //                     routerLink: ['/auth/error']
            //                 },
            //                 {
            //                     label: 'Access Denied',
            //                     icon: 'pi pi-fw pi-lock',
            //                     routerLink: ['/auth/access']
            //                 }
            //             ]
            //         },
            //         {
            //             label: 'Crud',
            //             icon: 'pi pi-fw pi-pencil',
            //             routerLink: ['/pages/crud']
            //         },
            //         {
            //             label: 'Not Found',
            //             icon: 'pi pi-fw pi-exclamation-circle',
            //             routerLink: ['/pages/notfound']
            //         },
            //         {
            //             label: 'Empty',
            //             icon: 'pi pi-fw pi-circle-off',
            //             routerLink: ['/pages/empty']
            //         }
            //     ]
            // },
            // {
            //     label: 'Hierarchy',
            //     items: [
            //         {
            //             label: 'Submenu 1',
            //             icon: 'pi pi-fw pi-bookmark',
            //             items: [
            //                 {
            //                     label: 'Submenu 1.1',
            //                     icon: 'pi pi-fw pi-bookmark',
            //                     items: [
            //                         { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
            //                         { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
            //                         { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' }
            //                     ]
            //                 },
            //                 {
            //                     label: 'Submenu 1.2',
            //                     icon: 'pi pi-fw pi-bookmark',
            //                     items: [{ label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' }]
            //                 }
            //             ]
            //         },
            //         {
            //             label: 'Submenu 2',
            //             icon: 'pi pi-fw pi-bookmark',
            //             items: [
            //                 {
            //                     label: 'Submenu 2.1',
            //                     icon: 'pi pi-fw pi-bookmark',
            //                     items: [
            //                         { label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark' },
            //                         { label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark' }
            //                     ]
            //                 },
            //                 {
            //                     label: 'Submenu 2.2',
            //                     icon: 'pi pi-fw pi-bookmark',
            //                     items: [{ label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark' }]
            //                 }
            //             ]
            //         }
            //     ]
            // },
            // {
            //     label: 'Get Started',
            //     items: [
            //         {
            //             label: 'Documentation',
            //             icon: 'pi pi-fw pi-book',
            //             routerLink: ['/documentation']
            //         },
            //         {
            //             label: 'View Source',
            //             icon: 'pi pi-fw pi-github',
            //             url: 'https://github.com/primefaces/sakai-ng',
            //             target: '_blank'
            //         }
            //     ]
            // }
        ];

        this.model = this.filterMenuByRole(fullMenu, userRole);
    }

    // Inside AppMenu class
    // filterMenuByRole(menu: any[], role: string | undefined): MenuItem[] {
    //     // 1. Normalize the role to lowercase for safe comparison
    //     const currentRole = role?.toLowerCase();

    //     // 2. Define privileged roles in lowercase
    //     const privilegedRoles = ['admin', 'superadmin', 'user'];

    //     // 3. If the user has a privileged role, return a copy of the full menu[cite: 6]
    //     if (currentRole && privilegedRoles.includes(currentRole)) {
    //         return [...menu];
    //     }

    //     // 4. Otherwise, filter items for restricted roles (like 'sales')[cite: 6]
    //     return menu
    //         .filter(item => {
    //             // If item has no role, it's public. If it has a role, it must match.[cite: 6]
    //             const itemRole = item.role?.toLowerCase();
    //             return !itemRole || itemRole === currentRole;
    //         })
    //         .map(item => {
    //             // Use .map to return a new object so we don't mutate the original fullMenu[cite: 6]
    //             const newItem = { ...item };
    //             if (newItem.items) {
    //                 newItem.items = this.filterMenuByRole(newItem.items, role);
    //             }
    //             return newItem;
    //         });
    // }

    filterMenuByRole(menu: any[], role: string | undefined): MenuItem[] {
        // 1. Normalize the role to lowercase for safe comparison
        const currentRole = role?.toLowerCase();

        // 2. Define privileged roles in lowercase
        const privilegedRoles = ['admin', 'superadmin', 'user'];

        return menu
            .filter(item => {
                const itemRole = item.role?.toLowerCase();

                // 3. Explicitly check for the 'sales' role restriction. 
                // If the item is marked for sales, ONLY sales can see it.
                if (itemRole === 'sales') {
                    return currentRole === 'sales';
                }

                // 4. If the user is an admin/superadmin, they can see all OTHER items
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
