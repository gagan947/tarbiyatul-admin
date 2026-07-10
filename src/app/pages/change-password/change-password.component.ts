import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: []
})
export class ChangePasswordComponent {
  changePasswordForm: FormGroup;
  isLoading = false;
  
  // Password Visibility toggles
  showCurrent = false;
  showNew = false;
  showConfirm = false;

  // Custom Toast State
  showToastMessage = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.changePasswordForm = this.fb.group({
      oldPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');
    
    if (!newPassword || !confirmPassword) return null;
    
    if (newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    } else {
      if (confirmPassword.hasError('mismatch')) {
        confirmPassword.setErrors(null);
      }
      return null;
    }
  }

  toggleCurrent(): void {
    this.showCurrent = !this.showCurrent;
  }

  toggleNew(): void {
    this.showNew = !this.showNew;
  }

  toggleConfirm(): void {
    this.showConfirm = !this.showConfirm;
  }

  triggerToast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToastMessage = true;
    setTimeout(() => {
      this.showToastMessage = false;
    }, 4000);
  }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const payload = {
      oldPassword: this.changePasswordForm.value.oldPassword,
      newPassword: this.changePasswordForm.value.newPassword
    };

    this.apiService.patch<any>('admin/auth/change-password', payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.success) {
          this.triggerToast('Password changed successfully!', 'success');
          this.changePasswordForm.reset();
          // Optionally redirect after a slight delay
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        } else {
          this.triggerToast(response.message || 'Failed to change password.', 'error');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error changing password:', err);
        const errorMsg = err.error?.message || 'Invalid current password or update request failed.';
        this.triggerToast(errorMsg, 'error');
      }
    });
  }
}
