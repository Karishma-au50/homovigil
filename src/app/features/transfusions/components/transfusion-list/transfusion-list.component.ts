import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';

import { TransfusionService, TransfusionRecord } from '../../service/transfusion.service';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-transfusion-list',
  standalone: true,
  imports: [
    SkeletonModule,
    CommonModule, 
    TableModule, 
    InputTextModule, 
    ButtonModule, 
    RippleModule,
    TooltipModule
  ],
  templateUrl: './transfusion-list.component.html',
  styleUrl: './transfusion-list.component.scss'
})
export class TransfusionListComponent implements OnInit {
  // --- Main List State ---
  transfusions: TransfusionRecord[] = [];
  loading: boolean = true;

  // --- Master-Detail View State ---
  viewMode: 'list' | 'detail' = 'list'; // Controls which screen is shown
  selectedDetails: any = null;          // Holds the data for the specific transfusion
  loadingDetails: boolean = false;      // Spinner for the detail view
  skeletonData: any[] = new Array(5).fill({});
  
  constructor(
    private transfusionService: TransfusionService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.fetchTransfusions();
  }

  fetchTransfusions(): void {
    this.loading = true;
    this.transfusionService.getAllTransfusions().subscribe({
      next: (response) => {
        if (!response.error) {
          this.transfusions = response.data;
          // console.log(response);
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching transfusions', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- Switch to Detail View ---
  viewDetails(row: any): void {
    this.viewMode = 'detail'; // Instantly hide main grid, show detail view
    this.loadingDetails = true;
    this.selectedDetails = null;

    // We can pre-fill some top-level info from the row while we wait for the API
    this.selectedDetails = {
      salesName: row.salesName,
      patientName: row.patientName,
      status: row.status,
      bags: [] // Will populate when API returns
    };

    this.transfusionService.getTransfusionDetails(row.id).subscribe({
      next: (response) => {
        // console.log(response)
        if (!response.error) {
          // Merge the detailed bags data into our selected object
          this.selectedDetails.bags = response.data.bags;
        }
        this.loadingDetails = false;
        this.cdr.detectChanges(); // Force UI update
      },
      error: (err) => {
        console.error('Error fetching details', err);
        this.loadingDetails = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- Switch back to List View ---
  goBack(): void {
    this.viewMode = 'list';
    this.selectedDetails = null; // Clear memory
  }

  // Helper to color-code the status
  badgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border border-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  }

  stripe(index: number): string {
    return index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
  }
}