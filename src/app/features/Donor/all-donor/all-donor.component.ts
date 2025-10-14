
import { Component } from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { Patient } from '../../../core/models/patient.modal';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { donorComponent } from '../donor/donor.component';
import { ConfirmationService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { DropdownModule } from 'primeng/dropdown';
import { PopupComponent } from '../../../shared/components/popup/popup.component';

@Component({
    selector: 'app-all-donor',
    templateUrl: './all-donor.component.html',
    styleUrl: './all-donor.component.scss',
    imports: [PopupComponent, CommonModule, TableModule, ButtonModule, TooltipModule, FormsModule, DialogModule, AvatarModule, donorComponent, DropdownModule, DatePickerModule, donorComponent]
})
export class AllDonorComponent {
    rows: Patient[] = [];

    router: any;
    selectedSearchBy: any;
    fromDate: Date | null = null;
    toDate: Date | null = null;
    searchOptions = [
        { label: 'Donor Name', value: 'donorName' },
        { label: 'Donor No', value: 'donorNo' },
        { label: 'Component', value: 'component' }
    ];
    constructor(
        private authService: AuthService,
        private confirmationService: ConfirmationService
    ) {}

    // Component variables
    modalTitle: string = 'Add New Donor';
    selectedDonor: Patient | null = null;

    ngOnInit(): void {
        this.loadDonors();
    }

    loadDonors(): void {
        this.authService.getAllPatients().subscribe((data: any) => {
            this.rows = (data.data || []).map((row: any) => {
                if (row.signature && typeof row.signature === 'string') {
                    // If it's a filename (not a data URL or already a full URL)
                    if (!row.signature.startsWith('http') && !row.signature.startsWith('data:')) {
                        row.signature = `https://haemovigil.atf-labs.com/public/${row.signature.replace(/^\/+/, '')}`;
                    }
                }
                return row;
            });
            console.log(data);
        });
    }

    addDonor(): void {
        this.selectedDonor = {
            _id: '0',
            firstname: '',
            lastname: '',
            UHID: '',
            bloodGroup: ''
        } as Patient;
        this.modalTitle = 'Add New Donor';
        this.showDialog();
    }

    // ✅ Utility: calculate age from DOB
    calculateAge(dob: string | Date | null | undefined): number {
        if (!dob) return 0;
        const birthDate = new Date(dob);
        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    editDonor(patient: Patient): void {
        this.selectedDonor = patient;
        this.modalTitle = 'Edit Patient';
        this.showDialog();
    }

    confirmDelete(patient: Patient): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${patient.firstname} ${patient.lastname}?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.authService.deletePatient(patient._id).subscribe({
                    next: () => {
                        // Optionally show success message
                        this.loadDonors(); // Reload updated list
                    },
                    error: () => {
                        // Optionally show error message
                        alert('Failed to delete Donor.');
                    }
                });
            },
            reject: () => {
                // Optionally handle rejection
            },
            key: 'confirmDialog'
        });
    }
    stripe = (i: number) => (i % 2 === 0 ? 'bg-gray-50' : '');

    visible: boolean = false;

    showDialog(): void {
        this.visible = true;
    }

    closeDialog(fetchData: boolean): void {
        this.visible = false;
        if (fetchData) {
            this.loadDonors();
        }
    }
    goToAllocateBag() {
        this.router.navigate(['/allocateBag']);
    }
    onGlobalFilter(table: Table, event: Event) {
        const value = (event.target as HTMLInputElement).value;
        table.filterGlobal(value, 'contains');
    }
}
