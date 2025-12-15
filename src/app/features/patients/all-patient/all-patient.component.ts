// haemovigil-table.component.ts
import { Component, ViewChild } from '@angular/core';

// ➜ PrimeNG & Angular standalone imports
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { Patient } from '../../../core/models/patient.modal';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { PatientComponent } from '../patient/patient.component';
import { ConfirmationService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { DropdownModule } from 'primeng/dropdown';

@Component({
    selector: 'app-all-patient',
    templateUrl: './all-patient.component.html',
    styleUrl: './all-patient.component.scss',
    imports: [CommonModule, TableModule, ButtonModule, TooltipModule, FormsModule, DialogModule, AvatarModule, PatientComponent, DropdownModule, DatePickerModule]
})
export class AllPatientComponent {
    @ViewChild('dt') table!: Table;
    rows: Patient[] = [];

    router: any;
    selectedSearchBy: any;
    fromDate: Date | null = null;
    toDate: Date | null = null;
    searchOptions = [
        { label: 'Patient Name', value: 'patient' },
        { label: 'Blood Group', value: 'bloodGroup' },
        { label: 'Component', value: 'component' }
    ];
    constructor(
        private authService: AuthService,
        private confirmationService: ConfirmationService
    ) {}

    // Component variables
    modalTitle: string = 'Add New Patient';
    selectedPatient: Patient | null = null;

    ngOnInit(): void {
        this.loadPatients();
    }

    loadPatients(): void {
        this.rows = []; // 🔥 STEP 1: clear table first

        this.authService.getAllPatients().subscribe((data: any) => {
            // 🔥 STEP 2: assign sorted data
            this.rows = data.data;

            // 🔥 STEP 3: force paginator to page 1
            setTimeout(() => {
                if (this.table) {
                    this.table.first = 0;
                }
            });
        });
    }

    addPatient(): void {
        this.selectedPatient = {
            _id: '0',
            firstname: '',
            lastname: '',
            UHID: '',
            bloodGroup: ''
        } as Patient; // Reset selected patient for new entry
        this.modalTitle = 'Add New Patient';
        this.showDialog();
    }

    editPatient(patient: Patient): void {
        // Call updatePatient with the updated patient object and its id
        this.selectedPatient = { ...patient };
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
                        this.loadPatients(); // Reload updated list
                    },
                    error: () => {
                        // Optionally show error message
                        alert('Failed to delete patient.');
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
            this.loadPatients(); // paginator reset happens inside
        }
    }

    goToAllocateBag() {
        this.router.navigate(['/allocateBag']);
    }
    onGlobalFilter(table: Table, event: Event) {
        const value = (event.target as HTMLInputElement).value;
        table.filterGlobal(value, 'contains');
    }
    detailsVisible: boolean = false;
    selectedPatientDetails: any = null;

    viewPatientDetails(row: any) {
        this.authService.getPatientDetailsWithBags(row._id).subscribe({
            next: (res) => {
                // Backend returns { status, data: { patient, totalBags, allocations } }
                this.selectedPatientDetails = res.data.patient;
                this.selectedPatientDetails.totalBags = res.data.totalBags || 0;
                this.selectedPatientDetails.allocations = res.data.allocations || [];

                this.detailsVisible = true;
            },
            error: () => {
                alert('Failed to fetch patient details.');
            }
        });
    }
}
