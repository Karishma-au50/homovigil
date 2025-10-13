import { Component, ViewChild } from '@angular/core';

// ➜ PrimeNG & Angular standalone imports
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/auth/auth.service';
import { Patient } from '../core/models/patient.modal';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { PatientComponent } from '../features/patients/patient/patient.component';
import { ConfirmationService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { DropdownModule } from 'primeng/dropdown';

// ➜ New imports for export functionality
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
    selector: 'app-report',
    templateUrl: './report.component.html',
    styleUrl: './report.component.scss',
    imports: [CommonModule, TableModule, ButtonModule, TooltipModule, FormsModule, DialogModule, AvatarModule, PatientComponent, DropdownModule, DatePickerModule]
})
export class ReportComponent {
  rows: Patient[] = [];
  selectedReportType: string = '';
  reportFilterValue: string = '';
  get filteredRows(): Patient[] {
    if (!this.reportFilterValue || !this.selectedReportType) {
      return this.rows;
    }
    const value = this.reportFilterValue.toLowerCase();
    if (this.selectedReportType === 'patient') {
      return this.rows.filter(row =>
        (row.firstname && row.firstname.toLowerCase().includes(value)) ||
        (row.lastname && row.lastname.toLowerCase().includes(value)) ||
        (row.UHID && row.UHID.toLowerCase().includes(value))
      );
    }
    // For 'ward' and 'department', fields do not exist on Patient, so return all rows
    return this.rows;
  }

    router: any;
    selectedSearchBy: any;
    fromDate: Date | null = null;
    toDate: Date | null = null;
    // searchOptions = [
    //     { label: 'Patient Name', value: 'patient' },
    //     { label: 'Blood Group', value: 'bloodGroup' },
    //     { label: 'Component', value: 'component' }
    // ];

    constructor(
        private authService: AuthService,
        private confirmationService: ConfirmationService
    ) {}

    modalTitle: string = 'Add New Patient';
    selectedPatient: Patient | null = null;
    visible: boolean = false;

    @ViewChild('dt') dt: Table | undefined;

    ngOnInit(): void {
        this.loadPatients();
    }

    getPlaceholder(): string {
        switch (this.selectedReportType) {
            case 'patient':
                return 'Enter Patient Name or UHID';
            case 'ward':
                return 'Enter Ward No.';
            case 'department':
                return 'Enter Department Name';
            default:
                return 'Enter Search Value';
        }
    }

