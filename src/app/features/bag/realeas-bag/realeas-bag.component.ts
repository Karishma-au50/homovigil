import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { BagAllocation } from '../../../core/models/bag.modal';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-realeas-bag',
 imports: [CommonModule, TableModule, TagModule],
  templateUrl: './realeas-bag.component.html',
  styleUrl: './realeas-bag.component.scss'
})
export class ReleasBagComponent {
   row: BagAllocation[] = [];
 
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
    constructor(private authService: AuthService) {}
      ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.authService.getAllocationBag().subscribe((data: any) => {
      console.log(data)
      this.row = data.data.allocations;
    });
  }
   stripe = (i: number) => (i % 2 === 0 ? 'bg-gray-50' : '');
  badgeClass(status: string) {
    return {
      Allocate: 'bg-green-100 text-green-700',
      Pending : 'bg-red-100 text-red-700',
      'In hold': 'bg-yellow-100 text-yellow-700',
    }[status] ?? 'bg-gray-100 text-gray-700';
  }

}
