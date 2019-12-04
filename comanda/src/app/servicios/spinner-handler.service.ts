import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class SpinnerHandlerService {

  constructor(private loadingCtrl:LoadingController) { }

  public async GetAllPageSpinner() {
    const loader = await this.loadingCtrl.create({
      spinner: null,
      keyboardClose: true,
      message: '<div class="spinner"><img src="assets/glamit/glamit2_sombrero_negro.png"></div> Cargando...',
      showBackdrop: false,
      duration:5000,
      cssClass: 'cajaSpinner'
    });

    return loader;
  }
}
