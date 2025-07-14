import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-patient',
    standalone: true,
    imports: [ReactiveFormsModule, ButtonModule],
    templateUrl: './patient.component.html',
    styleUrls: ['./patient.component.scss']
})
export class PatientComponent {
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
            bloodGroup: ['', Validators.required],
        });
    }


    onSubmit() {
        if (this.registerPatient.valid) {
            if (this.registerPatient.value._id == '0') {
                // Remove the _id field if it's not needed for registration
                delete this.registerPatient.value._id;
                this.authService.registerPatient(this.registerPatient.value).subscribe(
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
                this.authService.updatePatient(this.registerPatient.value, this.registerPatient.value._id).subscribe(
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
