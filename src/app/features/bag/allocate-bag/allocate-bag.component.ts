import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { StepsModule } from 'primeng/steps';

import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Patient } from '../../../core/models/patient.modal';
// import { AuthService } from '../../../core/auth/auth.service';

@Component({
    selector: 'app-allocate-bag',
    templateUrl: './allocate-bag.component.html',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule, // ✅ Add this
        FormsModule,
        StepsModule,
        ButtonModule
        // Add other PrimeNG modules here
    ]
})
export class AllocateBagComponent implements OnInit {
    recordFormStep1: FormGroup;
    recordFormStep2: FormGroup;
    steps: MenuItem[] = [];
    activeIndex = 0;
    patientData: Patient | null = null;
    subscription: Subscription = new Subscription();

    constructor(
        private fb: FormBuilder,
        private authService: AuthService
    ) {
        this.recordFormStep1 = this.fb.group({
            patientId: [''],
            bloodBagId: ['']
        });

        this.recordFormStep2 = this.fb.group({
            bagId: ['', Validators.required],
            bloodGroup: ['', Validators.required],
            componentType: ['', Validators.required] // Assuming a default value, adjust as needed
        });
    }


    ngOnInit() {
        this.steps = [{ label: 'Search Patient' }, { label: 'Allocate Bag' }];

        this.subscription.add(
            this.recordFormStep1.valueChanges
                .pipe(
                    debounceTime(500),
                    distinctUntilChanged((prev, curr) =>
                        prev.patientId === curr.patientId && prev.bloodBagId === curr.bloodBagId
                    ),
                    filter(val => (val.patientId?.trim() || val.bloodBagId?.trim()))
                )
                .subscribe(({ patientId, bloodBagId }) => {
                    const uhid = patientId?.trim() || '';
                    const label = bloodBagId?.trim() || '';

                    // Only one field should be filled
                    if (uhid && label) {
                        this.patientData = null;
                        return;
                    }

                    if (uhid || label) {
                        this.authService.searchPatient(uhid, label).subscribe({
                            next: (response) => {
                                this.patientData = response.data[0];
                                console.log(this.patientData);
                            },
                            error: (err) => {
                                console.error('Search failed', err);
                                this.patientData = null;
                            }
                        });
                    } else {
                        this.patientData = null;
                    }
                })
        );
    }

 handlePatientSearch() {
    const patientId = this.recordFormStep1.get('patientId')?.value?.trim();
    const bloodBagId = this.recordFormStep1.get('bloodBagId')?.value?.trim();

    // Only one field should be filled
    let uhid = '';
    let label = '';

    if (patientId && !bloodBagId) {
        uhid = patientId;
        label = '';
    } else if (!patientId && bloodBagId) {
        uhid = '';
        label = bloodBagId;
    } else {
        alert('Please enter either UHID or Label, not both.');
        return;
    }

    this.authService.searchPatient(uhid, label).subscribe({
        next: (res) => {
            this.patientData = res.data[0];
            this.activeIndex = 1; // Move to next step
        },
        error: () => {
            alert('Patient not found');
            this.patientData = null;
        }
    });
}
    onSubmit() {
        if (!this.patientData) return;
        const payload = {
            // ...this.patientData,
            // Use values from both step forms as needed
            patientId: this.patientData._id,
            bloodBagId: this.recordFormStep2.value.bagId,
            // bagId: this.recordFormStep2.value.bagId,
            bloodGroup: this.recordFormStep2.value.bloodGroup,
            bloodcomponent: this.recordFormStep2.value.componentType, // Assuming a default value, adjust as needed
            allocatedOn: new Date().toISOString(),
            status: 'allocated'
        };
        console.log('Payload to allocate bag:', payload);
        this.authService.allocateBag(payload).subscribe({
            next: () => {
                alert('Bag allocated successfully!');
                this.activeIndex = 0; // Reset wizard if needed
            },
            error: () => alert('Failed to allocate bag')
        });
    }
}
