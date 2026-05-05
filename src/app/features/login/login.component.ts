import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    registerForm: FormGroup;
    authService = inject(AuthService); // Assuming HemoVigilHttpService is the service for authentication

    constructor(
        private fb: FormBuilder,
        private router: Router
    ) {
        this.registerForm = this.fb.group({
            phone: ['', Validators.required],
            password: ['', Validators.required]
        });
    }

    onSubmit() {
        if (this.registerForm.valid) {
            this.authService.login(this.registerForm.value).subscribe(
                (response) => {
                    // handle success, maybe store token, etc.
                    // console.log('Login successful', response);
                    // this.router.navigate(['home']);

                    // Retrieve the role from the auth service (or fallback to response if your API returns it there)
                    const userRole = this.authService.currentUser?.role || response?.role;

                    // Conditionally route based on the role
                    if (userRole && userRole.toLowerCase() === 'sales') {
                        this.router.navigate(['/sales']);
                    } else {
                        // Default redirection for Admin and other roles
                        this.router.navigate(['/home']);
                    }
                },
                (error) => {
                    // handle error, show message, etc.
                    console.error('Login failed', error);
                }
            );
        } else {
            this.registerForm.markAllAsTouched();
        }
    }
}
