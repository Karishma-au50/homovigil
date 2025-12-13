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

@Component({
    selector: 'app-allocate-bag',
    templateUrl: './allocate-bag.component.html',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, StepsModule, ButtonModule, DialogModule, ToastModule],
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

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.steps = [{ label: 'Search Patient' }, { label: 'Allocate Bag' }];

        this.recordFormStep1 = this.fb.group({
            patientId: [''],
            bloodBagId: ['']
        });

        this.recordFormStep2 = this.fb.group({
            bagId: ['', Validators.required],
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
                        this.authService.searchPatient(uhid, label).subscribe({
                            next: (res: any) => {
                                this.patientData = res.data[0] || null;
                            },
                            error: (err) => {
                                this.showError('Search Failed', err?.error?.message || 'Error fetching patient');
                                this.patientData = null;
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
        const uhid = this.recordFormStep1.get('patientId')?.value?.trim() || '';
        const label = this.recordFormStep1.get('bloodBagId')?.value?.trim() || '';

        if ((uhid && label) || (!uhid && !label)) {
            this.showError('Input Error', 'Please enter either UHID or Label');
            return;
        }

        this.authService.searchPatient(uhid, label).subscribe({
            next: (res: any) => {
                const patient = res.data[0];
                if (!patient) {
                    this.showError('Not Found', 'Patient not found');
                    return;
                }

                if (patient.allocatedBags >= 6) {
                    // 🚨 limit reached → rotate haemovigil
                    this.patientToClone = patient;
                    this.showMaxBagsDialog = true;
                    return;
                }

                this.patientData = patient;
                this.activeIndex = 1;
            },
            error: (err) => {
                this.showError('Error', err?.error?.message || 'Failed to fetch patient');
            }
        });
    }

    // 🔁 Rotate haemovigil ID (UHID SAME)
    rotateHaemovigil(): void {
        if (!this.patientToClone) return;

        this.authService.rotateHaemovigil(this.patientToClone._id).subscribe((res: any) => {
            // 🔥 CRITICAL
            this.patientData = null;
            this.patientToClone = null;

            // ✅ use fresh patient from backend
            this.patientData = res.data;

            this.showMaxBagsDialog = false;
            this.activeIndex = 1;
        });
    }

    // 🩸 Allocate bag
    onSubmit(): void {
        if (!this.patientData) return;

        const payload = {
            patientId: this.patientData._id,
            bloodBagId: this.recordFormStep2.value.bagId,
            bloodGroup: this.recordFormStep2.value.bloodGroup,
            bloodcomponent: this.recordFormStep2.value.componentType
        };

        this.authService.allocateBag(payload).subscribe({
            next: () => {
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
                this.showError('Allocation Error', err?.error?.message || 'Failed to allocate');
            }
        });
    }
}
