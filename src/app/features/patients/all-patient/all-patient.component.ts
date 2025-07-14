
// haemovigil-table.component.ts
import { Component } from '@angular/core';

// ➜ PrimeNG & Angular standalone imports
import { TableModule } from 'primeng/table';
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

@Component({
    selector: 'app-all-patient',

    templateUrl: './all-patient.component.html',
    styleUrl: './all-patient.component.scss',
    imports: [
        CommonModule,
        TableModule,
        ButtonModule,
        TooltipModule,
        FormsModule,
        DialogModule,
        AvatarModule,
        PatientComponent
    ]
})

export class AllPatientComponent {
    rows: Patient[] = [];

    constructor(private authService: AuthService, private confirmationService: ConfirmationService) { }

    // Component variables
    modalTitle: string = 'Add New Patient';
    selectedPatient: Patient | null = null;

    ngOnInit(): void {
        this.loadPatients();
    }

    loadPatients(): void {
        this.authService.getAllPatients().subscribe((data: any) => {
            this.rows = data.data;
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
        this.selectedPatient = patient;
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
        })
    }

    visible: boolean = false;

    showDialog(): void {
        this.visible = true;
    }

    closeDialog(fetchData: boolean): void {
        this.visible = false;
        if (fetchData) {
            this.loadPatients();
        }
    }
}
