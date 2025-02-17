import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { Router } from '@angular/router';
import { ConfiguracionPage } from '../configuracion/configuracion.page';
import { ModalController, ToastController } from '@ionic/angular';
import { FCM } from '@ionic-native/fcm/ngx';
import { SpinnerHandlerService } from 'src/app/servicios/spinner-handler.service';
import { SonidosService } from '../../service/sonidos.service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
})
export class InicioPage implements OnInit  {

  private spinner: any = null;
  public foto: string;
  public estaActivo: any;
  constructor(
    private authService: AuthService,
    public router: Router,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private fcm: FCM,
    private spinnerHand:SpinnerHandlerService,
    private sonidos: SonidosService,
  ) {
      this.foto = "";

     }

  public cerrarSesion() {
    this.fcm.unsubscribeFromTopic('notificacionReservas');
    this.fcm.unsubscribeFromTopic('notificacionMesa');
    this.fcm.unsubscribeFromTopic('notificacionesPedidos');
    this.foto = "";
    this.authService.Logout();
  }

   async ionViewDidEnter() {//esta como asyncronico, no se va a subscribir hasta que no se llame buscarUsuario
    this.spinner = await this.spinnerHand.GetAllPageSpinner();
    this.spinner.present();
    await this.authService.buscarUsuario();
    this.subscribirse();
    this.foto = this.authService.user.foto;
    this.spinner.dismiss();
  }

   async ngOnInit() {
      await this.authService.buscarUsuario();
      this.subscribirse();
      this.foto = this.authService.user.foto;
      // console.log("este es el usuario:" +this.foto);
      this.estaActivo = this.sonidos.getActivo();
  }

  public subscribirse(){
    /* Esta funcion toma el tipo de usuario y con un switch dicta a que push notification se va a subscribir */
    this.fcm.unsubscribeFromTopic('notificacionReservas');
    this.fcm.unsubscribeFromTopic('notificacionMesa');
    this.fcm.unsubscribeFromTopic('notificacionesPedidos');

    let tipo = this.authService.tipoUser;
    switch (tipo) {
      case 'dueño':
        // console.log(tipo+" subscrito a reservas");
        this.fcm.subscribeToTopic('notificacionReservas');
        break;
      case 'supervisor':
        // console.log(tipo+" subscrito a reservas");
        this.fcm.subscribeToTopic('notificacionReservas');
        break;
      case 'mozo':
        // console.log(tipo+" subscrito a Mesas");
        this.fcm.subscribeToTopic('notificacionMesa');
        break;
      case 'cocinero':
        // console.log(tipo+" subscrito a Pedidos");
        this.fcm.subscribeToTopic('notificacionesPedidos');
        break;
      case 'candybar':
        // console.log(tipo+" subscrito a Pedidos");
        this.fcm.subscribeToTopic('notificacionesPedidos');
        break;
      case 'bartender':
        // console.log(tipo+" subscrito a Pedidos");
        this.fcm.subscribeToTopic('notificacionesPedidos');
        break;
      default:
        break;
    }
  }
  public configModal() {
    this.modalCtrl.create({
      component: ConfiguracionPage,
      componentProps: {
        user: this.authService.user,
        type: this.authService.tipoUser
      }
    }).then(modal => {
      modal.present();
    });
  }

  controlSonidos(evento) {
    this.sonidos.desactivarSonidos(evento.detail.checked);
  }
}
