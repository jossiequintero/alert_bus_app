import { Component, Input, OnInit } from '@angular/core';
import { ModalController, IonicModule, ToastController } from '@ionic/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BusService } from '../../../../services/bus.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-add-bus',
  templateUrl: './add-bus.component.html',
  styleUrls: ['./add-bus.component.scss'],
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class AddBusComponent  {
 
  @Input() routes: any[] = [];

  busForm: FormGroup;
  currentUser: any = JSON.parse(localStorage.getItem('currentUser') || '{}');
   constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder,
    private busService: BusService,
    private toastController: ToastController
  ) {
    this.busForm = this.fb.group({
      number: ['', Validators.required],
      routeId: ['', Validators.required],
      capacity: [50, Validators.required],
      placa: ['', Validators.required],
    });
  }

  close() {
    this.modalCtrl.dismiss();
  }

  async save() {
    if (this.busForm.invalid) return;

    const data = this.busForm.value;

    await this.busService.registerBus({
      number: data.number,
      driverId: this.currentUser.id,
      routeId: data.routeId,
      currentLocation: { latitude: 0, longitude: 0 },
      isActive: false,
      capacity: data.capacity,
      placa: data.placa,
      currentPassengers: 0,
    }).toPromise();
 
    await this.showToast('Autobús registrado exitosamente', 'success');
    this.modalCtrl.dismiss(true);
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