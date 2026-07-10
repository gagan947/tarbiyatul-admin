import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: []
})
export class ForgotPasswordComponent implements OnInit {
  forgotForm!: FormGroup;
  isLoading = false;

  // Feedback Messages
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const payload = this.forgotForm.value;

    this.apiService.post<any>('admin/auth/forgot-password', payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.message) {
          this.successMessage = response.message;
        } else {
          this.successMessage = 'An OTP or reset link has been sent to your email address.';
        }
        this.forgotForm.reset();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Forgot password error:', err);
        if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else if (err.error && err.error.error) {
          this.errorMessage = err.error.error;
        } else {
          this.errorMessage = 'Unable to send OTP. Please check your email address and try again.';
        }
      }
    });
  }
}
