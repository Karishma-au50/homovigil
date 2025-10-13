import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RadioButton } from 'primeng/radiobutton';
import { FormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { ToggleButton } from 'primeng/togglebutton';
import { TextareaModule } from 'primeng/textarea';
import { SignaturePadComponent } from '../../../shared/components/signature-pad/signature-pad.component';


@Component({
    selector: 'app-patient',
    standalone: true,
    imports: [TextareaModule, CommonModule, ReactiveFormsModule, ButtonModule, RadioButton, FormsModule, DatePicker, ToggleButton, SignaturePadComponent],
    templateUrl: './patient.component.html',
    styleUrls: ['./patient.component.scss']
})
export class PatientComponent {
    hideShowBtn: boolean = false;
    // date: Date | undefined;
    dob: Date | undefined;
    dateOfProcedure: Date | undefined;
    registerPatient: FormGroup;
    authService = inject(AuthService);
    @Input() formData: any;

    ngOnInit(): void {
        //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
        //Add 'implements OnInit' to the class.
        if (this.formData) {
            this.registerPatient.patchValue(this.formData);
        }
    }


    constructor(private fb: FormBuilder, private router: Router) {
        this.registerPatient = this.fb.group({
            _id: ['0'],
            firstname: ['', Validators.required],
            lastname: ['', Validators.required],
            UHID: ['', Validators.required],
            bloodGroup: ['', Validators.required], // Will be set programmatically
            age: ['', Validators.required],
            gender: ['Male', Validators.required], // Default to Male
            dob: [new Date(), Validators.required],
            // date: [new Date(), Validators.required],
            wardNo: ['', Validators.required],
            department: ['', Validators.required],
            donorNo: ['', Validators.required],
            dateOfProcedure: [new Date(), Validators.required],
            donorName: ['', Validators.required],
            weight: ['', Validators.required],
            address: ['', Validators.required],
            haemoglobin: ['', Validators.required],
            HIV: ['', Validators.required], 
            HBsAg: ['', Validators.required],
            HCV: ['', Validators.required],
            VDRL: ['', Validators.required],
            MP: ['', Validators.required],
            remarks: ['', Validators.required],
            signature: ['', Validators.required] // Add signature field
        });
    }


    onSubmit() {
        if (this.registerPatient.valid) {
            // Transform form data to match backend expectations
            const raw = this.registerPatient.value;
            const payload = {
                ...raw,
                // dob: raw.dob ? new Date(raw.dob).getTime() : null,
                dob: raw.dob ? new Date(raw.dob).toISOString().split('T')[0] : null,
                donorNo: String(raw.donorNo),
                dateOfProcedure: raw.dateOfProcedure ? new Date(raw.dateOfProcedure).getTime() : null,
                haemoglobin: Number(raw.haemoglobin),
                HIV: mapTestResult(raw.HIV),
                HBsAg: mapTestResult(raw.HBsAg),
                HCV: mapTestResult(raw.HCV),
                VDRL: mapTestResult(raw.VDRL),
                MP: mapTestResult(raw.MP),
            };

            function mapTestResult(val: string): 'Positive' | 'Negative' | 'Not Tested' {
                if (val === 'NR') return 'Not Tested';
                if (val === 'R') return 'Positive';
                if (val === 'N') return 'Negative';
                return val as any;
            }

            if (payload._id == '0') {
                // Remove the _id field if it's not needed for registration
                delete payload._id;
                this.authService.registerPatient(payload).subscribe(
                    response => {
                        // handle success, maybe store token, etc.
                        this.onClose(true);
                    },
                    error => {
                        // handle error, show message, etc.
                        console.error('Registration failed', error);
                    }
                );
            } else {
                this.authService.updatePatient(payload, payload._id).subscribe(
                    response => {
                        // handle success, maybe store token, etc.
                        this.onClose(true);
                    },
                    error => {
                        // handle error, show message, etc.
                        console.error('Update failed', error);
                    }
                );
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
