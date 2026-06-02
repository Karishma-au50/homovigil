import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';

import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { HemoVigilHttpService } from '../../../core/services/hemovigil.http.service';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-patient',
    standalone: true,
    imports: [ReactiveFormsModule, ButtonModule, CommonModule, ZXingScannerModule, ToastModule],
    providers: [],
    templateUrl: './patient.component.html',
    styleUrls: ['./patient.component.scss']
})
export class PatientComponent {
    registerPatient: FormGroup;
    authService = inject(AuthService);
    @Input() formData: any;
    // Track if this is an edit (true) or new entry (false)
    isEditMode = false;
    entryMode: 'manual' | 'scan' = 'manual';
    isSaving = false;
    isFetchingKey = false;

    transporterKey: string | null = null;

    allowedFormats = [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.EAN_13,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.DATA_MATRIX // Healthcare/Blood bags mein Data Matrix bhi use hota hai
    ];

    constructor(private fb: FormBuilder, private router: Router, private hemovigilService: HemoVigilHttpService, private messageService: MessageService) {
        this.registerPatient = this.fb.group({
            _id: ['0'],
            firstname: ['', Validators.required],
            lastname: ['', Validators.required],
            UHID: ['', Validators.required],
            wardNumber: ['', Validators.required],
            bloodGroup: ['', Validators.required],
            haemovigilId: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        if (this.formData) {
            this.registerPatient.patchValue(this.formData);
            // If formData has an _id that's not '0', it's an edit
            this.isEditMode = this.formData._id && this.formData._id !== '0';
        }
    }

    getTranspoterKey() {
        const idValue = this.registerPatient.get('haemovigilId')?.value;
        const patientId = this.registerPatient.get('_id')?.value; 

        if (!idValue || !idValue.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Enter Haemovigil ID first!' });
            return;
        }
        
        this.isFetchingKey = true;
        
        // Determine if this is a brand new patient or an edit
        const isNewPatient = !this.isEditMode;

        // Pass the flag as the second parameter
        this.hemovigilService.getHaemovigilIdTransporterKey(idValue, isNewPatient, patientId).subscribe({
            next: (res) => {
                this.isFetchingKey = false;
                this.transporterKey = res.data.transporterKey;
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Transporter key retrieved successfully.' });
            },
            error: (error) => {
                this.isFetchingKey = false;
                console.error('Failed to get Transporter key', error);
                const errorMessage = error.error?.message || 'Failed to get Transporter key.';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMessage });
            }
        });
    }

    // Add this getter to check if the top 5 fields are filled and valid
    get isTopFormValid(): boolean {
        const controls = this.registerPatient.controls;
        return controls['UHID'].valid && 
               controls['bloodGroup'].valid && 
               controls['wardNumber'].valid && 
               controls['firstname'].valid && 
               controls['lastname'].valid;
    }

    // Update the mode when the toggle is clicked
    setEntryMode(mode: 'manual' | 'scan') {
        this.entryMode = mode;
    }

    // Handle successful scan
    onCodeResult(resultString: string) {
        // Populate the input field with the scanned data
        this.registerPatient.patchValue({ haemovigilId: resultString });
        // Automatically switch back to manual mode to show the populated input
        this.entryMode = 'manual';
    }

    onSubmit() {
        if (this.registerPatient.valid) {
            this.isSaving = true;

            if (this.registerPatient.value._id == '0') {
                // Remove the _id field if it's not needed for registration
                delete this.registerPatient.value._id;
                this.authService.registerPatient(this.registerPatient.value).subscribe({
                    next: (response) => {
                        this.isSaving = false;
                        this.onClose(true);
                    },
                    error: (error) => {
                        this.isSaving = false;
                        console.error('Registration failed', error);
                    }
                });
            } else {
                this.authService.updatePatient(this.registerPatient.value, this.registerPatient.value._id).subscribe({
                    next: (response) => {
                        this.isSaving = false;
                        this.onClose(true);
                    },
                    error: (error) => {
                        this.isSaving = false;
                        console.error('Update failed', error);
                    }
                });
            }
        } else {
            this.registerPatient.markAllAsTouched();
        }
    }
    @Output() closeDialog = new EventEmitter<boolean>();
    onClose(fetchData: boolean): void {
        // Return true if needs to fetch data after closing the dialog else return false
        this.closeDialog.emit(fetchData);
    }

}
