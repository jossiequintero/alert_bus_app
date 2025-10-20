import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { PruebaComponent } from './prueba.component';

@NgModule({
  declarations: [PruebaComponent],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [PruebaComponent]
})
export class PruebaModule {}
