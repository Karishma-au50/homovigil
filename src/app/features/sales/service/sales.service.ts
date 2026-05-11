import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface OfflineQueueItem {
  tempId: string;       
  salesId: string;      
  patientId: string;    
  bags: any[]; // Updated to hold array of bags for offline
  status: 'draft' | 'synced' | 'failed';
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private apiUrl = environment.apiUrl + 'api';
  private isSyncing = false;
  
  constructor(private http: HttpClient) {
    window.addEventListener('online', () => this.syncDrafts());
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

  // Step 1: Create bulk record on "Process" click
  createTransfusionApi(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/sales/scan`, payload);
  }

  // Step 3: Save Transfusion (Insert Bag into Array)
  saveTransfusionApi(payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/sales/save-transfusion`, payload);
  }

  // --- OFFLINE QUEUE MANAGEMENT (Simplified for now) ---
  getAllRecords(): OfflineQueueItem[] {
    const data = localStorage.getItem('transfusions_queue');
    return data ? JSON.parse(data) : [];
  }

  saveDraftToQueue(draft: OfflineQueueItem) {
    const records = this.getAllRecords();
    records.push(draft);
    localStorage.setItem('transfusions_queue', JSON.stringify(records));
  }

  updateDraftInQueue(tempId: string, updates: Partial<OfflineQueueItem>) {
    let records = this.getAllRecords();
    const index = records.findIndex(r => r.tempId === tempId);
    if (index !== -1) {
      records[index] = { ...records[index], ...updates };
      localStorage.setItem('transfusions_queue', JSON.stringify(records));
      if (navigator.onLine) this.syncDrafts();
    }
  }

  removeDraftFromQueue(tempId: string) {
    let records = this.getAllRecords();
    records = records.filter(r => r.tempId !== tempId);
    localStorage.setItem('transfusions_queue', JSON.stringify(records));
  }

  public async syncDrafts() {
    // Offline sync logic will need to loop through the bags array similarly.
    // Keeping it minimal here to focus on the main flow.
  }
}