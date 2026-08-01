import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { AuthService } from './app/core/auth/auth.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, ToastModule, ConfirmDialog],
    template: `
        <router-outlet></router-outlet>
        <p-toast></p-toast>
        <p-confirmDialog key="confirmDialog" [closable]="false"></p-confirmDialog>
        `
})
export class AppComponent implements OnInit, OnDestroy {
    private timeoutId: any;
    private readonly INACTIVITY_TIME = 10 * 60 * 1000; // 10 minutes

    constructor(private authService: AuthService, private router: Router) {}

    ngOnInit() {
        this.resetTimeout();
    }

    ngOnDestroy() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
    }

    @HostListener('window:mousemove')
    @HostListener('window:keydown')
    @HostListener('window:click')
    @HostListener('window:scroll')
    onUserInteraction() {
        this.resetTimeout();
    }

    private resetTimeout() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        
        if (this.authService.isLoggedIn) {
            this.timeoutId = setTimeout(() => {
                this.logoutUser();
            }, this.INACTIVITY_TIME);
        }
    }

    private logoutUser() {
        this.authService.signOut().subscribe(() => {
            this.router.navigate(['/login']);
        });
    }
}
