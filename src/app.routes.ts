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
import { ReleasBagComponent } from './app/features/bag/realeas-bag/realeas-bag.component';
import { AllocateBagHistoryComponent } from './app/features/bag/allocate-bag-history/allocate-bag-history.component';
import { UsersListComponent } from './app/features/users/components/users-list/users-list.component';
import { SalesComponent } from './app/features/sales/components/sales.component';
import { HomeRedirectGuard } from './app/core/auth/guard/home-redirect.guard';
import { TransfusionListComponent } from './app/features/transfusions/components/transfusion-list/transfusion-list.component';

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
                component:AllPatientComponent
            },
              {
                path: 'allocateBag',
                component:AllocateBagComponent
            },
            {
                path:'releaseBag',
                component:ReleasBagComponent
            },
            {
                path:'allocationHistory',
                component:AllocateBagHistoryComponent
            },
            {
                path:'users',
                component:UsersListComponent
            },
            {
                path:'sales',
                component:SalesComponent
            },
            {
                path:'transfusionUpdate',
                component:TransfusionListComponent
            }

        ]
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: 'login', component: LoginComponent },
    { path: '**', redirectTo: '/notfound' },
];
