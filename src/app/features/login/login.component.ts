import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
 registerForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    console.log('Form Submitted:', this.registerForm.value);
    
    if (this.registerForm.valid) {
      console.log('Form Data:', this.registerForm.value);
      // Navigate to Home
      this.router.navigate(['home']);
    } else {
      console.log('Form is invalid');
      this.registerForm.markAllAsTouched(); // Optional: highlight errors
    }
  }
}
