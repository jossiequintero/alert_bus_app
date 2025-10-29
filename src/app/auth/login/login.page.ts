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
      name: ['', Validators.required],
      lastname: ['', Validators.required],

      confirmPassword: [''],
      role: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
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
      const { email, password, role, name, lastname } = this.loginForm.value;
      /*
      const name = this.loginForm.get('name')?.value;
      const lastname = this.loginForm.get('lastname')?.value;
*/
      try {
        console.log(email, password, name, lastname, role);
        
        const user = await this.authService.register(email, password, name, lastname, role).toPromise();
        this.isLoading = false;
        
        await this.showToast(`¡Cuenta creada exitosamente! Bienvenido ${user?.name || 'Usuario'}`, 'success');
        this.redirectBasedOnRole();
      } catch (error) {
        this.isLoading = false;
        console.error('Error en registro:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al crear la cuenta';
        await this.showToast(errorMessage, 'danger');
      }
    }
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  private redirectBasedOnRole() {
    const user:any = this.authService.getCurrentUser();
    if (user) {
      if (user.role === 'pasajero') {
        this.router.navigate(['/user/dashboard']);
      } else if (user.role === 'conductor') {
        this.router.navigate(['/driver/dashboard']);
      } else if (user.role === 'admin') {
        this.router.navigate(['/admin/dashboard']);
      }
    }
  }

  /**
   * Validador personalizado para verificar que las contraseñas coincidan
   */
  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
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
