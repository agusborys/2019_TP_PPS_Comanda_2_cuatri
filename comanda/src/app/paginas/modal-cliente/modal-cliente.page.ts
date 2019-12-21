import { Component, OnInit, Input } from '@angular/core';
import { ClienteKey } from 'src/app/clases/cliente';
import { ModalController } from '@ionic/angular';
import { AnonimoKey } from 'src/app/clases/anonimo';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-modal-cliente',
  templateUrl: './modal-cliente.page.html',
  styleUrls: ['./modal-cliente.page.scss'],
})
export class ModalClientePage {
  // tslint:disable: no-input-rename
  @Input('cliente') public cliente: ClienteKey | AnonimoKey;
  @Input('registrado') public registrado: string;
  public misClases: any;

  constructor(
    private modalCtrl: ModalController,
    private storage: Storage,
  ) { }

  ionViewDidEnter() {
     this.misClases = new Array();
     this.storage.get('mis-clases').then(misClases => {
       misClases.forEach( clase => {
         this.misClases.push(clase);
       });
     });
  }

  public cerrar() {
    this.modalCtrl.dismiss();
  }
}
