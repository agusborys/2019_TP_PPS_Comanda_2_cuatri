import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { Cliente, ClienteAConfirmar } from '../../clases/cliente';
import { Anonimo } from '../../clases/anonimo';
import { Herramientas } from '../../clases/herramientas';
import { CajaSonido } from '../../clases/cajaSonido';

import * as firebase from 'firebase';
import { Camera } from '@ionic-native/camera/ngx';
import { CameraOptions } from '@ionic-native/camera';
import { BarcodeScannerOptions, BarcodeScanResult, BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { AlertController } from '@ionic/angular';
import { ErrorHandlerService } from 'src/app/servicios/error-handler.service';
import { SpinnerHandlerService } from 'src/app/servicios/spinner-handler.service';
import { AngularFireStorage, AngularFireStorageReference } from '@angular/fire/storage';

import { Http, Headers, Response, RequestOptions  } from '@angular/http';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Empleado } from 'src/app/clases/empleado';
import { AngularFirestore } from '@angular/fire/firestore';
@Component({
  selector: 'app-registro-cliente',
  templateUrl: './registro-cliente.page.html',
  styleUrls: ['./registro-cliente.page.scss'],
})
export class RegistroClientePage implements OnInit {

  apiFCM = 'https://fcm.googleapis.com/fcm/send';
  private firebase = firebase;
  private usuario: Cliente;
  private anonimo: Anonimo;
  private spinner:any=null;

  private confirmarClave : string;
  private clave: string;
  private herramientas: Herramientas = new Herramientas();
  private cajaSonido: CajaSonido = new CajaSonido();
  private ocultarSeccion0 = false;
  private ocultarSeccion1 = true;
  private ocultarSeccion2 = true;
  private ocultarSpinner = true;
  private esCliente = true;
  private arrayClientes : Cliente[];
  private arrayClientesAConfirmar : ClienteAConfirmar[];
  private arrayEmpleados : Empleado[];

