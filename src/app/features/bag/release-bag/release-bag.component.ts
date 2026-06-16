import { Component, ViewChild } from '@angular/core';
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

@Component({
    selector: 'app-release-bag',
    standalone: true,
    imports: [SkeletonModule, CommonModule, FormsModule, TableModule, InputTextModule, DropdownModule, DatePickerModule, TagModule, ConfirmDialogModule, TooltipModule, ZXingScannerModule, DialogModule],
    providers: [ConfirmationService],
    templateUrl: './release-bag.component.html',
    styleUrl: './release-bag.component.scss'
})
export class ReleaseBagComponent {
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
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.DATA_MATRIX
    ];

    constructor(
        private authService: AuthService,
        private confirmationService: ConfirmationService
    ) { }

    // ✅ SAME AS PATIENT LIST
    ngOnInit(): void {
        this.loadPatients();
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
    onCodeResult(resultString: string) {
        this.scannedBagId = resultString;
        this.entryMode = 'manual';
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
        this.authService.addBloodbagId(this.scannedBagId, bagObjectId).subscribe({
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
                        this.row.splice(this.selectedIndex, 1);
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
}
