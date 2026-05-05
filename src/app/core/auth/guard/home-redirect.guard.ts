import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

export const HomeRedirectGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const jwtHelper = inject(JwtHelperService);

    // Fetch the token using the same key as your AuthGuard
    const token = localStorage.getItem('slcAuthToken');
    
    if (token) {
        try {
            const decodedToken: any = jwtHelper.decodeToken(token);
            const role = decodedToken?.role?.toLowerCase();

            // If the user has the sales role, reroute them to /sales
            if (role === 'sales') {
                return router.parseUrl('/sales');
            }
        } catch (error) {
            console.error('Error decoding token in HomeRedirectGuard', error);
        }
    }
    
    // Allow all other roles (like Admin) to proceed to /home[cite: 6]
    return true; 
};