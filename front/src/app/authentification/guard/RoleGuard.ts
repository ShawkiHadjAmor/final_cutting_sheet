import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const requiredRoles = route.data['roles'] as string[];
    const userRole = this.authService.getUserRole();
    const isAuthenticated = this.authService.isAuthenticated();

    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      this.router.navigate(['/authentification/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    if (!requiredRoles || requiredRoles.length === 0) {
      console.log('No specific roles required, allowing access');
      return true;
    }

    if (userRole && requiredRoles.includes(userRole)) {
      console.log(`User role ${userRole} matches required roles: ${requiredRoles}`);
      return true;
    }

    console.log(`User role ${userRole} does not match required roles: ${requiredRoles}, redirecting to dashboard`);
    this.router.navigate(['/dashboard']);
    return false;
  }
}