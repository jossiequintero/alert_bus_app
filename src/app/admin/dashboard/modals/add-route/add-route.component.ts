import { Component } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-route',
  templateUrl: './add-route.component.html',
  styleUrls: ['./add-route.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class AddRouteComponent {
  routeForm: FormGroup;
  stops: any[] = [];

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder
  ) {
    this.routeForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  addStop() {
    this.stops.push({ name: 'Nueva parada', latitude: 0, longitude: 0 });
  }

  removeStop(i: number) {
    this.stops.splice(i, 1);
  }

  close() {
    this.modalCtrl.dismiss();
  }

  save() {
    const data = {
      ...this.routeForm.value,
      stops: this.stops,
      isActive: true
    };
    this.modalCtrl.dismiss(data);
  }
}