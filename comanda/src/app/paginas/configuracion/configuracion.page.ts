import { Component, OnInit, Input } from '@angular/core';
import { EmpleadoKey } from 'src/app/clases/empleado';
import { AnonimoKey } from 'src/app/clases/anonimo';
import { ClienteKey } from 'src/app/clases/cliente';
import { ModalController } from '@ionic/angular';
import { AuthService } from 'src/app/servicios/auth.service';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
})
export class ConfiguracionPage {
  // tslint:disable: no-input-rename
  @Input('user') public user: ClienteKey | AnonimoKey | EmpleadoKey;
  @Input('type') public type: string;

  constructor(private modalCtrl: ModalController,private authService: AuthService,) { }

  public cerrar() {
    this.modalCtrl.dismiss();
  }
}
