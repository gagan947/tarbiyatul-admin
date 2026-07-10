import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('admin_token');

  if (token) {
    return true;
  }

  // User is not authenticated, redirect to login page
  router.navigate(['/login']);
  return false;
};
