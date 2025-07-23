import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { ToolbarModule } from 'primeng/toolbar';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { BagAllocation } from '../../core/models/bag.modal';
import { AuthService } from '../../core/auth/auth.service';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, FormsModule, DropdownModule, ButtonModule, DatePickerModule, TableModule, InputIconModule, ToolbarModule, IconFieldModule, InputTextModule],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent {
    records: BagAllocation[] = [];

    fromDate: Date | null = null;
    toDate: Date | null = null;
      allRecords: any[] = []; 


    @ViewChild('dt') dt!: Table;
    constructor(
        private authService: AuthService,
        private router: Router
    ) {}
    ngOnInit(): void {
        this.loadPatients();
    }

    loadPatients(): void {
        this.authService.getAllocationBag().subscribe((data: any) => {
            console.log(data);
            this.records = data.data.allocations;
        });
    }
    onGlobalFilter(table: Table, event: Event) {
        const value = (event.target as HTMLInputElement).value;
        table.filterGlobal(value, 'contains');
    }
    stripe = (i: number) => (i % 2 === 0 ? 'bg-gray-50' : '');
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
    onFilterGlobal(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        this.dt.filterGlobal(inputElement.value, 'contains');
    }
    goToAllocateBag() {
        this.router.navigate(['/allocateBag']);
    }
     filterByDateRange() {
        if (!this.fromDate && !this.toDate) {
            // If no dates selected, show all records
            this.records = [...this.allRecords];
            return;
        }

        this.records = this.allRecords.filter(record => {
            console.log(record);
            if (!record.allocatedOn) return false;

            const recordDate = new Date(record.allocatedOn);
            const from = this.fromDate ? new Date(this.fromDate) : null;
            const to = this.toDate ? new Date(this.toDate) : null;

            // Set time to start/end of day for accurate comparison
            if (from) from.setHours(0, 0, 0, 0);
            if (to) to.setHours(23, 59, 59, 999);

            // Filter logic
            if (from && to) {
                return recordDate >= from && recordDate <= to;
            } else if (from) {
                return recordDate >= from;
            } else if (to) {
                return recordDate <= to;
            }

            return true;
        });

        if (this.records.length === 0) {
            alert('No records found for the selected date range.');
        }
    }

    // Clear date filter
    clearDateFilter() {
        this.fromDate = null;
        this.toDate = null;
        this.records = [...this.allRecords];
    }
}
