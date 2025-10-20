import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  isLoginMode = true;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Verificar si ya está autenticado
    if (this.authService.isAuthenticated()) {
      this.redirectBasedOnRole();
    }
  }

  async onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { email, password, role } = this.loginForm.value;

      try {
        const user = await this.authService.login(email, password, role).toPromise();
        this.isLoading = false;
        
        await this.showToast(`¡Bienvenido ${user?.name || 'Usuario'}!`, 'success');
        this.redirectBasedOnRole();
      } catch (error) {
        this.isLoading = false;
        await this.showToast('Error al iniciar sesión', 'danger');
      }
    }
  }

  async onRegister() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { email, password, role } = this.loginForm.value;

      try {
        const user = await this.authService.register(email, password, email.split('@')[0], role).toPromise();
        this.isLoading = false;
        
        await this.showToast(`¡Cuenta creada exitosamente! Bienvenido ${user?.name || 'Usuario'}`, 'success');
        this.redirectBasedOnRole();
      } catch (error) {
        this.isLoading = false;
        await this.showToast('Error al crear la cuenta', 'danger');
      }
    }
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  private redirectBasedOnRole() {
    const user = this.authService.getCurrentUser();
    if (user) {
      if (user.role === 'pasajero') {
        this.router.navigate(['/user/dashboard']);
      } else if (user.role === 'chofer') {
        this.router.navigate(['/driver/dashboard']);
      } else if (user.role === 'admin') {
        this.router.navigate(['/admin/dashboard']);
      }
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
