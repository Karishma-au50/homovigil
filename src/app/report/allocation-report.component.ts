import { Component, ViewChild } from '@angular/core';

// ➜ PrimeNG & Angular standalone imports
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/auth/auth.service';
import { BagAllocation } from '../core/models/bag.modal';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { DropdownModule } from 'primeng/dropdown';

// ➜ Export functionality imports
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
    selector: 'app-allocation-report',
    templateUrl: './allocation-report.component.html',
    styleUrl: './allocation-report.component.scss',
    imports: [CommonModule, TableModule, ButtonModule, TooltipModule, FormsModule, DropdownModule, DatePickerModule],
    standalone: true
})
export class AllocationReportComponent {
  // Getter to return filtered data based on dropdown and input
  get filteredRecords(): BagAllocation[] {
    if (!this.selectedReportType || !this.reportFilterValue) {
      return this.records;
    }
    const filter = this.reportFilterValue.toLowerCase();
    if (this.selectedReportType === 'patient') {
      return this.records.filter(record =>
        ((record.patientId?.firstname || '') + ' ' + (record.patientId?.lastname || '')).toLowerCase().includes(filter) ||
        (record.patientId?.UHID || '').toLowerCase().includes(filter)
      );
    }
    return this.records;
  }
    records: BagAllocation[] = [];
    reportFilterValue: string = '';
    selectedReportType: string = '';
    fromDate: Date | null = null;
    toDate: Date | null = null;

    constructor(private authService: AuthService) {}

    @ViewChild('dt') dt: Table | undefined;

    ngOnInit(): void {
        this.loadAllocations();
    }

    loadAllocations(): void {
        this.authService.getAllocationBag().subscribe((data: any) => {
            this.records = data.data.allocations || [];
        });
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

    // ✅ Export to Excel
  exportExcel() {
    const exportData = this.filteredRecords.map((record, i) => ({
            'S.No': i + 1,
            'Bag ID': record.bloodBagId?.bloodBagId || 'N/A',
            UHID: record.patientId?.UHID || 'N/A',
            'Transporter Key': record.transporterKey || 'N/A',
            'Patient Name': `${this.toTitleCase(record.patientId?.firstname || '')} ${this.toTitleCase(record.patientId?.lastname || '')}`,
            'Blood Group': record.patientId?.bloodGroup || 'N/A',
            'Blood Component': record.bloodBagId?.bloodcomponent || 'N/A',
            Status: record.status || 'N/A',
            'Allocated On': record.allocatedOn ? new Date(record.allocatedOn).toLocaleString() : 'N/A'
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = { Sheets: { 'Allocation Report': worksheet }, SheetNames: ['Allocation Report'] };
        const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, `Allocation_Report_${new Date().getTime()}.xlsx`);
    }

    // ✅ Export to PDF
  exportPdf() {
    const doc = new jsPDF('l', 'mm', 'a4');
    const headers = [['S.No', 'Bag ID', 'UHID', 'Transporter Key', 'Patient Name', 'Blood Group', 'Blood Component', 'Status', 'Allocated On']];

    const data: (string | number)[][] = this.filteredRecords.map((record, i) => [
      i + 1,
      record.bloodBagId?.bloodBagId || 'N/A',
      record.patientId?.UHID || 'N/A',
      record.transporterKey || 'N/A',
      `${this.toTitleCase(record.patientId?.firstname || '')} ${this.toTitleCase(record.patientId?.lastname || '')}`,
      record.patientId?.bloodGroup || 'N/A',
      record.bloodBagId?.bloodcomponent || 'N/A',
      record.status || 'N/A',
      record.allocatedOn ? new Date(record.allocatedOn).toLocaleString() : 'N/A'
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 20,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [220, 0, 0] }
    });

    doc.save(`Allocation_Report_${new Date().getTime()}.pdf`);
  }

    // ✅ Print the table with optimized column fitting
    printTable() {
        const printContent = document.getElementById('allocationReportContent');

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
                th:nth-child(2), td:nth-child(2) { width: 12% !important; }  /* Bag ID */
                th:nth-child(3), td:nth-child(3) { width: 10% !important; }  /* UHID */
                th:nth-child(4), td:nth-child(4) { width: 12% !important; }  /* Transporter Key */
                th:nth-child(5), td:nth-child(5) { width: 15% !important; }  /* Patient Name */
                th:nth-child(6), td:nth-child(6) { width: 8% !important; }   /* Blood Group */
                th:nth-child(7), td:nth-child(7) { width: 12% !important; }  /* Blood Component */
                th:nth-child(8), td:nth-child(8) { width: 10% !important; }  /* Status */
                th:nth-child(9), td:nth-child(9) { width: 16% !important; }  /* Allocated On */
                
                .no-print {
                  display: none !important;
                }
                /* Set page to landscape for better column fitting */
                @page {
                  size: landscape;
                  margin: 0.5in;
                }
                /* Status badge styling for print */
                .status-badge {
                  display: inline-block;
                  padding: 2px 6px;
                  border-radius: 12px;
                  font-size: 8px !important;
                  font-weight: 500;
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
                <title>Bag Allocation Report</title>
                <meta charset="UTF-8">
                ${style}
              </head>
              <body>
                <h2 style="text-align: center; margin-bottom: 20px;">Bag Allocation Report</h2>
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
