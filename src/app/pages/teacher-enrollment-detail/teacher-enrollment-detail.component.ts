import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-teacher-enrollment-detail',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './teacher-enrollment-detail.component.html',
  styleUrls: []
})
export class TeacherEnrollmentDetailComponent {}
