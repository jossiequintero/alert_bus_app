import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

import { Bus } from '../../../../models/bus.model';
import { User } from '../../../../models/user.model';
import { BusService } from '../../../../services/bus.service';

@Component({
  selector: 'app-assign-driver',
  templateUrl: './assign-driver.component.html',
  styleUrls: ['./assign-driver.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class AssignDriverComponent {
  @Input() buses: Bus[] = [];
  @Input() drivers: User[] = [];

  selectedBusId = '';
  selectedDriverId = '';
  isSubmitting = false;

  constructor(
    private modalCtrl: ModalController,
    private busService: BusService,
    private toastController: ToastController
  ) {}

  close() {
    this.modalCtrl.dismiss();
  }

  async assign() {
    if (!this.selectedBusId || !this.selectedDriverId || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    try {
      await firstValueFrom(
        this.busService.assignDriver(this.selectedBusId, this.selectedDriverId)
      );
      await this.showToast('Conductor asignado correctamente', 'success');
      this.modalCtrl.dismiss({ refresh: true });
    } catch (error) {
      console.error('Error asignando conductor', error);
      await this.showToast('No se pudo asignar el conductor', 'danger');
    } finally {
      this.isSubmitting = false;
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
