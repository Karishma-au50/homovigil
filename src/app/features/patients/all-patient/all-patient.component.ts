
// haemovigil-table.component.ts
import { Component } from '@angular/core';

// ➜ PrimeNG & Angular standalone imports
import { TableModule }   from 'primeng/table';
import { ButtonModule }  from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule, NgFor, NgIf }   from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { Patient } from '../../../core/models/patient.modal';
import { DatePicker } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-all-patient',

  templateUrl: './all-patient.component.html',
  styleUrl: './all-patient.component.scss',
  imports: [
    CommonModule,
    NgFor,
    TableModule,
    ButtonModule,
    TooltipModule,
    DatePicker,
    FormsModule,
  ]
})

export class AllPatientComponent {
  rows: Patient[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.authService.getAllPatients().subscribe((data: any) => {
      this.rows = data.data;
    });
  }

  editPatient(patient: Patient): void {
    // Call updatePatient with the updated patient object and its id
    this.authService.updatePatient(patient, patient._id).subscribe({
      next: (res) => {
        // Optionally reload or update the table row
        this.loadPatients();
      }
    });
  }

confirmDelete(patient: Patient): void {
  console.log(patient)
  const confirmed = window.confirm(`Are you sure you want to delete ${patient.firstname} ${patient.lastname}?`);

  if (confirmed) {
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
  }
}

  // deletePatient(patient: Patient): void {
  //   this.authService.deletePatient(patient.id).subscribe({
  //     next: (res) => {
  //       // Remove the deleted patient from the table or reload
  //       this.loadPatients();
  //     }
  //   });
  // }
}