// import { CommonModule } from '@angular/common';
// import { Component } from '@angular/core';
// import { TableModule } from 'primeng/table';
// import { TagModule } from 'primeng/tag';
// import { BagAllocation } from '../../../core/models/bag.modal';
// import { AuthService } from '../../../core/auth/auth.service';

// @Component({
//   selector: 'app-realeas-bag',
//  imports: [CommonModule, TableModule, TagModule],
//   templateUrl: './realeas-bag.component.html',
//   styleUrl: './realeas-bag.component.scss'
// })
// export class ReleasBagComponent {
//    row: BagAllocation[] = [];

//     constructor(private authService: AuthService) {}
//       ngOnInit(): void {
//     this.loadPatients();
//   }

//   loadPatients(): void {
//     this.authService.getAllocationBag().subscribe((data: any) => {
//       // Only show allocations with status "Allocate"
//       this.row = (data.data.allocations || []).filter(
//         (allocation: BagAllocation) => allocation.status.toLowerCase() === 'allocated'
//       );
//     });
//   }
//    stripe = (i: number) => (i % 2 === 0 ? 'bg-gray-50' : '');
//   badgeClass(status: string) {
//     return {
//       Allocate: 'bg-green-100 text-green-700',
//       Pending : 'bg-red-100 text-red-700',
//       'In hold': 'bg-yellow-100 text-yellow-700',
//     }[status] ?? 'bg-gray-100 text-gray-700';
//   }
//    releaseBag(allocationId: string, index: number): void {
//     if (window.confirm('Are you sure you want to release this bag?')) {
//       this.authService.releaseAllocatedBag(allocationId).subscribe({
//         next: () => {
//           alert('Bag released successfully!');
//           this.row.splice(index, 1); // Remove released row from table
//         },
//         error: (error) => {
//           alert('Error releasing bag.');
//           console.error('Error releasing bag:', error);
//         }
//       });
//     }
//   }
//   reserveAllocatedBag(allocationId: string, allocatedOn: string): void {

//     if (window.confirm('Are you sure you want to reserve this bag?')) {
//       this.authService.reserveAllocatedBag(allocationId, allocatedOn,'reserved').subscribe({
//         next: () => {
//           alert('Bag reserved successfully!');
//           // Optionally update UI or reload data
//           this.loadPatients();

//       },
//       error: (error) => {
//         alert('Error reserving bag.');
//         console.error('Error reserving bag:', error);
//       }
//     });
//   }
//   }
// }
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api'; // 👈 Required for headless confirmation

import { BagAllocation } from '../../../core/models/bag.modal';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
    selector: 'app-realeas-bag',
    standalone: true,
    imports: [CommonModule, TableModule, TagModule, ConfirmDialogModule],
    providers: [ConfirmationService], // 👈 Provide the service here
    templateUrl: './realeas-bag.component.html',
    styleUrl: './realeas-bag.component.scss'
})
export class ReleasBagComponent {
    row: BagAllocation[] = [];

    constructor(
        private authService: AuthService,
        private confirmationService: ConfirmationService // 👈 Injected here
    ) {}

    ngOnInit(): void {
        this.loadPatients();
    }

    loadPatients(): void {
        this.authService.getAllocationBag().subscribe((data: any) => {
            this.row = (data.data.allocations || []).filter((allocation: BagAllocation) => allocation.status.toLowerCase() === 'allocated');
        });
    }

    getStatusColor(status: string): string {
        switch (status.toLowerCase()) {
            case 'allocate':
                return 'bg-green-100 text-green-700';
            case 'pending':
                return 'bg-pink-100 text-pink-700';
            case 'in hold':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    }

    stripe = (i: number) => (i % 2 === 0 ? 'bg-gray-50' : '');

    badgeClass(status: string) {
        return (
            {
                Allocate: 'bg-green-100 text-green-700',
                Pending: 'bg-red-100 text-red-700',
                'In hold': 'bg-yellow-100 text-yellow-700'
            }[status] ?? 'bg-gray-100 text-gray-700'
        );
    }
    releaseUserName: string = '';

    confirmReleaseBag(allocationId: string, index: number): void {
      this.releaseUserName = '';
      this.confirmationService.confirm({
        message: `
          <div>
            <p>Are you sure you want to release this bag?</p>
            <p>Please enter your name to confirm:</p>
            <input type="text" pInputText [(ngModel)]="releaseUserName" placeholder="Your Name" />
          </div>
        `,
        header: 'Confirm Release',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          if (!this.releaseUserName.trim()) {
            alert('Please enter your name to confirm.');
            return;
          }
          this.authService.releaseAllocatedBag(allocationId, this.releaseUserName).subscribe({
            next: () => {
              alert('Bag released successfully!');
              this.row.splice(index, 1);
            },
            error: (error) => {
              alert('Error releasing bag.');
              console.error('Error releasing bag:', error);
            }
          });
        },
        reject: () => {
          this.releaseUserName = '';
        }
      });
    }
    releaseBag(allocationId: string, index: number): void {
        this.confirmationService.confirm({
            message: 'Are you sure you want to release this bag?',
            header: 'Confirm Release',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.authService.releaseAllocatedBag(allocationId, this.releaseUserName).subscribe({
                    next: () => {
                        alert('Bag released successfully!');
                        this.row.splice(index, 1);
                    },
                    error: (error) => {
                        alert('Error releasing bag.');
                        console.error('Error releasing bag:', error);
                    }
                });
            }
        });
    }

    reserveAllocatedBag(allocationId: string, allocatedOn: string): void {
        this.confirmationService.confirm({
            message: 'Are you sure you want to reserve this bag?',
            header: 'Confirm Reserve',
            icon: 'pi pi-info-circle',
            accept: () => {
                this.authService.reserveAllocatedBag(allocationId, allocatedOn, 'reserved').subscribe({
                    next: () => {
                        alert('Bag reserved successfully!');
                        this.loadPatients();
                    },
                    error: (error) => {
                        alert('Error reserving bag.');
                        console.error('Error reserving bag:', error);
                    }
                });
            }
        });
    }
}
