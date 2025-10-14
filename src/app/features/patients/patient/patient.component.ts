import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RadioButton } from 'primeng/radiobutton';
import { FormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { SignaturePadComponent } from '../../../shared/components/signature-pad/signature-pad.component';


@Component({
    selector: 'app-patient',
    standalone: true,
    imports: [TextareaModule, CommonModule, ReactiveFormsModule, ButtonModule, RadioButton, FormsModule, DatePicker, SignaturePadComponent],
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
            const formDataWithDates = {
                ...this.formData,
                dob: this.convertToDate(this.formData.dob),
                dateOfProcedure: this.convertToDate(this.formData.dateOfProcedure),
                signature: this.formData.signature || ''
            };
            this.registerPatient.patchValue(formDataWithDates);
        }

        const dobControl = this.registerPatient.get('dob');
        const ageControl = this.registerPatient.get('age');
        if (dobControl && ageControl) {
            dobControl.valueChanges.subscribe((dobValue: unknown) => {
                const age = this.calculateAge(dobValue as any);
                if (age === null) {
                    ageControl.setValue('', { emitEvent: false });
                } else {
                    ageControl.setValue(age, { emitEvent: false });
                }
            });

            const initialDob = dobControl.value;
            if (initialDob) {
                const initialAge = this.calculateAge(initialDob as any);
                ageControl.setValue(initialAge ?? '', { emitEvent: false });
            }
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
            dob: ['', Validators.required],
            wardNo: ['', Validators.required],
            department: ['', Validators.required],
            remarks: [''],
            signature: ['', Validators.required] // Add signature field
        });
    }


    onSubmit() {
        if (this.registerPatient.valid) {
            // Transform form data to match backend expectations
            const raw = this.registerPatient.value;
            const isNewRecord = raw._id == '0';

            const payload = {
                ...raw,
                dob: raw.dob ? (isNewRecord ? this.formatDateForBackend(raw.dob) : this.formatDateAsTimestamp(raw.dob)) : null,
                donorNo: String(raw.donorNo),
                dateOfProcedure: raw.dateOfProcedure ? (isNewRecord ? this.formatDateForBackend(raw.dateOfProcedure) : this.formatDateAsTimestamp(raw.dateOfProcedure)) : null,
                haemoglobin: Number(raw.haemoglobin),
            };

            if (isNewRecord) {
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

    private convertToDate(dateValue: any): Date | null {
        if (!dateValue) return null;
        if (dateValue instanceof Date) return dateValue;
        if (typeof dateValue === 'number') {
            return new Date(dateValue);
        }
        if (typeof dateValue === 'string') {
            const parsedDate = new Date(dateValue);
            return isNaN(parsedDate.getTime()) ? null : parsedDate;
        }
        return null;
    }

    private formatDateForBackend(dateValue: any): string | null {
        if (!dateValue) return null;
        let date: Date;
        if (dateValue instanceof Date) {
            date = dateValue;
        } else if (typeof dateValue === 'string') {
            date = new Date(dateValue);
        } else if (typeof dateValue === 'number') {
            date = new Date(dateValue);
        } else {
            return null;
        }
        if (isNaN(date.getTime())) {
            return null;
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private formatDateAsTimestamp(dateValue: any): number | null {
        if (!dateValue) return null;
        let date: Date;
        if (dateValue instanceof Date) {
            date = dateValue;
        } else if (typeof dateValue === 'string') {
            date = new Date(dateValue);
        } else if (typeof dateValue === 'number') {
            date = new Date(dateValue);
        } else {
            return null;
        }
        if (isNaN(date.getTime())) {
            return null;
        }
        return date.getTime();
    }

    private calculateAge(dob: Date | string | null | undefined): number | null {
        if (!dob) return null;
        const dobDate = typeof dob === 'string' ? new Date(dob) : dob;
        if (!(dobDate instanceof Date) || isNaN(dobDate.getTime())) return null;

        const today = new Date();
        let age = today.getFullYear() - dobDate.getFullYear();
        const monthDiff = today.getMonth() - dobDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
            age--;
        }
        return age < 0 ? 0 : age;
    }

}
