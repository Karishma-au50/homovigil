import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/auth/auth.service';
import { BagAllocation } from '../../../core/models/bag.modal';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-allocate-bag-history',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, InputTextModule, DropdownModule, DatePickerModule, TagModule, ButtonModule, TooltipModule],
    templateUrl: './allocate-bag-history.component.html',
    styleUrl: './allocate-bag-history.component.scss'
})
export class AllocateBagHistoryComponent {
    row: BagAllocation[] = [];

    @ViewChild('dt') dt!: Table;

    constructor(private authService: AuthService) {}

    // ✅ SAME AS PATIENT LIST
    ngOnInit(): void {
        this.loadPatients();
    }

    // ✅ LOAD ALL DATA ONCE
    loadPatients(): void {
        this.authService.getAllAllocationsNoPagination().subscribe({
            next: (res: any) => {
                this.row = res.data ?? [];
            },
            error: () => {
                this.row = [];
            }
        });
    }

    // ✅ CLIENT SIDE SEARCH (WORKING)
    onGlobalFilter(table: Table, event: Event) {
        const value = (event.target as HTMLInputElement).value;
        table.filterGlobal(value, 'contains');
    }

    stripe = (i: number) => (i % 2 === 0 ? 'bg-gray-50' : '');

    formatStatus(status: string): string {
        if (!status) return '';
        // If the backend sends 'released' or 'Released', display 'Issued' instead
        if (status.toLowerCase() === 'released') {
            return 'Issued';
        }
        // Otherwise, display the status exactly as it came from the backend
        return status;
    }

    badgeClass(status: string) {
        return (
            {
                reserved: 'bg-green-100 text-green-700',
                allocated: 'bg-red-100 text-red-700',
                released: 'bg-blue-100 text-blue-700',
                'In hold': 'bg-yellow-100 text-yellow-700'
            }[status] ?? 'bg-gray-100 text-gray-700'
        );
    }
}
