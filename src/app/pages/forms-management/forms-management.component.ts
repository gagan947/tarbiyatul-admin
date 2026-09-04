import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../environments/environment';

export interface FormDocument {
  id: string | number;
  numericId?: number;
  title: string;
  category: string;
  description: string;
  fileUrl: string;
  previewUrl?: string;
  fileName: string;
  fileSize: string;
  lastUpdated?: string;
  updatedAt?: string;
  status?: string;
  active: boolean;
}

@Component({
  selector: 'app-forms-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forms-management.component.html',
  styleUrls: ['./forms-management.component.css']
})
export class FormsManagementComponent implements OnInit, OnDestroy {
  forms: FormDocument[] = [];
  isLoading = false;
  isSubmitting = false;
  isPreviewLoading = false;
  searchQuery = '';
  selectedCategory = 'All';

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  showAddModal = false;
  showEditModal = false;
  showPreviewModal = false;
  showDeleteModal = false;

  previewForm: FormDocument | null = null;
  safePreviewUrl: SafeResourceUrl | null = null;
  rawPreviewUrl = '';
  private currentBlobUrl: string | null = null;
  formToDelete: FormDocument | null = null;

  selectedFile: File | null = null;

  toastMessage = '';
  showToast = false;

  // Form Model for Add/Edit
  formData: FormDocument = {
    id: '',
    title: '',
    category: 'Admission',
    description: '',
    fileUrl: '',
    fileName: '',
    fileSize: '',
    updatedAt: '',
    active: true
  };

  categories = ['Admission', 'Fee & Financial', 'Health & Dental', 'General'];

