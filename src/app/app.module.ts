import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { GoogleMapsModule } from '@angular/google-maps';
import { HttpClientModule } from '@angular/common/http';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireFunctionsModule } from '@angular/fire/compat/functions';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { PruebaComponent } from './prueba/prueba/prueba.component';
import { environment } from '../environments/environment';


@NgModule({
  declarations: [AppComponent, PruebaComponent],
  imports: [
    BrowserModule, 
    IonicModule.forRoot(), 
    AppRoutingModule,
    GoogleMapsModule,
    HttpClientModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireFunctionsModule
  ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
