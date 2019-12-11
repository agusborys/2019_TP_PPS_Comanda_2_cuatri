import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ModalRealizarPedidoPage } from './modal-realizar-pedido.page';

const routes: Routes = [
  {
    path: '',
    component: ModalRealizarPedidoPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ModalRealizarPedidoPage]
})
export class ModalRealizarPedidoPageModule {}
