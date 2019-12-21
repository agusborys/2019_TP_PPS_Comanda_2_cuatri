import { Component, OnInit, Input } from '@angular/core';
import { EmpleadoKey } from 'src/app/clases/empleado';
import { AnonimoKey } from 'src/app/clases/anonimo';
import { ClienteKey } from 'src/app/clases/cliente';
import { ModalController } from '@ionic/angular';
import { AuthService } from 'src/app/servicios/auth.service';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
})
export class ConfiguracionPage {
  // tslint:disable: no-input-rename
  @Input('user') public user: ClienteKey | AnonimoKey | EmpleadoKey;
  @Input('type') public type: string;
  public misClases: any;
  constructor(
    private modalCtrl: ModalController,
    private authService: AuthService,
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
