import { Routes } from '@angular/router';
import { UsersDetailComponent } from './components/users-detail/users-detail.component';
import { UsersListComponent } from './components/users-list/users-list.component';

export default [
    { path: '', component: UsersListComponent },
    { path: 'add', component: UsersDetailComponent }
] as Routes;