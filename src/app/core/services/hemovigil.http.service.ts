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

    public allocateMultipleBags(bagAllocations: BagAllocation[]): Observable<ApiResponse<BagAllocation[]>> {
        return this.http.post<ApiResponse<BagAllocation[]>>(`${this.baseUrl}api/allocation/bulk`, bagAllocations);
    }

    public updatePatient(user: any, id: string): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<User>>(`${this.baseUrl}api/patient/${id}`, user);
    }

    public deletePatient(id: string) {
        return this.http.delete(`${this.baseUrl}api/patient/${id}`);
    }
    public releaseAllocatedBag(allocationId: string, payload: any): Observable<ApiResponse<any>> {
        return this.http.patch<ApiResponse<any>>(`${this.baseUrl}api/allocation/${allocationId}/release`, { payload });
    }
    public reserveAllocatedBag(allocationId: string): Observable<ApiResponse<any>> {
        return this.http.patch<ApiResponse<any>>(`${this.baseUrl}api/allocation/${allocationId}/reserve`, {});
    }
    getPatientDetailsWithBags(patientId: string): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}api/patient/${patientId}/details-with-bags`);
    }

    // ✅ PAGINATED ALLOCATION API
    getAllocationBagPaginated(page: number, limit: number, status?: string) {
        let url = `${this.baseUrl}api/allocation?page=${page}&limit=${limit}`;

        if (status) {
            url += `&status=${status}`;
        }

        return this.http.get(url);
    }

    checkAllocationLimit(patientId: string): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}api/patient/${patientId}/allocation-check`);
    }
    rotateHaemovigil(patientId: string): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}api/patient/${patientId}/rotate-haemovigil`, {});
    }
    getAllAllocationsNoPagination() {
        return this.http.get<any>(`${this.baseUrl}api/allocation/all`);
    }

    getTransporterKey(patientId: string): Observable<any> {
        return this.http.get(`${this.baseUrl}api/patient/${patientId}/transporter-key`); 
    }

    getHaemovigilIdTransporterKey(haemovigilId: string, isNew: boolean, patientId?: string): Observable<any> {
        let url = `${this.baseUrl}api/patient/${haemovigilId}/haemovigil-id/transporter-key?isNew=${isNew}`;
        
        if (!isNew && patientId) {
            url += `&patientId=${patientId}`;
        }
        
        return this.http.get(url);
    }

    addBloodbagId(bagId: string, bagObjectId: string, allocationId?: string, transporterBoxId?: string): Observable<any> {
        return this.http.patch(`${this.baseUrl}api/bloodbag/add-bag-id`, { bagId, bagObjectId, allocationId, transporterBoxId });
    }

    public deleteAllocation(allocationId: string): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.baseUrl}api/allocation/${allocationId}`);
    }

    public getAllBloodbags(params?: any): Observable<ApiResponse<any>> {
        let url = `${this.baseUrl}api/bloodbank?page=${params?.page || 1}&limit=${params?.limit || 100}`;
        if (params?.bloodGroup) url += `&bloodGroup=${encodeURIComponent(params.bloodGroup)}`;
        if (params?.bloodcomponent) url += `&bloodcomponent=${encodeURIComponent(params.bloodcomponent)}`;
        return this.http.get<ApiResponse<any>>(url);
    }

    public getBloodbagStats(): Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>(`${this.baseUrl}api/bloodbank/stats`);
    }

    public getBloodbagByRfid(rfid: string): Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>(`${this.baseUrl}api/bloodbank/rfid/${rfid}`);
    }

    public createBloodbag(bloodbag: any): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.baseUrl}api/bloodbank/`, bloodbag);
    }

    public updateBloodbag(id: string, bloodbag: any): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>(`${this.baseUrl}api/bloodbank/${id}`, bloodbag);
    }

    public deleteBloodbag(id: string): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.baseUrl}api/bloodbank/${id}`);
    }

}
