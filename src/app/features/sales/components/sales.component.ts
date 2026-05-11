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
  allowedFormats = [BarcodeFormat.QR_CODE];

  scannedPatient: any = null;
  createdSalesRecordId: string | null = null;

  isCompletedRecord: boolean = false;

  constructor(
    private salesService: SalesService,
    private authService: AuthService
  ) { }

  ngOnInit() {
  }

  isBagAlreadyScanned(bagId: string): boolean {
    if (!this.scannedPatient || !this.scannedPatient.bags) return false;
    return this.scannedPatient.bags.some((b: any) => b.bagId === bagId);
  }

  hasInProgressBags(): boolean {
    if (!this.scannedPatient || !this.scannedPatient.bags) return false;
    return this.scannedPatient.bags.some((b: any) => b.status === 'In Progress');
  }

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
        symptoms: { cough: false, fever: false, rash: false, pain: false },
        bags: [],
        existingDbBags: []
      };

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

      const loggedInUser: any = this.authService.currentUser;
      const payload = {
        salesId: loggedInUser._id || loggedInUser.id,
        patient: { patientId: patientId, bags: [] }
      };
      
      this.salesService.createTransfusionApi(payload).subscribe({
        next: (res: any) => {
          this.createdSalesRecordId = res.data?._id || res._id;

          const existingPatientData = res.data?.patient;
          this.scannedPatient.existingDbBags = existingPatientData?.bags || [];

          if (existingPatientData?.symptoms) {
            this.scannedPatient.symptoms = { 
                cough: existingPatientData.symptoms.cough || false,
                rash: existingPatientData.symptoms.rash || false,
                fever: existingPatientData.symptoms.fever || false,
                pain: existingPatientData.symptoms.pain || false
            };

            const hasPreviousSymptoms = Object.values(this.scannedPatient.symptoms).some(val => val === true);
            
            if (hasPreviousSymptoms) {
              // alert(`⚠️ WARNING: This patient previously showed reactions (symptoms) during transfusion! Please proceed with caution.`);
              this.scannedPatient.hasPreviousSymptoms = true; 
            }
          }
          
          this.scannedPatient.bags.forEach((b: any) => {
            if (this.scannedPatient.existingDbBags.some((dbBag: any) => dbBag.bagId === b.bagId)) {
              b.status = 'Completed';
              b.isAlreadyCompleted = true;
            }
          });
        }
      });
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
      qrData: scannedData,
      isAlreadyCompleted: false 
    };

    if (this.scannedPatient.existingDbBags?.length > 0) {
      if (this.scannedPatient.existingDbBags.some((dbBag: any) => dbBag.bagId === bagId)) {
        newBag.status = 'Completed';
        newBag.isAlreadyCompleted = true;
      }
    }

    this.scannedPatient.bags.push(newBag);
    const activeBag = this.scannedPatient.bags[this.scannedPatient.bags.length - 1];
    this.scrollToBottom();

    if (bloodBagId) {
      this.salesService.getBloodBagFromBackend(bloodBagId).subscribe({
        next: (res: any) => {
          const bData = res.data || res;
          activeBag.bloodBagNumber = bData.bloodBagId;
          activeBag.bloodComponent = bData.bloodcomponent;
          activeBag.bagBloodGroup = bData.bloodGroup;
        },
        error: () => activeBag.bloodBagNumber = bloodBagId
      });
    }
  }

  processAllScanned() {
    if (!this.scannedPatient || this.scannedPatient.bags.length === 0) {
      alert("Please scan at least one valid QR code.");
      return;
    }

    const hasNewBagsToProcess = this.scannedPatient.bags.some((b: any) => !b.isAlreadyCompleted);

    if (!hasNewBagsToProcess) {
      alert("All scanned bags for this patient have already been transfused.");
      return;
    }

    const loggedInUser: any = this.authService.currentUser;
    const payload = {
      salesId: loggedInUser._id || loggedInUser.id,
      patient: {
        patientId: this.scannedPatient.patientId,
        bags: []
      }
    };

    this.salesService.createTransfusionApi(payload).subscribe({
      next: (res: any) => {
        this.createdSalesRecordId = res.data?._id || res._id;
        
        if (this.scannedPatient.hasPreviousSymptoms) {
          alert(`⚠️ WARNING: This patient previously showed reactions (symptoms) during transfusion! Please proceed with caution.`);
        }

        this.currentStep = 2;
      },
      error: () => alert("Failed to create/update session on server.")
    });
  }

  saveTransfusion(bag: any) {
    if (!this.scannedPatient?.patientId) return;

    const payload = {
      patientId: this.scannedPatient.patientId,
      bagId: bag.bagId,
      bloodBagId: bag.bloodBagId,
      startTime: bag.startTime,
      endTime: bag.selectedEndTime ? bag.selectedEndTime : undefined,
      symptoms: this.scannedPatient.symptoms
    };

    this.salesService.saveTransfusionApi(payload).subscribe({
      next: () => {
        bag.status = 'Completed';
        this.checkAllBagsCompleted();
      },
      error: () => alert('Failed to save the transfusion record.')
    });
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  startTransfusion(bag: any) {
    bag.startTime = new Date().toISOString();
    bag.status = 'In Progress';
    this.currentStep = 3;
  }

  cancelInProgress(bag: any) {
    bag.startTime = null;
    bag.status = 'Pending Start';
    this.currentStep = 2;
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
  }
}