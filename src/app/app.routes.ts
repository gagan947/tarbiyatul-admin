import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { StudentEnrollmentComponent } from './pages/student-enrollment/student-enrollment.component';
import { StudentEnrollmentDetailComponent } from './pages/student-enrollment-detail/student-enrollment-detail.component';
import { TeacherEnrollmentComponent } from './pages/teacher-enrollment/teacher-enrollment.component';
import { TeacherEnrollmentDetailComponent } from './pages/teacher-enrollment-detail/teacher-enrollment-detail.component';
import { FeePaymentComponent } from './pages/fee-payment/fee-payment.component';
import { AnnouncementsComponent } from './pages/announcements/announcements.component';
import { SchoolEventsComponent } from './pages/school-events/school-events.component';
import { CreateSchoolEventComponent } from './pages/create-school-event/create-school-event.component';
import { EditSchoolEventComponent } from './pages/edit-school-event/edit-school-event.component';
import { SupportComponent } from './pages/support/support.component';
import { EditProfileComponent } from './pages/edit-profile/edit-profile.component';
import { ChangePasswordComponent } from './pages/change-password/change-password.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'student-enrollment', component: StudentEnrollmentComponent },
      { path: 'student-enrollment-detail', component: StudentEnrollmentDetailComponent },
      { path: 'teacher-enrollment', component: TeacherEnrollmentComponent },
      { path: 'teacher-enrollment-detail', component: TeacherEnrollmentDetailComponent },
      { path: 'fee-payment', component: FeePaymentComponent },
      { path: 'announcements', component: AnnouncementsComponent },
      { path: 'school-events', component: SchoolEventsComponent },
      { path: 'create-school-event', component: CreateSchoolEventComponent },
      { path: 'edit-school-event', component: EditSchoolEventComponent },
      { path: 'support', component: SupportComponent },
      { path: 'edit-profile', component: EditProfileComponent },
      { path: 'change-password', component: ChangePasswordComponent }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
