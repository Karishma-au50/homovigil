import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

export const AuthGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
    const router = inject(Router);
    const jwtHelper = inject(JwtHelperService);

    const token = localStorage.getItem('slcAuthToken');
    if (!token) {
        router.navigate(['/auth/login']);
        return false;
    }

    const decodedToken: any = jwtHelper.decodeToken(token);

    if (decodedToken.exp < Date.now() / 1000) {
        localStorage.removeItem('authToken');
        router.navigate(['/auth/login']);
        return false;
    }

    const role = decodedToken.role;

    const allowedRoles = route.data?.['allowedRoles'];

    // If no roles specified, allow access to logged-in users
    if (!allowedRoles || allowedRoles.length === 0) {
        return true;
    }

    const userRole = (role || '').toLowerCase();
    const allowed = (allowedRoles as string[]).map(r => r.toLowerCase());

    if (allowed.includes(userRole)) {
        return true;
    }

    // Default redirection if not allowed
    router.navigate(['/notfound']);
    return false;
};
