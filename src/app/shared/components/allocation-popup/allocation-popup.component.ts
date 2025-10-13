import { Component, OnDestroy } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AllocationReportComponent } from '../../../report/allocation-report.component';
// import { Footer } from '../popup/footer';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-allocation-popup',
  templateUrl: './allocation-popup.component.html',
  styleUrl: './allocation-popup.component.scss',
  imports: [DynamicDialogModule, ToastModule, ButtonModule],
  providers: [DialogService, MessageService],
  standalone: true,
})
export class AllocationPopupComponent implements OnDestroy {
    constructor(
        public dialogService: DialogService, 
        public messageService: MessageService
    ) {}

    ref: DynamicDialogRef | undefined;

    // show() {
    //     this.ref = this.dialogService.open(AllocationReportComponent, {
    //         header: 'Bag Allocation Report',
    //         width: '70vw',
    //         modal: true,
    //         contentStyle: { overflow: 'auto' },
    //         breakpoints: {
    //             '960px': '95vw',
    //             '640px': '98vw'
    //         },
    //         templates: {
    //             footer: Footer
    //         }
    //     });
    // }

    show() {
    this.ref = this.dialogService.open(AllocationReportComponent, {
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