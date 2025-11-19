import { Component } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { v4 } from 'uuid';

@Component({
  standalone: true,
  selector: 'app-add-route',
  templateUrl: './add-route.component.html',
  styleUrls: ['./add-route.component.scss'],
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule],
})
export class AddRouteComponent {
  routeForm: FormGroup;
  stops: any[] = [];
  stop: any = {
    id: '',
    nombre: '',
    descripcion: '',
    latitud: 0,
    longitud: 0
  }
  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder
  ) {
    this.routeForm = this.fb.group({
      name: ['', Validators.required],
      descripcion: ['', Validators.required],
      tiempoRecorrido: ['', Validators.required]
    });
  }

  addStop() {
    
    console.log(this.stops);
    const newStop = {
      id: v4,
      ...this.stop};
    console.log(newStop);
    
    this.stops.push(newStop);
    this.stop = {
      id: '',
      nombre: '',
      descripcion: '',
      latitud: 0,
      longitud: 0,
    }
    console.log(newStop);
    
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
    console.log(data);
    
    this.modalCtrl.dismiss(data);
  }
}