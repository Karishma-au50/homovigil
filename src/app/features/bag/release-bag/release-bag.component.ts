import { Component, ViewChild, OnInit, OnDestroy  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';

import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { DialogModule } from 'primeng/dialog';

import { AuthService } from '../../../core/auth/auth.service';
import { BagAllocation } from '../../../core/models/bag.modal';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import JsBarcode from 'jsbarcode';

@Component({
    selector: 'app-release-bag',
    standalone: true,
    imports: [SkeletonModule, CommonModule, FormsModule, TableModule, InputTextModule, DropdownModule, DatePickerModule, TagModule, ConfirmDialogModule, TooltipModule, ZXingScannerModule, DialogModule],
    providers: [ConfirmationService],
    templateUrl: './release-bag.component.html',
    styleUrl: './release-bag.component.scss'
})
export class ReleaseBagComponent {
    private originalWarn = console.warn;
    row: BagAllocation[] = [];
    isLoading: boolean = true;
    skeletonData: any[] = new Array(5).fill({});

    @ViewChild('dt') dt!: Table;

    releaseUserName = '';

    showBagIdDialog: boolean = false;
    entryMode: 'manual' | 'scan' = 'manual';
    scannedBagId: string = '';
    selectedAllocationId: string = '';
    selectedIndex: number = -1;
    selectedRow: any = null; 
    allowedFormats = [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.ITF,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.DATA_MATRIX
    ];

    modalTransporterKey: string = '';
    modalBagId: string = '';
    modalTransporterBoxId: string = '';

    isFetchingKey: boolean = false;
    isIssuingBag: boolean = false;
    isBagIdAlreadyExists: boolean = false;

    showScanner: boolean = false;
    printCopies: number = 1;

    constructor(
        private authService: AuthService,
        private confirmationService: ConfirmationService
    ) {
       console.warn = (...args) => {
            // Convert all arguments into a single string
            const logMessage = args.map(a => String(a)).join(' ');
            
            // Check if the combined string contains the annoying ZXing logs
            if (logMessage.includes('NotFoundException') || logMessage.includes('MultiFormatReader')) {
                return; // Swallow the warning!
            }
            
            this.originalWarn(...args); // Otherwise, log it normally
        };
     }

    // ✅ SAME AS PATIENT LIST
    ngOnInit(): void {
        this.loadPatients();
    }

    ngOnDestroy(): void {
        console.warn = this.originalWarn;
    }

    // ✅ LOAD ALL, THEN FILTER CLIENT SIDE
    loadPatients(): void {
        this.isLoading = true;

        this.authService.getAllAllocationsNoPagination().subscribe({
            next: (res: any) => {
                const all = res.data?.allocations ?? res.data ?? [];
                this.row = all.filter((a: BagAllocation) => a.status?.toLowerCase() === 'allocated');
                this.isLoading = false;
            },
            error: () => {
                this.row = [];
                this.isLoading = false;
            }
        });
    }

    // ✅ CLIENT SIDE SEARCH
    onGlobalFilter(table: Table, event: Event) {
        const value = (event.target as HTMLInputElement).value;
        table.filterGlobal(value, 'contains');
    }

    stripe = (i: number) => (i % 2 === 0 ? 'bg-gray-50' : '');

    badgeClass(status: string) {
        return (
            {
                allocated: 'bg-red-100 text-red-700',
                reserved: 'bg-green-100 text-green-700',
                released: 'bg-blue-100 text-blue-700'
            }[status] ?? 'bg-gray-100 text-gray-700'
        );
    }

    // -------- ACTIONS --------

    // releaseBag(allocationId: string, index: number): void {
    //     this.confirmationService.confirm({
    //         message: 'Are you sure you want to issue this bag?',
    //         header: 'Confirm Issue',
    //         icon: 'pi pi-exclamation-triangle',
    //         accept: () => {
    //             this.authService.releaseAllocatedBag(allocationId, this.releaseUserName).subscribe({
    //                 next: () => {
    //                     this.row.splice(index, 1);
    //                 }
    //             });
    //         }
    //     });
    // }

    setEntryMode(mode: 'manual' | 'scan') {
        this.entryMode = mode;
    }
    onCodeResult(resultString: string): void {
        this.modalBagId = resultString;
        this.showScanner = false; // Auto-close scanner after successful scan
    }

    releaseBagWithoutBagId(row: any, index: number): void{
        this.selectedAllocationId = row._id;
        this.selectedIndex = index;
        this.selectedRow = row;

        this.scannedBagId = row.bloodBagId.bloodBagId || null;
        this.triggerConfirmDialog();
    }

    // 1. We now pass the entire 'row' object to check its data
    releaseBag(row: any, index: number): void {
        this.selectedAllocationId = row._id;
        this.selectedIndex = index;
        this.selectedRow = row;

        // Check if bloodBagId is null or missing
        if (!row.bloodBagId.bloodBagId) {
            // Bag ID is MISSING! Show the popup to scan/enter it
            this.scannedBagId = '';
            this.entryMode = 'manual';
            this.showBagIdDialog = true;
        } else {
            // Bag ID EXISTS! Skip straight to confirmation dialog
            this.scannedBagId = row.bloodBagId.bloodBagId;
            this.triggerConfirmDialog();
        }
    }
    // 2. Called when they hit "Proceed" in the scanner dialog
    submitBagId(): void {
        if (!this.scannedBagId) return;

        // Extract the MongoDB _id of the BloodBag object from the row
        const bagObjectId = this.selectedRow?.bloodBagId?._id;

        if (!bagObjectId) {
            console.error("No Bag Object ID found for this row!");
            return;
        }

        // 1. Call API to save Bag ID in MongoDB first
        this.authService.addBloodbagId(this.scannedBagId, bagObjectId, this.selectedAllocationId, this.modalTransporterBoxId).subscribe({
            next: () => {
                // 2. Hide dialog ONLY after successful save
                this.showBagIdDialog = false;

                if (this.selectedRow.bloodBagId) {
                    this.selectedRow.bloodBagId.bloodBagId = this.scannedBagId;
                }

                // 3. Trigger the Issue Confirmation dialog
                this.triggerConfirmDialog();
            }
        });
    }

    // 3. The actual Confirmation Dialog logic
    triggerConfirmDialog(): void {
        this.confirmationService.confirm({
            message: 'Are you sure you want to issue this bag?',
            header: 'Confirm Issue',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                // If you need to send the new scannedBagId to the backend, add it here!
                this.authService.releaseAllocatedBag(this.selectedAllocationId, this.releaseUserName).subscribe({
                    next: () => {
                        // this.row.splice(this.selectedIndex, 1);
                        this.loadPatients();
                    }
                });
            }
        });
    }

    reserveAllocatedBag(allocationId: string): void {
        this.confirmationService.confirm({
            message: 'Are you sure you want to reserve this bag?',
            header: 'Confirm Reserve',
            icon: 'pi pi-info-circle',
            accept: () => {
                this.authService.reserveAllocatedBag(allocationId).subscribe({
                    next: () => {
                        this.loadPatients();
                    }
                });
            }
        });
    }

    // 1. Method to open the new Modal
    openReleaseModal(row: any, index: number): void {
        this.selectedAllocationId = row._id;
        this.selectedIndex = index;
        this.selectedRow = row;
        
        // Reset modal fields on open
        this.modalTransporterKey = '';
        this.modalTransporterBoxId = '';
        this.modalBagId = row.bloodBagId?.bloodBagId || ''; // Pre-fill if exists

        this.isBagIdAlreadyExists = !!row.bloodBagId?.bloodBagId;

        this.isFetchingKey = false;
        this.isIssuingBag = false;

        this.showScanner = false; // Reset scanner
        this.printCopies = 1;  
        
        this.showBagIdDialog = true;

        setTimeout(() => {
            const uhid = this.selectedRow?.patientId?.UHID;
            if (uhid) {
                JsBarcode('#patient-barcode-svg', uhid, {
                    format: "CODE128", // Or whatever format you use
                    lineColor: "#000",
                    width: 1.5,
                    height: 40,
                    displayValue: true
                });
            }
        }, 150);
    }

        // Add this new method to your class
    onModalClose(): void {
        this.isBagIdAlreadyExists = false; // Fixes the readonly bug
        this.modalTransporterKey = '';
        this.modalTransporterBoxId = '';
        this.modalBagId = '';
        this.isFetchingKey = false;
        this.isIssuingBag = false;
        this.selectedRow = null;
        this.showScanner = false;
    }

    // 2. Fetch the Key from API
    fetchTransporterKey(): void {
        const patientId = this.selectedRow?.patientId?._id;
        if (!patientId) return;
        this.isFetchingKey = true;

        this.authService.getTransporterKey(patientId).subscribe({
            next: (res: any) => {
                this.modalTransporterKey = res.data?.transporterKey || '';
                this.isFetchingKey = false;
            },
            error: (err: any) => {
                console.error('Failed to fetch transporter key', err);
                this.isFetchingKey = false;
            }
        });
    }
    // 3. Handle Issue Button Click
    submitIssueBag(): void {
        if (!this.modalTransporterBoxId) return;
        this.isIssuingBag = true; // START LOADING
        if (this.modalBagId && this.selectedRow?.bloodBagId?._id) {
            this.authService.addBloodbagId(this.modalBagId, this.selectedRow.bloodBagId._id, this.selectedAllocationId, this.modalTransporterBoxId).subscribe({
                next: () => this.finalizeIssue(),
                error: (err: any) => {
                    console.error('Failed to add bloodbag Id', err);
                    this.isIssuingBag = false; // STOP LOADING ON ERROR
                }
            });
        } else {
            this.finalizeIssue();
        }
    }
    // 4. Send everything to Release API
    finalizeIssue(): void {
        const payload = {
            releaseUserName: this.releaseUserName,
            transporterBoxId: this.modalTransporterBoxId,
            transporterKey: this.modalTransporterKey
        };
        
        this.authService.releaseAllocatedBag(this.selectedAllocationId, payload).subscribe({
            next: () => {
                this.isIssuingBag = false; // STOP LOADING
                this.showBagIdDialog = false;
                this.loadPatients();
            },
            error: (err: any) => {
                console.error('Failed to release bag', err);
                this.isIssuingBag = false; // STOP LOADING ON ERROR
            }
        });
    }

     toggleScanner(): void {
        this.showScanner = !this.showScanner;
    }
    // 4. Scanner Success Result
    
    // 5. Print Barcode Logic
    printBarcode(): void {
        const uhid = this.selectedRow?.patientId?.UHID;
        if (!uhid) return;

        // Grab the generated SVG from the DOM
        const svgElement = document.getElementById('patient-barcode-svg');
        if (!svgElement) return;

        // Serialize the SVG to a raw string
        const svgData = new XMLSerializer().serializeToString(svgElement);

        // ✅ FIX: Use flex-wrap so barcodes line up side-by-side in rows and wrap automatically
        let printContents = `<div style="display: flex; flex-wrap: wrap; justify-content: flex-start; gap: 10px; padding: 10px;">`;
        
        for (let i = 0; i < this.printCopies; i++) {
            printContents += `
                <div style="margin: 10px; page-break-inside: avoid; text-align: center;">
                    ${svgData}
                </div>
            `;
        }
        printContents += `</div>`;

        // Open print window
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Patient Barcode</title>
                        <style>
                            @page { size: auto; margin: 10mm; }
                            body { margin: 0; font-family: sans-serif; }
                        </style>
                    </head>
                    <body onload="setTimeout(function() { window.print(); window.close(); }, 250);">
                        ${printContents}
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    }

}
