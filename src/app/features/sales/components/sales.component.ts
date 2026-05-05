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

    // ✅ OFFLINE FALLBACK: If no internet, parse the QR JSON directly
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

      alert('You are offline. Scanned data has been loaded locally.');
      return; // Stop here, wait for user to click Next
    }

    // 1. Fetch patient details to display on UI
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

        // ✅ 2. CHECK FOR EXISTING RECORD IMMEDIATELY (But tell backend NOT to create a new one)
        if (this.isOnline) {
          const loggedInUser: any = this.authService.currentUser;
          const checkPayload = {
            salesId: loggedInUser._id || loggedInUser.id,
            patient: { patientId: this.scannedPatient.id },
            checkOnly: true // 👈 NEW: This safely checks status without writing to MongoDB
          };

          this.salesService.createTransclusionApi(checkPayload).subscribe({
            next: (salesRes: any) => {
              // If data is returned, an existing record was found! Auto-resume it.
              if (salesRes.statusCode === 200 && salesRes.data) {
                this.createdSalesRecordId = salesRes.data._id;
                const tData = salesRes.data.patient.transclusion;
                this.isSavedStatus = tData.isSaved || false;

                this.activeRecord = {
                  id: this.createdSalesRecordId!,
                  patientName: this.scannedPatient.patientName,
                  bloodGroup: this.scannedPatient.bloodGroup,
                  qrData: this.scannedPatient.qrData,
                  startTime: tData.startTransclusion,
                  status: 'synced'
                };

                // Auto-Redirection Logic
                if (this.isSavedStatus) {
                  this.currentStep = 3;
                  this.isCompletedRecord = true;
                  if (tData.endTransclusion) {
                    const dateObj = new Date(tData.endTransclusion);
                    dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
                    this.selectedEndTime = dateObj.toISOString().slice(0, 16);
                  }
                } else if (!tData.startTransclusion) {
                  this.currentStep = 2;
                } else {
                  this.currentStep = 3;
                }
              }
              // If salesRes.data is null, it's a new patient. 
              // It safely stays on Step 1 waiting for you to click "Next".
            }
          });
        }
      },
      error: (error) => {
        alert('Patient not found in the database or server is down.');
      }
    });
  }

  // --- PROGRESSION LOGIC ---
  nextStep() {
    if (this.currentStep === 1 && !this.scannedPatient) return;

    if (this.currentStep === 1) {
      // ✅ 3. NOW CREATE THE RECORD IN MONGODB (Because Next was clicked)
      if (this.isOnline) {
        const loggedInUser: any = this.authService.currentUser;
        const payload = {
          salesId: loggedInUser._id || loggedInUser.id,
          patient: { patientId: this.scannedPatient.id }
          // checkOnly is omitted here, so the backend WILL create the document
        };

        this.salesService.createTransclusionApi(payload).subscribe({
          next: (salesRes: any) => {
            this.createdSalesRecordId = salesRes.data._id;
            this.isOfflineQueueTempId = false;
            // Record created! Move to step 2.
            this.currentStep = 2;
          },
          error: (err) => {
            const errorMsg = err.error?.message || 'Failed to create transclusion record.';
            alert(errorMsg);
            this.resetScan();
          }
        });
      } else {
        // ✅ OFFLINE CREATE DRAFT: Generate a temporary ID and queue it
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
      }
    } else if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  resetScan() {
    this.scannedPatient = null;
    this.createdSalesRecordId = null;
  }

  // --- STEP 2: START TRANSCLUSION ---
  startTransclusion() {
    if (!this.scannedPatient) return;

    const currentStartTime = new Date().toISOString();

    // ✅ Only call API if online AND we have a real MongoDB ID
    if (this.isOnline && !this.isOfflineQueueTempId) {
      this.salesService.updateStartTransclusionApi(this.createdSalesRecordId!).subscribe({
        next: (response: any) => {
          this.activeRecord = { startTime: response.data.patient.transclusion.startTransclusion };
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

  // --- STEP 3: END TRANSCLUSION ---
  saveTransclusion() {
    if (!this.activeRecord || !this.createdSalesRecordId) return;

    const endTimePayload = this.selectedEndTime ? this.selectedEndTime : undefined;

    // ✅ Only call API if online AND we have a real MongoDB ID
    if (this.isOnline && !this.isOfflineQueueTempId) {
      this.salesService.updateEndTransclusionApi(this.createdSalesRecordId, endTimePayload).subscribe({
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
      alert('Saved securely to Offline Queue. Will sync automatically when internet returns.');
  }

}