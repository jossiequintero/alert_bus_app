import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { PruebaComponent } from './prueba/prueba/prueba.component';
const routes: Routes = [
  {
    path: 'auth/login',
    loadChildren: () => import('./auth/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'user/dashboard',
    loadChildren: () => import('./user/dashboard/dashboard.module').then( m => m.DashboardPageModule)
  },
  {
    path: 'user/routes',
    loadChildren: () => import('./user/routes/routes.module').then( m => m.RoutesPageModule)
  },
  {
    path: 'user/alerts',
    loadChildren: () => import('./user/alerts/alerts.module').then( m => m.AlertsPageModule)
  },
  {
    path: 'driver/dashboard',
    loadChildren: () => import('./driver/dashboard/dashboard.module').then( m => m.DashboardPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'prueba',
    component: PruebaComponent
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
