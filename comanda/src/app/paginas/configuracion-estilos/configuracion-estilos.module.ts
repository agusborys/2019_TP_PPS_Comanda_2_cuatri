import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ConfiguracionEstilosPage } from './configuracion-estilos.page';

const routes: Routes = [
  {
    path: '',
    component: ConfiguracionEstilosPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ConfiguracionEstilosPage]
})
export class ConfiguracionEstilosPageModule {}
