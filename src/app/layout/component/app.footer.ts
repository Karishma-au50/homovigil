import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    // Designed & Developed By
    // <a href="https://atf-labs.com/home" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">Atf Labs</a>
    template: `<div class="layout-footer">
    <p>
        Product of 
        <span class="text-primary font-bold hover:underline">Alliance Transfusion</span>
    </p>
         
    </div>`
})
export class AppFooter {}
