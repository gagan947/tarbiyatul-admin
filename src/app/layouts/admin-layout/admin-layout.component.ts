import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './admin-layout.component.html',
  styleUrls: []
})
export class AdminLayoutComponent implements OnInit {
  isSidebarOpen = false;
  adminName = 'Ali';
  adminEmail = '';
  profileImage: string | null = null;

  ngOnInit(): void {
    const adminUserJson = localStorage.getItem('admin_user');
    if (adminUserJson) {
      try {
        const adminUser = JSON.parse(adminUserJson);
        this.adminName = adminUser.name || 'Ali';
        this.adminEmail = adminUser.email || '';
        this.profileImage = adminUser.profileImage || null;
      } catch (e) {
        console.error('Error parsing admin user details', e);
      }
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
