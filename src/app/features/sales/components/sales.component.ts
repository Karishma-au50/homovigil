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

  onQrScanSuccess(scannedData: string) {
    let parsedQrData: any = null;

    try {
      // 1. Try to parse the raw JSON from the scanner directly
      const rawData = JSON.parse(scannedData);

      // 2. Map the new short keys back to the standard names.
      // We use || rawData.oldKey to ensure backwards compatibility with older printed bags!
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
      // 3. Fallback to your old service method if standard JSON parsing fails
      parsedQrData = this.salesService.parseQrForFullData(scannedData);
    }

    // Now use our safely mapped parsedQrData to get the IDs
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

    // if (bagId && this.isBagAlreadyScanned(bagId)) return;
    if (bagId && this.isBagAlreadyScanned(bagId)) {
      alert("Invalid QR Code! Scan a valid one.");
      return;
    }

    if (!this.scannedPatient) {
      // this.scannedPatient = {
      //   patientId: patientId,
      //   patientName: 'Fetching patient data...',
      //   uhId: 'Loading...',
      //   haemovigilId: 'Loading...',
      //   bloodGroup: '',
      //   status: 'Loading',
      //   symptoms: { cough: false, fever: false, rash: false, pain: false },
      //   bags: [],
      //   existingDbBags: []
      // };

      this.scannedPatient = {
        patientId: patientId,
        // ✅ OFFLINE UPDATE: Online hai toh "Fetching...", offline hai toh QR Code se naam uthao
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
            // Safety check: Only update if the patient card wasn't deleted by a duplicate scan
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

            // this.scannedPatient.bags.forEach((b: any) => {
            //   if (this.scannedPatient.existingDbBags.some((dbBag: any) => dbBag.bagId === b.bagId)) {
            //     b.status = 'Completed';
            //     b.isAlreadyCompleted = true;
            //   }
            // });

            // 1. Filter out bags that the DB says are already completed
            const validBags: any[] = [];
            let foundAlreadyTransfused = false;

            this.scannedPatient.bags.forEach((b: any) => {
              const isTransfused = this.scannedPatient.existingDbBags.some((dbBag: any) => dbBag.bagId === b.bagId);
              if (isTransfused) {
                foundAlreadyTransfused = true;
              } else {
                validBags.push(b);
              }
            });

            // 2. Update the array to only keep new/un-transfused bags
            this.scannedPatient.bags = validBags;

            // 3. If the list is now empty (because the ONLY bag scanned was invalid), reset the UI FIRST
            if (this.scannedPatient.bags.length === 0) {
              this.scannedPatient = null;
            }

            // 4. Show alert (Wrapped in setTimeout so Angular removes the background card BEFORE freezing the screen)
            if (foundAlreadyTransfused) {
              setTimeout(() => {
                alert("Invalid QR Code! Scan a valid one.");
              }, 50); // 50ms delay is enough for the UI to update
            }

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

    if (this.isOnline) {
      if (this.scannedPatient.existingDbBags?.length > 0) {
        if (this.scannedPatient.existingDbBags.some((dbBag: any) => dbBag.bagId === bagId)) {
          alert("Invalid QR Code! Scan a valid one.");
          return;
          // newBag.status = 'Completed';
          // newBag.isAlreadyCompleted = true;
        }
      }
    } else {
      // ✅ OFFLINE UPDATE: Ab bag number bhi directly QR se aayega!
      newBag.bloodBagNumber = parsedQrData?.bloodBagNumber || bloodBagId || bagId;
      newBag.bloodComponent = 'Offline Data';
      newBag.bagBloodGroup = parsedQrData?.bloodGroup || 'Offline';
    }


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

          if (this.scannedPatient.hasPreviousSymptoms) {
            alert(`⚠️ WARNING: This patient previously showed reactions (symptoms) during transfusion! Please proceed with caution.`);
          }

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
    if (bag.protocols.cough) activeProtocols.push('cough');
    if (bag.protocols.rash) activeProtocols.push('rash');
    if (bag.protocols.fever) activeProtocols.push('fever');
    if (bag.protocols.pain) activeProtocols.push('pain');
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
  }
}