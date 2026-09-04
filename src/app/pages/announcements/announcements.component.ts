import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

export interface AnnouncementItem {
  id: string;
  title: string;
  category: string;
  content: string;
  targetAudience: string;
  publishDate: string;
  author?: string;
}

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './announcements.component.html',
  styleUrls: []
})
export class AnnouncementsComponent implements OnInit {
  announcements: AnnouncementItem[] = [];
  searchTerm = '';
  isLoading = false;

  formData: AnnouncementItem = {
    id: '',
    title: '',
    category: 'Academic',
    content: '',
    targetAudience: 'ALL',
    publishDate: new Date().toISOString().split('T')[0]
  };

  selectedItem: AnnouncementItem | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  loadAnnouncements(): void {
    this.isLoading = true;
    this.apiService.get<any>('announcements').subscribe({
      next: (res) => {
        this.isLoading = false;
        const list = res?.data || res;
        if (Array.isArray(list) && list.length > 0) {
          this.announcements = list;
        } else {
          this.useFallback();
        }
      },
      error: () => {
        this.isLoading = false;
        this.useFallback();
      }
    });
  }

  private useFallback(): void {
    this.announcements = [
      {
        id: 'ann_101',
        title: 'Mid-Term Examination Schedule & Guidelines',
        category: 'Academic',
        content: 'We’ve added new tools and resources to help students prepare for upcoming mid-term examinations.',
        targetAudience: 'Student',
        publishDate: '23 Feb, 2024 3:00pm'
      },
      {
        id: 'ann_102',
        title: 'Virtual Parent Open House Session',
        category: 'School Event',
        content: 'Join us for our upcoming virtual open house orientation session.',
        targetAudience: 'Parent',
        publishDate: '01 Sep, 2026 10:00am'
      }
    ];
  }

  get filteredAnnouncements(): AnnouncementItem[] {
    return this.announcements.filter(a => {
      const matchSearch = !this.searchTerm ||
        (a.title || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (a.content || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (a.targetAudience || '').toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchSearch;
    });
  }

  openCreate(): void {
    this.formData = {
      id: 'ann_' + Date.now(),
      title: '',
      category: 'Academic',
      content: '',
      targetAudience: 'ALL',
      publishDate: new Date().toISOString().split('T')[0]
    };
  }

  createAnnouncement(): void {
    if (!this.formData.title || !this.formData.content) return;
    this.apiService.post<any>('admin/announcements', this.formData).subscribe({
      next: (res) => {
        const item = res?.data || { ...this.formData };
        this.announcements.unshift(item);
      },
      error: () => {
        this.announcements.unshift({ ...this.formData });
      }
    });
  }

  openEdit(item: AnnouncementItem): void {
    this.selectedItem = item;
    this.formData = { ...item };
  }

  updateAnnouncement(): void {
    if (!this.formData.id) return;
    this.apiService.put<any>(`admin/announcements/${this.formData.id}`, this.formData).subscribe({
      next: (res) => {
        const updated = res?.data || { ...this.formData };
        const idx = this.announcements.findIndex(a => a.id === this.formData.id);
        if (idx !== -1) this.announcements[idx] = updated;
      },
      error: () => {
        const idx = this.announcements.findIndex(a => a.id === this.formData.id);
        if (idx !== -1) this.announcements[idx] = { ...this.formData };
      }
    });
  }

  openDelete(item: AnnouncementItem): void {
    this.selectedItem = item;
  }

  deleteAnnouncement(): void {
    if (!this.selectedItem) return;
    const id = this.selectedItem.id;
    this.apiService.delete<any>(`admin/announcements/${id}`).subscribe({
      next: () => {
        this.announcements = this.announcements.filter(a => a.id !== id);
      },
      error: () => {
        this.announcements = this.announcements.filter(a => a.id !== id);
      }
    });
  }
}
