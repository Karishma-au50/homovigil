
import { Component, OnDestroy } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
// import { ProductListDemo } from './demo/productlistdemo';
import { ReportComponent } from '../../../../app/report/report.component';
// import { Footer } from './demo/footer';
// import { Footer } from './footer';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrl: './popup.component.scss',
  imports: [DynamicDialogModule, ToastModule, ButtonModule],
  providers: [DialogService, MessageService],
  standalone: true,
})
export class PopupComponent {
constructor(public dialogService: DialogService, public messageService: MessageService) {}

    ref: DynamicDialogRef | undefined;

    // show() {
    //     this.ref = this.dialogService.open(ReportComponent, {
    //         header: 'Patient Report',
    //         width: '70vw',
    //         modal: true,
    //         contentStyle: { overflow: 'auto' },
    //         breakpoints: {
    //             '960px': '75vw',
    //             '640px': '90vw'
    //         },
    //         templates: {
    //             footer: Footer
    //         }
    //     });

    // }
    show() {
    this.ref = this.dialogService.open(ReportComponent, {
        header: 'Patient Report',
        width: '70vw',
        modal: true,
        closable: true, // ensures the "X" button appears
        contentStyle: { overflow: 'auto' },
        breakpoints: {
            '960px': '75vw',
            '640px': '90vw'
        }
        // Removed templates.footer to eliminate custom footer
    });
}

    ngOnDestroy() {
        if (this.ref) {
            this.ref.close();
        }
    }
}
