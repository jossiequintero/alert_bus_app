import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';
import { Alert, AlertSettings } from '../../models/alert.model';
import { User } from '../../models/user.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.page.html',
  styleUrls: ['./alerts.page.scss'],
  standalone: false,
})
export class AlertsPage implements OnInit, OnDestroy {
  currentUser: User | null = null;
  alerts: Alert[] = [];
  alertSettings: AlertSettings = {
    userId: '',
    proximityRadius: 500,
    advanceTime: 5,
    isEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true
  };
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.loadAlerts();
    this.loadAlertSettings();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadAlerts() {
    if (!this.currentUser) return;

    const alertsSub = this.alertService.getAlertsForUser(this.currentUser.id).subscribe(alerts => {
      this.alerts = alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
    this.subscriptions.push(alertsSub);
  }

  private loadAlertSettings() {
    const settingsSub = this.alertService.alertSettings$.subscribe(settings => {
      if (settings) {
        this.alertSettings = settings;
      }
    });
    this.subscriptions.push(settingsSub);
  }

  updateAlertSettings() {
    this.alertService.updateAlertSettings(this.alertSettings);
    this.showToast('Configuración actualizada', 'success');
  }

  markAsRead(alertId: string) {
    this.alertService.markAlertAsRead(alertId);
    this.showToast('Alerta marcada como leída', 'success');
  }

  getAlertColor(alertType: string): string {
    switch (alertType) {
      case 'proximity':
        return 'warning';
      case 'arrival':
        return 'success';
      case 'delay':
        return 'danger';
      default:
        return 'primary';
    }
  }

  getAlertTypeText(alertType: string): string {
    switch (alertType) {
      case 'proximity':
        return 'Proximidad';
      case 'arrival':
        return 'Llegada';
      case 'delay':
        return 'Retraso';
      default:
        return 'General';
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
