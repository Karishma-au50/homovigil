import { Component } from '@angular/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';

interface DialogData {
    buttonType: string;
    summary: string;
}

@Component({
    selector: 'footer',
    standalone: true,
    imports: [ButtonModule],
    template:  `
        <div class="flex w-full justify-end mt-4">
            <p-button type="button" label="" icon="pi pi-times" (click)="closeDialog({ buttonType: 'Cancel', summary: 'No Product Selected' })" />
        </div> `
})
export class Footer {
    constructor(public ref: DynamicDialogRef) {}

    closeDialog(data: DialogData) {
        this.ref.close(data);
    }
}