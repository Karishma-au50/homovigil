
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { StepsModule } from 'primeng/steps';

// @Component({
//   selector: 'app-allocate-bag',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule,StepsModule ],
//   templateUrl: './allocate-bag.component.html',
// })
// export class AllocateBagComponent implements OnInit, OnDestroy {
//   recordForm: FormGroup;
//   patientData: any = [];
//   private sub: Subscription = new Subscription();

//   authService = inject(AuthService);

//   constructor(private fb: FormBuilder, private http: HttpClient) {
//     this.recordForm = this.fb.group({
//       patientId: [''],
//       bloodBagId: ['']
//     });
//   }

//   ngOnInit(): void {
//     this.sub.add(
//       this.recordForm.get('patientId')!.valueChanges.pipe(
//         debounceTime(500),
//         distinctUntilChanged(),
//         filter((val: string) => val?.trim().length > 0)
//       ).subscribe((uhid: string) => {
//         this.authService.searchPatient(uhid).subscribe({
//           next: (response) => {
//             this.patientData = response.data[0];
//             console.log(this.patientData)
//           },
//           error: (err) => {
//             console.error('Search failed', err);
//             this.patientData = null;
//           }
//         });
//       })
//     );
//   }

//   onSearch(): void {
//     const label = this.recordForm.value.bloodBagId;
//     if (!label) return;
//   }

//   onSubmit(): void {
//     if (!this.patientData) return;

//     const payload = {
//       ...this.patientData,
//       allocatedOn: new Date().toISOString(),
//       status: 'allocated'
//     };

//     this.authService.searchPatient(payload).subscribe({
//       next: () => alert('Allocation successful!'),
//       error: () => alert('Allocation failed.')
//     });
//   }

//   ngOnDestroy(): void {
//     this.sub.unsubscribe();
//   }
// }
// import { Component, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
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
    patientData: any = null;
    subscription: Subscription = new Subscription();

    constructor(private fb: FormBuilder, private authService: AuthService) {
        this.recordFormStep1 = this.fb.group({
            patientId: [''],
            bloodBagId: ['']
        });

        this.recordFormStep2 = this.fb.group({
            bagId: ['', Validators.required],
            bloodGroup: ['', Validators.required]
        });
    }

    ngOnInit() {
        this.steps = [
            { label: 'Search Patient' },
            { label: 'Allocate Bag' }
        ];

        this.subscription.add(
            this.recordFormStep1.get('patientId')!.valueChanges.pipe(
                debounceTime(500),
                distinctUntilChanged(),
                filter((val: string) => val?.trim().length > 0)
            ).subscribe((uhid: string) => {
                this.authService.searchPatient(uhid).subscribe({
                    next: (response) => {
                        this.patientData = response.data[0];
                        console.log(this.patientData)
                    },
                    error: (err) => {
                        console.error('Search failed', err);
                        this.patientData = null;
                    }
                });
            })
        );
    }

    handlePatientSearch() {
        const { patientId, bloodBagId } = this.recordFormStep1.value;

        if (!patientId && !bloodBagId) {
            alert('Please enter UHID or Label');
            return;
        }

        const idToSearch = patientId || bloodBagId;

        this.authService.searchPatient(idToSearch).subscribe({
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
            ...this.patientData,
            bagId: this.recordFormStep2.value.bagId,
            bloodGroup: this.recordFormStep2.value.bloodGroup,
            allocatedOn: new Date().toISOString(),
            status: 'allocated'
        };

        this.authService.searchPatient(payload).subscribe({
            next: () => {
                alert('Bag allocated successfully!');
                this.activeIndex = 0; // Reset wizard if needed
            },
            error: () => alert('Failed to allocate bag')
        });
    }
}
