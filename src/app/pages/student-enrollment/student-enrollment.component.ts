import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-student-enrollment',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './student-enrollment.component.html',
  styleUrls: []
})
export class StudentEnrollmentComponent implements OnInit {
  students: any[] = [];
  isLoading = false;

  // Stats
  totalStudents = 0;
  pendingStudents = 0;
  approvedStudents = 0;
  rejectedStudents = 0;

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
    this.fetchStudents();
  }

  fetchStudents(): void {
    this.isLoading = true;
    this.apiService.get<any>('admin/parents').subscribe({
      next: (response) => {
        this.isLoading = false;
        let parentsList: any[] = [];
        if (response && response.success && response.data) {
          const data = response.data;
          if (Array.isArray(data)) {
            parentsList = data;
          } else if (data.parents && Array.isArray(data.parents)) {
            parentsList = data.parents;
          } else if (data.users && Array.isArray(data.users)) {
            parentsList = data.users;
          }
        } else if (Array.isArray(response)) {
          parentsList = response;
        }

        // Flatten parents and their students into a single list of students
        const tempStudents: any[] = [];
        parentsList.forEach((parent: any) => {
          if (parent.students && Array.isArray(parent.students)) {
            parent.students.forEach((student: any) => {
              tempStudents.push({
                ...student,
                parentName: parent.fullName || (parent.firstName && parent.lastName ? `${parent.firstName} ${parent.lastName}` : (parent.name || 'N/A')),
                parentEmail: parent.email,
                parentId: parent.id,
                createdAt: student.createdAt || parent.createdAt
              });
            });
          }
        });

        this.students = tempStudents;
        this.calculateStats();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching student enrollments:', err);
      }
    });
  }

  calculateStats(): void {
    this.totalStudents = this.students.length;
    this.pendingStudents = this.students.filter(
      s => (s.status)?.toLowerCase() === 'pending'
    ).length;
    this.approvedStudents = this.students.filter(
      s => (s.status)?.toLowerCase() === 'approved' || (s.status)?.toLowerCase() === 'active'
    ).length;
    this.rejectedStudents = this.students.filter(
      s => (s.status)?.toLowerCase() === 'rejected'
    ).length;
  }

  changeStatusFilter(status: string): void {
    this.selectedStatus = status;
  }

  getFilteredStudents(): any[] {
    return this.students.filter(s => {
      const studentName = s.fullName || (s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : '');
      const parentName = s.parentName || '';
      const email = s.email || '';
      const grade = s.gradeLevel || '';
      const status = s.status || '';

      const matchesSearch = !this.searchTerm ||
        studentName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        parentName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        grade.toLowerCase().includes(this.searchTerm.toLowerCase());

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

  approveStudent(id: number): void {
    this.openConfirmModal(
      'Approve Student Application',
      'Are you sure you want to approve this student enrollment application?',
      'approve',
      () => {
        this.apiService.patch<any>(`admin/students/${id}/status`, {
          status: 'active'
        }).subscribe({
          next: () => {
            this.triggerToast('Student approved successfully!', 'success');
            this.fetchStudents();
          },
          error: (err) => {
            console.error('Error approving student:', err);
            this.triggerToast('Failed to approve student registration.', 'error');
            // Fallback UI mock update
            const student = this.students.find(s => s.id === id);
            if (student) {
              student.status = 'active';
              this.calculateStats();
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
        this.apiService.patch<any>(`admin/students/${id}/status`, {
          status: 'inactive'
        }).subscribe({
          next: () => {
            this.triggerToast('Student rejected successfully!', 'success');
            this.fetchStudents();
          },
          error: (err) => {
            console.error('Error rejecting student:', err);
            this.triggerToast('Failed to reject student registration.', 'error');
            // Fallback UI mock update
            const student = this.students.find(s => s.id === id);
            if (student) {
              student.status = 'rejected';
              this.calculateStats();
            }
          }
        });
      }
    );
  }
}
