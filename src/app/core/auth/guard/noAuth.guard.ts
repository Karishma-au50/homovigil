import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { of, switchMap } from 'rxjs';

export const NoAuthGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
    const router: Router = inject(Router);
    const _jwtHelper = inject(JwtHelperService);

    // Check the authentication status
    const authToken = localStorage.getItem('authToken');
    // const userRole = localStorage.getItem('userRole');

    if (authToken) {
        router.navigate(['/']);
        return of(false);
    }

    // Allow the access
    return of(true);
};
