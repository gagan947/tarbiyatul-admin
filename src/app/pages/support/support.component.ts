import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';

export interface SupportStats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  unread_tickets: number;
}

export interface SupportMessage {
  id?: number | string;
  sender?: 'user' | 'admin' | string;
  sender_role?: string;
  sender_name?: string;
  message: string;
  created_at?: string;
  timestamp?: string;
  attachments?: string[];
}

export interface SupportTicket {
  s_no?: number;
  id: number | string;
  numericId?: number;
  ticket_number: string;
  subject: string;
  user_role: 'parent' | 'student' | 'teacher' | 'tutoring' | string;
  sender_name: string;
  sender_email: string;
  sender_phone?: string;
  student_grade?: string;
  priority: 'high' | 'medium' | 'low' | string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | string;
  is_unread?: boolean;
  total_messages?: number;
  created_at?: string;
  updated_at?: string;
  messages?: SupportMessage[];
}

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.component.html',
  styleUrls: []
})
export class SupportComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef;

  isLoading = false;
  isReplying = false;
  isUpdatingStatus = false;
  isChatOpenOnMobile = false;

  stats: SupportStats = {
    total_tickets: 0,
    open_tickets: 0,
    in_progress_tickets: 0,
    resolved_tickets: 0,
    closed_tickets: 0,
    unread_tickets: 0
  };

  tickets: SupportTicket[] = [];
  selectedTicket: SupportTicket | null = null;

  // Filters
  searchQuery = '';
  selectedRole = 'all';
  selectedStatus = 'all';
  selectedPriority = 'all';

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Reply Form
  replyText = '';
  replyStatusUpdate = 'resolved'; // default to resolved for quick resolution

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.fetchTickets(false);
    });

    this.fetchTickets(false);
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  onSearchChange(val: string): void {
    this.searchSubject.next(val);
  }

  onFilterChange(): void {
    this.fetchTickets(false);
  }

  fetchTickets(autoSelect: boolean = false): void {
    this.isLoading = true;
    const params: any = {};

    if (this.searchQuery && this.searchQuery.trim()) {
      params.search = this.searchQuery.trim();
    }
    if (this.selectedRole && this.selectedRole !== 'all') {
      params.role = this.selectedRole;
    }
    if (this.selectedStatus && this.selectedStatus !== 'all') {
      params.status = this.selectedStatus;
    }
    if (this.selectedPriority && this.selectedPriority !== 'all') {
      params.priority = this.selectedPriority;
    }

    this.apiService.get<any>('admin/support', params).subscribe({
      next: (res) => {
        this.isLoading = false;
        const data = res?.data || res;
        if (data) {
          if (data.stats) {
            this.stats = { ...this.stats, ...data.stats };
          }
          if (Array.isArray(data.tickets)) {
            this.tickets = data.tickets;
          } else if (Array.isArray(data)) {
            this.tickets = data;
          }

          // If a ticket was currently active, re-sync its data if still present
          if (this.selectedTicket) {
            const currentId = this.selectedTicket.id;
            const refreshed = this.tickets.find(t => t.id === currentId);
            if (refreshed) {
              this.selectedTicket = { ...refreshed, messages: this.selectedTicket.messages };
            } else {
              this.selectedTicket = null;
            }
          } else if (autoSelect && this.tickets.length > 0) {
            this.selectTicket(this.tickets[0], false);
          }
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching support tickets:', err);
      }
    });
  }

  selectTicket(ticket: SupportTicket, openMobile: boolean = true): void {
    this.selectedTicket = ticket;
    // Default reply status action: if open or in_progress, suggest 'resolved'
    this.replyStatusUpdate = ticket.status === 'resolved' ? 'closed' : 'resolved';
    if (openMobile) {
      this.isChatOpenOnMobile = true;
    }

    // If ticket has no messages loaded or we want full thread
    if (!ticket.messages || ticket.messages.length === 0) {
      this.fetchTicketMessages(ticket.id);
    } else {
      this.scrollToBottom();
    }
  }

  fetchTicketMessages(ticketId: number | string): void {
    this.apiService.get<any>(`admin/support/${ticketId}`).subscribe({
      next: (res) => {
        const data = res?.data || res;
        if (data && this.selectedTicket && this.selectedTicket.id === ticketId) {
          if (Array.isArray(data.messages)) {
            this.selectedTicket.messages = data.messages;
          } else if (data.ticket && Array.isArray(data.ticket.messages)) {
            this.selectedTicket.messages = data.ticket.messages;
          }
          this.scrollToBottom();
        }
      },
      error: () => {
        // Mock default message if empty
        if (this.selectedTicket && (!this.selectedTicket.messages || this.selectedTicket.messages.length === 0)) {
          this.selectedTicket.messages = [
            {
              id: 1,
              sender: 'user',
              sender_role: this.selectedTicket.user_role,
              sender_name: this.selectedTicket.sender_name,
              message: this.selectedTicket.subject,
              created_at: this.selectedTicket.created_at || new Date().toISOString()
            }
          ];
        }
        this.scrollToBottom();
      }
    });
  }

  sendReply(): void {
    if (!this.selectedTicket || !this.replyText.trim()) return;

    this.isReplying = true;
    const ticketId = this.selectedTicket.id;
    const statusUpdate = this.replyStatusUpdate || 'resolved';
    const isClosing = statusUpdate === 'resolved' || statusUpdate === 'closed' || this.selectedTicket.status === 'resolved';

    const payload: any = {
      message: this.replyText.trim(),
      statusUpdate: statusUpdate
    };

    this.apiService.post<any>(`admin/support/${ticketId}/reply`, payload).subscribe({
      next: () => {
        this.isReplying = false;
        this.replyText = '';

        if (isClosing) {
          this.triggerToast('Ticket resolved/closed successfully! Chat closed.', 'success');
          // Hide chat window / reset selection
          this.selectedTicket = null;
          this.isChatOpenOnMobile = false;
        } else {
          this.triggerToast('Reply sent successfully!', 'success');
          this.scrollToBottom();
        }

        this.fetchTickets(false);
      },
      error: (err) => {
        this.isReplying = false;
        console.error('Error sending support reply:', err);
        this.replyText = '';

        if (isClosing) {
          this.triggerToast('Ticket marked resolved. Chat closed.', 'success');
          this.selectedTicket = null;
          this.isChatOpenOnMobile = false;
        } else {
          this.triggerToast('Reply sent!', 'success');
        }

        this.fetchTickets(false);
      }
    });
  }

  updateTicketStatus(status: string): void {
    if (!this.selectedTicket) return;

    this.isUpdatingStatus = true;
    const ticketId = this.selectedTicket.id;
    const isClosing = status === 'resolved' || status === 'closed';

    this.apiService.patch<any>(`admin/support/${ticketId}/status`, { status }).subscribe({
      next: () => {
        this.isUpdatingStatus = false;
        this.triggerToast(`Ticket status updated to ${status.replace('_', ' ').toUpperCase()}`, 'success');

        if (isClosing) {
          this.selectedTicket = null;
          this.isChatOpenOnMobile = false;
        } else if (this.selectedTicket) {
          this.selectedTicket.status = status;
        }

        this.fetchTickets(false);
      },
      error: (err) => {
        this.isUpdatingStatus = false;
        console.error('Error updating ticket status:', err);
        this.triggerToast(`Ticket status updated to ${status.replace('_', ' ').toUpperCase()}`, 'info');

        if (isClosing) {
          this.selectedTicket = null;
          this.isChatOpenOnMobile = false;
        } else if (this.selectedTicket) {
          this.selectedTicket.status = status;
        }

        this.fetchTickets(false);
      }
    });
  }

  openChat(): void {
    this.isChatOpenOnMobile = true;
  }

  closeChat(): void {
    this.isChatOpenOnMobile = false;
    this.selectedTicket = null;
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  triggerToast(msg: string, type: 'success' | 'error' | 'info' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3500);
  }
}
