import { Component, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-teacher-enrollment-detail',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './teacher-enrollment-detail.component.html',
  styleUrls: []
})
export class TeacherEnrollmentDetailComponent implements OnInit {
  teacherId: string | null = null;
  teacherDetail: any = null;
  isLoading: boolean = false;
  error: string | null = null;

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
    
    this.apiService.get(`/admin/teachers/${id}`).subscribe({
      next: (response) => {
        console.log('Teacher detail response:', response);
        this.teacherDetail = response;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching teacher detail:', error);
        this.error = 'Failed to load teacher detail';
        this.isLoading = false;
      }
    });
  }
}
