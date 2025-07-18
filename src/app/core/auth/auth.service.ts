import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, tap, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { User } from '../models/user.model';
import { MessageService } from 'primeng/api';
import { HemoVigilHttpService } from '../services/hemovigil.http.service';

export interface Credentials {
    mobile: string;
    password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private hemoVigilService = inject(HemoVigilHttpService);
    private messageService = inject(MessageService);

    private _user$ = new BehaviorSubject<User | null>(null);
    public readonly user$ = this._user$.asObservable();

    constructor() {
        this.initialize();
    }

    // Token management
    set authToken(token: string) {
        localStorage.setItem('slcAuthToken', token);
    }

    get authToken(): string {
        return localStorage.getItem('slcAuthToken') ?? '';
    }

    get currentUser(): User | null {
        return this._user$.value;
    }

    get isLoggedIn(): boolean {
        return !!this._user$.value;
    }

    // Login
    login(credentials: Credentials): Observable<any> {
        return this.hemoVigilService.login(credentials).pipe(
            tap((response: any) => {
                if (response.data.token) {
                    this.authToken = response.data.token;
                    this.decodeAndStoreUser(response.data.token);
                }
                this.messageService.add({
                    severity: 'success',
                    summary: 'Login Successful',
                    detail: 'Logged in successfully.',
                    life: 3000
                });
            }),
            catchError((error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Login Failed',
                    detail: error.error?.message || 'An error occurred during login.',
                    life: 3000
                });
                return throwError(() => error);
            })
        );
    }

    // Patient registration
    registerPatient(patientData: any): Observable<any> {
        return this.hemoVigilService.registerPatient(patientData).pipe(
            tap(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Registration Successful',
                    detail: 'Patient registered successfully.',
                    life: 3000
                });
            }),
            catchError((error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Registration Failed',
                    detail: error.error?.message || 'An error occurred during registration.',
                    life: 3000
                });
                return throwError(() => error);
            })
        );
    }

    // Patient search
    searchPatient(uhid: string, label:string): Observable<any> {
        return this.hemoVigilService.searchPatient(uhid,label).pipe(
            tap(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Patient Fetched',
                    detail: 'Patient fetched successfully.',
                    life: 3000
                });
            }),
            catchError((error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Fetch Failed',
                    detail: error.error?.message || 'An error occurred during patient fetch.',
                    life: 3000
                });
                return throwError(() => error);
            })
        );
    }

    // Get all patients
    getAllPatients(): Observable<any> {
        return this.hemoVigilService.getAllPatients().pipe(
            tap(() => {
                // this.messageService.add({
                //     severity: 'success',
                //     summary: 'Patients Loaded',
                //     detail: 'All patients loaded successfully.',
                //     life: 3000
                // });
            }),
            catchError((error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Load Failed',
                    detail: error.error?.message || 'An error occurred while loading patients.',
                    life: 3000
                });
                return throwError(() => error);
            })
        );
    }

    // Get all allocation bags
    getAllocationBag(): Observable<any> {
        return this.hemoVigilService.getAllocationBag().pipe(
            tap(() => {
                // this.messageService.add({
                //     severity: 'success',
                //     summary: 'Bags Loaded',
                //     detail: 'All Bags loaded successfully.',
                //     life: 3000
                // });
            }),
            catchError((error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Load Failed',
                    detail: error.error?.message || 'An error occurred while loading bags.',
                    life: 3000
                });
                return throwError(() => error);
            })
        );
    }

    // Update patient
    updatePatient(patient: any, id: string): Observable<any> {
        return this.hemoVigilService.updatePatient(patient, id).pipe(
            tap(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Update Successful',
                    detail: 'Patient updated successfully.',
                    life: 3000
                });
            }),
            catchError((error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Update Failed',
                    detail: error.error?.message || 'An error occurred during update.',
                    life: 3000
                });
                return throwError(() => error);
            })
        );
    }

    // Delete patient
    deletePatient(id: string): Observable<any> {
        return this.hemoVigilService.deletePatient(id).pipe(
            tap(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Delete Successful',
                    detail: 'Patient deleted successfully.',
                    life: 3000
                });
            }),
            catchError((error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Delete Failed',
                    detail: error.error?.message || 'An error occurred during deletion.',
                    life: 3000
                });
                return throwError(() => error);
            })
        );
    }

    // Allocate bag
    allocateBag(bagData: any): Observable<any> {
        return this.hemoVigilService.allocateBag(bagData).pipe(
            tap(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Bag Allocation Successful',
                    detail: 'Bag allocated successfully.',
                    life: 3000
                });
            }),
            catchError((error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Allocation Failed',
                    detail: error.error?.message || 'An error occurred during bag allocation.',
                    life: 3000
                });
                return throwError(() => error);
            })
        );
    }

    // Logout
    signOut(): Observable<any> {
        localStorage.removeItem('slcAuthToken');
        this._user$.next(null);
        return of(true);
    }

    // Initialization on app load
    private initialize(): void {
        const token = this.authToken;
        if (token) {
            this.decodeAndStoreUser(token);
        }
    }

    // Decode user and check expiration
    private decodeAndStoreUser(token: string): void {
        try {
            const decoded = jwtDecode<User & { exp: number }>(token);
            const currentTimeInSeconds = Math.floor(Date.now() / 1000);

            if (decoded.exp && decoded.exp < currentTimeInSeconds) {
                console.warn('Token expired');
                this.signOut().subscribe();
                return;
            }

            this._user$.next(decoded);
        } catch (error) {
            console.error('Invalid token:', error);
            this._user$.next(null);
        }
    }
    // Release allocated bag
    releaseAllocatedBag(allocationId: string, releaseUserName: string): Observable<any> {
        return this.hemoVigilService.releaseAllocatedBag(allocationId, releaseUserName).pipe(
            tap(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Bag Released',
                    detail: 'Allocated bag released successfully.',
                    life: 3000
                });
            }),
            catchError((error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Release Failed',
                    detail: error.error?.message || 'An error occurred during bag release.',
                    life: 3000
                });
                return throwError(() => error);
            })
        );
    }
    // Reserve allocated bag
    reserveAllocatedBag(allocationId: string, allocatedOn: string, reserved: string): Observable<any> {
        return this.hemoVigilService.reserveAllocatedBag(allocationId, allocatedOn,reserved).pipe(
            tap(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Bag Reserved',
                    detail: 'Allocated bag reserved successfully.',
                    life: 3000
                });
            }),
            catchError((error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Reservation Failed',
                    detail: error.error?.message || 'An error occurred during bag reservation.',
                    life: 3000
                });
                return throwError(() => error);
            })
        );
    }
}
