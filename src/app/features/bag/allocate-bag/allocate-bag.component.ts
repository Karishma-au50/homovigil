// import { Component, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
// import { HttpClient, HttpClientModule } from '@angular/common/http';
// import { AuthService } from '../../../core/auth/auth.service';

// @Component({
//     selector: 'app-allocate-bag',
//     standalone: true,
//     imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
//     templateUrl: './allocate-bag.component.html'
// })
// export class AllocateBagComponent {
//     recordForm: FormGroup;

//     authService = inject(AuthService);
//     patientData: any = [];

//     constructor(
//         private fb: FormBuilder,
//         private http: HttpClient
//     ) {
//         this.recordForm = this.fb.group({
//             patientId: [''],
//             bloodBagId: ['']
//         });
//     }

//     onSearch(): void {
//         const uhid = this.recordForm.value.patientId;
//         const label = this.recordForm.value.bloodBagId;

//         if (!uhid && !label) return;
//         this.authService.searchPatient(uhid).subscribe(
//             (response) => {
//                 console.log('fetched successfully', response);
//                 this.patientData = response;
//             },
//             (error) => {
//                 console.error('fetched failed', error);
//             }
//         );
//     }

//     onSubmit(): void {
//         if (!this.patientData) return;

//         const payload = {
//             ...this.patientData,
//             allocatedOn: new Date().toISOString(),
//             status: 'allocated'
//         };
//     }
// }
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-allocate-bag',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './allocate-bag.component.html',
})
export class AllocateBagComponent implements OnInit, OnDestroy {
  recordForm: FormGroup;
  patientData: any = [];
  private sub: Subscription = new Subscription();

  authService = inject(AuthService);

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.recordForm = this.fb.group({
      patientId: [''],
      bloodBagId: ['']
    });
  }

  ngOnInit(): void {
    this.sub.add(
      this.recordForm.get('patientId')!.valueChanges.pipe(
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

  onSearch(): void {
    const label = this.recordForm.value.bloodBagId;
    if (!label) return;

    // Example label search fallback
    // this.authService.searchPatientByLabe(label).subscribe({
    //   next: (response) => {
    //     this.patientData = response;
    //   },
    //   error: (err) => {
    //     console.error('Label fetch failed', err);
    //     this.patientData = null;
    //   }
    // });
  }

  onSubmit(): void {
    if (!this.patientData) return;

    const payload = {
      ...this.patientData,
      allocatedOn: new Date().toISOString(),
      status: 'allocated'
    };

    this.authService.searchPatient(payload).subscribe({
      next: () => alert('Allocation successful!'),
      error: () => alert('Allocation failed.')
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
