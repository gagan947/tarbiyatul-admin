import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: []
})
export class EditProfileComponent implements OnInit {
  editProfileForm: FormGroup;
  isLoading = false;
  adminUser: any = null;
  imageBaseUrl = environment.imageBaseUrl;

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  // Custom Toast State
  showToastMessage = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';

  constructor(private fb: FormBuilder, private apiService: ApiService) {
    this.editProfileForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9\\-\\+]{9,15}$')]],
      email: [{ value: '', disabled: true }] // Non-editable
    });
  }

  ngOnInit(): void {
    // Attempt to load from localStorage first for immediate display (optional)
    const userStr = localStorage.getItem('admin_user');
    if (userStr) {
      try {
        this.adminUser = JSON.parse(userStr);
        this.patchFormValues(this.adminUser);
      } catch (e) {
        console.error('Error parsing admin user:', e);
      }
    }

    // Fetch the latest profile data from the API
    this.fetchProfileData();
  }

  fetchProfileData(): void {
    this.isLoading = true;
    this.apiService.get<any>('admin/auth/profile').subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.success && response.data) {
          // The API wraps the user details inside an "admin" object
          this.adminUser = response.data.admin || response.data;
          this.patchFormValues(this.adminUser);
          
          // Optionally update local storage with the fresh data
          localStorage.setItem('admin_user', JSON.stringify(this.adminUser));
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching profile data:', err);
      }
    });
  }

  patchFormValues(user: any): void {
    this.editProfileForm.patchValue({
      name: user.fullName || user.firstName || user.name || '',
      phone: user.phone || '',
      email: user.email || ''
    });
    
    if (user.profileImage) {
      this.previewUrl = `${this.imageBaseUrl}${user.profileImage}`;
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Image Preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
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
    if (this.editProfileForm.invalid) {
      this.editProfileForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    
    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('name', this.editProfileForm.get('name')?.value);
    formData.append('phone', this.editProfileForm.get('phone')?.value);
    
    if (this.selectedFile) {
      formData.append('profileImage', this.selectedFile);
    }

    this.apiService.patch<any>('admin/auth/profile', formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.success) {
          this.triggerToast('Profile updated successfully!', 'success');
          
          const updatedUser = response.data?.admin || response.data;
          
          // Update local storage so layout reflects the new name/image on fresh load
          if (updatedUser) {
            localStorage.setItem('admin_user', JSON.stringify(updatedUser));
            
            // Broadcast the update immediately across the SPA without a reload
            this.apiService.profileUpdated$.next(updatedUser);
          }
        } else {
          this.triggerToast(response.message || 'Failed to update profile.', 'error');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error updating profile:', err);
        this.triggerToast(err.error?.message || 'Error occurred while updating profile.', 'error');
      }
    });
  }
}