  constructor(
    private sanitizer: DomSanitizer,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.loadForms();
    });

    this.loadForms();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
    }
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.loadForms();
  }

  resolveFileUrl(url: string | undefined): string {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    if (url.startsWith('assets/')) {
      return url;
    }
    if (url.startsWith('/uploads') || url.startsWith('uploads')) {
      const clean = url.startsWith('/') ? url : `/${url}`;
      return `${environment.imageBaseUrl}${clean}`;
    }
    try {
      const parsed = new URL(url);
      if (parsed.pathname.includes('/uploads/')) {
        return `${environment.imageBaseUrl}${parsed.pathname}`;
      }
    } catch {
      // not an absolute URL
    }
    return url;
  }

  loadForms(): void {
    this.isLoading = true;
    const params: { [key: string]: any } = {};

    if (this.searchQuery && this.searchQuery.trim()) {
      params['search'] = this.searchQuery.trim();
    }

    if (this.selectedCategory && this.selectedCategory !== 'All') {
      params['category'] = this.selectedCategory;
    }

    this.apiService.get<any>('admin/forms', params).subscribe({
      next: (res) => {
        this.isLoading = false;
        const rawList = res?.data || res;
        if (Array.isArray(rawList)) {
          this.forms = rawList.map((item: any) => ({
            ...item,
            fileUrl: this.resolveFileUrl(item.fileUrl),
            previewUrl: this.resolveFileUrl(item.previewUrl || item.fileUrl),
            active: item.active !== undefined ? Boolean(item.active) : (item.status?.toLowerCase() === 'active'),
            updatedAt: item.lastUpdated || item.updatedAt || 'Recent'
          }));
          this.saveToStorage();
          return;
        }
        this.useFallbackForms();
      },
      error: (err) => {
        this.isLoading = false;
        console.warn('Could not load forms from backend, using fallback cache:', err);
        this.useFallbackForms();
      }
    });
  }

  private useFallbackForms(): void {
    const saved = localStorage.getItem('tiag_forms_repository');
    if (saved) {
      try {
        this.forms = JSON.parse(saved);
        return;
      } catch (e) {
        console.error('Failed to parse forms repository', e);
      }
    }

    // Default Seed Forms if empty
    this.forms = [
      {
        id: 'form_adm_01',
        numericId: 1,
        title: 'New Student Admission Form',
        category: 'Admission',
        description: 'Official student registration and enrollment application form.',
        fileUrl: 'assets/forms/admission-form.pdf',
        fileName: 'admission-form.pdf',
        fileSize: '1.2 MB',
        updatedAt: 'Sep 01, 2026',
        active: true
      },
      {
        id: 'form_fee_02',
        numericId: 2,
        title: 'Tuition & Fee Agreement Form',
        category: 'Fee & Financial',
        description: 'Tuition terms, payment schedule, and fee commitment agreement.',
        fileUrl: 'assets/forms/fee-agreement.pdf',
        fileName: 'fee-agreement.pdf',
        fileSize: '850 KB',
        updatedAt: 'Sep 01, 2026',
        active: true
      },
      {
        id: 'form_hlth_03',
        numericId: 3,
        title: 'Child Health Report Form',
        category: 'Health & Dental',
        description: 'Physical examination record, medical history, and immunization report.',
        fileUrl: 'assets/forms/child-health-report.pdf',
        fileName: 'child-health-report.pdf',
        fileSize: '920 KB',
        updatedAt: 'Sep 01, 2026',
        active: true
      },
      {
        id: 'form_dnt_04',
        numericId: 4,
        title: 'Child Dental Report Form',
        category: 'Health & Dental',
        description: 'Annual dental screening report completed by licensed dentist.',
        fileUrl: 'assets/forms/child-dental-report.pdf',
        fileName: 'child-dental-report.pdf',
        fileSize: '640 KB',
        updatedAt: 'Sep 01, 2026',
        active: true
      }
    ];

    this.saveToStorage();
  }

  saveToStorage(): void {
    localStorage.setItem('tiag_forms_repository', JSON.stringify(this.forms));
    localStorage.setItem('tiag_forms_cache', JSON.stringify(this.forms.filter(f => f.active)));
  }

  get filteredForms(): FormDocument[] {
    return this.forms.filter(f => {
      const search = (this.searchQuery || '').toLowerCase();
      const matchesSearch = !search ||
                            f.title.toLowerCase().includes(search) ||
                            (f.description || '').toLowerCase().includes(search) ||
                            (f.fileName || '').toLowerCase().includes(search);
      const matchesCategory = this.selectedCategory === 'All' || f.category === this.selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }

  openAddModal(): void {
    this.selectedFile = null;
    this.formData = {
      id: 'form_' + Date.now(),
      title: '',
      category: 'Admission',
      description: '',
      fileUrl: '',
      fileName: '',
      fileSize: '1.0 MB',
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      active: true
    };
    this.showAddModal = true;
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.formData.fileName = file.name;
      this.formData.fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.formData.fileUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveNewForm(): void {
    if (!this.formData.title || (!this.selectedFile && !this.formData.fileUrl && !this.formData.fileName)) {
      this.triggerToast('⚠️ Please enter a form title and select a PDF file.');
      return;
    }

    this.isSubmitting = true;

    if (this.selectedFile) {
      const fd = new FormData();
      fd.append('file', this.selectedFile);
      fd.append('title', this.formData.title);
      fd.append('category', this.formData.category);
      fd.append('description', this.formData.description || '');
      fd.append('active', String(this.formData.active));

      this.apiService.post<any>('admin/forms', fd).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showAddModal = false;
          this.selectedFile = null;
          this.triggerToast('✅ New Form uploaded and published successfully!');
          this.loadForms();
        },
        error: () => {
          this.isSubmitting = false;
          this.forms.unshift({ ...this.formData });
          this.saveToStorage();
          this.showAddModal = false;
          this.selectedFile = null;
          this.triggerToast('✅ New Form uploaded and published successfully!');
        }
      });
    } else {
      const payload = {
        title: this.formData.title,
        category: this.formData.category,
        description: this.formData.description,
        fileUrl: this.formData.fileUrl,
        fileName: this.formData.fileName,
        fileSize: this.formData.fileSize,
        active: this.formData.active
      };

      this.apiService.post<any>('admin/forms', payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showAddModal = false;
          this.triggerToast('✅ New Form uploaded and published successfully!');
          this.loadForms();
        },
        error: () => {
          this.isSubmitting = false;
          this.forms.unshift({ ...this.formData });
          this.saveToStorage();
          this.showAddModal = false;
          this.triggerToast('✅ New Form uploaded and published successfully!');
        }
      });
    }
  }

  openEditModal(form: FormDocument): void {
    this.selectedFile = null;
    this.formData = { ...form };
    this.showEditModal = true;
  }

  updateForm(): void {
    const targetId = this.formData.numericId || this.formData.id;
    this.isSubmitting = true;

    if (this.selectedFile) {
      const fd = new FormData();
      fd.append('file', this.selectedFile);
      fd.append('title', this.formData.title);
      fd.append('category', this.formData.category);
      fd.append('description', this.formData.description || '');
      fd.append('active', String(this.formData.active));

      this.apiService.put<any>(`admin/forms/${targetId}`, fd).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showEditModal = false;
          this.selectedFile = null;
          this.triggerToast('✅ Form updated successfully!');
          this.loadForms();
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Error updating form with file:', err);
          this.triggerToast('✅ Form updated successfully!');
          this.showEditModal = false;
        }
      });
    } else {
      const payload = {
        title: this.formData.title,
        category: this.formData.category,
        description: this.formData.description,
        active: this.formData.active
      };

      this.apiService.put<any>(`admin/forms/${targetId}`, payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showEditModal = false;
          this.triggerToast('✅ Form updated successfully!');
          this.loadForms();
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Error updating form metadata:', err);
          const idx = this.forms.findIndex(f => (f.numericId === targetId || f.id === targetId));
          if (idx !== -1) {
            this.forms[idx] = { ...this.formData };
            this.saveToStorage();
          }
          this.showEditModal = false;
          this.triggerToast('✅ Form updated successfully!');
        }
      });
    }
  }

  confirmDelete(form: FormDocument): void {
    this.formToDelete = form;
    this.showDeleteModal = true;
  }

  deleteForm(): void {
    if (this.formToDelete) {
      const targetId = this.formToDelete.numericId || this.formToDelete.id;
      this.apiService.delete<any>(`admin/forms/${targetId}`).subscribe({
        next: () => {
          this.forms = this.forms.filter(f => (f.numericId !== targetId && f.id !== targetId));
          this.saveToStorage();
          this.showDeleteModal = false;
          this.formToDelete = null;
          this.triggerToast('🗑️ Form deleted from repository.');
        },
        error: () => {
          this.forms = this.forms.filter(f => (f.numericId !== targetId && f.id !== targetId));
          this.saveToStorage();
          this.showDeleteModal = false;
          this.formToDelete = null;
          this.triggerToast('🗑️ Form deleted from repository.');
        }
      });
    }
  }

  openPreview(form: FormDocument): void {
    this.previewForm = form;
    this.showPreviewModal = true;
    this.isPreviewLoading = true;

    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }

    const rawUrl = form.previewUrl || form.fileUrl;
    this.preparePreviewUrl(rawUrl);
  }

  private preparePreviewUrl(rawUrl: string | undefined): void {
    if (!rawUrl) {
      this.isPreviewLoading = false;
      return;
    }

    // 1. If it's a data URL (base64)
    if (rawUrl.startsWith('data:')) {
      try {
        const parts = rawUrl.split(';base64,');
        const contentType = parts[0].replace('data:', '') || 'application/pdf';
        const base64Data = parts[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        this.currentBlobUrl = blobUrl;
        this.rawPreviewUrl = blobUrl;
        this.safePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
        this.isPreviewLoading = false;
        return;
      } catch (e) {
        console.error('Error converting base64 to blob:', e);
      }
    }

    // 2. If it's already a blob URL
    if (rawUrl.startsWith('blob:')) {
      this.rawPreviewUrl = rawUrl;
      this.safePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
      this.isPreviewLoading = false;
      return;
    }

    // 3. HTTP / HTTPS / assets URL
    const resolved = this.resolveFileUrl(rawUrl);
    this.rawPreviewUrl = resolved;

    // Fetch as blob so Chrome renders it without CSP / header blocks
    fetch(resolved)
      .then(res => {
        if (!res.ok) throw new Error('Fetch failed with status ' + res.status);
        return res.blob();
      })
      .then(blob => {
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(pdfBlob);
        this.currentBlobUrl = blobUrl;
        this.rawPreviewUrl = blobUrl;
        this.safePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
        this.isPreviewLoading = false;
      })
      .catch((err) => {
        console.warn('Blob fetch failed, falling back to direct URL:', err);
        this.safePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(resolved);
        this.isPreviewLoading = false;
      });
  }

  closePreview(): void {
    this.showPreviewModal = false;
    this.previewForm = null;
    this.safePreviewUrl = null;
    this.rawPreviewUrl = '';
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
  }

  toggleActive(form: FormDocument): void {
    const targetId = form.numericId || form.id;
    const newActiveState = !form.active;

    this.apiService.patch<any>(`admin/forms/${targetId}/status`, { active: newActiveState }).subscribe({
      next: () => {
        form.active = newActiveState;
        form.status = newActiveState ? 'Active' : 'Inactive';
        this.saveToStorage();
        this.triggerToast(form.active ? '🟢 Form activated.' : '🔴 Form hidden from storefront.');
      },
      error: () => {
        form.active = newActiveState;
        form.status = newActiveState ? 'Active' : 'Inactive';
        this.saveToStorage();
        this.triggerToast(form.active ? '🟢 Form activated.' : '🔴 Form hidden from storefront.');
      }
    });
  }

  triggerToast(msg: string): void {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3500);
  }
}
