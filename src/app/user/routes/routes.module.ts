import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';

import { IonicModule } from '@ionic/angular';

import { RoutesPageRoutingModule } from './routes-routing.module';

import { RoutesPage } from './routes.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GoogleMapsModule,
    RoutesPageRoutingModule
  ],
  declarations: [RoutesPage]
})
export class RoutesPageModule {}
