import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { Credentials } from '../auth/auth.service';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { Patient } from '../models/patient.modal';
import { BagAllocation } from '../models/bag.modal';

@Injectable({
    providedIn: 'root'
})
export class HemoVigilHttpService {
    private http = inject(HttpClient);

    // Base API URL
    private baseUrl = environment.apiUrl;

    // Auth
    public login(credentials: Credentials): Observable<ApiResponse<User>> {
        return this.http.post<ApiResponse<User>>(`${this.baseUrl}api/user/login`, credentials);
    }
    public registerPatient(patient: any): Observable<ApiResponse<Patient>> {
        const token = localStorage.getItem('slcAuthToken'); // or use your AuthService getter
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
        return this.http.post<ApiResponse<any>>(`${this.baseUrl}api/patient/`, patient, { headers });
    }
    public searchPatient(uhid: string): Observable<ApiResponse<string>> {

        return this.http.get<ApiResponse<any>>(`${this.baseUrl}api/patient/search?uhid=${uhid}`);
    }

    // Users
    public getAllPatients(): Observable<ApiResponse<Patient[]>> {
        const token = localStorage.getItem('slcAuthToken');
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
        return this.http.get<ApiResponse<Patient[]>>(`${this.baseUrl}api/patient/`, { headers });
    }

    public getAllocationBag(): Observable<ApiResponse<BagAllocation[]>> {
        const token = localStorage.getItem('slcAuthToken');
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
        return this.http.get<ApiResponse<BagAllocation[]>>(`${this.baseUrl}api/allocation`, { headers });
    }
    // public createUser(user: any): Observable<ApiResponse<User>> {
    //     return this.http.post<ApiResponse<User>>(`${this.baseUrl}/users/`, user);
    // }

    public updatePatient(user: any, id: string): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<User>>(`${this.baseUrl}api/patient/${id}`, user);
    }
    public deletePatient(id: string) {
        const token = localStorage.getItem('slcAuthToken');
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
        return this.http.delete(`${this.baseUrl}api/patient/${id}`, { headers });
    }

    // public getAllAllocations(user:any,id:string):Observable<ApiResponse<any>>{
    //     return this.http.get<ApiResponse<
    // }

    // public sendOtp(mobile: string): Observable<ApiResponse<any>> {
    //     return this.http.post<ApiResponse<any>>(`${this.baseUrl}/users/send-otp`, { mobile });
    // }

    // public verifyOtp(mobile: string, otp: string): Observable<ApiResponse<User>> {
    //     return this.http.post<ApiResponse<User>>(`${this.baseUrl}/users/verify-otp`, { mobile, otp });
    // }
}
