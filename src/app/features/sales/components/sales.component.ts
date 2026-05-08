import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  currentStep: number = 1;
  isOnline: boolean = true;
  allowedFormats = [BarcodeFormat.QR_CODE];

  scannedPatient: any = null;
  createdSalesRecordId: string | null = null;
  
  isCompletedRecord: boolean = false;
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

  isBagAlreadyScanned(bagId: string): boolean {
    if (!this.scannedPatient || !this.scannedPatient.bags) return false;
    return this.scannedPatient.bags.some((b: any) => b.bagId === bagId);
  }

  // Helper method to check if any bag is currently in progress
  hasInProgressBags(): boolean {
    if (!this.scannedPatient || !this.scannedPatient.bags) return false;
    return this.scannedPatient.bags.some((b: any) => b.status === 'In Progress');
  }

  // --- STEP 1: SCAN LOGIC ---
  onQrScanSuccess(scannedData: string) {
    const parsedQrData = this.salesService.parseQrForFullData(scannedData);
    const patientId = parsedQrData?.patientId || this.salesService.parseQrForId(scannedData);
    
    if (!patientId) {
      alert("Invalid QR Code! Scan a valid one.");
      return;
    }

    const bagId = parsedQrData?.bagId || null;
    const bloodBagId = parsedQrData?.bloodBagId || null;

    if (this.scannedPatient && this.scannedPatient.patientId !== patientId) {
      this.scannedPatient = null; 
    }

    if (bagId && this.isBagAlreadyScanned(bagId)) return;

    if (!this.scannedPatient) {
      this.scannedPatient = {
        patientId: patientId,
        patientName: 'Fetching patient data...',
        uhId: 'Loading...',
        haemovigilId: 'Loading...',
        bloodGroup: '',
        status: 'Loading',
        // ✅ NAYA: Global Symptoms object for Step 3
        symptoms: {
            cough: false,
            fever: false,
            rash: false,
            pain: false
        },
        bags: []
      };

      if (this.isOnline) {
        this.salesService.getPatientFromBackend(patientId).subscribe({
          next: (res: any) => {
            const pData = res.data || res;
            this.scannedPatient.patientName = `${pData.firstname} ${pData.lastname || ''}`.trim();
            this.scannedPatient.uhId = pData.UHID;
            this.scannedPatient.haemovigilId = pData.haemovigilId || 'N/A';
            this.scannedPatient.bloodGroup = pData.bloodGroup;
            this.scannedPatient.status = 'Ready';
          },
          error: () => this.scannedPatient.patientName = 'Patient not found'
        });
      }
    }

    const newBag = {
      bagId: bagId,
      bloodBagId: bloodBagId,
      bloodBagNumber: 'Fetching...',
      bloodComponent: '...',
      bagBloodGroup: '...',
      status: 'Pending Start',
      startTime: null,
      selectedEndTime: '',
      qrData: scannedData
    };
    
    this.scannedPatient.bags.push(newBag);
    const activeBag = this.scannedPatient.bags[this.scannedPatient.bags.length - 1];
    this.scrollToBottom();

    if (this.isOnline && bloodBagId) {
      this.salesService.getBloodBagFromBackend(bloodBagId).subscribe({
        next: (res: any) => {
          const bData = res.data || res;
          activeBag.bloodBagNumber = bData.bloodBagId;
          activeBag.bloodComponent = bData.bloodcomponent;
          activeBag.bagBloodGroup = bData.bloodGroup;
        },
        error: () => activeBag.bloodBagNumber = bloodBagId
      });
    } else if (!this.isOnline) {
      activeBag.bloodBagNumber = bloodBagId || 'Offline Bag';
    }
  }

  processAllScanned() {
    if (!this.scannedPatient || this.scannedPatient.bags.length === 0) {
      alert("Please scan at least one valid QR code.");
      return;
    }
    
    const loggedInUser: any = this.authService.currentUser;

    const payload = {
      salesId: loggedInUser._id || loggedInUser.id,
      patient: {
        patientId: this.scannedPatient.patientId,
        bags: this.scannedPatient.bags.map((b: any) => ({
          bagId: b.bagId,
          bloodBagId: b.bloodBagId
        }))
      }
    };

    if (this.isOnline) {
      this.salesService.createTransfusionApi(payload).subscribe({
        next: (res: any) => {
          this.createdSalesRecordId = res.data?._id || res._id;
          this.currentStep = 2; 
        },
        error: () => alert("Failed to create session on server.")
      });
    } else {
      this.createdSalesRecordId = `temp_offline_${Date.now()}`;
      this.isOfflineQueueTempId = true;
      this.currentStep = 2;
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    }, 100); 
  }

  prevStep() {
    if (this.currentStep === 2) this.resetFlow();
    else if (this.currentStep > 1) this.currentStep--;
  }

  // --- STEP 2: START TRANSFUSION (PER BAG) ---
  startTransfusion(bag: any) {
    if (!this.createdSalesRecordId) return;

    const currentStartTime = new Date().toISOString();

    if (this.isOnline && !this.isOfflineQueueTempId) {
      this.salesService.updateStartTransfusionApi(this.createdSalesRecordId, bag.bagId).subscribe({
        next: () => {
          bag.startTime = currentStartTime;
          bag.status = 'In Progress';
          this.currentStep = 3; // ✅ NAYA: Start hote hi Step 3 par bhej do
        },
        error: () => alert('Failed to connect to the server.')
      });
    } else {
      bag.startTime = currentStartTime;
      bag.status = 'In Progress';
      this.currentStep = 3; // ✅ NAYA: Start hote hi Step 3 par bhej do
    }
  }

  // --- STEP 3: END TRANSFUSION (PER BAG) ---
  saveTransfusion(bag: any) {
    if (!this.createdSalesRecordId) return;

    const endTimePayload = bag.selectedEndTime ? bag.selectedEndTime : undefined;

    // Backend payload update logic (if API supports global symptoms, you can pass this.scannedPatient.symptoms here)
    if (this.isOnline && !this.isOfflineQueueTempId) {
      this.salesService.updateEndTransfusionApi(this.createdSalesRecordId, bag.bagId, endTimePayload).subscribe({
        next: () => {
          bag.status = 'Completed';
          this.checkAllBagsCompleted();
        },
        error: () => {
          bag.status = 'Completed';
          this.checkAllBagsCompleted();
        }
      });
    } else {
      bag.status = 'Completed';
      this.checkAllBagsCompleted();
    }
  }

  checkAllBagsCompleted() {
    const allCompleted = this.scannedPatient.bags.every((b: any) => b.status === 'Completed');
    if (allCompleted) {
      this.isCompletedRecord = true;
      this.currentStep = 3;
    }
  }

  resetFlow() {
    this.currentStep = 1;
    this.scannedPatient = null;
    this.createdSalesRecordId = null;
    this.isCompletedRecord = false;
    this.isOfflineQueueTempId = false;
  }
}