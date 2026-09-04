import { Component, OnInit } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-edit-school-event',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './edit-school-event.component.html',
  styleUrls: []
})
export class EditSchoolEventComponent implements OnInit {
  eventId: string | number | null = null;
  eventForm: FormGroup;
  isLoading = false;
  isFetching = false;
  errorMessage = '';
  successMessage = '';

  categoryOptions: string[] = ['STUDENT', 'PARENT', 'TEACHER'];
  gradeOptions: string[] = [
    'Pre-K',
    'Kindergarten',
    '1st Grade',
    '2nd Grade',
    '3rd Grade',
    '4th Grade'
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
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

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id');
    if (this.eventId) {
      this.fetchEventDetails(this.eventId);
    }
  }

  fetchEventDetails(id: string | number): void {
    this.isFetching = true;
    this.errorMessage = '';
    this.apiService.get<any>(`admin/events/${id}`).subscribe({
      next: (res) => {
        this.isFetching = false;
        const data = res?.data || res?.event || res;
        if (data) {
          let dateVal = data.eventDate ? data.eventDate.split('T')[0] : '';
          let timeVal = data.eventTime ? data.eventTime.substring(0, 5) : '';

          this.eventForm.patchValue({
            title: data.title || '',
            description: data.description || '',
            eventDate: dateVal,
            eventTime: timeVal,
            categories: data.categories || [],
            grades: data.grades || []
          });
        }
      },
      error: (err) => {
        this.isFetching = false;
        console.error('Error fetching event details:', err);
        this.errorMessage = 'Failed to load event details.';
      }
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

    if (!this.eventId) {
      this.errorMessage = 'No event ID found to update.';
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

    this.apiService.put<any>(`admin/events/${this.eventId}`, payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res?.message || 'Event updated successfully!';
        setTimeout(() => {
          this.router.navigate(['/school-events']);
        }, 1200);
      },
      error: () => {
        this.apiService.patch<any>(`admin/events/${this.eventId}`, payload).subscribe({
          next: (res) => {
            this.isLoading = false;
            this.successMessage = res?.message || 'Event updated successfully!';
            setTimeout(() => {
              this.router.navigate(['/school-events']);
            }, 1200);
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Error updating event:', err);
            this.errorMessage = err.error?.message || err.message || 'Failed to update event. Please try again.';
          }
        });
      }
    });
  }
}

