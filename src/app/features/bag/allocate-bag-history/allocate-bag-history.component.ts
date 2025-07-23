import { Component, ViewChild } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { BagAllocation } from '../../../core/models/bag.modal';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-allocate-bag-history',
    imports: [CommonModule, FormsModule, ButtonModule, TableModule, DropdownModule, TagModule, DatePickerModule, InputTextModule],
    templateUrl: './allocate-bag-history.component.html',
    styleUrl: './allocate-bag-history.component.scss'
})
export class AllocateBagHistoryComponent {
    row: BagAllocation[] = [];
    searchOptions = [
        { label: 'Patient Name', value: 'patient' },
        { label: 'Blood Group', value: 'bloodGroup' },
        { label: 'Component', value: 'component' }
    ];

    selectedSearchBy: any;
    fromDate: Date | null = null;
    toDate: Date | null = null;
    @ViewChild('dt') dt!: Table;

    constructor(private authService: AuthService) {}
    ngOnInit(): void {
        this.loadPatients();
    }

    loadPatients(): void {
        this.authService.getAllocationBag().subscribe((data: any) => {
            console.log(data);
            this.row = data.data.allocations;
        });
    }
    stripe = (i: number) => (i % 2 === 0 ? 'bg-gray-50' : '');
    onGlobalFilter(table: Table, event: Event) {
        const value = (event.target as HTMLInputElement).value;
        table.filterGlobal(value, 'contains');
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
