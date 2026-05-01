import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';

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

  constructor(private usersService: UsersService,
    private messageService: MessageService) { }

  ngOnInit() {
    // Clone the passed data so we don't mutate the table row directly before saving
    if (this.formData) {
      this.user = { ...this.formData };
    }
  }

  isFormInvalid(): boolean {
    // Now valid if there's at least one digit (up to your 10-digit limit)
    const isPhoneValid = this.user.phone && this.user.phone.length > 0;
    const isNameValid = !!this.user.name;

    if (!this.user._id) {
      return !isNameValid || !isPhoneValid;
    }
    return !isNameValid || !isPhoneValid;
  }

  saveUser() {
    const action = this.user._id
      ? this.usersService.updateUser(this.user._id, this.user)
      : this.usersService.registerUser(this.user);

    action.subscribe({
      next: () => this.closeDialog.emit(true),
      error: (err) => {
        // 1. Extract the specific message from the backend response body[cite: 15]
        const errorMessage = err.error?.message || 'Something went wrong';

        // 2. Check for the duplicate phone error specifically
        if (err.status === 400 && errorMessage.includes('already exists')) {
          this.messageService.add({
            severity: 'error',
            summary: 'Duplicate Entry',
            detail: 'This phone number is already registered to another user.'
          });
        } else {
          // 3. Show the actual backend message for other errors (like validation)[cite: 15]
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage
          });
        }
      }
    });
  }

  cancel() {
    // Emit false to just close the dialog without refreshing data
    this.closeDialog.emit(false);
  }
}