import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  static knownErrors: any = [
    {
        code: 'auth/email-already-in-use',
        message: "El correo ya existe"
    },
    {
        code: 'auth/user-not-found',
        message: "El correo no se encuentra registrado"
    },
    {
        code: 'auth/wrong-password',
        message: "Contraseña Incorrecta"
    },
    {
        code: "auth/network-request-failed",
        message: "No hay conexión a internet"
    },
    {
        code: "auth/invalid-email",
        message: "Correo inválido"
    },
    {
        code: "auth/weak-password",
        message: "La contraseña debe tener mínimo 6 caracteres"
    }
];

  constructor(public alertCtrl: AlertController) { }

  public async mostrarError(error, title?, message?){
    console.log("ocurrio un error", error);
    var errorMessage = this.getErrorMessage(error);
    const alert = await this.alertCtrl.create({
        cssClass: 'avisoAlert',
        header:  title ? title:"Error!",
        message: message ? message + errorMessage : errorMessage,
        buttons: ['Ok']
    });
     alert.present();
  }
  public async mostrarErrorSolo(title, message?){
      console.log("ocurrio un error");
      const alert = await this.alertCtrl.create({
        cssClass: 'avisoAlert',
          header:  title ? title:"Error!",
          message: message,
          buttons: ['Ok']
      });
      alert.present();
  }
  public async mostrarErrorLiteral(error, title?) {
      const alert = await this.alertCtrl.create({
        cssClass: 'avisoAlert',
          header: title ? title : "Error!",
          message: error,
          //cssClass: 'error-alert',
          buttons: ['Ok']
      });
      await alert.present();
  }

  public async mostrarMensajeConfimación(mensaje, title?) {
      const alert = await this.alertCtrl.create({
        cssClass: 'avisoAlert',
          header: title,
          message: mensaje,
          //cssClass: 'confirm-alert',
          buttons: [
              {
                  text: 'No',
                  role: 'cancel',
                  handler: () => {
                      alert.dismiss(false);
                      return false;
                  }
              },
              {
                  text: 'Si',
                  handler: () => {
                      alert.dismiss(true);
                      return false;
                  }
              }
          ]
      }
      );
      return alert;
  }

  private getErrorMessage(error){
      var mensaje = "Error desconocido";
      for(var i=0; i< ErrorHandlerService.knownErrors.length; i++){
        if(error.code == ErrorHandlerService.knownErrors[i].code){
              mensaje = ErrorHandlerService.knownErrors[i].message;
              break;
        }     
      }
      return mensaje;
  }
}
