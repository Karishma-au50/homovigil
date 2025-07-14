import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { User } from '../models/user.model';
import { MessageService } from 'primeng/api';
import { HemoVigilHttpService } from '../services/hemovigil.http.service';
import { Patient } from '../models/patient.modal';

export interface Credentials {
    mobile: string;
    password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private slcRewardsService = inject(HemoVigilHttpService);
    private messageService = inject(MessageService);

    // Private reactive user state
    private _user$ = new BehaviorSubject<User | null>(null);

    // Public observable to subscribe in components
    public readonly user$ = this._user$.asObservable();

    constructor() {
        this.initialize();
    }

    // Access token management
    set authToken(token: string) {
        localStorage.setItem('slcAuthToken', token);
    }

    get authToken(): string {
        return localStorage.getItem('slcAuthToken') ?? '';
    }

    // Synchronous access
    get currentUser(): User | null {
        return this._user$.value;
    }

    get isLoggedIn(): boolean {
        return !!this._user$.value;
    }

    // sendOtp(mobile: string): Observable<any> {
    //     return this.slcRewardsService.sendOtp(mobile).pipe(
    //         tap((response: any) => {
    //             this.messageService.add({
    //                 severity: 'success',
    //                 summary: 'OTP Sent',
    //                 detail: 'An OTP has been sent to your mobile number.',
    //                 life: 3000
    //             });
    //         }),
    //         catchError((error) => {
    //             this.messageService.add({
    //                 severity: 'error',
    //                 summary: 'OTP Failed',
    //                 detail: error.error?.message || 'An error occurred while sending OTP.',
    //                 life: 3000
    //             });

    //             return throwError(() => error); // propagates error to the component
    //         })
    //     );
    // }

    // verifyOtp(mobile: string, otp: string): Observable<any> {
    //     return this.slcRewardsService.verifyOtp(mobile, otp).pipe(
    //         tap((response: any) => {
    //             if (response.data.token) {
    //                 this.authToken = response.data.token;
    //             }
    //             this.decodeAndStoreUser(response.data.token);

    //             this.messageService.add({
    //                 severity: 'success',
    //                 summary: 'OTP Verified',
    //                 detail: 'OTP verified successfully. Logged in.',
    //                 life: 3000
    //             });
    //         }),
    //         catchError((error) => {
    //             this.messageService.add({
    //                 severity: 'error',
    //                 summary: 'Verification Failed',
    //                 detail: error.error?.message || 'An error occurred during OTP verification.',
    //                 life: 3000
    //             });

    //             return throwError(() => error); // propagates error to the component
    //         })
    //     );
    // }

    // Login
    login(credentials: Credentials): Observable<any> {
        return this.slcRewardsService.login(credentials).pipe(
            tap((response: any) => {
                if (response.data.token) {
                    this.authToken = response.data.token;
                }
                this.decodeAndStoreUser(response.data.token);

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

                return throwError(() => error); // propagates error to the component
            })
        );
    }

    registerPatient(patientData: any): Observable<any> {
        return this.slcRewardsService.registerPatient(patientData).pipe(
            tap((response: any) => {
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
    searchPatient(uhid: string): Observable<any> {
        return this.slcRewardsService.searchPatient(uhid).pipe(
            tap((response: any) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Patient fetched Successful',
                    detail: 'Patient fetched successfully.',
                    life: 3000
                });
            }),
            catchError((error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'fetched Failed',
                    detail: error.error?.message || 'An error occurred during registration.',
                    life: 3000
                });
                return throwError(() => error);
            })
        );
    }


    getAllPatients(): Observable<any> {
        return this.slcRewardsService.getAllPatients().pipe(
            tap((response: any) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Patients Loaded',
                    detail: 'All patients loaded successfully.',
                    life: 3000
                });

                return of(response)
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
    getAllocationBag(): Observable<any> {
        return this.slcRewardsService.getAllocationBag().pipe(
            tap((response: any) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Bags Loaded',
                    detail: 'All Bags loaded successfully.',
                    life: 3000
                });

                return of(response.data)
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
    // ...existing code...

    updatePatient(patient: any, id: string): Observable<any> {
        return this.slcRewardsService.updatePatient(patient, id).pipe(
            tap((response: any) => {
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

    deletePatient(id: string): Observable<any> {
        return this.slcRewardsService.deletePatient(id).pipe(
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

    // ...existing code...
    // Logout
    signOut(): Observable<any> {
        localStorage.removeItem('slcAuthToken');
        this._user$.next(null);
        return of(true);
    }

    // Init on app load
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
}
