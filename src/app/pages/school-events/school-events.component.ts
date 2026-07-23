import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

export interface EventItem {
  id?: number | string;
  _id?: string;
  title: string;
  description: string;
  eventDate: string;
  eventTime: string;
  categories?: string[];
  grades?: string[];
  status?: string;
}

@Component({
  selector: 'app-school-events',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './school-events.component.html',
  styleUrls: []
})
export class SchoolEventsComponent implements OnInit {
  eventsList: EventItem[] = [];
  isLoading = false;
  errorMessage = '';

  // Preset card styles to preserve original visual theme design
  private colorThemes = [
    { border: '#730fff', headerBg: '#f7f0ff', dateBg: '#730fff24', dateColor: '#5400ad' },
    { border: '#0fbfff', headerBg: '#0fbfff17', dateBg: '#0fbfff24', dateColor: '#006c94' },
    { border: '#ffe30f', headerBg: '#ffe30f0f', dateBg: '#ffe30f24', dateColor: '#a89500' },
    { border: '#fa0064', headerBg: '#fef1f5', dateBg: '#fa006424', dateColor: '#9e003f' },
    { border: '#00ff11', headerBg: '#f0fff1', dateBg: '#00ff1124', dateColor: '#006106' },
    { border: '#0f37ff', headerBg: '#0f37ff14', dateBg: '#0f37ff24', dateColor: '#001999' },
    { border: '#ff830f', headerBg: '#fff7f0', dateBg: '#ff830f24', dateColor: '#bf5e03' },
    { border: '#ff0f0f', headerBg: '#ff0f0f0d', dateBg: '#ff0f0f24', dateColor: '#700000' }
  ];

  selectedDeleteId: string | number | null = null;
  isDeleting = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.fetchEvents();
  }

  fetchEvents(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.apiService.get<any>('admin/events').subscribe({
      next: (res) => {
        this.isLoading = false;
        // Handle array responses direct or nested under res.data.events / res.data
        if (Array.isArray(res)) {
          this.eventsList = res;
        } else if (res && res.data && Array.isArray(res.data.events)) {
          this.eventsList = res.data.events;
        } else if (res && Array.isArray(res.data)) {
          this.eventsList = res.data;
        } else if (res && Array.isArray(res.events)) {
          this.eventsList = res.events;
        } else {
          this.eventsList = [];
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching events:', err);
        this.errorMessage = 'Failed to load school events.';
      }
    });
  }

  setDeleteId(id: string | number | undefined): void {
    this.selectedDeleteId = id || null;
  }

  confirmDelete(): void {
    if (!this.selectedDeleteId) return;

    this.isDeleting = true;
    this.apiService.delete<any>(`admin/events/${this.selectedDeleteId}`).subscribe({
      next: (res) => {
        this.isDeleting = false;
        this.selectedDeleteId = null;
        this.fetchEvents();
      },
      error: (err) => {
        this.isDeleting = false;
        console.error('Error deleting event:', err);
        this.errorMessage = err.error?.message || 'Failed to delete event. Please try again.';
      }
    });
  }

  getTheme(index: number) {
    return this.colorThemes[index % this.colorThemes.length];
  }

  getDay(dateStr: string): string {
    if (!dateStr) return '01';
    const d = new Date(dateStr);
    return isNaN(d.getDate()) ? '01' : String(d.getDate()).padStart(2, '0');
  }

  getMonth(dateStr: string): string {
    if (!dateStr) return 'AUG';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'AUG';
    return d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours}:${minutes} ${ampm}`;
    }
    return timeStr;
  }
}

