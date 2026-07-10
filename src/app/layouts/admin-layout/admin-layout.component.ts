import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../services/api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './admin-layout.component.html',
  styleUrls: []
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  isSidebarOpen = false;
  adminName = 'Ali';
  adminEmail = '';
  profileImage: string | null = null;
  private profileSub?: Subscription;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    // Initial Load from local storage
    const adminUserJson = localStorage.getItem('admin_user');
    if (adminUserJson) {
      this.updateProfileState(JSON.parse(adminUserJson));
    }

    // Subscribe to real-time profile updates
    this.profileSub = this.apiService.profileUpdated$.subscribe((updatedUser) => {
      if (updatedUser) {
        this.updateProfileState(updatedUser);
      }
    });
  }

  ngOnDestroy(): void {
    this.profileSub?.unsubscribe();
  }

  private updateProfileState(adminUser: any): void {
    try {
      this.adminName = adminUser.name || adminUser.fullName || adminUser.firstName || 'Ali';
      this.adminEmail = adminUser.email || '';
      this.profileImage = adminUser.profileImage || null;
    } catch (e) {
      console.error('Error updating admin profile state', e);
    }
  }

  getProfileImageUrl(): string {
    if (this.profileImage) {
      if (this.profileImage.startsWith('http')) {
        return this.profileImage;
      }
      // If imageBaseUrl is configured with a trailing slash or not, join nicely
      const baseUrl = environment.imageBaseUrl.endsWith('/') 
        ? environment.imageBaseUrl.slice(0, -1) 
        : environment.imageBaseUrl;
      const imgPath = this.profileImage.startsWith('/') 
        ? this.profileImage 
        : '/' + this.profileImage;
      return `${baseUrl}${imgPath}`;
    }
    return 'assets/img/user.jpg';
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }
}
