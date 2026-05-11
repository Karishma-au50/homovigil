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
  isOnline: boolean = navigator.onLine;

  currentStep: number = 1;
  allowedFormats = [BarcodeFormat.QR_CODE];

  scannedPatient: any = null;
  createdSalesRecordId: string | null = null;

  isCompletedRecord: boolean = false;
  showStep2Error: boolean = false;
  sessionScannedBags: string[] = [];

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

  hasInProgressBags(): boolean {
    if (!this.scannedPatient || !this.scannedPatient.bags) return false;
    return this.scannedPatient.bags.some((b: any) => b.status === 'In Progress');
  }

  goToEndPhase() {
    // Check strictly if at least one bag is CURRENTLY In Progress
    const hasStarted = this.scannedPatient.bags.some((b: any) =>
      b.status === 'In Progress'
    );

    if (!hasStarted) {
      this.showStep2Error = true;
      setTimeout(() => this.showStep2Error = false, 3000);
      return;
    }

    this.showStep2Error = false;
    this.currentStep = 3;
  }

  onQrScanSuccess(scannedData: string) {
    let parsedQrData: any = null;

    try {
      const rawData = JSON.parse(scannedData);
      parsedQrData = {
        bagId: rawData.bId || rawData.bagId,
        patientId: rawData.pId || rawData.patientId,
        bloodBagId: rawData.bbId || rawData.bloodBagId,
        patientName: rawData.pN || rawData.patientName,
        uhId: rawData.uId || rawData.uhId,
        haemovigilId: rawData.hId || rawData.haemovigilId,
        bloodGroup: rawData.bG || rawData.bloodGroup,
        bloodBagNumber: rawData.bbN || rawData.bloodBagNumber
      };
    } catch (e) {
      parsedQrData = this.salesService.parseQrForFullData(scannedData);
    }

    const patientId = parsedQrData?.patientId || this.salesService.parseQrForId(scannedData);

    if (!patientId) {
      // ✅ CHANGE 3: Delayed alert prevents screen freeze
      setTimeout(() => alert("Invalid QR Code! Scan a valid one."), 400);
      return;
    }

    const bagId = parsedQrData?.bagId || null;
    const bloodBagId = parsedQrData?.bloodBagId || null;

    if (this.scannedPatient && this.scannedPatient.patientId !== patientId) {
      this.scannedPatient = null;
    }

    if (bagId) {
      if (this.isBagAlreadyScanned(bagId) || this.sessionScannedBags.includes(bagId)) {
        return; // ✅ SILENT IGNORE: Prevents alert spam while camera is still pointing at the QR
      }
      this.sessionScannedBags.push(bagId); // Lock this bagId immediately for this session
    }

    let isFirstScan = false;
    if (!this.scannedPatient) {
      isFirstScan = true;
      this.scannedPatient = {
        patientId: patientId,
        patientName: this.isOnline ? 'Fetching patient data...' : (parsedQrData?.patientName || patientId),
        uhId: this.isOnline ? 'Loading...' : (parsedQrData?.uhId || 'Offline'),
        haemovigilId: this.isOnline ? 'Loading...' : (parsedQrData?.haemovigilId || 'Offline'),
        bloodGroup: this.isOnline ? '' : (parsedQrData?.bloodGroup || 'Offline'),
        status: this.isOnline ? 'Loading' : 'Ready',
        symptoms: { cough: false, fever: false, rash: false, pain: false },
        bags: [],
        existingDbBags: []
      };

      if (this.isOnline) {
        this.salesService.getPatientFromBackend(patientId).subscribe({
          next: (res: any) => {
            if (this.scannedPatient) {
              const pData = res.data || res;
              this.scannedPatient.patientName = `${pData.firstname} ${pData.lastname || ''}`.trim();
              this.scannedPatient.uhId = pData.UHID;
              this.scannedPatient.haemovigilId = pData.haemovigilId || 'N/A';
              this.scannedPatient.bloodGroup = pData.bloodGroup;
              this.scannedPatient.status = 'Ready';
            }
          },
          error: () => {
            if (this.scannedPatient) this.scannedPatient.patientName = 'Patient not found';
          }
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
      qrData: scannedData,
      isAlreadyCompleted: false,
      protocols: { cough: false, rash: false, fever: false, pain: false }
    };

    // ✅ CHANGE 4: Do not push to UI immediately. Check DB lock first!
    if (this.isOnline) {
      const loggedInUser: any = this.authService.currentUser;
      const payload = {
        salesId: loggedInUser._id || loggedInUser.id,
        patient: { patientId: patientId, bags: [] },
        bagId: bagId,
        bloodBagId: bloodBagId
      };

      this.salesService.createTransfusionApi(payload).subscribe({
        next: (res: any) => {
          if (res.alreadyScanned) {
            // Destroy card if it was the very first scan and it failed
            if (isFirstScan && this.scannedPatient?.bags.length === 0) {
              this.scannedPatient = null;
            }
            setTimeout(() => alert("Invalid QR Code! Scan a valid one."), 400);
            return;
          }

          this.createdSalesRecordId = res.data?._id || res._id;

          if (isFirstScan) {
            const existingPatientData = res.data?.patient;
            this.scannedPatient.existingDbBags = existingPatientData?.bags || [];

            if (existingPatientData?.symptoms) {
              this.scannedPatient.symptoms = {
                cough: existingPatientData.symptoms.cough || false,
                rash: existingPatientData.symptoms.rash || false,
                fever: existingPatientData.symptoms.fever || false,
                pain: existingPatientData.symptoms.pain || false
              };
              if (Object.values(this.scannedPatient.symptoms).some(val => val === true)) {
                this.scannedPatient.hasPreviousSymptoms = true;
              }
            }
          }

          // ✅ SAFE TO PUSH: Backend confirmed it is not a duplicate. (No UI flashing!)
          this.scannedPatient.bags.push(newBag);
          this.scrollToBottom();

          // Fetch bag details
          if (bloodBagId) {
            this.salesService.getBloodBagFromBackend(bloodBagId).subscribe({
              next: (bRes: any) => {
                const bData = bRes.data || bRes;
                newBag.bloodBagNumber = bData.bloodBagId;
                newBag.bloodComponent = bData.bloodcomponent;
                newBag.bagBloodGroup = bData.bloodGroup;
              },
              error: () => newBag.bloodBagNumber = bloodBagId
            });
          }
        }
      });
    } else {
      // Offline mode: push immediately
      newBag.bloodBagNumber = parsedQrData?.bloodBagNumber || bloodBagId || bagId;
      newBag.bloodComponent = 'Offline Data';
      newBag.bagBloodGroup = parsedQrData?.bloodGroup || 'Offline';
      this.scannedPatient.bags.push(newBag);
      this.scrollToBottom();
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
    if (this.isOnline) {
      this.salesService.createTransfusionApi(payload).subscribe({
        next: (res: any) => {
          this.createdSalesRecordId = res.data?._id || res._id;

          // if (this.scannedPatient.hasPreviousSymptoms) {
          //   alert(`⚠️ WARNING: This patient previously showed reactions (symptoms) during transfusion! Please proceed with caution.`);
          // }

          this.currentStep = 2;
        },
        error: () => alert("Failed to create/update session on server.")
      });
    } else {
      this.currentStep = 2;
    }
  }

  saveTransfusion(bag: any) {
    // if (!this.scannedPatient?.patientId) return;
    if (!this.scannedPatient?.patientId) return;

    const activeProtocols = [];
    if (bag.protocols.cough) activeProtocols.push('Cough');
    if (bag.protocols.rash) activeProtocols.push('Skin Rash');
    if (bag.protocols.fever) activeProtocols.push('Fever');
    if (bag.protocols.pain) activeProtocols.push('Pain (Back Chest or Flank)');
    const protocolString = activeProtocols.join(',');

    const payload = {
      patientId: this.scannedPatient.patientId,
      bagId: bag.bagId,
      bloodBagId: bag.bloodBagId,
      startTime: bag.startTime,
      endTime: bag.selectedEndTime ? bag.selectedEndTime : undefined,
      // symptoms: this.scannedPatient.symptoms
      protocolMatched: protocolString
    };

    if (this.isOnline) {
      this.salesService.saveTransfusionApi(payload).subscribe({
        next: () => {
          bag.status = 'Completed';
          this.checkAllBagsCompleted();
        },
        error: () => alert('Failed to save the transfusion record.')
      });
    } else {
      const loggedInUser: any = this.authService.currentUser;
      const offlineRecord = {
        ...payload,
        salesId: loggedInUser._id || loggedInUser.id,
        offlineSyncId: Date.now().toString()
      };

      const records = JSON.parse(localStorage.getItem('transfusions_queue') || '[]');
      records.push(offlineRecord);
      localStorage.setItem('transfusions_queue', JSON.stringify(records));

      bag.status = 'Completed';
      this.checkAllBagsCompleted();
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
    this.sessionScannedBags = [];
  }
  
}