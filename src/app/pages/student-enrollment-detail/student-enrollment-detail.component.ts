import { Component, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-student-enrollment-detail',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './student-enrollment-detail.component.html',
  styleUrls: []
})
export class StudentEnrollmentDetailComponent implements OnInit {
  parentId!: number;
  parent: any = null;
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
        this.parentId = +params['id'];
        this.fetchParentDetails();
      }
    });
  }

  fetchParentDetails(): void {
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

        this.parent = parentsList.find(p => p.id === this.parentId);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching parent details:', err);
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

  updateStudentStatus(studentId: number, status: string): void {
    const act = status === 'active' ? 'approve' : 'reject';
    this.openConfirmModal(
      `${status === 'active' ? 'Approve' : 'Reject'} Student`,
      `Are you sure you want to ${act} this student's registration request?`,
      status === 'active' ? 'approve' : 'reject',
      () => {
        this.apiService.patch<any>(`admin/students/${studentId}/status`, { status }).subscribe({
          next: () => {
            this.triggerToast(`Student status updated to ${status} successfully!`, 'success');
            this.fetchParentDetails();
          },
          error: (err) => {
            console.error('Error updating student status:', err);
            this.triggerToast('Failed to update student registration status.', 'error');
            // Fallback UI mock update
            if (this.parent && this.parent.students) {
              const student = this.parent.students.find((s: any) => s.id === studentId);
              if (student) {
                student.status = status;
              }
            }
          }
        });
      }
    );
  }

  updateParentStatus(status: string): void {
    this.apiService.patch<any>(`admin/users/${this.parentId}/approval`, {
      role: 'parent',
      status: status
    }).subscribe({
      next: () => {
        this.triggerToast(`Parent application status updated to ${status} successfully!`, 'success');
        this.fetchParentDetails();
      },
      error: (err) => {
        console.error('Error updating parent approval status:', err);
        this.triggerToast('Failed to update parent approval status.', 'error');
        // Fallback UI mock update
        if (this.parent) {
          if (this.parent.approvalStatus) {
            this.parent.approvalStatus = status;
          } else {
            this.parent.status = status;
          }
        }
      }
    });
  }

  approveAll(): void {
    if (!this.parent) return;
    this.openConfirmModal(
      'Approve All Enrollments',
      'Are you sure you want to approve this application and all registered children?',
      'approve',
      () => {
        this.apiService.patch<any>(`admin/users/${this.parentId}/approval`, {
          role: 'parent',
          status: 'active'
        }).subscribe({
          next: () => {
            if (this.parent.students && this.parent.students.length > 0) {
              let completed = 0;
              this.parent.students.forEach((student: any) => {
                this.apiService.patch<any>(`admin/students/${student.id}/status`, {
                  status: 'active'
                }).subscribe({
                  next: () => {
                    completed++;
                    if (completed === this.parent.students.length) {
                      this.triggerToast('Parent application and all students approved successfully!', 'success');
                      this.fetchParentDetails();
                    }
                  },
                  error: (err) => {
                    console.error(`Error approving student ${student.id}:`, err);
                    completed++;
                    if (completed === this.parent.students.length) {
                      this.fetchParentDetails();
                    }
                  }
                });
              });
            } else {
              this.triggerToast('Parent registration approved successfully!', 'success');
              this.fetchParentDetails();
            }
          },
          error: (err) => {
            console.error('Error in batch approval process:', err);
            this.triggerToast('Failed to complete batch approval process.', 'error');
          }
        });
      }
    );
  }

  rejectAll(): void {
    if (!this.parent) return;
    this.openConfirmModal(
      'Reject All Enrollments',
      'Are you sure you want to reject this application and all registered children?',
      'reject',
      () => {
        this.apiService.patch<any>(`admin/users/${this.parentId}/approval`, {
          role: 'parent',
          status: 'rejected'
        }).subscribe({
          next: () => {
            if (this.parent.students && this.parent.students.length > 0) {
              let completed = 0;
              this.parent.students.forEach((student: any) => {
                this.apiService.patch<any>(`admin/students/${student.id}/status`, {
                  status: 'rejected'
                }).subscribe({
                  next: () => {
                    completed++;
                    if (completed === this.parent.students.length) {
                      this.triggerToast('Parent application and all students rejected successfully!', 'success');
                      this.fetchParentDetails();
                    }
                  },
                  error: (err) => {
                    console.error(`Error rejecting student ${student.id}:`, err);
                    completed++;
                    if (completed === this.parent.students.length) {
                      this.fetchParentDetails();
                    }
                  }
                });
              });
            } else {
              this.triggerToast('Parent registration rejected successfully!', 'success');
              this.fetchParentDetails();
            }
          },
          error: (err) => {
            console.error('Error in batch rejection process:', err);
            this.triggerToast('Failed to complete batch rejection process.', 'error');
          }
        });
      }
    );
  }
}
