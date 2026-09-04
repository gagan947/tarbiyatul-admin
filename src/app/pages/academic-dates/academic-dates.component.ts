import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

export interface PageDateConfig {
  key: string;
  pageName: string;
  pageRoute: string;
  label: string;
  value: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-academic-dates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './academic-dates.component.html',
  styleUrls: ['./academic-dates.component.css']
})
export class AcademicDatesComponent implements OnInit {
  isLoading = false;
  isSaving = false;
  showSuccessToast = false;
  isErrorToast = false;
  toastMessage = '';
  lastUpdatedAt: string | null = null;

  constructor(private apiService: ApiService) {}

  pageDates: PageDateConfig[] = [
    {
      key: 'academicYear',
      pageName: 'Sitewide / All Pages',
      pageRoute: 'Academic Session Year',
      label: 'Current Academic Year',
      value: '2025 - 2026',
      description: 'Shown across portal headers, footer, and welcome messages.',
      icon: 'fa-calendar-check'
    },
    {
      key: 'firstDayOfSchoolDay',
      pageName: 'Welcome Page',
      pageRoute: '/welcome',
      label: 'First Day of School — Day (e.g. Monday, Wednesday)',
      value: 'Monday',
      description: 'Day of the week displayed before the first day date.',
      icon: 'fa-calendar-day'
    },
    {
      key: 'firstDayOfSchoolDate',
      pageName: 'Welcome Page',
      pageRoute: '/welcome',
      label: 'First Day of School — Date',
      value: 'October 13, 2026',
      description: '"First day of school for students will be [DAY], [DATE]."',
      icon: 'fa-school'
    },
    {
      key: 'virtualOpenHouseDay',
      pageName: 'Welcome Page',
      pageRoute: '/welcome',
      label: 'Virtual Open House — Day (e.g. Wednesday)',
      value: 'Wednesday',
      description: 'Day of the week displayed for the virtual open house session.',
      icon: 'fa-calendar-day'
    },
    {
      key: 'virtualOpenHouseDate',
      pageName: 'Welcome Page',
      pageRoute: '/welcome',
      label: 'Virtual Open House — Date',
      value: 'May 13, 2026',
      description: '"Virtual Open House for parents will be held on [DATE]."',
      icon: 'fa-laptop-house'
    },
    {
      key: 'registrationDeadline',
      pageName: 'Admissions / Welcome Page',
      pageRoute: '/admissionProcess',
      label: 'Registration & Down Payment Deadline',
      value: 'August 29, 2025',
      description: 'Displayed in fee instructions and admission process information.',
      icon: 'fa-file-signature'
    },
    {
      key: 'studentOrientationDate',
      pageName: 'Admissions / Welcome Page',
      pageRoute: '/admissionProcess',
      label: 'Student Orientation & Materials Pickup Date',
      value: 'September 5, 2025',
      description: 'Portal orientation and digital workbook access distribution date.',
      icon: 'fa-person-chalkboard'
    }
  ];

  groupedPages: { pageName: string; pageRoute: string; items: PageDateConfig[] }[] = [];

  ngOnInit(): void {
    this.updateGroupedPages();
    this.loadSaved();
  }

  updateGroupedPages(): void {
    const map = new Map<string, { pageName: string; pageRoute: string; items: PageDateConfig[] }>();
    this.pageDates.forEach(item => {
      if (!map.has(item.pageName)) {
        map.set(item.pageName, { pageName: item.pageName, pageRoute: item.pageRoute, items: [] });
      }
      map.get(item.pageName)!.items.push(item);
    });
    this.groupedPages = Array.from(map.values());
  }

  loadSaved(): void {
    this.isLoading = true;
    this.apiService.get<any>('admin/academic-dates').subscribe({
      next: (res) => {
        this.isLoading = false;
        const parsed = res?.data || res;
        if (parsed) {
          if (parsed.updatedAt) {
            this.lastUpdatedAt = parsed.updatedAt;
          }
          this.pageDates.forEach(item => {
            if (parsed[item.key] !== undefined && parsed[item.key] !== null) {
              item.value = parsed[item.key];
            } else if (item.key === 'virtualOpenHouseDay' && parsed['openHouseDay'] !== undefined) {
              item.value = parsed['openHouseDay'];
            } else if (item.key === 'virtualOpenHouseDate' && parsed['openHouseDate'] !== undefined) {
              item.value = parsed['openHouseDate'];
            } else if (item.key === 'studentOrientationDate' && parsed['orientationDate'] !== undefined) {
              item.value = parsed['orientationDate'];
            }
          });
        }
        this.updateGroupedPages();
      },
      error: (err) => {
        this.isLoading = false;
        console.warn('Could not fetch admin/academic-dates, checking fallback cache:', err);
        this.useFallbackSaved();
        this.updateGroupedPages();
      }
    });
  }

  private useFallbackSaved(): void {
    const saved = localStorage.getItem('tiag_academic_dates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.pageDates.forEach(item => {
          if (parsed[item.key] !== undefined) {
            item.value = parsed[item.key];
          } else if (item.key === 'virtualOpenHouseDay' && parsed['openHouseDay'] !== undefined) {
            item.value = parsed['openHouseDay'];
          } else if (item.key === 'virtualOpenHouseDate' && parsed['openHouseDate'] !== undefined) {
            item.value = parsed['openHouseDate'];
          } else if (item.key === 'studentOrientationDate' && parsed['orientationDate'] !== undefined) {
            item.value = parsed['orientationDate'];
          }
        });
      } catch (e) { /* ignore */ }
    }
  }

  getVal(key: string): string {
    const found = this.pageDates.find(d => d.key === key);
    return found ? found.value : '';
  }

  saveAll(): void {
    this.isSaving = true;

    const payload = {
      academicYear: this.getVal('academicYear') || '2025 - 2026',
      firstDayOfSchoolDay: this.getVal('firstDayOfSchoolDay') || 'Monday',
      firstDayOfSchoolDate: this.getVal('firstDayOfSchoolDate') || 'October 13, 2026',
      virtualOpenHouseDay: this.getVal('virtualOpenHouseDay') || 'Wednesday',
      virtualOpenHouseDate: this.getVal('virtualOpenHouseDate') || 'May 13, 2026',
      registrationDeadline: this.getVal('registrationDeadline') || 'August 29, 2025',
      studentOrientationDate: this.getVal('studentOrientationDate') || 'September 5, 2025',
      // backward-compatibility aliases
      openHouseDay: this.getVal('virtualOpenHouseDay') || 'Wednesday',
      openHouseDate: this.getVal('virtualOpenHouseDate') || 'May 13, 2026',
      orientationDate: this.getVal('studentOrientationDate') || 'September 5, 2025'
    };

    localStorage.setItem('tiag_academic_dates', JSON.stringify(payload));

    this.apiService.put<any>('admin/academic-dates', payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res?.data?.updatedAt) {
          this.lastUpdatedAt = res.data.updatedAt;
        }
        this.triggerToast(res?.message || 'Academic dates updated successfully!', false);
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error updating academic dates:', err);
        this.triggerToast('Academic dates saved locally!', false);
      }
    });
  }

  private triggerToast(msg: string, isError: boolean = false): void {
    this.toastMessage = msg;
    this.isErrorToast = isError;
    this.showSuccessToast = true;
    setTimeout(() => {
      this.showSuccessToast = false;
    }, 4000);
  }
}
