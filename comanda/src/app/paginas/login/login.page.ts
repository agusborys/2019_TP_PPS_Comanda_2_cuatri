import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { Router } from '@angular/router';
import { Empleado } from '../../clases/empleado';
import { CajaSonido } from '../../clases/cajaSonido';
import { AngularFirestore, QuerySnapshot } from '@angular/fire/firestore';
import { ClienteKey, ClienteAConfirmarKey } from 'src/app/clases/cliente';
import { AlertController } from '@ionic/angular';
import { ErrorHandlerService } from 'src/app/servicios/error-handler.service';
import { SpinnerHandlerService } from 'src/app/servicios/spinner-handler.service';

import { FCM } from '@ionic-native/fcm/ngx';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  correo: string;
  clave: string;
  cajaSonido: CajaSonido = new CajaSonido();
  testRadioResult;
  usuarioSeleccionado: string;
  private spinner:any=null;
  constructor(
    private authService: AuthService,
    public router: Router,
    private firestore: AngularFirestore,
    private alertCtrl: AlertController,
    private errorHandler:ErrorHandlerService,
    private spinnerHand:SpinnerHandlerService) {
  }

  ngOnInit() {
    this.correo = '';
    this.clave = '';
  }

  public presentAlert(header: string, subHeader: string, message: string) {
    this.alertCtrl.create({
      header,
      subHeader,
      message,
      buttons: ['Aceptar']
    }).then(a => { a.present(); });
  }

  private traerUsuarioAConfirmar(correo: string): Promise<boolean | ClienteAConfirmarKey> {
    return this.firestore.collection('clientes-confirmar').ref.where('correo', '==', correo).get()
      .then((d: QuerySnapshot<any>) => {
        if (d.empty) {
          return false;
        } else {
          const auxReturn: ClienteAConfirmarKey = d.docs[0].data() as ClienteAConfirmarKey;
          auxReturn.key = d.docs[0].id;
          return auxReturn;
        }
      }).catch(err => {
        return false;
      });
  }

  async onSumitLogin() {
    if(this.ValidForm())
    {
      // Obtener Spiner
       this.spinner = await this.spinnerHand.GetAllPageSpinner();
       // Mostrar Spiner
       this.spinner.present();
      const user = await this.traerUsuarioAConfirmar(this.correo);
      if (user != false) {
        //this.presentAlert('¡Error!', 'Error en el inicio de sesión.', 'Usted no ha sido confrmado.');
        this.errorHandler.mostrarErrorSolo("Error!", "Usuario no confirmado");
        this.correo = '';
        this.clave = '';
      } else {
        this.authService.Login(this.correo, this.clave).then(async (res) => {
          this.router.navigate(['/inicio']);
          this.cajaSonido.ReproducirGuardar();
          this.correo = '';
          this.clave = '';
          this.spinner.dismiss();
        })
          .catch(err => {
            //this.presentAlert('¡Error!', '', 'Los datos son incorrectos o no existen.');
            this.spinner.dismiss();
            this.errorHandler.mostrarError(err,"Error al iniciar sesión");
          });
      }
    }
    
  }
  /*
    Valido campos vacíos del form
  */
  private ValidForm() {
    let auxReturn: boolean = false;
    if (this.correo && this.clave) {
      auxReturn = true;
    } else {
      // Mostrar Toast con mensaje
      this.errorHandler.mostrarErrorSolo("Error!","Debe completar todos los campos");
    }
    return auxReturn;
  }
  /*
    Seleccion de usuarios
  */
  ingresoAuto(tipo: string) {
    if (tipo === 'dueño') {
      this.correo = 'duenio@duenio.com';
      this.clave = '000000';
    } else if (tipo === 'supervisor') {
      this.correo = 'supervisor@supervisor.com';
      this.clave = '111111';
    } else if (tipo === 'mozo') {
      this.correo = 'mozo@mozo.com';
      this.clave = '222222';
    } else if (tipo === 'bartender') {
      this.correo = 'bartender@bartender.com';
      this.clave = '333333';
    } else if (tipo === 'candybar') {
      this.correo = 'candybar@candybar.com';
      this.clave = '444444';
    } else if (tipo === 'cocinero') {
      this.correo = 'cocinero@cocinero.com';
      this.clave = '555555';
    } else if (tipo === 'cliente') {
      this.correo = 'pepe@cliente.com';
      this.clave = '123456';
    } else if (tipo === 'anonimo') {
      this.correo = 'anonimo@anonimo.com';
      this.clave = '777777';
    }
    //this.onSumitLogin();
  }
  /*
    Alert para la seleccion de usuarios, contenido con radio buttons y al hacer click en OK completa
    los campos con el usuario seleccionado.
  */
  async abrirAlert()
  {
    const alert = await this.alertCtrl.create({
      cssClass: 'seleccionarAlert',
      header: 'Seleccionar usuario',
      inputs: [
        {
          type: 'radio',
          label: 'Dueño',
          value: 'dueño',
          checked: true
        },
        {
          type: 'radio',
          label: 'Supervisor',
          value: 'supervisor'
        },
        {
          type: 'radio',
          label: 'Mozo',
          value: 'mozo'
        },
        {
          type: 'radio',
          label: 'Bartender',
          value: 'bartender'
        },
        {
          type: 'radio',
          label: 'Candybar',
          value: 'candybar'
        },
        {
          type: 'radio',
          label: 'Cocinero',
          value: 'cocinero'
        },
        {
          type: 'radio',
          label: 'Cliente',
          value: 'cliente'
        },
        {
          type: 'radio',
          label: 'Anónimo',
          value: 'anonimo'
        }
      ],
      buttons:[
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass:'alertButton',
          handler: () => {
            console.log('Confirm Cancel');
          }
        }, {
          text: 'Ok',
          cssClass:'alertButton',
          handler: (data) => {
            console.log('Confirm Ok');
            this.testRadioResult = data;
            this.usuarioSeleccionado = data;
            this.ingresoAuto(this.usuarioSeleccionado);
          }
        }
      ]
    });
    await alert.present();
  }

}
