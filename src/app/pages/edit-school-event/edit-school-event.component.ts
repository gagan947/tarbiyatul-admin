import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-school-event',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './edit-school-event.component.html',
  styleUrls: []
})
export class EditSchoolEventComponent {}
