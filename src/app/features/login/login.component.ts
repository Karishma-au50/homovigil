import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-login',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    registerForm: FormGroup;
    authService = inject(AuthService); // Assuming HemoVigilHttpService is the service for authentication
    isLoading: boolean = false;

    constructor(
        private fb: FormBuilder,
        private router: Router
    ) {
        this.registerForm = this.fb.group({
            phone: ['', Validators.required],
            password: ['', Validators.required]
        });
    }

    onPhoneInput(event: any) {
        // Remove any non-numeric characters (like letters, 'e', '+', etc.)
        let sanitizedValue = event.target.value.replace(/[^0-9]/g, '');
        
        // Limit to exactly 10 digits
        if (sanitizedValue.length > 10) {
            sanitizedValue = sanitizedValue.slice(0, 10);
        }

        // Update the input box and the Angular form control
        event.target.value = sanitizedValue;
        this.registerForm.get('phone')?.setValue(sanitizedValue);
    }

    onSubmit() {
        if (this.registerForm.valid) {
            this.isLoading = true;

            this.authService.login(this.registerForm.value).subscribe(
                (response) => {
                    this.isLoading = false;
                    // handle success, maybe store token, etc.
                    // console.log('Login successful', response);
                    // this.router.navigate(['home']);

                    // Retrieve the role from the auth service (or fallback to response if your API returns it there)
                    const userRole = this.authService.currentUser?.role || response?.role;

                    // Conditionally route based on the role
                    if (userRole && (userRole.toLowerCase() === 'ward' || userRole.toLowerCase() === 'sales') ) {
                        this.router.navigate(['/sales']);
                    } else {
                        // Default redirection for Admin and other roles
                        this.router.navigate(['/allPatient']);
                    }
                },
                (error) => {
                    this.isLoading = false;
                    // handle error, show message, etc.
                    console.error('Login failed', error);
                }
            );
        } else {
            this.registerForm.markAllAsTouched();
        }
    }
}
