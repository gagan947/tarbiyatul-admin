import { Component, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

export interface TutoringStudentDetail {
  id: string | number;
  numericId?: number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  dob?: string;
  gradeLevel?: string;
  grade?: string;
  academy?: string;
  email?: string;
  status?: string;
  profileImage?: string | null;
  date?: string;
  formatted_date?: string;
}

export interface AssignmentStats {
  total: number;
  submitted: number;
  pending: number;
  overdue: number;
  graded: number;
}

export interface TutoringAssignment {
  id: string | number;
  title: string;
  description?: string;
  subject?: string;
  gradeLevel?: string;
  dueDate?: string;
  due_date?: string;
  totalPoints?: number;
  attachmentUrl?: string | null;
  bookTitle?: string | null;
  createdAt?: string;
  submission?: any | null;
  status: string;
  statusLabel?: string;
}

export interface TutoringDetailItem {
  id: string | number;
  numericId?: number;
  userId?: string | number;
  studentId?: string | number;
  role?: string;
  learnerName: string;
  learnerEmail?: string;
  guardianName?: string;
  email: string;
  phone: string;
  profileImage?: string | null;
  subject: string;
  academy?: string;
  gradeLevel?: string;
  dob?: string;
  status: string;
  raw_status?: string;
  date?: string;
  formatted_date?: string;
  createdAt?: string;
  notes?: string;
  students?: TutoringStudentDetail[];
  assignment_stats?: AssignmentStats;
  assignments?: TutoringAssignment[];
  learner?: any;
  guardian?: any;
}

@Component({
  selector: 'app-tutoring-enrollment-detail',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './tutoring-enrollment-detail.component.html',
  styleUrls: []
})
export class TutoringEnrollmentDetailComponent implements OnInit {
  enrollmentId: string | number = '';
  enrollment: TutoringDetailItem | null = null;
  isLoading = false;

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

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.enrollmentId = params['id'];
        this.fetchEnrollmentDetails();
      }
    });
  }

  fetchEnrollmentDetails(): void {
    this.isLoading = true;
    this.apiService.get<any>(`admin/tutoring-enrollments/${this.enrollmentId}`).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.success && response.data) {
          this.enrollment = this.mapToDetail(response.data);
        } else if (response?.data) {
          this.enrollment = this.mapToDetail(response.data);
        } else if (response) {
          this.enrollment = this.mapToDetail(response);
        } else {
          this.fetchFromListFallback();
        }
      },
      error: (err) => {
        console.error('Error fetching tutoring enrollment detail:', err);
        this.fetchFromListFallback();
      }
    });
  }

  private fetchFromListFallback(): void {
    this.apiService.get<any>('admin/tutoring-enrollments').subscribe({
      next: (response) => {
        this.isLoading = false;
        const list = this.extractList(response);
        const found = list.find((item: any) => 
          String(item.id) === String(this.enrollmentId) ||
          String(item.numericId) === String(this.enrollmentId) ||
          String(item.userId) === String(this.enrollmentId)
        );
        if (found) {
          this.enrollment = this.mapToDetail(found);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error in tutoring enrollment fallback:', err);
      }
    });
  }

  private extractList(response: any): any[] {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (response.data) {
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.data.enrollments)) return response.data.enrollments;
    }
    if (Array.isArray(response.enrollments)) return response.enrollments;
    return [];
  }

  private mapToDetail(data: any): TutoringDetailItem {
    if (!data) return this.getDefaultDetail();

    const assignmentStats: AssignmentStats = data.assignment_stats || {
      total: Array.isArray(data.assignments) ? data.assignments.length : 0,
      submitted: 0,
      pending: Array.isArray(data.assignments) ? data.assignments.length : 0,
      overdue: 0,
      graded: 0
    };
    const assignments: TutoringAssignment[] = Array.isArray(data.assignments) ? data.assignments : [];

    // 1. Direct match for API response with learner & guardian objects
    if (data.learner || data.guardian) {
      const learner = data.learner || {};
      const guardian = data.guardian || {};
      const learnerName = learner.name || learner.fullName || (learner.firstName ? `${learner.firstName} ${learner.lastName || ''}`.trim() : (data.learnerName || 'N/A'));
      const guardianName = guardian.name || guardian.fullName || (data.guardianName || learnerName);
      const learnerEmail = learner.email || data.learnerEmail || '';
      const email = guardian.email || learner.email || data.email || '';
      const phone = guardian.phone || data.phone || 'N/A';
      const statusRaw = data.status || data.raw_status || learner.status || 'PENDING';
      const status = statusRaw.toUpperCase();
      const academy = data.academy || learner.academy || 'Global Academy';
      const subject = data.subject || academy || '1-on-1 Tutoring';
      const gradeLevel = learner.grade || learner.gradeLevel || data.gradeLevel || '';
      const dob = learner.dob || data.dob;
      const profileImage = learner.profileImage || data.profileImage || null;
      const formattedDate = data.formatted_date || data.date || learner.formatted_date || learner.date;

      return {
        id: data.id,
        numericId: data.numericId,
        userId: data.userId || data.numericId,
        studentId: learner.id || learner.numericId,
        role: 'tutoring',
        learnerName: learnerName,
        learnerEmail: learnerEmail,
        guardianName: guardianName,
        email: email,
        phone: phone,
        profileImage: profileImage,
        subject: subject,
        academy: academy,
        gradeLevel: gradeLevel,
        dob: dob,
        status: status,
        raw_status: data.raw_status,
        date: data.date,
        formatted_date: formattedDate,
        createdAt: data.createdAt || formattedDate,
        learner: learner,
        guardian: guardian,
        assignment_stats: assignmentStats,
        assignments: assignments,
        students: [
          {
            id: learner.id || learner.numericId || '1',
            numericId: learner.numericId,
            fullName: learnerName,
            name: learnerName,
            email: learnerEmail,
            gradeLevel: gradeLevel,
            grade: gradeLevel,
            academy: academy,
            dob: dob,
            status: learner.status || status,
            profileImage: profileImage
          }
        ]
      };
    }

    // 2. Format with students array
    if (data.students && Array.isArray(data.students) && data.students.length > 0) {
      const student = data.students[0];
      const studentName = student.fullName || (student.firstName && student.lastName ? `${student.firstName} ${student.lastName}`.trim() : student.name);
      const userName = data.fullName || (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}`.trim() : data.name);
      const learnerName = studentName || userName || 'N/A';
      const guardianName = userName || studentName || 'N/A';
      const statusRaw = student.status || data.approvalStatus || data.status || 'PENDING';

      return {
        id: data.id,
        numericId: data.numericId,
        userId: data.userId || data.id,
        studentId: student.id,
        role: data.role || 'tutoring',
        learnerName: learnerName,
        learnerEmail: student.email || data.email || '',
        guardianName: guardianName,
        email: data.email || student.email || '',
        phone: data.phone || 'N/A',
        profileImage: student.profileImage || data.profileImage || null,
        subject: student.academy || student.gradeLevel || data.subject || '1-on-1 Tutoring',
        academy: student.academy || data.academy || 'Global Academy',
        gradeLevel: student.gradeLevel || '',
        dob: student.dob,
        status: statusRaw.toUpperCase(),
        raw_status: data.raw_status,
        createdAt: student.createdAt || data.createdAt,
        assignment_stats: assignmentStats,
        assignments: assignments,
        students: data.students
      };
    }

    // 3. Flat data fallback
    const userName = data.fullName || (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}`.trim() : (data.name || data.learnerName || 'N/A'));
    const statusRaw = data.approvalStatus || data.status || 'PENDING';
    return {
      id: data.id,
      numericId: data.numericId,
      userId: data.userId || data.id,
      studentId: data.studentId || data.id,
      role: data.role || 'tutoring',
      learnerName: data.learnerName || userName,
      learnerEmail: data.learnerEmail || data.email || '',
      guardianName: data.guardianName || userName,
      email: data.email || '',
      phone: data.phone || 'N/A',
      profileImage: data.profileImage || null,
      subject: data.subject || data.academy || '1-on-1 Tutoring',
      academy: data.academy || 'Global Academy',
      gradeLevel: data.gradeLevel || '',
      dob: data.dob,
      status: statusRaw.toUpperCase(),
      createdAt: data.createdAt,
      assignment_stats: assignmentStats,
      assignments: assignments,
      students: data.students || []
    };
  }

  private getDefaultDetail(): TutoringDetailItem {
    return {
      id: this.enrollmentId,
      learnerName: 'Palash jaan',
      learnerEmail: 'palash@mailinator.com',
      guardianName: 'Palash jaan',
      email: 'palash@mailinator.com',
      phone: '98761255312',
      subject: 'Global Academy',
      academy: 'Global Academy',
      gradeLevel: 'Pre-K',
      status: 'ACTIVE',
      createdAt: '2026-09-02'
    };
  }

  approveEnrollment(): void {
    if (!this.enrollment) return;
    const targetId = this.enrollment.numericId || this.enrollmentId;

    this.openConfirmModal(
      'Approve Tutoring Application',
      `Are you sure you want to approve the 1-on-1 tutoring application for ${this.enrollment.learnerName}?`,
      'approve',
      () => {
        this.apiService.patch<any>(`admin/tutoring-enrollments/${targetId}/status`, {
          status: 'APPROVED'
        }).subscribe({
          next: () => {
            this.triggerToast('Tutoring application approved successfully!', 'success');
            this.fetchEnrollmentDetails();
          },
          error: (err) => {
            console.error('Error approving enrollment:', err);
            this.triggerToast('Failed to approve tutoring application.', 'error');
            if (this.enrollment) {
              this.enrollment.status = 'APPROVED';
            }
          }
        });
      }
    );
  }

  rejectEnrollment(): void {
    if (!this.enrollment) return;
    const targetId = this.enrollment.numericId || this.enrollmentId;

    this.openConfirmModal(
      'Decline Tutoring Application',
      `Are you sure you want to decline the tutoring application for ${this.enrollment.learnerName}?`,
      'reject',
      () => {
        this.apiService.patch<any>(`admin/tutoring-enrollments/${targetId}/status`, {
          status: 'REJECTED'
        }).subscribe({
          next: () => {
            this.triggerToast('Tutoring application declined.', 'info');
            this.fetchEnrollmentDetails();
          },
          error: (err) => {
            console.error('Error declining enrollment:', err);
            this.triggerToast('Failed to decline tutoring application.', 'error');
            if (this.enrollment) {
              this.enrollment.status = 'REJECTED';
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
}
