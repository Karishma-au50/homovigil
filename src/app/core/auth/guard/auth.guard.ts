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

    // If no roles specified, allow access to everyone
    if (!allowedRoles || allowedRoles.length === 0) {
        return true;
    }

    // If not allowed → redirect based on role
    switch (role) {
        case 'Admin':
        case 'subAdmin':
        case 'sales':
            // Allowed roles, allow access
            return true;
        case 'customer':
            router.navigate(['/not-found']);
            return false;
        default:
            router.navigate(['/not-found']);
            break;
    }

    return false;
};
