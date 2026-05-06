import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { SalesService } from '../service/sales.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule, FormsModule],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss'
})
export class SalesComponent implements OnInit {
  currentStep: number = 1;
  isOnline: boolean = true;
  allowedFormats = [BarcodeFormat.QR_CODE];

  // Data holders
  scannedPatient: any = null;
  activeRecord: any | null = null;
  selectedEndTime: string = '';

  // NEW: Store the DB ID created in Step 1
  createdSalesRecordId: string | null = null;

  isCompletedRecord: boolean = false;
  isSavedStatus: boolean = false;
  isOfflineQueueTempId: boolean = false;

  constructor(
    private salesService: SalesService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.isOnline = navigator.onLine;
    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);
  }

  // --- STEP 1: SCAN LOGIC ---
  onQrScanSuccess(scannedData: string) {
    const patientId = this.salesService.parseQrForId(scannedData);

    if (!patientId) {
      alert('Invalid QR Code. No valid Patient ID found.');
      return;
    }

    // ✅ OFFLINE FLOW: Parse JSON, queue draft, and immediately go to Step 2
    if (!this.isOnline) {
      const parsedData = this.salesService.parseQrForFullData(scannedData);

      this.scannedPatient = {
        id: patientId,
        uhId: parsedData?.UHID || 'N/A',
        patientName: `${parsedData?.firstname || 'Offline'} ${parsedData?.lastname || 'Patient'}`.trim(),
        bloodGroup: parsedData?.bloodGroup || 'Unknown',
        haemovigilId: parsedData?.haemovigilId || 'N/A',
        mobile: parsedData?.mobile || 'N/A',
        qrData: scannedData
      };

      const loggedInUser: any = this.authService.currentUser;
      this.createdSalesRecordId = `temp_offline_${Date.now()}`;
      this.isOfflineQueueTempId = true;

      this.salesService.saveDraftToQueue({
        tempId: this.createdSalesRecordId,
        salesId: loggedInUser._id || loggedInUser.id,
        patientId: this.scannedPatient.id,
        status: 'draft'
      });

      this.currentStep = 2;
      return;
    }

    // ✅ ONLINE FLOW: Fetch details, create/resume DB record, and automatically advance
    this.salesService.getPatientFromBackend(patientId).subscribe({
      next: (response: any) => {
        const backendData = response.data;
        this.scannedPatient = {
          id: backendData._id,
          uhId: backendData.UHID,
          firstname: backendData.firstname,
          lastname: backendData.lastname,
          patientName: `${backendData.firstname} ${backendData.lastname || ''}`.trim(),
          bloodGroup: backendData.bloodGroup,
          haemovigilId: backendData.haemovigilId,
          dob: backendData.dob,
          mobile: backendData.mobile,
          qrData: scannedData
        };

        const loggedInUser: any = this.authService.currentUser;
        const payload = {
          salesId: loggedInUser._id || loggedInUser.id,
          patient: { patientId: this.scannedPatient.id }
          // Notice: We removed checkOnly, so it creates the DB record instantly!
        };

        this.salesService.createTransflusionApi(payload).subscribe({
          next: (salesRes: any) => {
            this.createdSalesRecordId = salesRes.data._id;
            this.isOfflineQueueTempId = false;

            if (salesRes.statusCode === 200) {
              // Existing Record found - Auto Resume
              const tData = salesRes.data.patient.transflusion;
              this.isSavedStatus = tData.isSaved || false;

              this.activeRecord = {
                id: this.createdSalesRecordId!,
                patientName: this.scannedPatient.patientName,
                bloodGroup: this.scannedPatient.bloodGroup,
                qrData: this.scannedPatient.qrData,
                startTime: tData.startTransflusion,
                status: 'synced'
              };

              if (this.isSavedStatus) {
                this.currentStep = 3;
                this.isCompletedRecord = true;
                if (tData.endTransflusion) {
                  const dateObj = new Date(tData.endTransflusion);
                  dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
                  this.selectedEndTime = dateObj.toISOString().slice(0, 16);
                }
              } else if (!tData.startTransflusion) {
                this.currentStep = 2;
              } else {
                this.currentStep = 3;
              }
            } else {
              // New Record created! Move to Step 2
              this.currentStep = 2;
            }
          },
          error: (err) => {
            alert(err.error?.message || 'Failed to create transflusion record.');
            this.resetScan();
          }
        });
      },
      error: (error) => {
        alert('Patient not found.');
        this.resetScan();
      }
    });
  }

  // --- PROGRESSION LOGIC ---
  prevStep() {
    if (this.currentStep === 2) {
      // ✅ If going back to Step 1, clear all data so the scanner reappears
      this.resetFlow();
    } else if (this.currentStep > 1) {
      // Normal back behavior for other steps (e.g., Step 3 -> Step 2)
      this.currentStep--;
    }
  }

  resetScan() {
    this.scannedPatient = null;
    this.createdSalesRecordId = null;
  }

  // --- STEP 2: START Transflusion ---
  startTransflusion() {
    if (!this.scannedPatient) return;

    const currentStartTime = new Date().toISOString();

    // ✅ Only call API if online AND we have a real MongoDB ID
    if (this.isOnline && !this.isOfflineQueueTempId) {
      this.salesService.updateStartTransflusionApi(this.createdSalesRecordId!).subscribe({
        next: (response: any) => {
          this.activeRecord = { startTime: response.data.patient.transflusion.startTransflusion };
          this.currentStep = 3;
        },
        error: () => alert('Failed to connect to the server.')
      });
    } else {
      // ✅ OFFLINE UPDATE DRAFT: Save start time to queue
      this.salesService.updateDraftInQueue(this.createdSalesRecordId!, {
        startTime: currentStartTime
      });
      this.activeRecord = { startTime: currentStartTime };
      this.currentStep = 3;
    }
  }

  // --- STEP 3: END Transflusion ---
  saveTransflusion() {
    if (!this.activeRecord || !this.createdSalesRecordId) return;

    const endTimePayload = this.selectedEndTime ? this.selectedEndTime : undefined;

    // ✅ Only call API if online AND we have a real MongoDB ID
    if (this.isOnline && !this.isOfflineQueueTempId) {
      this.salesService.updateEndTransflusionApi(this.createdSalesRecordId, endTimePayload).subscribe({
        next: () => {
          this.isCompletedRecord = true;
          this.isSavedStatus = true;
        },
        error: () => this.fallbackToOfflineQueue(endTimePayload)
      });
    } else {
      // ✅ OFFLINE UPDATE DRAFT: Save end time to queue
      this.fallbackToOfflineQueue(endTimePayload);
    }

  }

  // Ensure your resetFlow looks like this so the "Scan Next Patient" button works:
  resetFlow() {
    this.currentStep = 1;
    this.scannedPatient = null;
    this.activeRecord = null;
    this.selectedEndTime = '';
    this.createdSalesRecordId = null;
    this.isCompletedRecord = false;
    this.isSavedStatus = false;
    this.isOfflineQueueTempId = false;
  }

  private fallbackToOfflineQueue(endTimePayload: string | undefined) {
      // Use 'BLANK' as a flag if they intentionally left the calendar empty
      const finalEndData = endTimePayload ? new Date(endTimePayload).toISOString() : 'BLANK';
      
      this.salesService.updateDraftInQueue(this.createdSalesRecordId!, {
          endTime: finalEndData
      });
      
      this.isCompletedRecord = true;
      this.isSavedStatus = true;
      alert('Saved securely to Offline. Will sync automatically when internet returns.');
  }

}