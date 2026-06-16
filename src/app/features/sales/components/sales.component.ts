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
  allowedFormats = [
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.EAN_13
  ];

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
    window.addEventListener('online', () => { this.isOnline = true, this.syncOfflineData(); });
    window.addEventListener('offline', () => this.isOnline = false);
  }

  syncOfflineData() {
    const queue = JSON.parse(localStorage.getItem('transfusions_queue') || '[]');
    if (queue.length === 0) return;

    const loggedInUser: any = this.authService.currentUser;
    const payload = {
        salesId: loggedInUser._id || loggedInUser.id,
        offlineRecords: queue
    };

    // Call the new backend endpoint you created in step 4
    this.salesService.syncOfflineApi(payload).subscribe({
        next: (res: any) => {
            console.log("Sync successful!", res);
            // Clear the queue once successfully synced
            localStorage.removeItem('transfusions_queue');
        },
        error: (err) => {
            console.error("Sync failed, data remains in queue.", err);
        }
    });
}

  // isBagAlreadyScanned(bagId: string): boolean {
  //   if (!this.scannedPatient || !this.scannedPatient.bags) return false;
  //   return this.scannedPatient.bags.some((b: any) => b.bagId === bagId);
  // }

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

  // onQrScanSuccess(scannedData: string) {
  //   let parsedQrData: any = null;

  //   try {
  //     const rawData = JSON.parse(scannedData);
  //     parsedQrData = {
  //       bagId: rawData.bId || rawData.bagId,
  //       patientId: rawData.pId || rawData.patientId,
  //       bloodBagId: rawData.bbId || rawData.bloodBagId,
  //       bloodComponent: rawData.bbC || rawData.bloodComponent,
  //       patientName: rawData.pN || rawData.patientName,
  //       uhId: rawData.uId || rawData.uhId,
  //       haemovigilId: rawData.hId || rawData.haemovigilId,
  //       bloodGroup: rawData.bG || rawData.bloodGroup,
  //       bloodBagNumber: rawData.bbN || rawData.bloodBagNumber
  //     };
  //   } catch (e) {
  //     parsedQrData = this.salesService.parseQrForFullData(scannedData);
  //   }

  //   const patientId = parsedQrData?.patientId || this.salesService.parseQrForId(scannedData);

  //   if (!patientId) {
  //     setTimeout(() => alert("Invalid QR Code! Scan a valid one."), 400);
  //     return;
  //   }

  //   const bagId = parsedQrData?.bagId || null;
  //   const bloodBagId = parsedQrData?.bloodBagId || null;

  //   if (this.scannedPatient && this.scannedPatient.patientId !== patientId) {
  //     this.scannedPatient = null;
  //   }

  //   if (bagId) {
  //     if (this.isBagAlreadyScanned(bagId) || this.sessionScannedBags.includes(bagId)) {
  //       return; // Silent Ignore for camera spam
  //     }
  //     this.sessionScannedBags.push(bagId);
  //   }

  //   let isFirstScan = false;
  //   let tempPatientData: any = null;

  //   if (!this.scannedPatient) {
  //     isFirstScan = true;

  //     // ✅ FIX: "Fetching..." text hata diya! QR code ka data instantly UI par show karein.
  //     tempPatientData = {
  //       patientId: patientId,
  //       patientName: parsedQrData?.patientName || patientId,
  //       uhId: parsedQrData?.uhId || 'N/A',
  //       haemovigilId: parsedQrData?.haemovigilId || 'N/A',
  //       bloodGroup: parsedQrData?.bloodGroup || 'N/A',
  //       status: 'Ready', // ✅ Isse amber color ka "Fetching..." tag gayab ho jayega!
  //       symptoms: { cough: false, fever: false, rash: false, pain: false },
  //       bags: [],
  //       existingDbBags: []
  //     };


  //   }

  //   // ✅ FIX: Naya bag banate waqt instantly QR ka data use karein (No "Fetching...")
  //   const newBag = {
  //     bagId: bagId,
  //     bloodBagId: bloodBagId,
  //     bloodBagNumber: parsedQrData?.bloodBagNumber || bagId,
  //     bloodComponent: parsedQrData?.bloodComponent || 'Unknown',
  //     bagBloodGroup: parsedQrData?.bloodGroup || 'Unknown',
  //     status: 'Pending Start',
  //     startTime: null,
  //     selectedEndTime: '',
  //     qrData: scannedData,
  //     isAlreadyCompleted: false,
  //     protocols: { cough: false, rash: false, fever: false, pain: false }
  //   };

  //   if (this.isOnline) {
  //     const loggedInUser: any = this.authService.currentUser;
  //     const payload = {
  //       salesId: loggedInUser._id || loggedInUser.id,
  //       patient: { patientId: patientId, bags: [] },
  //       bagId: bagId,
  //       bloodBagId: bloodBagId
  //     };

  //     this.salesService.createTransfusionApi(payload).subscribe({
  //       next: (res: any) => {
  //         if (res.alreadyScanned) {
  //           // if (isFirstScan && this.scannedPatient?.bags.length === 0) {
  //           //   this.scannedPatient = null;
  //           // }
  //           setTimeout(() => alert("Invalid Qr code! scan valid one."), 400);
  //           return;
  //         }

  //         if (isFirstScan) {
  //           this.scannedPatient = tempPatientData;

  //           // Patient ki fresh details API se silently fetch karke update karein
  //           this.salesService.getPatientFromBackend(patientId).subscribe({
  //             next: (pRes: any) => {
  //               if (this.scannedPatient) {
  //                 const pData = pRes.data || pRes;
  //                 this.scannedPatient.patientName = `${pData.firstname} ${pData.lastname || ''}`.trim() || this.scannedPatient.patientName;
  //                 this.scannedPatient.uhId = pData.UHID || this.scannedPatient.uhId;
  //                 this.scannedPatient.haemovigilId = pData.haemovigilId || this.scannedPatient.haemovigilId;
  //                 this.scannedPatient.bloodGroup = pData.bloodGroup || this.scannedPatient.bloodGroup;
  //               }
  //             }
  //           });
  //         }

  //         this.createdSalesRecordId = res.data?._id || res._id;

  //         // ✅ FIX: API se duplicate lock check pass hone ke turant baad bag ko UI mein bhej dein! 
  //         this.scannedPatient.bags.push(newBag);
  //         this.scrollToBottom();

  //         // Background mein silent update (UI iska wait nahi karega)
  //         if (bloodBagId) {
  //           this.salesService.getBloodBagFromBackend(bloodBagId).subscribe({
  //             next: (bRes: any) => {
  //               const bData = bRes.data || bRes;
  //               newBag.bloodBagNumber = bData.bloodBagId || newBag.bloodBagNumber;
  //               newBag.bloodComponent = bData.bloodcomponent || newBag.bloodComponent;
  //               newBag.bagBloodGroup = bData.bloodGroup || newBag.bagBloodGroup;
  //             }
  //           });
  //         }
  //       }
  //     });
  //   } else {
  //     // Offline mode
  //     if (isFirstScan) {
  //       this.scannedPatient = tempPatientData;
  //     }
  //     this.scannedPatient.bags.push(newBag);
  //     this.scrollToBottom();
  //   }
  // }

  // onQrScanSuccess(scannedData: string) {
  //   const allocationShortId = scannedData.trim();
    
  //   if (!allocationShortId) return;

  //   // 2. Prevent duplicate processing if the scanner fires multiple times instantly
  //   if (this.sessionScannedBags.includes(allocationShortId)) {
  //     return; 
  //   }
    
  //   // Optimistically lock in UI to prevent camera spam
  //   this.sessionScannedBags.push(allocationShortId);

  //   // 3. Fetch data from backend using the Barcode string
  //   if (this.isOnline) {
  //     this.salesService.getDetailsFromBarcodeApi(allocationShortId).subscribe({
  //       next: (res: any) => {
  //         const allocation = res.data;
  //         const patient = allocation.patientId; // Populated from backend
  //         const bloodBag = allocation.bloodBagId; // Populated from backend

  //         this.processFetchedBarcodeData(allocation, patient, bloodBag, allocationShortId);
  //       },
  //       error: (err) => {
  //         // Remove from session so ward boy can try scanning again
  //         this.sessionScannedBags = this.sessionScannedBags.filter(id => id !== allocationShortId);
  //         setTimeout(() => alert("Invalid Barcode or Data not found!"), 400);
  //       }
  //     });
  //   } else {
  //      // ✅ OFFLINE MODE: Just build a generic bag with the Short ID
  //       if (!this.scannedPatient) {
  //           this.scannedPatient = {
  //               patientName: 'Offline Patient (Pending Sync)',
  //               uhId: '---',
  //               haemovigilId: '---',
  //               bloodGroup: '---',
  //               status: 'Offline',
  //               bags: []
  //           };
  //       }

  //       const newOfflineBag = {
  //           bagId: null, // We don't know this yet
  //           bloodBagId: null, // We don't know this yet
  //           bloodBagNumber: allocationShortId, // Use barcode as identifier
  //           bloodComponent: 'Unknown (Offline)', 
  //           bagBloodGroup: '---',      
  //           status: 'Pending Start',
  //           startTime: null,
  //           selectedEndTime: '',
  //           qrData: allocationShortId,
  //           isAlreadyCompleted: false,
  //           protocols: { cough: false, rash: false, fever: false, pain: false }
  //       };

  //       this.scannedPatient.bags.push(newOfflineBag);
  //       this.scrollToBottom();
  //   }
  // }

    onQrScanSuccess(scannedData: string) {
    const value = scannedData.trim();
    if (!value) return;

    // Prevent scanner spam for the same value
    if (this.sessionScannedBags.includes(value)) return;
    this.sessionScannedBags.push(value);

    if (!this.isOnline) {
      if (!this.scannedPatient) {
        this.scannedPatient = {
          patientName: 'Offline Patient (Pending Sync)',
          uhId: value, haemovigilId: '---', bloodGroup: '---',
          status: 'Offline', bags: []
        };
      }
      this.scannedPatient.bags.push({
        bagId: null, bloodBagId: null, bagSubDocId: null,
        bloodBagNumber: 'Offline Bag', bloodComponent: 'Unknown (Offline)',
        bagBloodGroup: '---', status: 'Pending Start', startTime: null,
        selectedEndTime: '', qrData: value, isAlreadyCompleted: false,
        protocols: { cough: false, rash: false, fever: false, pain: false }
      });
      this.scrollToBottom();
      return;
    }

    // ONLINE: resolve the barcode on the backend
    this.salesService.resolveBarcodeApi(value).subscribe({
      next: (res: any) => {
        const data = res.data;
        const patient = data.patient;
        const bloodBag = data.bloodBag;

        // Different patient scanned — reset session and continue
        if (this.scannedPatient && this.scannedPatient.patientId !== patient._id.toString()) {
          alert('Warning: Different patient barcode scanned. Starting new session.');
          this.scannedPatient = null;
          this.sessionScannedBags = [];
          this.createdSalesRecordId = null;
          this.currentStep = 1;
          this.sessionScannedBags.push(value);
        }

        // Initialize patient card on first scan
        if (!this.scannedPatient) {
          this.scannedPatient = {
            patientId: patient._id,
            patientName: `${patient.firstname} ${patient.lastname || ''}`.trim(),
            uhId: patient.UHID || 'N/A',
            haemovigilId: patient.haemovigilId || 'N/A',
            bloodGroup: patient.bloodGroup || 'N/A',
            status: 'Ready',
            symptoms: { cough: false, fever: false, rash: false, pain: false },
            bags: [], existingDbBags: []
          };
        }

        const loggedInUser: any = this.authService.currentUser;

        // Build the new bag object
        const newBag: any = {
          bagId: data.scenario === 'BLOOD_BAG_ID' ? data.allocationId : null,
          bloodBagId: data.scenario === 'BLOOD_BAG_ID' ? bloodBag._id : null,
          bagSubDocId: null,
          bloodBagNumber: data.scenario === 'BLOOD_BAG_ID' ? bloodBag.bloodBagId : 'Bag ID not found',
          bloodComponent: data.scenario === 'BLOOD_BAG_ID' ? bloodBag.bloodcomponent : null,
          bagBloodGroup: data.scenario === 'BLOOD_BAG_ID' ? bloodBag.bloodGroup : null,
          status: 'Pending Start', startTime: null, selectedEndTime: '',
          qrData: value, isAlreadyCompleted: false,
          protocols: { cough: false, rash: false, fever: false, pain: false }
        };

        // Lock the bag in database and get its subdocument _id
        this.salesService.createTransfusionApi({
          salesId: loggedInUser._id || loggedInUser.id,
          patient: { patientId: patient._id, bags: [] },
          bagId: newBag.bagId,
          bloodBagId: newBag.bloodBagId
        }).subscribe({
          next: (lockRes: any) => {
            if (lockRes.alreadyScanned) {
              this.sessionScannedBags = this.sessionScannedBags.filter(id => id !== value);
              if (this.scannedPatient && this.scannedPatient.bags.length === 0) {
                this.scannedPatient = null;
              }
              setTimeout(() => alert('This bag has already been scanned.'), 400);
              return;
            }
            this.createdSalesRecordId = lockRes.data?._id || lockRes._id;
            newBag.bagSubDocId = lockRes.data?.savedBagSubDocId || null;
            this.scannedPatient.bags.push(newBag);
            this.scrollToBottom();
          },
          error: () => {
            this.sessionScannedBags = this.sessionScannedBags.filter(id => id !== value);
            if (this.scannedPatient && this.scannedPatient.bags.length === 0) {
              this.scannedPatient = null;
            }
          }
        });
      },
      error: (err) => {
        this.sessionScannedBags = this.sessionScannedBags.filter(id => id !== value);
        setTimeout(() => alert(err?.error?.message || 'Invalid barcode or not found. Please try again.'), 400);
      }
    });
  }

  // processFetchedBarcodeData(allocation: any, patient: any, bloodBag: any, shortId: string) {
  //   const patientId = patient._id;
  //   const bagId = allocation._id;
  //   const bloodBagId = bloodBag._id;

  //   // Safety check: if ward boy somehow scans a different patient's bag
  //   if (this.scannedPatient && this.scannedPatient.patientId !== patientId) {
  //     alert("Warning: You scanned a bag belonging to a different patient. Resetting session.");
  //     this.scannedPatient = null;
  //   }

  //   if (!this.scannedPatient) {
  //     this.scannedPatient = {
  //       patientId: patientId,
  //       patientName: `${patient.firstname} ${patient.lastname || ''}`.trim(),
  //       uhId: patient.UHID || 'N/A',
  //       haemovigilId: patient.haemovigilId || 'N/A',
  //       bloodGroup: patient.bloodGroup || 'N/A',
  //       status: 'Ready',
  //       symptoms: { cough: false, fever: false, rash: false, pain: false },
  //       bags: [],
  //       existingDbBags: []
  //     };
  //   }

  //   const newBag = {
  //     bagId: bagId,
  //     bloodBagId: bloodBagId,
  //     bloodBagNumber: bloodBag.bloodBagId || shortId,
  //     bloodComponent: bloodBag.bloodcomponent || 'Unknown', 
  //     bagBloodGroup: bloodBag.bloodGroup || 'Unknown',      
  //     status: 'Pending Start',
  //     startTime: null,
  //     selectedEndTime: '',
  //     qrData: shortId,
  //     isAlreadyCompleted: false,
  //     protocols: { cough: false, rash: false, fever: false, pain: false }
  //   };

  //   // 5. Call your existing Transfusion API to "lock" the bag in the database
  //   const loggedInUser: any = this.authService.currentUser;
  //   const payload = {
  //     salesId: loggedInUser._id || loggedInUser.id,
  //     patient: { patientId: patientId, bags: [] },
  //     bagId: bagId,
  //     bloodBagId: bloodBagId
  //   };

  //   this.salesService.createTransfusionApi(payload).subscribe({
  //     next: (res: any) => {
  //       if (res.alreadyScanned) {
  //         setTimeout(() => alert("Invalid Barcode Scan Valid One."), 400);

  //         // 1. Remove from session so they can try scanning again if needed
  //         this.sessionScannedBags = this.sessionScannedBags.filter(id => id !== shortId);

  //         // 2. Destroy the empty patient card if no other bags exist
  //         if (this.scannedPatient && this.scannedPatient.bags.length === 0) {
  //           this.scannedPatient = null;
  //         }
  //         // --------------------
          
  //         return;
  //       }

  //       this.createdSalesRecordId = res.data?._id || res._id;
        
  //       // Push to UI list
  //       this.scannedPatient.bags.push(newBag);
  //       this.scrollToBottom();
  //     },
  //     error: () => {
  //        this.sessionScannedBags = this.sessionScannedBags.filter(id => id !== shortId);
         
  //        // ADD THIS BLOCK:
  //        // Destroy the empty patient card if the API request fails
  //        if (this.scannedPatient && this.scannedPatient.bags.length === 0) {
  //           this.scannedPatient = null;
  //        }
  //        // --------------------
  //     }
  //   });
  // }

  processAllScanned() {
    if (!this.scannedPatient || this.scannedPatient.bags.length === 0) {
      alert("Please scan at least one valid Barcode.");
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
    // Bags already locked in DB during onQrScanSuccess — just proceed to step 2
    this.currentStep = 2;
    // if (this.isOnline) {
    //   this.salesService.createTransfusionApi(payload).subscribe({
    //     next: (res: any) => {
    //       this.createdSalesRecordId = res.data?._id || res._id;

    //       // if (this.scannedPatient.hasPreviousSymptoms) {
    //       //   alert(`⚠️ WARNING: This patient previously showed reactions (symptoms) during transfusion! Please proceed with caution.`);
    //       // }

    //       this.currentStep = 2;
    //     },
    //     error: () => alert("Failed to create/update session on server.")
    //   });
    // } else {
    //   this.currentStep = 2;
    // }
  }

  saveTransfusion(bag: any) {
    // if (!this.scannedPatient?.patientId) return;
    if (this.isOnline && !this.scannedPatient?.patientId) return;

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
      bagSubDocId: bag.bagSubDocId || null,
      startTime: bag.startTime,
      endTime: bag.selectedEndTime ? bag.selectedEndTime : undefined,
      // symptoms: this.scannedPatient.symptoms
      protocolMatched: protocolString,
      status: "completed"
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
      const offlineRecord = {
            shortId: bag.bloodBagNumber, // The barcode string
            startTime: bag.startTime,
            endTime: bag.selectedEndTime ? bag.selectedEndTime : undefined,
            protocolMatched: protocolString,
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

  // startTransfusion(bag: any) {
  //   bag.startTime = new Date().toISOString();
  //   bag.status = 'In Progress';
  //   this.currentStep = 3;
  // }

  // cancelInProgress(bag: any) {
  //   bag.startTime = null;
  //   bag.status = 'Pending Start';
  //   this.currentStep = 2;
  // }

  startTransfusion(bag: any) {
    bag.startTime = new Date().toISOString();
    const originalStatus = bag.status;
    bag.status = 'Loading'; // Shows '...' in UI briefly

    if (this.isOnline) {
      const payload = {
        patientId: this.scannedPatient.patientId,
        bagId: bag.bagId,
        bloodBagId: bag.bloodBagId,
        bagSubDocId: bag.bagSubDocId || null,
        startTime: bag.startTime,
        protocolMatched: "", 
        status: "pending" 
      };

      this.salesService.saveTransfusionApi(payload).subscribe({
        next: () => {
          bag.status = 'In Progress';
          this.currentStep = 3;
        },
        error: () => {
          alert("Network error. Could not sync start time with server.");
          bag.startTime = null;
          bag.status = originalStatus;
        }
      });
    } else {
      // Offline mode: proceed instantly, it will sync later
      bag.status = 'In Progress';
      this.currentStep = 3;
    }
  }

  // cancelInProgress(bag: any) {
  //   bag.startTime = null;
  //   const originalStatus = bag.status;
  //   bag.status = 'Loading';

  //   if (this.isOnline) {
  //     const payload = {
  //       patientId: this.scannedPatient.patientId,
  //       bagId: bag.bagId,
  //       bloodBagId: bag.bloodBagId,
  //       startTime: null, // Reset start time in DB to maintain the empty lock
  //       protocolMatched: "",
  //       status: "new"
  //     };

  //     this.salesService.saveTransfusionApi(payload).subscribe({
  //       next: () => {
  //         bag.status = 'Pending Start';
  //         this.currentStep = 2;
  //       },
  //       error: () => {
  //         bag.status = 'Pending Start';
  //         this.currentStep = 2;
  //       }
  //     });
  //   } else {
  //     bag.status = 'Pending Start';
  //     this.currentStep = 2;
  //   }
  // }

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