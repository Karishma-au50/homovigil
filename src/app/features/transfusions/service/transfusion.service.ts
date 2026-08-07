import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// Optional: Define an interface to give your frontend strict typing based on your backend output
export interface TransfusionRecord {
  id: string;
  salesName: string;
  patientName: string;
  haemovigilId: string;
  bagIds: string[];
  status: string;
}

// Interface for your ApiResponse wrapper
export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  error: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TransfusionService {
  // Adjust this base URL to match your environment setup
  private apiUrl = environment.apiUrl +'api/transfusions'; 

  constructor(private http: HttpClient) { }

  getAllTransfusions(): Observable<ApiResponse<TransfusionRecord[]>> {
    return this.http.get<ApiResponse<TransfusionRecord[]>>(this.apiUrl);
  }

  getTransfusionDetails(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

}