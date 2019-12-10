import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { Router } from '@angular/router';
import { ConfiguracionPage } from '../configuracion/configuracion.page';
import { ModalController, ToastController } from '@ionic/angular';
import { FCM } from '@ionic-native/fcm/ngx';
import { SpinnerHandlerService } from 'src/app/servicios/spinner-handler.service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
})
export class InicioPage {

  private spinner:any=null;
  public foto:string;
  constructor(
    private authService: AuthService,
    public router: Router,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private fcm: FCM,
    private spinnerHand:SpinnerHandlerService) { 
      this.foto = "";
      
     }

  public cerrarSesion() {
    this.authService.Logout();
    this.fcm.unsubscribeFromTopic('notificacionReservas');
    this.fcm.unsubscribeFromTopic('notificacionMesa');
    this.fcm.unsubscribeFromTopic('notificacionesPedidos');
    this.foto = "";
  }

   async ionViewDidEnter() {//esta como asyncronico, no se va a subscribir hasta que no se llame buscarUsuario
    await this.authService.buscarUsuario();
    this.subscribirse();
    this.foto = this.authService.user.foto;
  } 
  
/*   async ngOnInit() {
         await this.authService.buscarUsuario();
         this.subscribirse(); 
         this.foto = this.authService.user.foto; 
         console.log("este es el usuario:" +this.foto);
  } */

  public subscribirse(){
    /* Esta funcion toma el tipo de usuario y con un switch dicta a que push notification se va a subscribir */
    let tipo = this.authService.tipoUser;
    switch (tipo) {
      case 'dueño':
        console.log("subscrito a reservas");
        this.fcm.subscribeToTopic('notificacionReservas');
        break;
      case 'supervisor':
        console.log("subscrito a reservas");
        this.fcm.subscribeToTopic('notificacionReservas');
        break;
      case 'mozo':
        console.log("subscrito a Mesas");
        this.fcm.subscribeToTopic('notificacionMesa');
        break;
      case 'cocinero':
        console.log(tipo+" cocinero subscrito a Pedidos");
        this.fcm.subscribeToTopic('notificacionesPedidos');
        break;
      case 'candybar':
        console.log(tipo+" subscrito a Pedidos");
        this.fcm.subscribeToTopic('notificacionesPedidos');
        break;
      case 'bartender':
        console.log(tipo+" subscrito a Pedidos");
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
}
