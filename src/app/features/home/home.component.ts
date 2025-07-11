import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { ToolbarModule } from 'primeng/toolbar';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { BagAllocation } from '../../core/models/bag.modal';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownModule, ButtonModule, DatePickerModule, TableModule, InputIconModule,ToolbarModule, IconFieldModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
     records: BagAllocation[] = [];
  searchOptions = [
    { label: 'Patient Name', value: 'patient' },
    { label: 'Blood Group', value: 'bloodGroup' },
    { label: 'Component', value: 'component' }
  ];

  selectedSearchBy: any;
  fromDate: Date | null = null;
  toDate: Date | null = null;
  @ViewChild('dt') dt!: Table;
     constructor(private authService: AuthService) {}
        ngOnInit(): void {
      this.loadPatients();
    }
  
    loadPatients(): void {
      this.authService.getAllocationBag().subscribe((data: any) => {
        console.log(data)
        this.records = data.data.allocations;
      });
    }

  // records = Array.from({ length: 15 }).map((_, i) => ({
  //   bagId: '123456',
  //   uhid: 'MM00138779',
  //   patient: i % 2 === 0 ? 'Kusum Duggal' : 'Sharad Kulsheshtra',
  //   bloodGroup: ['B+', 'A+', 'AB+', 'O+', 'A-'][i % 5],
  //   component: i % 2 === 0 ? 'Plasma' : 'RBC',
  //   status: ['Allocate', 'Pending', 'In hold'][i % 3],
  //   allocatedOn: 'Jan 26, 2025 | 04:30 PM',
  // }));
    stripe = (i: number) => (i % 2 === 0 ? 'bg-gray-50' : '');
  badgeClass(status: string) {
    return {
      Allocate: 'bg-green-100 text-green-700',
      Pending : 'bg-red-100 text-red-700',
      'In hold': 'bg-yellow-100 text-yellow-700',
    }[status] ?? 'bg-gray-100 text-gray-700';
  }
  onFilterGlobal(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        this.dt.filterGlobal(inputElement.value, 'contains');
    }
}
