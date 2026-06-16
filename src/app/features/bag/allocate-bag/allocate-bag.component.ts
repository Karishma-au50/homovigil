import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { StepsModule } from 'primeng/steps';
import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Patient } from '../../../core/models/patient.modal';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { Router } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
    selector: 'app-allocate-bag',
    templateUrl: './allocate-bag.component.html',
    standalone: true,
    imports: [SkeletonModule, CommonModule, ReactiveFormsModule, FormsModule, StepsModule, ButtonModule, DialogModule, ToastModule],
    providers: [MessageService]
})
export class AllocateBagComponent implements OnInit, OnDestroy {
    recordFormStep1!: FormGroup;
    recordFormStep2!: FormGroup;

    steps: MenuItem[] = [];
    activeIndex = 0;

    patientData: Patient | null = null;
    patientToClone: Patient | null = null;

    showMaxBagsDialog = false;

    subscription = new Subscription();

    isSearching: boolean = false;
    isAllocating: boolean = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private messageService: MessageService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.steps = [{ label: 'Search Patient' }, { label: 'Allocate Bag' }];

        this.recordFormStep1 = this.fb.group({
            patientId: [''],
            bloodBagId: ['']
        });

        this.recordFormStep2 = this.fb.group({
            transporterBoxId: ['', Validators.required],
            bagId: [''],
            bloodGroup: ['', Validators.required],
            componentType: ['', Validators.required]
        });

        // 🔍 Auto search on typing
        this.subscription.add(
            this.recordFormStep1.valueChanges
                .pipe(
                    debounceTime(500),
                    distinctUntilChanged((prev, curr) => prev.patientId === curr.patientId && prev.bloodBagId === curr.bloodBagId),
                    filter((val) => val.patientId?.trim() || val.bloodBagId?.trim())
                )
                .subscribe(({ patientId, bloodBagId }) => {
                    const uhid = patientId?.trim() || '';
                    const label = bloodBagId?.trim() || '';

                    if (uhid && label) {
                        this.patientData = null;
                        return;
                    }

                    if (uhid || label) {
                        this.isSearching = true;
                        this.authService.searchPatient(uhid, label).subscribe({
                            next: (res: any) => {
                                this.patientData = res.data[0] || null;
                                this.isSearching = false;
                            },
                            error: (err) => {
                                this.showError('Search Failed', err?.error?.message || 'Error fetching patient');
                                this.patientData = null;
                                this.isSearching = false;
                            }
                        });
                    }
                })
        );
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    showError(title: string, message: string) {
        this.messageService.add({
            severity: 'error',
            summary: title,
            detail: message
        });
    }

    // 🔍 Manual search + limit check
    handlePatientSearch(): void {
        const uhid = this.recordFormStep1.get('patientId')?.value?.trim();
        const label = this.recordFormStep1.get('bloodBagId')?.value?.trim() || '';

        // if (!uhid) {
        //     this.showError('Input Error', 'Please enter UHID');
        //     return;
        // }

        if (!uhid && !label) {
            this.showError('Input Error', 'Please enter either Patient UHID or Haemovigil Label');
            return;
        }

        this.isSearching = true;

        // 1️⃣ Search patient
        this.authService.searchPatient(uhid, label).subscribe({
            next: (res: any) => {
                const patient = res.data?.[0];
                if (!patient) {
                    this.isSearching = true;
                    this.showError('Not Found', 'Patient not found');
                    return;
                }

                // 2️⃣ Check allocation limit
                this.authService.checkAllocationLimit(patient._id).subscribe({
                    next: (limitRes: any) => {
                        this.isSearching = false;
                        // 🔥 THIS IS THE KEY LINE
                        if (limitRes?.data?.limitReached) {
                            this.patientToClone = patient;
                            this.patientData = null;
                            this.showMaxBagsDialog = true;
                            return;
                        }

                        // ✅ safe to allocate
                        this.patientData = patient;
                        this.activeIndex = 1;
                    },
                    error: () => {
                        this.isSearching = false;
                        this.showError('Error', 'Failed to verify allocation limit');
                    }
                });
            },
            error: () => {
                this.isSearching = false;
                this.showError('Error', 'Patient search failed');
            }
        });
    }

    // 🔁 Rotate haemovigil ID (UHID SAME)
    // rotateHaemovigil(): void {
    //     if (!this.patientToClone) return;

    //     this.authService.rotateHaemovigil(this.patientToClone._id).subscribe((res: any) => {
    //         // 🔥 CRITICAL
    //         this.patientData = null;
    //         this.patientToClone = null;

    //         // ✅ use fresh patient from backend
    //         this.patientData = res.data;

    //         this.showMaxBagsDialog = false;
    //         this.activeIndex = 1;
    //     });
    // }

    rotateHaemovigil(): void {
        this.showMaxBagsDialog = false;
        this.router.navigate(['/allPatient']); // Navigate to Patient List
    }

    // 🩸 Allocate bag
    onSubmit(): void {
        if (!this.patientData) return;

        if (this.recordFormStep2.invalid) {
            this.recordFormStep2.markAllAsTouched();
            this.showError('Form Incomplete', 'Please fill all required fields');
            return;
        }

        const payload = {
            patientId: this.patientData._id,
            transporterBoxId: this.recordFormStep2.value.transporterBoxId,
            bloodBagId: this.recordFormStep2.value.bagId,
            bloodGroup: this.recordFormStep2.value.bloodGroup,
            bloodcomponent: this.recordFormStep2.value.componentType
        };

        this.isAllocating = true; 
        this.authService.allocateBag(payload).subscribe({
            next: () => {
                this.isAllocating = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Blood bag allocated successfully'
                });

                // 🔁 RESET FLOW
                this.activeIndex = 0;
                this.recordFormStep2.reset();
                this.patientData = null;
            },
            error: (err) => {
                this.isAllocating = false;
                this.showError('Allocation Error', err?.error?.message || 'Failed to allocate');
            }
        });
    }
}
