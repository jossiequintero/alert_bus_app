import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController, IonicModule, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

import { Bus, BusRoute } from '../../../../models/bus.model';
import { BusService } from '../../../../services/bus.service';

@Component({
  standalone: true,
  selector: 'app-add-bus',
  templateUrl: './add-bus.component.html',
  styleUrls: ['./add-bus.component.scss'],
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class AddBusComponent implements OnInit {
  @Input() routes: BusRoute[] = [];
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() busToEdit?: Bus;

  busForm: FormGroup;
  isSaving = false;

  private currentUser: any = JSON.parse(localStorage.getItem('currentUser') || '{}');

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder,
    private busService: BusService,
    private toastController: ToastController
  ) {
    this.busForm = this.fb.group({
      number: ['', Validators.required],
      routeId: ['', Validators.required],
      capacity: [50, [Validators.required, Validators.min(1)]],
      placa: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    if (this.mode === 'edit' && this.busToEdit) {
      this.busForm.patchValue({
        number: this.busToEdit.number,
        routeId: this.busToEdit.routeId,
        capacity: this.busToEdit.capacity,
        placa: this.busToEdit.placa || ''
      });
    }
  }

  get title(): string {
    return this.mode === 'edit' ? 'Editar Autobús' : 'Agregar Autobús';
  }

  get primaryButtonLabel(): string {
    return this.mode === 'edit' ? 'Actualizar' : 'Guardar';
  }

  close() {
    this.modalCtrl.dismiss();
  }

  async save() {
    if (this.busForm.invalid || this.isSaving) {
      return;
    }

    this.isSaving = true;
    const formValue = this.busForm.value;

    try {
      if (this.mode === 'edit' && this.busToEdit) {
        await firstValueFrom(
          this.busService.updateBus(this.busToEdit.id, {
            number: formValue.number,
            routeId: formValue.routeId,
            capacity: formValue.capacity,
            placa: formValue.placa
          })
        );
        await this.showToast('Autobús actualizado exitosamente', 'success');
      } else {
        await firstValueFrom(
          this.busService.registerBus({
            number: formValue.number,
            driverId: this.currentUser?.id,
            routeId: formValue.routeId,
            currentLocation: { latitude: 0, longitude: 0 },
            isActive: false,
            capacity: formValue.capacity,
            placa: formValue.placa
          })
        );
        await this.showToast('Autobús registrado exitosamente', 'success');
      }

      this.modalCtrl.dismiss(true);
    } catch (error) {
      console.error('Error guardando autobús', error);
      await this.showToast('No se pudo guardar el autobús', 'danger');
    } finally {
      this.isSaving = false;
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
