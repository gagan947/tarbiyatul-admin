import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-teacher-enrollment',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './teacher-enrollment.component.html',
  styleUrls: []
})
export class TeacherEnrollmentComponent implements OnInit {
  teachers: any[] = [];
  isLoading = false;

  // Stats
  totalTeachers = 0;
  pendingTeachers = 0;
  approvedTeachers = 0;
  rejectedTeachers = 0;

  // Search & Filter
  searchTerm = '';
  selectedStatus = 'All Status';

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

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.fetchTeachers();
  }

  fetchTeachers(): void {
    this.isLoading = true;
    this.apiService.get<any>('admin/teachers').subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.success && response.data) {
          const data = response.data;
          if (Array.isArray(data)) {
            this.teachers = data;
          } else if (data.teachers && Array.isArray(data.teachers)) {
            this.teachers = data.teachers;
            if (data.counts) {
              this.totalTeachers = data.counts.total ?? 0;
              this.pendingTeachers = data.counts.pending ?? 0;
              this.approvedTeachers = data.counts.approved ?? 0;
              this.rejectedTeachers = data.counts.rejected ?? 0;
              return;
            }
          }
        } else if (Array.isArray(response)) {
          this.teachers = response;
        }

        // Calculate counts on the client-side as fallback
        this.calculateStats();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching teachers list:', err);
      }
    });
  }

  calculateStats(): void {
    this.totalTeachers = this.teachers.length;
    this.pendingTeachers = this.teachers.filter(t => t.approvalStatus?.toLowerCase() === 'pending').length;
    this.approvedTeachers = this.teachers.filter(
      t => t.approvalStatus?.toLowerCase() === 'approved' || t.approvalStatus?.toLowerCase() === 'active'
    ).length;
    this.rejectedTeachers = this.teachers.filter(t => t.approvalStatus?.toLowerCase() === 'rejected').length;
  }

  changeStatusFilter(status: string): void {
    this.selectedStatus = status;
  }

  getFilteredTeachers(): any[] {
    return this.teachers.filter(t => {
      const name = t.fullName || (t.firstName && t.lastName ? `${t.firstName} ${t.lastName}` : (t.name || ''));
      const email = t.email || '';
      const phone = t.phone || '';
      const status = t.approvalStatus || '';

      const matchesSearch = !this.searchTerm ||
        name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        phone.includes(this.searchTerm);

      const matchesStatus = this.selectedStatus === 'All Status' ||
        (this.selectedStatus === 'Approved' && (status.toLowerCase() === 'approved' || status.toLowerCase() === 'active')) ||
        status.toLowerCase() === this.selectedStatus.toLowerCase();

      return matchesSearch && matchesStatus;
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

  approveTeacher(id: number): void {
    this.openConfirmModal(
      'Approve Teacher Registration',
      'Are you sure you want to approve this teacher request?',
      'approve',
      () => {
        this.apiService.patch<any>(`admin/users/${id}/approval`, {
          role: 'teacher',
          status: 'active'
        }).subscribe({
          next: () => {
            this.triggerToast('Teacher request approved successfully!', 'success');
            this.fetchTeachers();
          },
          error: (err) => {
            console.error('Error approving teacher:', err);
            this.triggerToast('Failed to approve teacher application.', 'error');
            // Fallback UI mock update if backend is partially implemented
            const teacher = this.teachers.find(t => t.id === id);
            if (teacher) {
              teacher.approvalStatus = 'active';
              this.calculateStats();
            }
          }
        });
      }
    );
  }

  rejectTeacher(id: number): void {
    this.openConfirmModal(
      'Reject Teacher Registration',
      'Are you sure you want to reject this teacher request?',
      'reject',
      () => {
        this.apiService.patch<any>(`admin/users/${id}/approval`, {
          role: 'teacher',
          status: 'inactive'
        }).subscribe({
          next: () => {
            this.triggerToast('Teacher request rejected successfully!', 'success');
            this.fetchTeachers();
          },
          error: (err) => {
            console.error('Error rejecting teacher:', err);
            this.triggerToast('Failed to reject teacher application.', 'error');
            // Fallback UI mock update if backend is partially implemented
            const teacher = this.teachers.find(t => t.id === id);
            if (teacher) {
              teacher.approvalStatus = 'rejected';
              this.calculateStats();
            }
          }
        });
      }
    );
  }
}
