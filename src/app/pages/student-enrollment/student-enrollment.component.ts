import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';

export interface StudentEnrollment {
  s_no?: number;
  id: number;
  student_id?: number;
  student_name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  parent_name?: string;
  parentName?: string;
  gmail?: string;
  email?: string;
  parent_email?: string;
  grade?: string;
  gradeLevel?: string;
  status: string;
  date?: string;
  createdAt?: string;
  formatted_date?: string;
  academy?: string;
  parent_id?: number;
  parentId?: number;
}

@Component({
  selector: 'app-student-enrollment',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './student-enrollment.component.html',
  styleUrls: []
})
export class StudentEnrollmentComponent implements OnInit, OnDestroy {
  students: StudentEnrollment[] = [];
  isLoading = false;

  // Stats
  totalStudents = 0;
  pendingStudents = 0;
  approvedStudents = 0;
  rejectedStudents = 0;

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
    // Setup debounced search subscription
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.fetchStudents();
    });

    this.fetchStudents();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  onSearchChange(value: string): void {
    this.currentPage = 1;
    this.searchSubject.next(value);
  }

  fetchStudents(): void {
    this.isLoading = true;
    const params: { [key: string]: any } = {};

    if (this.searchTerm && this.searchTerm.trim()) {
      params['search'] = this.searchTerm.trim();
    }

    if (this.selectedStatus && this.selectedStatus !== 'All Status') {
      params['status'] = this.selectedStatus.toUpperCase();
    }

    this.apiService.get<any>('admin/student-enrollments', params).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.success && response.data) {
          const data = response.data;
          if (data.stats) {
            this.totalStudents = data.stats.total_students ?? 0;
            this.pendingStudents = data.stats.pending_applications ?? 0;
            this.approvedStudents = data.stats.approved_applications ?? 0;
            this.rejectedStudents = data.stats.rejected_applications ?? 0;
          }
          if (Array.isArray(data.enrollments)) {
            this.students = data.enrollments;
          } else if (Array.isArray(data)) {
            this.students = data;
          }
        } else if (Array.isArray(response)) {
          this.students = response;
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching student enrollments:', err);
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
    return Math.ceil(this.students.length / this.pageSize) || 1;
  }

  get paginatedStudents(): StudentEnrollment[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.students.slice(startIndex, startIndex + this.pageSize);
  }

  get startIndex(): number {
    return this.students.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.students.length ? this.students.length : end;
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
    this.fetchStudents();
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

  approveStudent(id: number): void {
    this.openConfirmModal(
      'Approve Student Application',
      'Are you sure you want to approve this student enrollment application?',
      'approve',
      () => {
        this.isActionLoading = true;
        this.actionLoadingId = id;
        this.apiService.patch<any>(`admin/student-enrollments/${id}/status`, {
          status: 'APPROVED'
        }).subscribe({
          next: () => {
            this.isActionLoading = false;
            this.actionLoadingId = null;
            this.showConfirmModal = false;
            this.confirmActionFn = null;
            this.triggerToast('Student approved successfully!', 'success');
            this.fetchStudents();
          },
          error: (err) => {
            this.isActionLoading = false;
            this.actionLoadingId = null;
            this.showConfirmModal = false;
            this.confirmActionFn = null;
            console.error('Error approving student:', err);
            this.triggerToast('Failed to approve student registration.', 'error');
            const student = this.students.find(s => (s.id === id || s.student_id === id));
            if (student) {
              student.status = 'APPROVED';
            }
          }
        });
      }
    );
  }

  rejectStudent(id: number): void {
    this.openConfirmModal(
      'Reject Student Application',
      'Are you sure you want to reject this student enrollment application?',
      'reject',
      () => {
        this.isActionLoading = true;
        this.actionLoadingId = id;
        this.apiService.patch<any>(`admin/student-enrollments/${id}/status`, {
          status: 'REJECTED'
        }).subscribe({
          next: () => {
            this.isActionLoading = false;
            this.actionLoadingId = null;
            this.showConfirmModal = false;
            this.confirmActionFn = null;
            this.triggerToast('Student rejected successfully!', 'success');
            this.fetchStudents();
          },
          error: (err) => {
            this.isActionLoading = false;
            this.actionLoadingId = null;
            this.showConfirmModal = false;
            this.confirmActionFn = null;
            console.error('Error rejecting student:', err);
            this.triggerToast('Failed to reject student registration.', 'error');
            const student = this.students.find(s => (s.id === id || s.student_id === id));
            if (student) {
              student.status = 'REJECTED';
            }
          }
        });
      }
    );
  }
}