  constructor(
    public http: Http,
    public httpClient: HttpClient,
    private auth: AuthService,
    private camera: Camera,
    public barcodeScanner: BarcodeScanner,
    private alertCtrl: AlertController,
    private errorHandler:ErrorHandlerService,
    private spinnerHand:SpinnerHandlerService,
    private storage: AngularFireStorage,
    private firestore: AngularFirestore,
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
    this.traerClientes().subscribe((d:Cliente[])=>{
      this.arrayClientes = d;
    });
    this.traerClientesAConfirmar().subscribe((d:ClienteAConfirmar[])=>{
      this.arrayClientesAConfirmar = d;
    });
    this.traerEmpleados().subscribe((d:Empleado[])=>{
      this.arrayEmpleados = d;
    });

  }
  public traerClientes() {
    return this.firestore.collection('clientes').snapshotChanges()
      .pipe(map((f) => {
        return f.map((a) => {
          const data = a.payload.doc.data() as Cliente;
          // data.key = a.payload.doc.id;
          return data;
        });
      }));
  }
  public traerClientesAConfirmar() {
    return this.firestore.collection('clientes-confirmar').snapshotChanges()
      .pipe(map((f) => {
        return f.map((a) => {
          const data = a.payload.doc.data() as ClienteAConfirmar;
          // data.key = a.payload.doc.id;
          return data;
        });
      }));
  }
  public traerEmpleados(){
    return this.firestore.collection('empleados').snapshotChanges()
      .pipe(map((f) => {
        return f.map((a) => {
          const data = a.payload.doc.data() as Empleado;
          // data.key = a.payload.doc.id;
          return data;
        });
      }));
  }
  //#region metodos de FCM
  envioPost() {

    //let usuarioLogueado = this.auth.user;

    let tituloNotif = "Se registro un nuevo cliente";


    let bodyNotif = "El cliente " + this.usuario.correo + " esta esperando confirmacion." ; 

    let header = this.initHeaders();
    let options = new RequestOptions({ headers: header, method: 'post'});
    let data =  {
      "notification": {
        "title": tituloNotif   ,
        "body": bodyNotif ,
        "sound": "default",
        "click_action": "FCM_PLUGIN_ACTIVITY",
        "icon": "fcm_push_icon"
      },
      "data": {
        "landing_page": "inicio",
      },
        "to": "/topics/notificacionReservas",
        "priority": "high",
        "restricted_package_name": ""
    };

    console.log("Data: ", data);
   
    return this.http.post(this.apiFCM, data, options).pipe(map(res => res.json())).subscribe(result => {
      console.log(result);
    });

               
  }

  
 private initHeaders(): Headers {
  let apiKey = 'key=AAAAN11vLtI:APA91bEwhXPo2yboIARzbRHmaQ72PwOfCvmkZsizri-KjBkpxb0cwKR9_y2oj2UkRG2IUm06u16HzJYYwatkqNSeeBjWOFhsq7iA4isVRY8E2_Y3NOvA0w5sBZw--8cMH2d1NDjdSllQ' ;
  var headers = new Headers();
  headers.append('Authorization', apiKey);
  headers.append('Content-Type', 'application/json');
  return headers;
}
  //#endregion


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
      this.errorHandler.mostrarErrorSolo("¡Error!", "Completar campo de contraseña");
    } else if (this.clave.length < 6) {
      validado = false;
      //this.presentAlert('¡Error!', '', 'Debe escribir una clave.');
      this.errorHandler.mostrarErrorSolo("¡Error!", "La contraseña debe tener 6 caracteres como mínimo");
    }
     else if (!this.herramientas.ValidarMail(this.usuario.correo)) {
      validado = false;
      //this.presentAlert('¡Error!', 'Error en el registro.', 'No es un correo electronico valido.');
      this.errorHandler.mostrarErrorSolo("¡Error!", "Correo electrónico inválido");
    } 
    else if (this.confirmarClave != this.clave){
      validado = false;
      this.errorHandler.mostrarErrorSolo("¡Error!","Las contraseñas deben coincidir");
    }
    else if (!this.herramientas.ValidarNombre(this.usuario.nombre)) {
      validado = false;
      //this.presentAlert('¡Error!', 'Error en el registro.', 'No es un nombre valido.');
      this.errorHandler.mostrarErrorSolo("¡Error!", "Nombre inválido");
    }
    if (this.esCliente === true) {
      if (!this.herramientas.ValidarNombre(this.usuario.apellido)) {
        validado = false;
        //this.presentAlert('¡Error!', 'Error en el registro.', 'No es un apellido valido.');
        this.errorHandler.mostrarErrorSolo("¡Error!", "Apellido inválido");
      } else if (!this.herramientas.ValidarDNI(this.usuario.DNI)) {
        validado = false;
        //this.presentAlert('¡Error!', 'Error en el registro.', 'No es un DNI valido.');
        this.errorHandler.mostrarErrorSolo("¡Error!", "DNI inválido");
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
 public async SacarFoto() {
  this.cajaSonido.ReproducirSelecionar();
  let imageName = this.usuario.correo + (this.herramientas.GenRanNum(1111111, 9999999).toString());
  const imageRef: AngularFireStorageReference = this.storage.ref(`fotos/${imageName}.jpg`);
  try {
    let options: CameraOptions = {
      quality: 50,
      targetHeight: 600,
      targetWidth: 600,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE
    };
    let result = await this.camera.getPicture(options);
    this.spinner = await this.spinnerHand.GetAllPageSpinner();
    this.spinner.present();
    let image = `data:image/jpeg;base64,${result}`;
    await imageRef.putString(image,"data_url").then(async (snapshot)=>{
      this.usuario.foto = await snapshot.ref.getDownloadURL();
      this.Registrar();
      //this.spinner.dismiss();
    });
    // let pictures = firebase.storage().ref(`fotos/${imageName}`);
    // pictures.putString(image, "data_url").then(() => {
    //   pictures.getDownloadURL().then((url) => {
    //     this.usuario.foto = (url as string);
    //     this.Registrar();
    //     this.spinner.dismiss();
    //   });
    // });

  } catch (error) {
    console.log(error);
    //this.spinner.dismiss();
    this.presentAlert('¡Error!', 'Error en el registro', "Error:" + error.message);
  }
  this.spinner.dismiss();
  //este spinner es necesario
  //this.ActivarSpinner(5000);
}

  /*
    *otorga una foto predefinida, evitando sacar una foto, es utilizada para propocitos de
    prueba o si no tenes ganas de sacar fotos.
  */
  public async SinFoto() {
    // tslint:disable-next-line: max-line-length
    this.spinner = await this.spinnerHand.GetAllPageSpinner();
    this.spinner.present();
    this.usuario.foto = 'https://firebasestorage.googleapis.com/v0/b/comanda-c5293.appspot.com/o/usuario(3).png?alt=media&token=fbbd41a8-46c0-4d4c-9ecc-991d33fb4361';
    this.Registrar();
  }

  /*
    *basado en las elecciones del usuario se guarda un cliente o un anonimos
  */
  Registrar() {
    
    if (this.esCliente == true) {
      this.RegistrarCliente();
    } else {
      this.anonimo.correo = this.usuario.correo; // Cambiar esto para agregar un numero aleatorio
      this.anonimo.foto = this.usuario.foto;
      this.anonimo.nombre = this.usuario.nombre;
      this.RegistrarAnonimo();
    }
    this.envioPost();
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
      this.spinner.dismiss();
      //this.presentAlert('Exito!', null, '¡Usted ha sido registrado!');
      this.errorHandler.mostrarErrorSolo("¡Felicidades!", "Sus datos han sido cargados, ahora debe esperar la confirmación del dueño");
    }).catch(err => {
      //this.presentAlert('¡Error!', 'Error en el registro.', 'Error en base de datos.');
      this.spinner.dismiss();
      this.errorHandler.mostrarErrorSolo("¡Error!", "Error al registrar");
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
      this.spinner.dismiss();
      this.errorHandler.mostrarErrorSolo("¡Felicidades!", "Ha sido registrado");
    }).catch(err => {
      //this.presentAlert('¡Error!', 'Error en el registro.', 'Error en base de datos.');
      this.spinner.dismiss();
      this.errorHandler.mostrarErrorSolo("¡Error!", "Error al registrar");
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
    const options: BarcodeScannerOptions = { prompt: 'Escanee el código QR del DNI', formats: 'PDF_417',resultDisplayDuration: 0 };
    this.barcodeScanner.scan(options).then((barcodeData: BarcodeScanResult) => {
      if(!barcodeData.cancelled)
      {
        const scan = (barcodeData.text).split('@');
        this.manejarDNI(scan);
        //this.errorHandler.mostrarError("Scan", scan);
      }
      
    }, (err) => {
      //this.presentAlert('¡Error!', 'Error al escanear el DNI.', err);
      this.errorHandler.mostrarErrorSolo("¡Error!", "Error en el escaneo del DNI");
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
