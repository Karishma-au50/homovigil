import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TransclusionRecord {
  id: string;
  patientName: string;
  bloodGroup: string;
  qrData: string;
  startTime?: string;
  endTime?: string;
  status: 'draft' | 'synced';
}

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  // Update this to match your local network IP where Node.js is running
  private apiUrl = 'http://192.168.1.43:3000/api';

  constructor(private http: HttpClient) {
    window.addEventListener('online', () => this.syncDrafts());
  }

  // 1. Extract ONLY the ID from the scanned QR code
  parseQrForId(qrData: string): string | null {
    if (!qrData) return null;

    const cleanData = qrData.trim();

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

  // 2. Fetch the actual patient details from your backend
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

  // 3. Save Start Transclusion Date & Time
  saveStartTransclusion(patientData: any): TransclusionRecord {
    const record: TransclusionRecord = {
      ...patientData,
      startTime: new Date().toISOString(),
      status: navigator.onLine ? 'synced' : 'draft'
    };
    this.saveToStorage(record);
    return record;
  }

  // 4. Save End Transclusion Date & Time
  saveEndTransclusion(recordId: string, endTime?: string) {
    let records = this.getAllRecords();
    const index = records.findIndex(r => r.id === recordId);

    if (index !== -1) {
      // ✅ MODIFIED: Save the provided time, or leave as undefined/null
      records[index].endTime = endTime ? new Date(endTime).toISOString() : undefined;
      records[index].status = navigator.onLine ? 'synced' : 'draft';
      localStorage.setItem('transclusions_db', JSON.stringify(records));
      if (navigator.onLine) this.syncDrafts();
    }
  }

  private saveToStorage(record: TransclusionRecord) {
    const records = this.getAllRecords();
    records.push(record);
    localStorage.setItem('transclusions_db', JSON.stringify(records));
  }

  private getAllRecords(): TransclusionRecord[] {
    const data = localStorage.getItem('transclusions_db');
    return data ? JSON.parse(data) : [];
  }

  public syncDrafts() {
    let records = this.getAllRecords();
    let updated = false;

    records = records.map(record => {
      if (record.status === 'draft') {
        record.status = 'synced';
        updated = true;
      }
      return record;
    });

    if (updated) {
      localStorage.setItem('transclusions_db', JSON.stringify(records));
      console.log('All drafts synced successfully.');
    }
  }
}