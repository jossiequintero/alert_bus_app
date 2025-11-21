import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { BusRoute } from '../../../../models/bus.model';
import { BusService } from '../../../../services/bus.service';

interface StopForm {
  id: string;
  nombre: string;
  descripcion: string;
  latitud: number;
  longitud: number;
  order: number;
}

@Component({
  standalone: true,
  selector: 'app-add-route',
  templateUrl: './add-route.component.html',
  styleUrls: ['./add-route.component.scss'],
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule],
})
export class AddRouteComponent implements OnInit {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() routeToEdit?: BusRoute;

  routeForm: FormGroup;
  stops: StopForm[] = [];
  stop: StopForm = this.getEmptyStop();
  isSaving = false;

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder,
    private busService: BusService,
    private toastController: ToastController
  ) {
    this.routeForm = this.fb.group({
      name: ['', Validators.required],
      descripcion: ['', Validators.required],
      tiempoRecorrido: [0, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    if (this.mode === 'edit' && this.routeToEdit) {
      this.routeForm.patchValue({
        name: this.routeToEdit.name,
        descripcion: this.routeToEdit.description,
        tiempoRecorrido: this.routeToEdit.estimatedDuration
      });

      this.stops = this.routeToEdit.stops.map((stop, index) => ({
        id: stop.id,
        nombre: stop.name,
        descripcion: stop.description,
        latitud: stop.location.latitude,
        longitud: stop.location.longitude,
        order: stop.order ?? index + 1
      }));
    }
  }

  get title(): string {
    return this.mode === 'edit' ? 'Editar Ruta' : 'Nueva Ruta';
  }

  get primaryButtonLabel(): string {
    return this.mode === 'edit' ? 'Actualizar Ruta' : 'Guardar Ruta';
  }

  addStop() {
    const hasName = !!this.stop.nombre?.trim();
    const hasLat = this.stop.latitud !== null && this.stop.latitud !== undefined;
    const hasLng = this.stop.longitud !== null && this.stop.longitud !== undefined;

    if (!hasName || !hasLat || !hasLng) {
      return;
    }

    const newStop: StopForm = {
      ...this.stop,
      latitud: Number(this.stop.latitud),
      longitud: Number(this.stop.longitud),
      id: this.stop.id || uuid(),
      order: this.stop.order ? Number(this.stop.order) : this.stops.length + 1
    };

    this.stops = [...this.stops, newStop];
    this.stop = this.getEmptyStop();
  }

  removeStop(index: number) {
    this.stops = this.stops.filter((_, i) => i !== index);
  }

  close() {
    this.modalCtrl.dismiss();
  }

  async save() {
    if (this.routeForm.invalid || this.isSaving) {
      return;
    }

    this.isSaving = true;
    const formValue = this.routeForm.value;
    const tiempoRecorrido = Number(formValue.tiempoRecorrido);
    const stopsPayload = this.stops.map((stop, index) => ({
      id: stop.id || uuid(),
      nombre: stop.nombre,
      descripcion: stop.descripcion,
      latitud: stop.latitud,
      longitud: stop.longitud,
      order: stop.order || index + 1
    }));

    try {
      if (this.mode === 'edit' && this.routeToEdit) {
        await firstValueFrom(
          this.busService.updateRoute(this.routeToEdit.id, {
            name: formValue.name,
            description: formValue.descripcion,
            estimatedDuration: tiempoRecorrido,
            isActive: true,
            stops: stopsPayload
          })
        );
        await this.showToast('Ruta actualizada correctamente', 'success');
      } else {
        await firstValueFrom(
          this.busService.addRoute({
            name: formValue.name,
            descripcion: formValue.descripcion,
            tiempoRecorrido,
            stops: stopsPayload,
            isActive: true
          })
        );
        await this.showToast('Ruta creada correctamente', 'success');
      }

      this.modalCtrl.dismiss(true);
    } catch (error) {
      console.error('Error guardando ruta', error);
      await this.showToast('No se pudo guardar la ruta', 'danger');
    } finally {
      this.isSaving = false;
    }
  }

  private getEmptyStop(): StopForm {
    return {
      id: uuid(),
      nombre: '',
      descripcion: '',
      latitud: 0,
      longitud: 0,
      order: this.stops.length + 1
    };
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
