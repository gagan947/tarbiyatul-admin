import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './support.component.html',
  styleUrls: []
})
export class SupportComponent {
  isChatOpenOnMobile = false;

  openChat() {
    this.isChatOpenOnMobile = true;
  }

  closeChat() {
    this.isChatOpenOnMobile = false;
  }
}
