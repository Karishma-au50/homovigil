import { Component,EventEmitter,inject, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-patient',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './patient.component.html',
  styleUrls: ['./patient.component.scss']
})
export class PatientComponent {
   registerPatient: FormGroup;
   authService = inject(AuthService); 

  constructor(private fb: FormBuilder, private router: Router) {
    this.registerPatient = this.fb.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      UHID:['',Validators.required],
      bloodGroup:['',Validators.required],
    });
  }


 onSubmit() {
  console.log('tergrt')
    if (this.registerPatient.valid) {
      this.authService.registerPatient(this.registerPatient.value).subscribe(
        response => {
          // handle success, maybe store token, etc.
          console.log('register successfully', response);
          this.router.navigate(['allPatient']);
        },
        error => {
          // handle error, show message, etc.
          console.error('Registration failed', error);
        }
      );
    } else {
      this.registerPatient.markAllAsTouched();
    }
  }
    @Output() closeDialog = new EventEmitter<void>();
  onClose(): void {
    this.closeDialog.emit();
  }

}
