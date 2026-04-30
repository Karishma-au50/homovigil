import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';

// Services
import { UsersService, User } from '../../service/users.service';

@Component({
  selector: 'app-users-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, DropdownModule],
  templateUrl: './users-detail.component.html',
  styleUrl: './users-detail.component.scss'
})
export class UsersDetailComponent implements OnInit {
  // Receives data from users-list
  @Input() formData: User | null = null; 
  
  // Emits a boolean back to users-list to close the dialog (true = refresh table, false = do nothing)
  @Output() closeDialog = new EventEmitter<boolean>(); 

  user: Partial<User> = {};
  
  roles = [
    { label: 'User', value: 'user' },
    { label: 'Admin', value: 'admin' },
    { label: 'Super Admin', value: 'superAdmin' },
    { label: 'Sales', value: 'sales' }
  ];

  constructor(private usersService: UsersService) {}

  ngOnInit() {
    // Clone the passed data so we don't mutate the table row directly before saving
    if (this.formData) {
      this.user = { ...this.formData };
    }
  }

  saveUser() {
    if (this.user._id) {
      // Update existing user
      this.usersService.updateUser(this.user._id, this.user).subscribe({
        next: () => this.closeDialog.emit(true), // true triggers table reload in parent
        error: (err) => alert('Error updating user: ' + err.message)
      });
    } else {
      // Register new user
      this.usersService.registerUser(this.user).subscribe({
        next: () => this.closeDialog.emit(true), // true triggers table reload in parent
        error: (err) => alert('Error creating user: ' + err.message)
      });
    }
  }

  cancel() {
    // Emit false to just close the dialog without refreshing data
    this.closeDialog.emit(false); 
  }
}