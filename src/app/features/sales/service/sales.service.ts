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
  symptoms?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private apiUrl = environment.apiUrl + 'api';
  private isSyncing = false;
  
  constructor(private http: HttpClient) {
    window.addEventListener('online', () => this.syncDrafts());

    if (navigator.onLine) {
      setTimeout(() => this.syncDrafts(), 2000); 
    }
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

 // --- OFFLINE QUEUE MANAGEMENT ---
  getAllRecords(): OfflineQueueItem[] {
    const data = localStorage.getItem('transfusions_queue');
    return data ? JSON.parse(data) : [];
  }

  saveDraftToQueue(draft: OfflineQueueItem) {
    const records = this.getAllRecords();
    records.push(draft);
    localStorage.setItem('transfusions_queue', JSON.stringify(records));
    if (navigator.onLine) this.syncDrafts();
  }

  removeDraftFromQueue(id: string) {
    let records = this.getAllRecords();
    records = records.filter(r => r.offlineSyncId !== id);
    localStorage.setItem('transfusions_queue', JSON.stringify(records));
  }

  public async syncDrafts() {
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;
    
    let records = this.getAllRecords(); // aapka purana get function
    if (!records || records.length === 0) {
      this.isSyncing = false;
      return;
    }

    for (const record of records) {
      try {
        await lastValueFrom(this.createTransfusionApi({
          salesId: record.salesId,
          patient: { patientId: record.patientId, bags: [] }
        }));

        const payload = { ...record, isOfflineSync: true };
        const res: any = await lastValueFrom(this.saveTransfusionApi(payload));

        if (res?.alreadyTransfused) {
          alert(`⚠️ OFFLINE SYNC ALERT:\nBag ID: ${record.bloodBagId || record.bagId} was already transfused by someone else. Data was kept safe.`);
        }

        // Queue se remove karein (Aapka purana remove function use karke)
        let updatedRecords = this.getAllRecords().filter((r: any) => r.offlineSyncId !== record.offlineSyncId);
        localStorage.setItem('transfusions_queue', JSON.stringify(updatedRecords));

      } catch (error) {
        console.error('Failed to sync offline record silently', error);
      }
    }
    this.isSyncing = false;
  }

}