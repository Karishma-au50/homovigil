import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { HomeComponent } from './app/features/home/home.component';
import { PatientComponent } from './app/features/patients/patient/patient.component';
import { AllPatientComponent } from './app/features/patients/all-patient/all-patient.component';
import { LoginComponent } from './app/features/login/login.component';
import { AllocateBagComponent } from './app/features/bag/allocate-bag/allocate-bag.component';
import { ReleaseBagComponent } from './app/features/bag/release-bag/release-bag.component';
import { AllocateBagHistoryComponent } from './app/features/bag/allocate-bag-history/allocate-bag-history.component';
import { UsersListComponent } from './app/features/users/components/users-list/users-list.component';
import { SalesComponent } from './app/features/sales/components/sales.component';
import { HomeRedirectGuard } from './app/core/auth/guard/home-redirect.guard';
import { TransfusionListComponent } from './app/features/transfusions/components/transfusion-list/transfusion-list.component';
import { AuthGuard } from './app/core/auth/guard/auth.guard';
import { BloodbankComponent } from './app/features/bloodbank/bloodbank.component';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            // { path: '', component: Dashboard },
            { path: '', pathMatch: 'full', redirectTo: 'home' },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') },
            {
                path: 'home',
                component: HomeComponent,
                canActivate: [HomeRedirectGuard]
            },
             {
                path: 'patient',
                component: PatientComponent
            },
            {
                path: 'allPatient',
                component: AllPatientComponent,
                canActivate: [AuthGuard],
                data: { allowedRoles: ['admin', 'ward'] }
            },
            {
                path: 'allocateBag',
                component: AllocateBagComponent,
                canActivate: [AuthGuard],
                data: { allowedRoles: ['admin', 'ward'] }
            },
            {
                path: 'releaseBag',
                component: ReleaseBagComponent,
                canActivate: [AuthGuard],
                data: { allowedRoles: ['admin', 'ward'] }
            },
            {
                path: 'allocationHistory',
                component: AllocateBagHistoryComponent,
                canActivate: [AuthGuard],
                data: { allowedRoles: ['admin', 'ward'] }
            },
            {
                path: 'users',
                component: UsersListComponent,
                canActivate: [AuthGuard],
                data: { allowedRoles: ['admin'] }
            },
            {
                path: 'sales',
                component: SalesComponent,
                canActivate: [AuthGuard],
                data: { allowedRoles: ['admin', 'ward', 'sales'] }
            },
            {
                path: 'transfusionUpdate',
                component: TransfusionListComponent,
                canActivate: [AuthGuard],
                data: { allowedRoles: ['admin', 'ward'] }
            },
            {
                path: 'bloodbank',
                component: BloodbankComponent,
                canActivate: [AuthGuard],
                data: { allowedRoles: ['admin', 'bloodbank'] }
            }
        ]
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: 'login', component: LoginComponent },
    { path: '**', redirectTo: '/notfound' },
];
