import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  animations: [
    trigger('fadeInOut', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(-20px)'
      })),
      transition(':enter', [
        animate('0.5s ease-out', style({
          opacity: 1,
          transform: 'translateY(0)'
        }))
      ])
    ]),
    trigger('modalOverlayAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms', style({ opacity: 0 }))
      ])
    ]),
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.9)' }))
      ])
    ])
  ]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  titleText = "SAFRAN TUNISIE";
  displayText = "";
  currentIndex = 0;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService  
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    this.animateText();
  }

  animateText() {
    const interval = setInterval(() => {
      if (this.currentIndex >= this.titleText.length) {
        this.currentIndex = 0;
        this.displayText = "";
      }
      this.displayText += this.titleText[this.currentIndex];
      this.currentIndex++;
    }, 150);
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = null;
      const { email, password } = this.loginForm.value;
  
      this.authService.login(email, password).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          console.log('Login successful:', response);
          const role = response.role;
          // Redirect based on role
          let targetRoute = '/dashboard'; // Default route
          if (role === 'ENGINEER') {
            targetRoute = '/dashboard/cutting-sheet/view'; // Engineer sees Fiche de Coupe
          } else if (role === 'ORDO') {
            targetRoute = '/dashboard/launch-of';
          } else if (role === 'STOREKEEPER') {
            targetRoute = '/dashboard/store/list';
          } else if (role === 'CML') {
            targetRoute = '/dashboard/cml/view-list';
          }
  
          console.log('Navigating to:', targetRoute);
          this.router.navigateByUrl(targetRoute).then(success => {
            if (!success) {
              console.error('Navigation failed for route:', targetRoute);
              this.errorMessage = 'Navigation failed. Please try again.';
            } else {
              console.log('Navigation successful to:', targetRoute);
            }
          }).catch(err => {
            console.error('Navigation error:', err);
            this.errorMessage = 'Navigation error: ' + err.message;
          });
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = err.message || 'Login failed. Please try again.';
          console.error('Login error:', err);
        }
      });
    }
  } 
  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    if (control?.hasError('required')) {
      return field === 'email' ? 'Email is required' : 'Password is required';
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control?.hasError('minlength')) {
      return 'Password needs at least 6 characters';
    }
    return '';
  }
}