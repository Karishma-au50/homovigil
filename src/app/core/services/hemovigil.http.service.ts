import { HttpClient } from '@angular/common/http';
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
    private baseUrl = environment.apiUrl;

    // Auth
    public login(credentials: Credentials): Observable<ApiResponse<User>> {
        return this.http.post<ApiResponse<User>>(`${this.baseUrl}api/user/login`, credentials);
    }

    public registerPatient(patient: any): Observable<ApiResponse<Patient>> {
        return this.http.post<ApiResponse<any>>(`${this.baseUrl}api/patient/`, patient);
    }

    public searchPatient(uhid: string, label: string): Observable<ApiResponse<string>> {
        let url = `${this.baseUrl}api/patient/search`;

        if (uhid && !label) {
            url += `?uhid=${uhid}`;
        } else if (!uhid && label) {
            url += `?haemovigilId=${label}`;
        } else if (uhid && label) {
            url += `?uhid=${uhid}&haemovigilId=${label}`;
        }

        return this.http.get<ApiResponse<any>>(url);
    }
    // Patients
    public getAllPatients(): Observable<ApiResponse<Patient[]>> {
        return this.http.get<ApiResponse<Patient[]>>(`${this.baseUrl}api/patient/`);
    }

    public getAllocationBag(): Observable<ApiResponse<BagAllocation[]>> {
        return this.http.get<ApiResponse<BagAllocation[]>>(`${this.baseUrl}api/allocation`);
    }

    public allocateBag(bagAllocation: BagAllocation): Observable<ApiResponse<BagAllocation>> {
        return this.http.post<ApiResponse<BagAllocation>>(`${this.baseUrl}api/allocation`, bagAllocation);
    }

    public updatePatient(user: any, id: string): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<User>>(`${this.baseUrl}api/patient/${id}`, user);
    }

    public deletePatient(id: string) {
        return this.http.delete(`${this.baseUrl}api/patient/${id}`);
    }
    public releaseAllocatedBag(allocationId: string, releaseUserName: string): Observable<ApiResponse<any>> {
        return this.http.patch<ApiResponse<any>>(`${this.baseUrl}api/allocation/${allocationId}/release`, { releaseUserName });
    }
    public reserveAllocatedBag(allocationId: string, allocatedOn: string, reserved: string): Observable<ApiResponse<any>> {
        const payload = {
            status: reserved,
            allocatedOn: allocatedOn
        };
        return this.http.patch<ApiResponse<any>>(`${this.baseUrl}api/allocation/${allocationId}`, payload);
    }
}
