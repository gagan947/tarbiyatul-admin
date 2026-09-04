import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

export interface DashboardStats {
  total_students: number;
  total_teachers: number;
  upcoming_events: number;
  announcements: number;
}

export interface RecentApplication {
  s_no?: number;
  parent_id: number;
  parent_name: string;
  email: string;
  phone?: string;
  total_child: number;
  status: string;
  formatted_date: string;
  students?: any[];
}

export interface AdminInfo {
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: []
})
export class DashboardComponent implements OnInit {
  isLoading = false;
  adminInfo: AdminInfo | null = null;
  stats: DashboardStats = {
    total_students: 0,
    total_teachers: 0,
    upcoming_events: 0,
    announcements: 0
  };
  recentApplications: RecentApplication[] = [];

  // Custom Confirm Modal State
  showConfirmModal = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmType: 'approve' | 'reject' | 'confirm' = 'confirm';
  private confirmActionFn: (() => void) | null = null;

  // Custom Toast Notification State
  showToastMessage = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.fetchDashboardData();
  }

  fetchDashboardData(): void {
    this.isLoading = true;
    this.apiService.get<any>('admin/dashboard').subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.success && res.data) {
          const data = res.data;
          if (data.admin_info) {
            this.adminInfo = data.admin_info;
            // Notify layout components of updated admin profile info
            this.apiService.profileUpdated$.next(data.admin_info);
          }
          if (data.stats) {
            this.stats = {
              total_students: data.stats.total_students ?? 0,
              total_teachers: data.stats.total_teachers ?? 0,
              upcoming_events: data.stats.upcoming_events ?? 0,
              announcements: data.stats.announcements ?? 0
            };
          }
          if (Array.isArray(data.recent_applications)) {
            this.recentApplications = data.recent_applications;
          }
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching admin dashboard data:', err);
      }
    });
  }

  // Custom Confirm Modal Operations
  openConfirmModal(title: string, message: string, type: 'approve' | 'reject' | 'confirm', action: () => void): void {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmType = type;
    this.confirmActionFn = action;
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.confirmActionFn = null;
  }

  onConfirm(): void {
    if (this.confirmActionFn) {
      this.confirmActionFn();
    }
    this.closeConfirmModal();
  }

  triggerToast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToastMessage = true;
    setTimeout(() => {
      this.showToastMessage = false;
    }, 4000);
  }

  approveApplication(app: RecentApplication): void {
    this.openConfirmModal(
      'Approve Application',
      `Are you sure you want to approve the enrollment application for ${app.parent_name}?`,
      'approve',
      () => {
        this.apiService.patch<any>(`admin/users/${app.parent_id}/approval`, {
          role: 'parent',
          status: 'active'
        }).subscribe({
          next: () => {
            this.triggerToast('Application approved successfully!', 'success');
            this.fetchDashboardData();
          },
          error: (err) => {
            console.error('Error approving application:', err);
            this.triggerToast('Failed to approve application.', 'error');
            app.status = 'ACTIVE';
          }
        });
      }
    );
  }

  rejectApplication(app: RecentApplication): void {
    this.openConfirmModal(
      'Reject Application',
      `Are you sure you want to reject the enrollment application for ${app.parent_name}?`,
      'reject',
      () => {
        this.apiService.patch<any>(`admin/users/${app.parent_id}/approval`, {
          role: 'parent',
          status: 'inactive'
        }).subscribe({
          next: () => {
            this.triggerToast('Application rejected successfully!', 'success');
            this.fetchDashboardData();
          },
          error: (err) => {
            console.error('Error rejecting application:', err);
            this.triggerToast('Failed to reject application.', 'error');
            app.status = 'INACTIVE';
          }
        });
      }
    );
  }
}
