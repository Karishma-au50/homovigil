import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface OfflineQueueItem {
  offlineSyncId: string;
  salesId: string;
  patientId: string;
  bagId: string;
  bloodBagId: string;
  startTime: string;
  endTime?: string;
  protocolMatched?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private apiUrl = environment.apiUrl + 'api';
  private isSyncing = false;

  constructor(private http: HttpClient) {
    
  }

  parseQrForId(qrData: string): string | null {
    if (!qrData) return null;
    const cleanData = qrData.trim().replace(/^[\u200B\u200C\u200D\u20FE\uFEFF]/, '');
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (objectIdRegex.test(cleanData)) return cleanData;
    try {
      const parsedData = JSON.parse(cleanData);
      if (parsedData.patientId) return parsedData.patientId;
      return parsedData._id?.$oid || parsedData._id || null;
    } catch (error) {
      return null;
    }
  }

  parseQrForFullData(qrData: string): any | null {
    try {
      const cleanData = qrData.trim().replace(/^[\u200B\u200C\u200D\u20FE\uFEFF]/, '');
      return JSON.parse(cleanData);
    } catch { return null; }
  }

  // --- API CALLS ---
  getPatientFromBackend(patientId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/patient/${patientId}`);
  }

  getBloodBagFromBackend(bloodBagId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/bloodbag/${bloodBagId}`);
  }

  // getDetailsFromBarcodeApi(shortId: string) {
  //   return this.http.get(`${this.apiUrl}/sales/barcode/${shortId}`);
  // }

  // Step 1: Create bulk record on "Process" click
  createTransfusionApi(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/sales/scan`, payload);
  }

  // Step 3: Save Transfusion (Insert Bag into Array)
  saveTransfusionApi(payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/sales/save-transfusion`, payload);
  }

  syncOfflineApi(payload: any) {
    return this.http.post(`${this.apiUrl}/sales/sync-offline`, payload);
  }

  getPatientByUHIDApi(uhid: string): Observable<any> {
      return this.http.get(`${this.apiUrl}/transfusion/patient-by-uhid/${uhid}`);
  }

  resolveBarcodeApi(scannedValue: string): Observable<any> {
      return this.http.post(`${this.apiUrl}/transfusions/resolve-barcode`, { scannedValue });
  }

}