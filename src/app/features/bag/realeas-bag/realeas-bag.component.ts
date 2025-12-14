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

import { AuthService } from '../../../core/auth/auth.service';
import { BagAllocation } from '../../../core/models/bag.modal';

@Component({
    selector: 'app-realeas-bag',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, InputTextModule, DropdownModule, DatePickerModule, TagModule, ConfirmDialogModule],
    providers: [ConfirmationService],
    templateUrl: './realeas-bag.component.html',
    styleUrl: './realeas-bag.component.scss'
})
export class ReleasBagComponent {
    row: BagAllocation[] = [];

    @ViewChild('dt') dt!: Table;

    releaseUserName = '';

    constructor(
        private authService: AuthService,
        private confirmationService: ConfirmationService
    ) {}

    // ✅ SAME AS PATIENT LIST
    ngOnInit(): void {
        this.loadPatients();
    }

    // ✅ LOAD ALL, THEN FILTER CLIENT SIDE
    loadPatients(): void {
        this.authService.getAllocationBag().subscribe({
            next: (res: any) => {
                const all = res.data?.allocations ?? res.data ?? [];
                this.row = all.filter((a: BagAllocation) => a.status?.toLowerCase() === 'allocated');
            },
            error: () => {
                this.row = [];
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

    releaseBag(allocationId: string, index: number): void {
        this.confirmationService.confirm({
            message: 'Are you sure you want to release this bag?',
            header: 'Confirm Release',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.authService.releaseAllocatedBag(allocationId, this.releaseUserName).subscribe({
                    next: () => {
                        this.row.splice(index, 1);
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
