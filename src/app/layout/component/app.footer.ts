import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        Designed & Developed By
        <a href="https://atf-labs.com/home" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">Atf Labs</a>
    </div>`
})
export class AppFooter {}
