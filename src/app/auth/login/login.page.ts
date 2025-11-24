import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { PushNotificationService } from '../../services/push-notification.service';

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
    private loadingController: LoadingController,
    private pushNotificationService: PushNotificationService
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
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
      const { email, password } = this.loginForm.value;

      try {
        const user = await this.authService.login(email, password).toPromise();
        await this.showToast(`¡Bienvenido ${user?.nombre || 'Usuario'}!`, 'success');
        
        // Inicializar push notifications después del login exitoso
        // Solo para usuarios (rol_id = 1) y conductores (rol_id = 2)
        if (user && (user.roleId === 1 || user.roleId === 2)) {
          try {
            await this.pushNotificationService.initialize();
            console.log('Push notifications inicializadas después del login');
          } catch (pushError) {
            console.error('Error inicializando push notifications:', pushError);
            // No mostrar error al usuario, es un proceso en segundo plano
          }
        }
        
        this.isLoading = false;
        this.loginForm.reset();
        this.redirectBasedOnRole();
      } catch (error) {
        await this.showToast('Error al iniciar sesión', 'danger');
      }
      finally {
        this.isLoading = false;
        this.loginForm.reset();
      }
    }
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  private redirectBasedOnRole() {
    const user:any = this.authService.getCurrentUser();
    if (user) {
      if (user.roleId == 1) {
        this.router.navigate(['/user/dashboard']);
      } else if (user.roleId == 2) {
        this.router.navigate(['/driver/dashboard']);
      } else if (user.roleId == 3) {
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
