import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { Router } from '@angular/router';
import { ConfiguracionPage } from '../configuracion/configuracion.page';
import { ModalController } from '@ionic/angular';
import { SpinnerHandlerService } from 'src/app/servicios/spinner-handler.service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
})
export class InicioPage implements OnInit {

  private spinner:any=null;
  constructor(
    private authService: AuthService,
    public router: Router,
    private modalCtrl: ModalController,
    private spinnerHand:SpinnerHandlerService) { }

  public cerrarSesion() {
    this.authService.Logout();
  }

  async ngOnInit() { 
    
  }
  async ionViewDidEnter(){
    if(this.authService.tipoUser =='')
    {
      this.spinner = await this.spinnerHand.GetAllPageSpinner();
    this.spinner.present();
    }
    
    if(this.authService.tipoUser!='')
    {
      this.spinner.dismiss();
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
