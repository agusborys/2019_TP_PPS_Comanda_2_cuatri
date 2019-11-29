import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { Cliente } from '../../clases/cliente';
import { Anonimo } from '../../clases/anonimo';
import { Herramientas } from '../../clases/herramientas';
import { CajaSonido } from '../../clases/cajaSonido';

import * as firebase from 'firebase';
import { Camera } from '@ionic-native/camera/ngx';
import { CameraOptions } from '@ionic-native/camera';
import { BarcodeScannerOptions, BarcodeScanResult, BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { AlertController } from '@ionic/angular';
import { ErrorHandlerService } from 'src/app/servicios/error-handler.service';

@Component({
  selector: 'app-registro-cliente',
  templateUrl: './registro-cliente.page.html',
  styleUrls: ['./registro-cliente.page.scss'],
})
export class RegistroClientePage implements OnInit {
  private firebase = firebase;
  private usuario: Cliente;
  private anonimo: Anonimo;

  private clave: string;
  private herramientas: Herramientas = new Herramientas();
  private cajaSonido: CajaSonido = new CajaSonido();
  private ocultarSeccion0 = false;
  private ocultarSeccion1 = true;
  private ocultarSeccion2 = true;
  private ocultarSpinner = true;
  private esCliente = true;

  constructor(
    private auth: AuthService,
    private camera: Camera,
    public barcodeScanner: BarcodeScanner,
    private alertCtrl: AlertController,
    private errorHandler:ErrorHandlerService,
  ) {
    this.usuario = new Cliente();
    this.anonimo = new Anonimo();
    this.clave = '';
  }

  ngOnInit() {
    this.ocultarSeccion0 = false;
    this.ocultarSeccion1 = true;
    this.ocultarSeccion2 = true;
    this.usuario = new Cliente();
    this.anonimo = new Anonimo();
    this.clave = '';
  }

  public presentAlert(header: string, subHeader: string, message: string) {
    this.alertCtrl.create({
      header,
      subHeader,
      message,
      buttons: ['OK']
    }).then(a => { a.present(); });
  }

  /*
    *verifica que los datos ingresados en el formulario son correctos, de serlo se muestra un selector
  */
  public ValidarRegistro() {
    let validado = true;

    if (this.usuario.correo === '') {
      validado = false;
      //this.presentAlert('Error!', '', 'Debe escribir un correo electrónico.');
      this.errorHandler.mostrarErrorSolo("Error!", "Completar campo de correo electrónico");
    } else if (this.clave === '') {
      validado = false;
      //this.presentAlert('¡Error!', '', 'Debe escribir una clave.');
      this.errorHandler.mostrarErrorSolo("Error!", "Completar campo de contraseña");
    } else if (this.clave.length < 6) {
      validado = false;
      //this.presentAlert('¡Error!', '', 'Debe escribir una clave.');
      this.errorHandler.mostrarErrorSolo("Error!", "La contraseña debe tener 6 caracteres como mínimo");
    } else if (!this.herramientas.ValidarMail(this.usuario.correo)) {
      validado = false;
      //this.presentAlert('¡Error!', 'Error en el registro.', 'No es un correo electronico valido.');
      this.errorHandler.mostrarErrorSolo("Error!", "Correo electrónico inválido");
    } else if (!this.herramientas.ValidarNombre(this.usuario.nombre)) {
      validado = false;
      //this.presentAlert('¡Error!', 'Error en el registro.', 'No es un nombre valido.');
      this.errorHandler.mostrarErrorSolo("Error!", "Nombre inválido");
    }
    if (this.esCliente === true) {
      if (!this.herramientas.ValidarNombre(this.usuario.apellido)) {
        validado = false;
        //this.presentAlert('¡Error!', 'Error en el registro.', 'No es un apellido valido.');
        this.errorHandler.mostrarErrorSolo("Error!", "Apellido inválido");
      } else if (!this.herramientas.ValidarDNI(this.usuario.DNI)) {
        validado = false;
        //this.presentAlert('¡Error!', 'Error en el registro.', 'No es un DNI valido.');
        this.errorHandler.mostrarErrorSolo("Error!", "DNI inválido");
      }
    }
    if (validado) {
      this.ocultarSeccion1 = true;
      this.ocultarSeccion2 = false;
    }
  }

  /*
    *permite sacar una foto y subirla en firebase, asi permite guardar su direcccion
  */
  async SacarFoto() {
    this.cajaSonido.ReproducirSelecionar();
    const imageName = this.usuario.correo + (this.herramientas.GenRanNum(1111111, 9999999).toString());
    try {
      const options: CameraOptions = {
        quality: 50,
        targetHeight: 600,
        targetWidth: 600,
        destinationType: this.camera.DestinationType.DATA_URL,
        encodingType: this.camera.EncodingType.JPEG,
        mediaType: this.camera.MediaType.PICTURE
      };

      const result = await this.camera.getPicture(options);
      const image = `data:image/jpeg;base64,${result}`;
      const pictures = firebase.storage().ref(`fotos/${imageName}`);
      pictures.putString(image, 'data_url').then(() => {
        pictures.getDownloadURL().then((url) => {
          this.usuario.foto = (url as string);
          this.Registrar();
        });
      });

    } catch (error) {
      //this.presentAlert('¡Error!', 'Error en el registro.', 'Error al subir la foto, se cancelará el proceso.');
      this.errorHandler.mostrarErrorSolo("Error!", "Error al subir la foto");
      console.log('Error:' + error);
    }
  }

  /*
    *otorga una foto predefinida, evitando sacar una foto, es utilizada para propocitos de
    prueba o si no tenes ganas de sacar fotos.
  */
  public SinFoto() {
    // tslint:disable-next-line: max-line-length
    this.usuario.foto = 'https://firebasestorage.googleapis.com/v0/b/comanda-2019-comicon.appspot.com/o/anonimo.png?alt=media&token=72c4068d-0bb0-4d8a-adce-047df2c46e5b';
    this.Registrar();
  }

  /*
    *basado en las elecciones del usuario se guarda un cliente o un anonimos
  */
  Registrar() {
    if (this.esCliente === true) {
      this.RegistrarCliente();
    } else {
      this.anonimo.correo = this.usuario.correo; // Cambiar esto para agregar un numero aleatorio
      this.anonimo.foto = this.usuario.foto;
      this.anonimo.nombre = this.usuario.nombre;
      this.RegistrarAnonimo();
    }
  }

  /*
    *guarda un Usuario del tipo cliente, utilizando un servicio
  */
  public RegistrarCliente() {
    this.auth.RegistrarCliente(this.usuario, this.clave).then(auth => {
      this.usuario = new Cliente();
      this.anonimo = new Anonimo();
      this.clave = '';
      this.ocultarSeccion0 = false;
      this.ocultarSeccion1 = true;
      this.ocultarSeccion2 = true;
      //this.presentAlert('Exito!', null, '¡Usted ha sido registrado!');
      this.errorHandler.mostrarErrorSolo("Felicidades!", "Sus datos han sido cargados, ahora debe esperar la confirmación del dueño");
    }).catch(err => {
      //this.presentAlert('¡Error!', 'Error en el registro.', 'Error en base de datos.');
      this.errorHandler.mostrarErrorSolo("Error!", "Error al registrar");
      console.log(err);
    });
  }

  /*
    *guarda un Usuario del tipo anonimo, utilizando un servicio
  */
  RegistrarAnonimo() {
    this.auth.RegistrarAnonimo(this.anonimo, this.clave).then(auth => {
      this.usuario = new Cliente();
      this.anonimo = new Anonimo();
      this.clave = '';
      this.ocultarSeccion0 = false;
      this.ocultarSeccion1 = true;
      this.ocultarSeccion2 = true;
      //this.presentAlert('Exito!', null, '¡Usted ha sido registrado!');
      this.errorHandler.mostrarErrorSolo("Felicidades!", "Ha sido registrado");
    }).catch(err => {
      //this.presentAlert('¡Error!', 'Error en el registro.', 'Error en base de datos.');
      this.errorHandler.mostrarErrorSolo("Error!", "Error al registrar");
      console.log(err);
    });
  }

  /*
    *borra todos los datos ingresados en el formulario
  */
  public BorrarDatos() {
    this.usuario = new Cliente();
    this.anonimo = new Anonimo();
    this.clave = '';
    this.ocultarSeccion0 = false;
    this.ocultarSeccion1 = true;
    this.ocultarSeccion2 = true;
  }

  /*
    *rellena el formulario con datos aleatorios
  */
  public RellenarDatos() {
    this.usuario.apellido = this.herramientas.AutofillApellido();
    this.usuario.nombre = this.herramientas.AutofillNombre();
    this.usuario.DNI = this.herramientas.GenRanNum(999999999, 22222222);
    this.usuario.correo = this.herramientas.AutofillMail();
  }

  private manejarDNI(datos: Array<string>) {
    const dni = parseInt(datos[4], 10);

    if (isNaN(dni)) {
      console.log('Es de formato 2010');
      this.usuario.DNI = parseInt(datos[1].trim(), 10);
      this.usuario.apellido = datos[4];
      this.usuario.nombre = datos[5];
    } else {
      console.log('Es de formato 2014');
      this.usuario.DNI = parseInt(datos[4], 10);
      this.usuario.apellido = datos[1];
      this.usuario.nombre = datos[2];
    }
  }

  /*
    *permite escanear el dni para rellenar datos del formulario
  */
  public EscanearDNI() {
    const options: BarcodeScannerOptions = { prompt: 'Escaneé el DNI', resultDisplayDuration: 0 };
    this.barcodeScanner.scan(options).then((barcodeData: BarcodeScanResult) => {
      const scan = (barcodeData.text).split('@');
      this.manejarDNI(scan);
    }, (err) => {
      //this.presentAlert('¡Error!', 'Error al escanear el DNI.', err);
      this.errorHandler.mostrarErrorSolo("Error!", "Error en el escaneo del DNI");
    });
  }

  /*
    *permite seleccionar el tipo de cliete que se registrara
  */
  public ElegirCliente(tipo: string) {
    if (tipo === 'anonimo') {
      this.esCliente = false;
    } else {
      this.esCliente = true;
    }
    this.ocultarSeccion0 = true;
    this.ocultarSeccion1 = false;
  }

  Volver() {
    this.usuario = new Cliente();
    this.anonimo = new Anonimo();
    this.clave = '';
    this.ocultarSeccion0 = false;
    this.ocultarSeccion1 = true;
    this.ocultarSeccion2 = true;
  }
}
