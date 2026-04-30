import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService } from 'primeng/api';

// Services & Child Components
import { UsersDetailComponent } from '../users-detail/users-detail.component';
import { UsersService, User } from '../../service/users.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule, 
    TableModule, 
    ButtonModule, 
    TooltipModule, 
    FormsModule, 
    DialogModule, 
    UsersDetailComponent, 
    TitleCasePipe
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss'
})
export class UsersListComponent implements OnInit {
  @ViewChild('dt') table!: Table;
  rows: User[] = [];

  // Dialog & Form Variables
  visible: boolean = false;
  modalTitle: string = 'Add New User';
  selectedUser: User | null = null;

  constructor(
    private usersService: UsersService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.rows = []; // Clear table first

    this.usersService.getAllUsers().subscribe({
      next: (res: any) => {
        // Assuming ApiResponse wraps data in 'data'
        this.rows = res.data; 

        // Force paginator to page 1
        setTimeout(() => {
          if (this.table) {
            this.table.first = 0;
          }
        });
      },
      error: (err) => console.error('Failed to load users:', err)
    });
  }

  addUser(): void {
    this.selectedUser = {
      name: '',
      phone: '',
      email: '',
      role: 'user',
      isDeleted: false
    } as User;
    
    this.modalTitle = 'Add New User';
    this.showDialog();
  }

  editUser(user: User): void {
    this.selectedUser = { ...user };
    this.modalTitle = 'Edit User';
    this.showDialog();
  }

  confirmDelete(user: User): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${user.name}?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // Ensure user._id exists before calling delete
        if(user._id) {
            this.usersService.deleteUser(user._id).subscribe({
            next: () => {
                this.loadUsers(); 
            },
            error: () => {
                alert('Failed to delete user.');
            }
            });
        }
      }
    });
  }

  // UI Helpers
  stripe = (i: number) => (i % 2 === 0 ? 'bg-gray-50' : '');

  showDialog(): void {
    this.visible = true;
  }

  closeDialog(fetchData: boolean): void {
    this.visible = false;
    if (fetchData) {
      this.loadUsers(); 
    }
  }

  onGlobalFilter(table: Table, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    table.filterGlobal(value, 'contains');
  }
}