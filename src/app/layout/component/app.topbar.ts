import { Component, inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterLink, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { AuthService } from '../../core/auth/auth.service';

import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator, RouterLink, OverlayPanelModule, ButtonModule],
    templateUrl: './app.topbar.html',
})
export class AppTopbar {
    items!: MenuItem[];

    authService = inject(AuthService);
    router = inject(Router);

    constructor(public layoutService: LayoutService) {}

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }

    logout() {
        localStorage.removeItem('slcAuthToken');
        
        this.authService.signOut().subscribe(() => {
            this.router.navigate(['/login']);
        });
    }

}
