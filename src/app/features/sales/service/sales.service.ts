import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface OfflineQueueItem {
  tempId: string;       // E.g., 'offline_168493...'
  salesId: string;      // Logged in user ID
  patientId: string;    // Parsed from QR
  startTime?: string;
  endTime?: string;
  status: 'draft' | 'synced' | 'failed';
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  // Update this to match your local network IP where Node.js is running
  private apiUrl = environment.apiUrl+'api';
  private isSyncing = false;
  
  constructor(private http: HttpClient) {
    window.addEventListener('online', () => this.syncDrafts());
  }

  // 1. Extract ONLY the ID from the scanned QR code
  parseQrForId(qrData: string): string | null {
    if (!qrData) return null;

    const cleanData = qrData.trim().replace(/^[\u200B\u200C\u200D\u20FE\uFEFF]/, '');

    // Check if the QR code is just a plain raw MongoDB ObjectId (24 hex characters)
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (objectIdRegex.test(cleanData)) {
      return cleanData;
    }

    // If it's not a raw ID, attempt to parse it as JSON
    try {
      const parsedData = JSON.parse(cleanData);

      // Handle MongoDB $oid structure or flat _id
      return parsedData._id?.$oid || parsedData._id || null;
    } catch (error) {
      console.error('Invalid QR format: Neither raw ID nor valid JSON', error);
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

  //Fetch the actual patient details from your backend
  getPatientFromBackend(patientId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/patient/${patientId}`);
  }

  // Step 1: Create record on QR scan
  createTransclusionApi(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/sales/scan`, payload);
  }

  // Step 2: Update start time
  updateStartTransclusionApi(salesRecordId: string, payload?: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/sales/${salesRecordId}/start`, payload || {});
  }

  // Step 3: Update end time
  updateEndTransclusionApi(salesRecordId: string, endTime?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/sales/${salesRecordId}/end`, { endTime });
  }

  // --- OFFLINE QUEUE MANAGEMENT ---
  getAllRecords(): OfflineQueueItem[] {
    const data = localStorage.getItem('transclusions_queue');
    return data ? JSON.parse(data) : [];
  }

  saveDraftToQueue(draft: OfflineQueueItem) {
    const records = this.getAllRecords();
    records.push(draft);
    localStorage.setItem('transclusions_queue', JSON.stringify(records));
  }

  updateDraftInQueue(tempId: string, updates: Partial<OfflineQueueItem>) {
    let records = this.getAllRecords();
    const index = records.findIndex(r => r.tempId === tempId);
    if (index !== -1) {
      records[index] = { ...records[index], ...updates };
      localStorage.setItem('transclusions_queue', JSON.stringify(records));
      
      // Auto-trigger sync if internet is back
      if (navigator.onLine) this.syncDrafts();
    }
  }

  removeDraftFromQueue(tempId: string) {
    let records = this.getAllRecords();
    records = records.filter(r => r.tempId !== tempId);
    localStorage.setItem('transclusions_queue', JSON.stringify(records));
  }

  public async syncDrafts() {
    if (!navigator.onLine || this.isSyncing) return;
    this.isSyncing = true;

    const records = this.getAllRecords();
    // Get all drafts that haven't permanently failed
    const pendingDrafts = records.filter(r => r.status === 'draft');

    if (pendingDrafts.length > 0) {
      console.log(`Starting background sync for ${pendingDrafts.length} queued patients...`);
    }

    for (let draft of pendingDrafts) {
      try {
        // STEP 1: Verify Patient from Backend First!
        const patientRes: any = await lastValueFrom(this.getPatientFromBackend(draft.patientId));
        if (!patientRes || !patientRes.data) {
           throw new Error('Patient verification failed. Invalid ID.');
        }

        // STEP 2: Create (or Resume) Transclusion
        const createPayload = { salesId: draft.salesId, patient: { patientId: draft.patientId } };
        const createRes: any = await lastValueFrom(this.createTransclusionApi(createPayload));
        
        // Grab the real MongoDB ID (handles both new 201 records and existing 200 records)
        const realSalesRecordId = createRes.data._id;

        // STEP 3: Update Start Time (if recorded)
        if (draft.startTime) {
          const startPayload = { startTime: draft.startTime };
          await lastValueFrom(this.updateStartTransclusionApi(realSalesRecordId, startPayload));
        }

        // STEP 4: Update End Time (if recorded)
        if (draft.endTime || draft.endTime === null) {
          // Send undefined if it was intentionally left blank, otherwise send the time string
          const formattedEndTime = draft.endTime === 'BLANK' ? undefined : draft.endTime;
          await lastValueFrom(this.updateEndTransclusionApi(realSalesRecordId, formattedEndTime));
        }

        // SUCCESS: Remove this record from the queue entirely!
        console.log(`Successfully synced patient: ${draft.patientId}`);
        this.removeDraftFromQueue(draft.tempId);

      } catch (error: any) {
        console.error(`Sync failed for patient ${draft.patientId}:`, error);
        // Mark as failed so it doesn't infinitely loop on bad QR codes
        this.updateDraftInQueue(draft.tempId, { 
            status: 'failed', 
            errorMessage: error?.error?.message || error.message 
        });
      }
    }

    this.isSyncing = false;
  }

}