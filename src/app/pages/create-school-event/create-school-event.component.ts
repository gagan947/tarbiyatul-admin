import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-school-event',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './create-school-event.component.html',
  styleUrls: []
})
export class CreateSchoolEventComponent {}
