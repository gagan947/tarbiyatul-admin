import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HandbookService, Handbook } from '../../services/handbook.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-handbooks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './handbooks.component.html',
  styleUrl: './handbooks.component.css'
})
export class HandbooksComponent implements OnInit {
  handbooks: Handbook[] = [];
  isLoading = false;

  // Add Handbook Form Data
  newTitle = '';
  newGradeLevel = '';
  selectedFile: File | null = null;

  // UI States
  showConfirmModal = false;
  handbookToDelete: number | null = null;
  confirmTitle = '';
  confirmMessage = '';

  showToastMessage = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'info';
  gradeLevels: string[] = [
    'Kindergarten',
    '1st Grade',
    '2nd Grade',
    '3rd Grade',
    '4th Grade',
  ];
  constructor(private handbookService: HandbookService) { }

  ngOnInit(): void {
    this.loadHandbooks();
  }

  loadHandbooks(): void {
    this.isLoading = true;
    this.handbookService.getHandbooks().subscribe({
      next: (response) => {
        // Assuming response structure, maybe response.data or response directly
        this.handbooks = response.data || response || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching handbooks', err);
        this.isLoading = false;
        this.showToast('Failed to load handbooks', 'error');
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onAddHandbook(): void {
    if (!this.newTitle || !this.newGradeLevel || !this.selectedFile) {
      this.showToast('Please fill all fields and select a file.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('title', this.newTitle);
    formData.append('grade_level', this.newGradeLevel);
    formData.append('file', this.selectedFile);

    this.isLoading = true;
    this.handbookService.addHandbook(formData).subscribe({
      next: () => {
        this.showToast('Handbook added successfully', 'success');
        this.loadHandbooks();
        this.resetForm();
        // Hide modal
        const closeBtn = document.getElementById('closeAddHandbookModal');
        if (closeBtn) closeBtn.click();
      },
      error: (err) => {
        console.error('Error adding handbook', err);
        this.showToast('Failed to add handbook', 'error');
        this.isLoading = false;
      }
    });
  }

  resetForm(): void {
    this.newTitle = '';
    this.newGradeLevel = '';
    this.selectedFile = null;
  }

  confirmDelete(id: number): void {
    this.handbookToDelete = id;
    this.confirmTitle = 'Delete Handbook';
    this.confirmMessage = 'Are you sure you want to delete this handbook?';
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.handbookToDelete = null;
  }

  onDeleteConfirmed(): void {
    if (this.handbookToDelete) {
      this.isLoading = true;
      this.handbookService.deleteHandbook(this.handbookToDelete).subscribe({
        next: () => {
          this.showToast('Handbook deleted successfully', 'success');
          this.loadHandbooks();
          this.closeConfirmModal();
        },
        error: (err) => {
          console.error('Error deleting handbook', err);
          this.showToast('Failed to delete handbook', 'error');
          this.isLoading = false;
          this.closeConfirmModal();
        }
      });
    }
  }

  viewHandbook(filePath: string | undefined): void {
    if (filePath) {
      const url = environment.imageBaseUrl + (filePath.startsWith('/') ? '' : '/') + filePath;
      window.open(url, '_blank');
    } else {
      this.showToast('File path not found.', 'error');
    }
  }

  showToast(message: string, type: 'success' | 'error' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToastMessage = true;
    setTimeout(() => {
      this.showToastMessage = false;
    }, 3000);
  }
}
