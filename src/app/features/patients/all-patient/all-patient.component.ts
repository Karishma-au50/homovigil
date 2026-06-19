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
import { BarCodeComponent } from '../bar-code/bar-code.component';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
    selector: 'app-all-patient',
    templateUrl: './all-patient.component.html',
    styleUrl: './all-patient.component.scss',
    imports: [SkeletonModule, CommonModule, TableModule, ButtonModule, TooltipModule, FormsModule, DialogModule, AvatarModule, PatientComponent, DropdownModule, DatePickerModule, BarCodeComponent, ToastModule],
    providers: [MessageService]
})
export class AllPatientComponent {
    @ViewChild('dt') table!: Table;
    rows: Patient[] = [];

    isLoading: boolean = true;
    skeletonData: any[] = new Array(5).fill({});

    router: any;
    selectedSearchBy: any;
    fromDate: Date | null = null;
    toDate: Date | null = null;
    searchOptions = [
        { label: 'Patient Name', value: 'patient' },
        { label: 'Blood Group', value: 'bloodGroup' },
        { label: 'Component', value: 'component' }
    ];

    // --- BarCode Dialog State ---
    qrVisible: boolean = false;
    selectedPatientForQr: Patient | null = null;

    // --- Transporter Key Dialog State ---
    transporterKeyVisible: boolean = false;
    currentTransporterKey: string | null = null;
    isLoadingKey: boolean = false;

    constructor(
        private authService: AuthService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService
    ) { }

    // Component variables
    modalTitle: string = 'Add New Patient';
    selectedPatient: Patient | null = null;

    ngOnInit(): void {
        this.loadPatients();
    }

    loadPatients(): void {
        this.rows = []; // 🔥 STEP 1: clear table first
        this.isLoading = true;

        this.authService.getAllPatients().subscribe({
            next: (data: any) => {
                // 🔥 STEP 2: assign sorted data
                this.rows = data.data;
                this.isLoading = false;

                // 🔥 STEP 3: force paginator to page 1
                setTimeout(() => {
                    if (this.table) {
                        this.table.first = 0;
                    }
                });
            },
            error: () => {
                this.isLoading = false; // Stop loading on error
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load patients' });
            }
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

    viewTransporterKey(patient: Patient) {
        this.isLoadingKey = true;
        this.currentTransporterKey = null;
        this.transporterKeyVisible = true;

        this.authService.getTransporterKey(patient._id).subscribe({
            next: (res: any) => {
                this.currentTransporterKey = res.data.transporterKey;
                this.isLoadingKey = false;
            },
            error: (err: any) => {
                this.isLoadingKey = false;
                this.transporterKeyVisible = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch Transporter Key.' });
                console.log(err);
            }
        });
    }

    confirmDelete(patient: Patient): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${patient.firstname} ${patient.lastname}?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.authService.deletePatient(patient._id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Patient deleted successfully.' });
                        this.loadPatients();
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete patient.' });
                    }
                });
            },
            reject: () => {
                // Optionally handle rejection
            },
            key: 'confirmDialog'
        });
    }

    openQrDialog(row: Patient) {
        this.selectedPatientForQr = row;
        // console.log(row)
        let patientUhid = row?.UHID;
        if(patientUhid){
            this.qrVisible = true;
        }else{
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'UHID not exists for this patient.' });
        }
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
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch patient details.' });
            }
        });
    }
}
