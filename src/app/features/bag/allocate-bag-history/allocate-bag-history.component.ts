import { Component } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { BagAllocation } from '../../../core/models/bag.modal';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-allocate-bag-history',
  imports: [CommonModule, TableModule, TagModule],
  templateUrl: './allocate-bag-history.component.html',
  styleUrl: './allocate-bag-history.component.scss'
})
export class AllocateBagHistoryComponent {
   row: BagAllocation[] = [];
   

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
      'reserved': 'bg-green-100 text-green-700',
      'allocated' : 'bg-red-100 text-red-700',
      'released': 'bg-blue-100 text-blue-700',
      'In hold': 'bg-yellow-100 text-yellow-700',
    }[status] ?? 'bg-gray-100 text-gray-700';
  }
}
