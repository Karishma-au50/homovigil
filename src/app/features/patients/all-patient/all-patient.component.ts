
// haemovigil-table.component.ts
import { Component } from '@angular/core';

// ➜ PrimeNG & Angular standalone imports
import { TableModule }   from 'primeng/table';
import { ButtonModule }  from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { NgFor, NgIf }   from '@angular/common';

@Component({
  selector: 'app-all-patient',

  templateUrl: './all-patient.component.html',
  styleUrl: './all-patient.component.scss',

  // ⬇️ Stand-alone “imports” array replaces NgModule
  imports: [
    // Angular built-ins you use in the template
    NgFor,
    NgIf,

    // PrimeNG
    TableModule,
    ButtonModule,
    TooltipModule
  ]
})
export class AllPatientComponent {
  // Dummy data: replace with your API data
  rows = [
    {
      lastName: 'Duggal',
      firstName: 'Kusum',
      uhid: 'MM0013879',
      createdOn: 'Jan 26, 2025 | 04:30 PM',
      haemoId: 'ASGSFS',
      bloodGroup: 'B+'
    },
    {
      lastName: 'Kulsheshtra',
      firstName: 'Sharad',
      uhid: 'MM0013879',
      createdOn: 'Jan 26, 2025 | 04:30 PM',
      haemoId: 'AJHJHG',
      bloodGroup: 'A+'
    },
     {
      lastName: 'Duggal',
      firstName: 'Kusum',
      uhid: 'MM0013879',
      createdOn: 'Jan 26, 2025 | 04:30 PM',
      haemoId: 'ASGSFS',
      bloodGroup: 'B+'
    },
     {
      lastName: 'Duggal',
      firstName: 'Kusum',
      uhid: 'MM0013879',
      createdOn: 'Jan 26, 2025 | 04:30 PM',
      haemoId: 'ASGSFS',
      bloodGroup: 'B+'
    },
     {
      lastName: 'Duggal',
      firstName: 'Kusum',
      uhid: 'MM0013879',
      createdOn: 'Jan 26, 2025 | 04:30 PM',
      haemoId: 'ASGSFS',
      bloodGroup: 'B+'
    },
     {
      lastName: 'Duggal',
      firstName: 'Kusum',
      uhid: 'MM0013879',
      createdOn: 'Jan 26, 2025 | 04:30 PM',
      haemoId: 'ASGSFS',
      bloodGroup: 'B+'
    },
     {
      lastName: 'Duggal',
      firstName: 'Kusum',
      uhid: 'MM0013879',
      createdOn: 'Jan 26, 2025 | 04:30 PM',
      haemoId: 'ASGSFS',
      bloodGroup: 'B+'
    },
     {
      lastName: 'Duggal',
      firstName: 'Kusum',
      uhid: 'MM0013879',
      createdOn: 'Jan 26, 2025 | 04:30 PM',
      haemoId: 'ASGSFS',
      bloodGroup: 'B+'
    },
      {
      lastName: 'Duggal',
      firstName: 'Kusum',
      uhid: 'MM0013879',
      createdOn: 'Jan 26, 2025 | 04:30 PM',
      haemoId: 'ASGSFS',
      bloodGroup: 'B+'
    },
      {
      lastName: 'Duggal',
      firstName: 'Kusum',
      uhid: 'MM0013879',
      createdOn: 'Jan 26, 2025 | 04:30 PM',
      haemoId: 'ASGSFS',
      bloodGroup: 'B+'
    },
      {
      lastName: 'Duggal',
      firstName: 'Kusum',
      uhid: 'MM0013879',
      createdOn: 'Jan 26, 2025 | 04:30 PM',
      haemoId: 'ASGSFS',
      bloodGroup: 'B+'
    },
      {
      lastName: 'Duggal',
      firstName: 'Kusum',
      uhid: 'MM0013879',
      createdOn: 'Jan 26, 2025 | 04:30 PM',
      haemoId: 'ASGSFS',
      bloodGroup: 'B+'
    },
    // …more rows
  ];
}
