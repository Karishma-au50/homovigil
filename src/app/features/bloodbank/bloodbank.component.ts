import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from '../../core/auth/auth.service';

interface BloodBag {
  _id?: string;
  bloodBagId?: string; // RFID Tag UID
  bloodGroup: string;
  bloodcomponent: string;
  volume?: number;
  expiryDate?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-bloodbank',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    DatePickerModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    InputTextModule,
    TooltipModule,
    SkeletonModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './bloodbank.component.html',
  styleUrls: ['./bloodbank.component.scss']
})
export class BloodbankComponent implements OnInit, OnDestroy {
  @ViewChild('dt') dt!: Table;

  // Inventory Data
  bloodbags: BloodBag[] = [];
  filteredBloodbags: BloodBag[] = [];
  isLoading = true;
  skeletonData = new Array(5).fill({});

  // Summary / Stats
  totalBagsCount = 0;
  groupStats: { [key: string]: number } = {};
  componentStats: { component: string; count: number }[] = [];

  // Dialog Controls
  registerDialog = false;
  dispatchDialog = false;
  isSaving = false;

  // Form State (New Bag)
  newBag: BloodBag = {
    bloodBagId: '',
    bloodGroup: '',
    bloodcomponent: '',
    volume: undefined,
    expiryDate: ''
  };

  // RFID Scanner & Service States
  socket: WebSocket | null = null;
  isScannerConnected = false;
  rfidStatus: 'checking' | 'connected' | 'offline' | 'outdated' = 'checking';
  runningVersion = '';
  expectedVersion = '1.1.0';
  
  // RFID Mode States
  isScanningForRegister = false;
  isScanningForDispatch = false;
  scannedDispatchBag: BloodBag | null = null;
  manualDispatchRfid = '';

  // Dropdown Options
  bloodGroups = [
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' }
  ];

  bloodComponents = [
    { label: 'Whole Blood', value: 'Whole Blood' },
    { label: 'Red Blood Cells', value: 'Red Blood Cells' },
    { label: 'Platelets', value: 'Platelets' },
    { label: 'Plasma', value: 'Plasma' },
    { label: 'Cryoprecipitate', value: 'Cryoprecipitate' }
  ];

