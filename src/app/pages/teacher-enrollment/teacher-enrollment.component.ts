import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';

export interface TeacherEnrollment {
  s_no?: number;
  id: string | number;
  numericId?: number;
  teacher_name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  gmail?: string;
  email?: string;
  phone_number?: string;
  phone?: string;
  qualification?: string;
  specialization?: string;
  subject?: string;
  teachingGrade?: string;
  yearsOfExperience?: number;
  status?: string;
  approvalStatus?: string;
  date?: string;
  formatted_date?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-teacher-enrollment',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './teacher-enrollment.component.html',
  styleUrls: []
})
export class TeacherEnrollmentComponent implements OnInit, OnDestroy {
  teachers: TeacherEnrollment[] = [];
  isLoading = false;

  // Stats
  totalTeachers = 0;
  pendingTeachers = 0;
  approvedTeachers = 0;
  rejectedTeachers = 0;

  // Search & Filter
  searchTerm = '';
  selectedStatus = 'All Status';
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

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
    // Setup debounced search handler
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.fetchTeachers();
    });

    this.fetchTeachers();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  onSearchChange(value: string): void {
    this.currentPage = 1;
    this.searchSubject.next(value);
  }

  fetchTeachers(): void {
    this.isLoading = true;
    const params: { [key: string]: any } = {};

    if (this.searchTerm && this.searchTerm.trim()) {
      params['search'] = this.searchTerm.trim();
    }

    if (this.selectedStatus && this.selectedStatus !== 'All Status') {
      params['status'] = this.selectedStatus.toUpperCase();
    }

    this.apiService.get<any>('admin/teacher-enrollments', params).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.success && response.data) {
          const data = response.data;
          if (data.stats) {
            this.totalTeachers = data.stats.total_teachers ?? 0;
            this.pendingTeachers = data.stats.pending_applications ?? 0;
            this.approvedTeachers = data.stats.approved_applications ?? 0;
            this.rejectedTeachers = data.stats.rejected_applications ?? 0;
          }
          if (Array.isArray(data.enrollments)) {
            this.teachers = data.enrollments;
          } else if (Array.isArray(data)) {
            this.teachers = data;
          }
        } else if (Array.isArray(response)) {
          this.teachers = response;
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching teacher enrollments:', err);
      }
    });
  }

  // Pagination
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50];

  onPageSizeChange(size: number): void {
    this.pageSize = Number(size);
    this.currentPage = 1;
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get totalPages(): number {
    return Math.ceil(this.teachers.length / this.pageSize) || 1;
  }

  get paginatedTeachers(): TeacherEnrollment[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.teachers.slice(startIndex, startIndex + this.pageSize);
  }

  get startIndex(): number {
    return this.teachers.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.teachers.length ? this.teachers.length : end;
  }

  get pagesArray(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const maxVisible = 5;
    const pages: number[] = [];

    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      let start = Math.max(1, current - 2);
      let end = Math.min(total, start + maxVisible - 1);
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  }

  changeStatusFilter(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.fetchTeachers();
  }

  // Action Loading State
  isActionLoading = false;
  actionLoadingId: string | number | null = null;

  // Custom Confirm Modal Operations
  openConfirmModal(title: string, message: string, type: 'approve' | 'reject' | 'confirm', action: () => void): void {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmType = type;
    this.confirmActionFn = action;
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    if (this.isActionLoading) return;
    this.showConfirmModal = false;
    this.confirmActionFn = null;
  }

  onConfirm(): void {
    if (this.confirmActionFn && !this.isActionLoading) {
      this.confirmActionFn();
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

  approveTeacher(id: number | string): void {
    this.openConfirmModal(
      'Approve Teacher Registration',
      'Are you sure you want to approve this teacher registration request?',
      'approve',
      () => {
        this.isActionLoading = true;
        this.actionLoadingId = id;
        this.apiService.patch<any>(`admin/teacher-enrollments/${id}/status`, {
          status: 'APPROVED'
        }).subscribe({
          next: () => {
            this.isActionLoading = false;
            this.actionLoadingId = null;
            this.showConfirmModal = false;
            this.confirmActionFn = null;
            this.triggerToast('Teacher request approved successfully!', 'success');
            this.fetchTeachers();
          },
          error: (err) => {
            this.isActionLoading = false;
            this.actionLoadingId = null;
            this.showConfirmModal = false;
            this.confirmActionFn = null;
            console.error('Error approving teacher:', err);
            this.triggerToast('Failed to approve teacher application.', 'error');
            const teacher = this.teachers.find(t => (t.id === id || t.numericId === id));
            if (teacher) {
              teacher.status = 'APPROVED';
            }
          }
        });
      }
    );
  }

  rejectTeacher(id: number | string): void {
    this.openConfirmModal(
      'Reject Teacher Registration',
      'Are you sure you want to reject this teacher registration request?',
      'reject',
      () => {
        this.isActionLoading = true;
        this.actionLoadingId = id;
        this.apiService.patch<any>(`admin/teacher-enrollments/${id}/status`, {
          status: 'REJECTED'
        }).subscribe({
          next: () => {
            this.isActionLoading = false;
            this.actionLoadingId = null;
            this.showConfirmModal = false;
            this.confirmActionFn = null;
            this.triggerToast('Teacher request rejected successfully!', 'success');
            this.fetchTeachers();
          },
          error: (err) => {
            this.isActionLoading = false;
            this.actionLoadingId = null;
            this.showConfirmModal = false;
            this.confirmActionFn = null;
            console.error('Error rejecting teacher:', err);
            this.triggerToast('Failed to reject teacher registration.', 'error');
            const teacher = this.teachers.find(t => (t.id === id || t.numericId === id));
            if (teacher) {
              teacher.status = 'REJECTED';
            }
          }
        });
      }
    );
  }
}
