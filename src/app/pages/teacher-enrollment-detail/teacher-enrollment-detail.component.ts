import { Component, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../environments/environment';

export interface TeacherProfile {
  qualification?: string;
  specialization?: string;
  experienceYears?: number;
  teachingGrade?: string;
  resumeUrl?: string;
}

export interface TeacherDetail {
  id: string | number;
  numericId?: number;
  role?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  profileImage?: string | null;
  approvalStatus?: string;
  status?: string;
  createdAt?: string;
  appliedDate?: string;
  qualification?: string;
  specialization?: string;
  yearsOfExperience?: number;
  experienceYears?: number;
  teachingGrade?: string;
  resumeUrl?: string;
  teacherProfile?: TeacherProfile;
}

@Component({
  selector: 'app-teacher-enrollment-detail',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './teacher-enrollment-detail.component.html',
  styleUrls: []
})
export class TeacherEnrollmentDetailComponent implements OnInit {
  teacherId: string | null = null;
  teacherDetail: TeacherDetail | null = null;
  isLoading: boolean = false;
  error: string | null = null;

  // Custom Confirm Modal State
  showConfirmModal: boolean = false;
  confirmTitle: string = '';
  confirmMessage: string = '';
  confirmType: 'approve' | 'reject' | 'confirm' = 'confirm';
  private confirmActionFn: (() => void) | null = null;

  // Custom Toast Notification State
  showToastMessage: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'info' = 'success';

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.teacherId = params['id'];
      if (this.teacherId) {
        this.fetchTeacherDetail(this.teacherId);
      } else {
        this.error = 'No teacher ID provided';
      }
    });
  }

  fetchTeacherDetail(id: string): void {
    this.isLoading = true;
    this.error = null;
    
    this.apiService.get<any>(`admin/teachers/${id}`).subscribe({
      next: (response) => {
        console.log('Teacher detail response:', response);
        const data = response?.data?.teacher || response?.data || response;
        if (data && (data.id || data.firstName || data.fullName)) {
          this.teacherDetail = data;
        } else {
          this.fetchFromFallbackList(id);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching teacher detail:', error);
        this.fetchFromFallbackList(id);
      }
    });
  }

  private fetchFromFallbackList(id: string): void {
    this.apiService.get<any>('admin/teacher-enrollments').subscribe({
      next: (res) => {
        this.isLoading = false;
        const list = res?.data?.teachers || res?.data || res || [];
        if (Array.isArray(list)) {
          const found = list.find((t: any) => String(t.id) === String(id) || String(t.numericId) === String(id));
          if (found) {
            this.teacherDetail = found;
            return;
          }
        }
        this.error = 'Teacher detail not found';
      },
      error: () => {
        this.isLoading = false;
        this.error = 'Failed to load teacher detail';
      }
    });
  }

  getResumeUrl(url: string | undefined): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const base = environment.imageBaseUrl || '';
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  }

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

  approveTeacher(): void {
    if (!this.teacherDetail) return;
    const id = this.teacherDetail.numericId || this.teacherDetail.id;
    const name = this.teacherDetail.fullName || `${this.teacherDetail.firstName || ''} ${this.teacherDetail.lastName || ''}`.trim() || 'this teacher';

    this.openConfirmModal(
      'Approve Teacher Application',
      `Are you sure you want to approve the teacher registration for ${name}?`,
      'approve',
      () => {
        const payload = { status: 'APPROVED', notes: 'Verified experience and background check.' };
        this.apiService.patch<any>(`admin/teacher-enrollments/${id}/status`, payload).subscribe({
          next: () => {
            this.triggerToast('Teacher request approved successfully!', 'success');
            if (this.teacherDetail) {
              this.teacherDetail.approvalStatus = 'APPROVED';
              this.teacherDetail.status = 'APPROVED';
            }
          },
          error: () => {
            // Fallback to legacy approval endpoint
            this.apiService.patch<any>(`admin/users/${id}/approval`, { role: 'teacher', status: 'active' }).subscribe({
              next: () => {
                this.triggerToast('Teacher request approved successfully!', 'success');
                if (this.teacherDetail) {
                  this.teacherDetail.approvalStatus = 'APPROVED';
                  this.teacherDetail.status = 'APPROVED';
                }
              },
              error: (err) => {
                console.error('Error approving teacher:', err);
                this.triggerToast('Failed to approve teacher application.', 'error');
              }
            });
          }
        });
      }
    );
  }

  rejectTeacher(): void {
    if (!this.teacherDetail) return;
    const id = this.teacherDetail.numericId || this.teacherDetail.id;
    const name = this.teacherDetail.fullName || `${this.teacherDetail.firstName || ''} ${this.teacherDetail.lastName || ''}`.trim() || 'this teacher';

    this.openConfirmModal(
      'Reject Teacher Application',
      `Are you sure you want to reject the teacher registration for ${name}?`,
      'reject',
      () => {
        const payload = { status: 'REJECTED', notes: 'Does not meet requirements.' };
        this.apiService.patch<any>(`admin/teacher-enrollments/${id}/status`, payload).subscribe({
          next: () => {
            this.triggerToast('Teacher request rejected successfully!', 'info');
            if (this.teacherDetail) {
              this.teacherDetail.approvalStatus = 'REJECTED';
              this.teacherDetail.status = 'REJECTED';
            }
          },
          error: () => {
            // Fallback to legacy approval endpoint
            this.apiService.patch<any>(`admin/users/${id}/approval`, { role: 'teacher', status: 'inactive' }).subscribe({
              next: () => {
                this.triggerToast('Teacher request rejected successfully!', 'info');
                if (this.teacherDetail) {
                  this.teacherDetail.approvalStatus = 'REJECTED';
                  this.teacherDetail.status = 'REJECTED';
                }
              },
              error: (err) => {
                console.error('Error rejecting teacher:', err);
                this.triggerToast('Failed to reject teacher application.', 'error');
              }
            });
          }
        });
      }
    );
  }
}

