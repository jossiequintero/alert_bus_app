import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-assign-driver',
  templateUrl: './assign-driver.component.html',
  styleUrls: ['./assign-driver.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class AssignDriverComponent {
  @Input() buses: any[] = [];
  @Input() drivers: any[] = [];

  selectedBusId = '';
  selectedDriverId = '';

  constructor(private modalCtrl: ModalController) {}

  close() {
    this.modalCtrl.dismiss();
  }

  assign() {
    this.modalCtrl.dismiss({
      busId: this.selectedBusId,
      driverId: this.selectedDriverId
    });
  }
}