    loadPatients(): void {
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
    });
    }

    addPatient(): void {
        this.selectedPatient = {
            _id: '0',
            firstname: '',
            lastname: '',
            UHID: '',
            bloodGroup: ''
        } as Patient;
        this.modalTitle = 'Add New Patient';
        this.showDialog();
    }

    editPatient(patient: Patient): void {
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
                    next: () => this.loadPatients(),
                    error: () => alert('Failed to delete patient.')
                });
            },
            reject: () => {}
        });
    }

    stripe = (i: number) => (i % 2 === 0 ? 'bg-gray-50' : '');

    showDialog(): void {
        this.visible = true;
    }

    closeDialog(fetchData: boolean): void {
        this.visible = false;
        if (fetchData) this.loadPatients();
    }

    goToAllocateBag() {
        this.router.navigate(['/allocateBag']);
    }

    onGlobalFilter(table: Table, event: Event) {
        const value = (event.target as HTMLInputElement).value;
        table.filterGlobal(value, 'contains');
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
  

    // ✅ Export to Excel
  //   exportExcel() {
  // const exportData = this.filteredRows.map((row, i) => ({
  //           'S.No': i + 1,
  //           'Patient Name': `${this.toTitleCase(row.firstname ?? '')} ${this.toTitleCase(row.lastname ?? '')}`,
  //           UHID: row.UHID ?? '',
  //           'Created On': row.createdAt ? new Date(row.createdAt).toLocaleString() : '',
  //           'Haemovigil Id': row.haemovigilId ?? '',
  //           'Blood Group': row.bloodGroup ?? '',
  //           Gender: 'Female',
  //           Age: 25,
  //           DOB: 'Sep 01, 2000',
  //           Department: 'Cardiology',
  //           'Ward No': 'Ward 7',
  //           'Donor No': 'DON001',
  //           DOP: 'Sep 23, 2025'
  //       }));

  //       const worksheet = XLSX.utils.json_to_sheet(exportData);
  //       const workbook = { Sheets: { Report: worksheet }, SheetNames: ['Report'] };
  //       const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  //       const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  //       saveAs(blob, `Report_${new Date().getTime()}.xlsx`);
  //   }
exportExcel() {
  const exportData = this.filteredRows.map((row, i) => ({
    'S.No': i + 1,
    'Patient Name': `${this.toTitleCase(row.firstname ?? '')} ${this.toTitleCase(row.lastname ?? '')}`,
    UHID: row.UHID ?? '',
    'Created On': row.createdAt ? new Date(row.createdAt).toLocaleString() : '',
    'Haemovigil Id': row.haemovigilId ?? '',
    'Blood Group': row.bloodGroup ?? '',
    Gender: row.gender ?? '',          // if you have gender field
    Age: this.calculateAge(row.dob),   // ✅ calculate age
    DOB: row.dob ? new Date(row.dob).toLocaleDateString() : '', // format DOB
    Department: row.department ?? '',
    'Ward No': row.wardNo ?? '',
    'Donor No': row.donorNo ?? '',
    // DOP: row.dop ? new Date(row.dop).toLocaleDateString() : ''
    DOP: row.dateOfProcedure ? new Date(row.dateOfProcedure).toLocaleDateString() : ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = { Sheets: { Report: worksheet }, SheetNames: ['Report'] };
  const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, `Report_${new Date().getTime()}.xlsx`);
}

    // ✅ Export to PDF
  //   exportPdf() {
  //       const doc = new jsPDF('l', 'mm', 'a4');
  //       const headers = [['S.No', 'Patient Name', 'UHID', 'Created On', 'Haemovigil Id', 'Blood Group', 'Gender', 'Age', 'DOB', 'Department', 'Ward No', 'Donor No', 'DOP']];

  // const data: (string | number)[][] = this.filteredRows.map((row, i) => [
  //           i + 1,
  //           `${this.toTitleCase(row.firstname ?? '')} ${this.toTitleCase(row.lastname ?? '')}`,
  //           row.UHID ?? '',
  //           row.createdAt ? new Date(row.createdAt).toLocaleString() : '',
  //           row.haemovigilId ?? '',
  //           row.bloodGroup ?? '',
  //           'Female',
  //           25,
  //           'Sep 01, 2000',
  //           'Cardiology',
  //           'Ward 7',
  //           'DON001',
  //           'Sep 23, 2025'
  //       ]);

  //       autoTable(doc, {
  //           head: headers,
  //           body: data,
  //           startY: 20,
  //           styles: { fontSize: 8, cellPadding: 3 },
  //           headStyles: { fillColor: [220, 0, 0] }
  //       });

  //       doc.save(`Report_${new Date().getTime()}.pdf`);
  //   }

   exportPdf() {
    const doc = new jsPDF('l', 'mm', 'a4');
    const headers = [['S.No', 'Patient Name', 'UHID', 'Created On', 'Haemovigil Id', 'Blood Group', 'Gender', 'Age', 'DOB', 'Department', 'Ward No', 'Donor No', 'DOP']];

    const data: (string | number)[][] = this.filteredRows.map((row, i) => [
      i + 1,
      `${this.toTitleCase(row.firstname ?? '')} ${this.toTitleCase(row.lastname ?? '')}`,
      row.UHID ?? '',
      row.createdAt ? new Date(row.createdAt).toLocaleString() : '',
      row.haemovigilId ?? '',
      row.bloodGroup ?? '',
      row.gender ?? '',
      this.calculateAge(row.dob),
      row.dob ? new Date(row.dob).toLocaleDateString() : '',
      row.department ?? '',
      row.wardNo ?? '',
      row.donorNo ?? '',
      // row.dop ? new Date(row.dop).toLocaleDateString() : ''
      row.dateOfProcedure ? new Date(row.dateOfProcedure).toLocaleDateString() : ''
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 20,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [220, 0, 0] }
    });

    doc.save(`Report_${new Date().getTime()}.pdf`);
  }

    // ✅ Print the table with optimized column fitting
    printTable() {
        const printContent = document.getElementById('reportContent');

        if (!printContent) {
            console.error('Print content container not found');
            return;
        }

        const printWindow = window.open('', '', 'width=1200,height=800');
        if (!printWindow) return;

        const style = `
    <style>
      @media print {
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 10px;
          font-family: Arial, sans-serif;
        }
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          table-layout: fixed !important;
          font-size: 10px !important;
        }
        th {
          background-color: #c53030 !important; /* bg-red-700 */
          color: white !important;              /* text-white */
          font-weight: 600 !important;          /* font-semibold */
          font-size: 12px !important;           /* text-m */
          border: 1px solid #ccc !important;
          padding: 6px 4px !important;
          text-align: center !important;
          word-wrap: break-word !important;
        }
        td {
          border: 1px solid #ccc !important;
          padding: 4px 3px !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          font-size: 10px !important;
          text-align: left !important;
        }
        /* Column width optimization for all columns to fit */
        th:nth-child(1), td:nth-child(1) { width: 5% !important; }   /* S.No */
        th:nth-child(2), td:nth-child(2) { width: 12% !important; }  /* Patient Name */
        th:nth-child(3), td:nth-child(3) { width: 8% !important; }   /* UHID */
        th:nth-child(4), td:nth-child(4) { width: 10% !important; }  /* Created On */
        th:nth-child(5), td:nth-child(5) { width: 8% !important; }   /* Haemovigil Id */
        th:nth-child(6), td:nth-child(6) { width: 6% !important; }   /* Blood Group */
        th:nth-child(7), td:nth-child(7) { width: 6% !important; }   /* Gender */
        th:nth-child(8), td:nth-child(8) { width: 5% !important; }   /* Age */
        th:nth-child(9), td:nth-child(9) { width: 8% !important; }   /* DOB */
        th:nth-child(10), td:nth-child(10) { width: 10% !important; } /* Department */
        th:nth-child(11), td:nth-child(11) { width: 7% !important; }  /* Ward No */
        th:nth-child(12), td:nth-child(12) { width: 7% !important; }  /* Donor No */
        th:nth-child(13), td:nth-child(13) { width: 8% !important; }  /* DOP */
        th:nth-child(14), td:nth-child(14) { width: 10% !important; } /* Signature */
        .no-print {
          display: none !important;
        }
        /* Set page to landscape for better column fitting */
        @page {
          size: landscape;
          margin: 0.5in;
        }
        /* Ensure images fit properly */
        img {
          max-width: 100% !important;
          height: auto !important;
          object-fit: contain !important;
        }
      }
      /* Also apply some styles for screen preview */
      @media screen {
        body {
          padding: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #ccc;
          padding: 8px;
        }
        th {
          background-color: #c53030;
          color: white;
          font-weight: 600;
        }
      }
    </style>
  `;

        printWindow.document.write(`
    <html>
      <head>
        <title>Haemovigil Report</title>
        <meta charset="UTF-8">
        ${style}
      </head>
      <body>
        <h2 style="text-align: center; margin-bottom: 20px;">Haemovigil Report</h2>
        ${printContent.innerHTML}
      </body>
    </html>
  `);

        printWindow.document.close();
        printWindow.focus();

        // Allow styles to load before printing
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }

    // ✅ Utility to format names
    toTitleCase(str: string): string {
        return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    }
}