  constructor(
    private authService: AuthService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadInventory();
    this.connectToRfidScanner();
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.close();
    }
  }

  // Connect to the local Node.js RFID WebSocket Server
  connectToRfidScanner(): void {
    try {
      this.rfidStatus = 'checking';
      this.socket = new WebSocket('ws://localhost:8080');

      // Connection timeout: 1.5 seconds to establish connection
      const connTimeout = setTimeout(() => {
        if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
          this.rfidStatus = 'offline';
          this.isScannerConnected = false;
          console.warn('[RFID] Local RFID service connection timeout.');
        }
      }, 1500);

      this.socket.onopen = () => {
        clearTimeout(connTimeout);
        this.isScannerConnected = true;
        this.rfidStatus = 'connected';
        console.log('[RFID] Connected to local RFID WebSocket Server');
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.event === 'card' && data.uid) {
            this.handleRfidScan(data.uid);
          } else if (data.event === 'status') {
            this.isScannerConnected = data.readersCount > 0;
            this.runningVersion = data.version || '1.0.0';
            
            // Check version compatibility
            if (this.runningVersion !== this.expectedVersion) {
              this.rfidStatus = 'outdated';
            } else {
              this.rfidStatus = 'connected';
            }
          } else if (data.event === 'reader-connected') {
            this.isScannerConnected = true;
            this.messageService.add({ severity: 'info', summary: 'Scanner Connected', detail: data.reader });
          } else if (data.event === 'reader-disconnected') {
            this.isScannerConnected = false;
            this.messageService.add({ severity: 'warn', summary: 'Scanner Disconnected', detail: 'RFID Reader unplugged' });
          }
        } catch (err) {
          console.error('[RFID] Parse error:', err);
        }
      };

      this.socket.onclose = () => {
        clearTimeout(connTimeout);
        this.isScannerConnected = false;
        this.rfidStatus = 'offline';
        console.warn('[RFID] WebSocket connection closed. Retrying in 5s...');
        setTimeout(() => this.connectToRfidScanner(), 5000);
      };

      this.socket.onerror = (err) => {
        console.error('[RFID] WebSocket error:', err);
      };
    } catch (e) {
      this.rfidStatus = 'offline';
      console.error('[RFID] Connection failed:', e);
    }
  }

  // Handle scans based on what UI dialog/mode is open
  handleRfidScan(uid: string): void {
    this.messageService.add({ severity: 'success', summary: 'Card Scanned', detail: `UID: ${uid}` });

    if (this.isScanningForRegister) {
      // 1. Assign scan UID to the registration form
      this.newBag.bloodBagId = uid;
      this.isScanningForRegister = false;
      
    } else if (this.isScanningForDispatch) {
      // 2. Dispatch/Remove Bag flow
      const matchedBag = this.bloodbags.find(bag => bag.bloodBagId === uid);
      
      if (matchedBag) {
        this.scannedDispatchBag = matchedBag;
        this.isScanningForDispatch = false; // Stop scanning immediately to prevent continuous loops!
      } else {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Bag Not Found', 
          detail: `No bag registered with RFID UID: ${uid}` 
        });
      }
    } else {
      // If scanned out-of-nowhere, open the dispatch dialog automatically!
      const matchedBag = this.bloodbags.find(bag => bag.bloodBagId === uid);
      if (matchedBag) {
        this.scannedDispatchBag = matchedBag;
        this.isScanningForDispatch = false;
        this.dispatchDialog = true;
      } else {
        // Offer to register it
        this.confirmationService.confirm({
          message: `Scanned unregistered RFID tag: ${uid}. Would you like to register a new blood bag with this tag?`,
          header: 'New Tag Detected',
          icon: 'pi pi-plus',
          accept: () => {
            this.openRegisterDialog();
            this.newBag.bloodBagId = uid;
          }
        });
      }
    }
  }

  loadInventory(): void {
    this.isLoading = true;
    
    // Fetch stats
    this.authService.getBloodbagStats().subscribe({
      next: (res: any) => {
        const stats = res.data;
        this.totalBagsCount = stats.overview?.totalBloodbags || 0;
        this.groupStats = stats.overview?.bloodGroupStats || {};
        this.componentStats = stats.componentStats || [];
      },
      error: () => {
        console.error('Failed to load blood bag statistics.');
      }
    });

    // Fetch list
    this.authService.getAllBloodbags().subscribe({
      next: (res: any) => {
        this.bloodbags = res.data?.bloodbags || [];
        this.filteredBloodbags = [...this.bloodbags];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load blood bag inventory.' });
      }
    });
  }

  openRegisterDialog(): void {
    this.newBag = {
      bloodBagId: '',
      bloodGroup: '',
      bloodcomponent: '',
      volume: undefined,
      expiryDate: ''
    };
    this.isScanningForRegister = false;
    this.registerDialog = true;
  }

  toggleRegisterScanner(): void {
    if (!this.isScannerConnected) {
      this.messageService.add({ severity: 'warn', summary: 'Scanner Offline', detail: 'Please start your local RFID Node.js service.' });
      return;
    }
    this.isScanningForRegister = !this.isScanningForRegister;
  }

  saveBloodBag(): void {
    if (!this.newBag.bloodGroup || !this.newBag.bloodcomponent) {
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Blood Group and Component are required.' });
      return;
    }

    this.isSaving = true;
    
    // Call AuthService registration wrapper
    this.authService.createBloodbag(this.newBag).subscribe({
      next: () => {
        this.isSaving = false;
        this.registerDialog = false;
        this.loadInventory(); // Refresh
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }

  openDispatchDialog(): void {
    this.scannedDispatchBag = null;
    this.manualDispatchRfid = '';
    this.isScanningForDispatch = true;
    this.dispatchDialog = true;
  }

  closeDispatchDialog(): void {
    this.isScanningForDispatch = false;
    this.dispatchDialog = false;
    this.scannedDispatchBag = null;
    this.manualDispatchRfid = '';
  }

  confirmDispatch(bag: BloodBag): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to dispatch/remove Blood Bag (RFID: ${bag.bloodBagId}) from inventory?\nGroup: ${bag.bloodGroup} | Component: ${bag.bloodcomponent}`,
      header: 'Confirm Dispatch',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Dispatch',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        if (bag._id) {
          this.authService.deleteBloodbag(bag._id).subscribe({
            next: () => {
              this.loadInventory(); // Refresh
              this.closeDispatchDialog();
            }
          });
        }
      }
    });
  }

  confirmDelete(bag: BloodBag): void {
    this.confirmationService.confirm({
      message: `Delete Blood Bag ID ${bag.bloodBagId || 'No ID'}? This action is permanent.`,
      header: 'Delete Confirmation',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        if (bag._id) {
          this.authService.deleteBloodbag(bag._id).subscribe({
            next: () => {
              this.loadInventory(); // Refresh
            }
          });
        }
      }
    });
  }

  onGlobalFilter(table: Table, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    table.filterGlobal(value, 'contains');
  }

  stripe = (i: number) => (i % 2 === 0 ? 'bg-gray-50' : 'bg-white');

  dispatchManual(): void {
    if (!this.manualDispatchRfid) return;

    this.authService.getBloodbagByRfid(this.manualDispatchRfid.trim()).subscribe({
      next: (res: any) => {
        const bag = res.data;
        if (bag) {
          this.scannedDispatchBag = bag;
          this.isScanningForDispatch = false; // Stop scanning loops
        }
      },
      error: () => {
        // Error toast is handled by AuthService automatically, but we can log
        console.warn('RFID tag search failed.');
      }
    });
  }

  executeDispatch(): void {
    if (!this.scannedDispatchBag || !this.scannedDispatchBag._id) return;

    this.isLoading = true;
    this.authService.deleteBloodbag(this.scannedDispatchBag._id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Dispatched',
          detail: 'Blood bag dispatched and removed from inventory.'
        });
        this.loadInventory(); // Refresh
        this.closeDispatchDialog();
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  clearDispatchBag(): void {
    this.scannedDispatchBag = null;
    this.manualDispatchRfid = '';
    this.isScanningForDispatch = true; // Resume scanning
  }

  getGroupCount(group: string): number {
    return this.groupStats[group] || 0;
  }
}
