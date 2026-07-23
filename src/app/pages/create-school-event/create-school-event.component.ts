import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-create-school-event',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './create-school-event.component.html',
  styleUrls: []
})
export class CreateSchoolEventComponent {
  eventForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  categoryOptions: string[] = ['STUDENT', 'PARENT', 'TEACHER'];
  gradeOptions: string[] = ['Kindergarten',
    '1st Grade',
    '2nd Grade',
    '3rd Grade',
    '4th Grade',];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
      eventDate: ['', [Validators.required]],
      eventTime: ['', [Validators.required]],
      categories: [[], [Validators.required]],
      grades: [[], [Validators.required]]
    });
  }

  isCategorySelected(cat: string): boolean {
    const selected: string[] = this.eventForm.get('categories')?.value || [];
    return selected.includes(cat);
  }

  toggleCategory(cat: string): void {
    const selected: string[] = [...(this.eventForm.get('categories')?.value || [])];
    const index = selected.indexOf(cat);
    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(cat);
    }
    this.eventForm.get('categories')?.setValue(selected);
    this.eventForm.get('categories')?.markAsTouched();
  }

  isGradeSelected(grade: string): boolean {
    const selected: string[] = this.eventForm.get('grades')?.value || [];
    return selected.includes(grade);
  }

  toggleGrade(grade: string): void {
    const selected: string[] = [...(this.eventForm.get('grades')?.value || [])];
    const index = selected.indexOf(grade);
    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(grade);
    }
    this.eventForm.get('grades')?.setValue(selected);
    this.eventForm.get('grades')?.markAsTouched();
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    let formattedTime = this.eventForm.value.eventTime;
    if (formattedTime && formattedTime.length === 5) {
      formattedTime += ':00';
    }

    const payload = {
      title: this.eventForm.value.title,
      description: this.eventForm.value.description,
      eventDate: this.eventForm.value.eventDate,
      eventTime: formattedTime,
      categories: this.eventForm.value.categories,
      grades: this.eventForm.value.grades
    };

    this.apiService.post<any>('admin/events', payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res?.message || 'Event created successfully!';
        setTimeout(() => {
          this.router.navigate(['/school-events']);
        }, 1200);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error creating event:', err);
        this.errorMessage = err.error?.message || err.message || 'Failed to create event. Please try again.';
      }
    });
  }
}

