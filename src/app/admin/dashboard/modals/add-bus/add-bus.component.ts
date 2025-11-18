import { Component, Input, OnInit } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
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
    private busService: BusService
  ) {
    this.busForm = this.fb.group({
      number: ['', Validators.required],
      routeId: ['', Validators.required],
      capacity: [50, Validators.required]
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
      currentPassengers: 0
    }).toPromise();

    this.modalCtrl.dismiss(true);
  }
}