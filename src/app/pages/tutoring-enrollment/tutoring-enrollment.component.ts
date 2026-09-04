import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';

export interface TutoringLearner {
  id?: string | number;
  name?: string;
  email?: string;
  grade?: string;
  gradeLevel?: string;
  date?: string;
  formatted_date?: string;
}

export interface TutoringGuardian {
  name?: string;
  email?: string;
  phone?: string;
}

export interface TutoringItem {
  s_no?: number;
  id: string | number;
  numericId?: number;
  learner?: TutoringLearner;
  guardian?: TutoringGuardian;
  learnerName?: string;
  learnerEmail?: string;
  guardianName?: string;
  email?: string;
  phone?: string;
  gradeLevel?: string;
  subject?: string;
  academy?: string;
  status: string;
  date?: string;
  formatted_date?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-tutoring-enrollment',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './tutoring-enrollment.component.html',
  styleUrls: []
})
export class TutoringEnrollmentComponent implements OnInit, OnDestroy {
  tutoringList: TutoringItem[] = [];
  isLoading = false;

  // Stats
  totalEnrollments = 0;
  pendingCount = 0;
  approvedCount = 0;
  rejectedCount = 0;

  // Filters
  searchTerm = '';
  selectedStatus = 'All Status';
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Modal State
  showConfirmModal = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmType: 'approve' | 'reject' | 'confirm' = 'confirm';
  private confirmActionFn: (() => void) | null = null;

  // Toast State
  showToastMessage = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    // Debounced search
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.fetchTutoringEnrollments();
    });

    this.fetchTutoringEnrollments();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  onSearchChange(value: string): void {
    this.currentPage = 1;
    this.searchSubject.next(value);
  }

  changeStatusFilter(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.fetchTutoringEnrollments();
  }

  fetchTutoringEnrollments(): void {
    this.isLoading = true;
    const params: { [key: string]: any } = {};

    if (this.searchTerm && this.searchTerm.trim()) {
      params['search'] = this.searchTerm.trim();
    }

    if (this.selectedStatus && this.selectedStatus !== 'All Status') {
      params['status'] = this.selectedStatus.toUpperCase();
    }

    this.apiService.get<any>('admin/tutoring-enrollments', params).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.success && response.data) {
          const data = response.data;
          if (data.stats) {
            this.totalEnrollments = data.stats.total_applications ?? 0;
            this.pendingCount = data.stats.pending_review ?? 0;
            this.approvedCount = data.stats.approved_active ?? 0;
            this.rejectedCount = data.stats.rejected ?? 0;
          }
          if (Array.isArray(data.enrollments)) {
            this.tutoringList = data.enrollments;
          } else if (Array.isArray(data)) {
            this.tutoringList = data;
          }
        } else if (Array.isArray(response)) {
          this.tutoringList = response;
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching tutoring enrollments:', err);
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
    return Math.ceil(this.tutoringList.length / this.pageSize) || 1;
  }

  get paginatedTutoringList(): TutoringItem[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.tutoringList.slice(startIndex, startIndex + this.pageSize);
  }

  get startIndex(): number {
    return this.tutoringList.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.tutoringList.length ? this.tutoringList.length : end;
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

  // Action Loading State
  isActionLoading = false;
  actionLoadingId: string | number | null = null;

  approveEnrollment(id: string | number): void {
    const item = this.tutoringList.find(t => t.id === id || t.numericId === id);
    const learnerName = item?.learner?.name || item?.learnerName || 'this learner';

    this.openConfirmModal(
      'Approve Tutoring Enrollment',
      `Are you sure you want to approve the tutoring application for ${learnerName}?`,
      'approve',
      () => {
        this.isActionLoading = true;
        this.actionLoadingId = id;
        this.apiService.patch<any>(`admin/tutoring-enrollments/${id}/status`, {
          status: 'APPROVED'
        }).subscribe({
          next: () => {
            this.isActionLoading = false;
            this.actionLoadingId = null;
            this.showConfirmModal = false;
            this.confirmActionFn = null;
            this.triggerToast('Tutoring application approved successfully!', 'success');
            this.fetchTutoringEnrollments();
          },
          error: (err) => {
            this.isActionLoading = false;
            this.actionLoadingId = null;
            this.showConfirmModal = false;
            this.confirmActionFn = null;
            console.error('Error approving tutoring enrollment:', err);
            this.triggerToast('Failed to approve tutoring application.', 'error');
            if (item) {
              item.status = 'APPROVED';
            }
          }
        });
      }
    );
  }

  rejectEnrollment(id: string | number): void {
    const item = this.tutoringList.find(t => t.id === id || t.numericId === id);
    const learnerName = item?.learner?.name || item?.learnerName || 'this learner';

    this.openConfirmModal(
      'Reject Tutoring Enrollment',
      `Are you sure you want to reject the tutoring application for ${learnerName}?`,
      'reject',
      () => {
        this.isActionLoading = true;
        this.actionLoadingId = id;
        this.apiService.patch<any>(`admin/tutoring-enrollments/${id}/status`, {
          status: 'REJECTED'
        }).subscribe({
          next: () => {
            this.isActionLoading = false;
            this.actionLoadingId = null;
            this.showConfirmModal = false;
            this.confirmActionFn = null;
            this.triggerToast('Tutoring application rejected successfully!', 'success');
            this.fetchTutoringEnrollments();
          },
          error: (err) => {
            this.isActionLoading = false;
            this.actionLoadingId = null;
            this.showConfirmModal = false;
            this.confirmActionFn = null;
            console.error('Error rejecting tutoring enrollment:', err);
            this.triggerToast('Failed to reject tutoring application.', 'error');
            if (item) {
              item.status = 'REJECTED';
            }
          }
        });
      }
    );
  }

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
}
