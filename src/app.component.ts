import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, ToastModule, ConfirmDialog],
    template: `
        <router-outlet></router-outlet>
        <p-toast></p-toast>
        <p-confirmDialog key="confirmDialog"></p-confirmDialog>
        `
})
export class AppComponent {}
