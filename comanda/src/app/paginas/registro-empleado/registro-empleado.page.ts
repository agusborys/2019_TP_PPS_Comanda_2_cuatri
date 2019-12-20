import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { Router } from '@angular/router';

import { Empleado } from '../../clases/empleado';
import { Herramientas } from '../../clases/herramientas';
import { CajaSonido } from '../../clases/cajaSonido';

import * as firebase from "firebase";
import { Camera } from '@ionic-native/camera/ngx';
import { CameraOptions } from '@ionic-native/camera';
import { BarcodeScannerOptions, BarcodeScanResult, BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { AlertController } from '@ionic/angular';
import { SpinnerHandlerService } from 'src/app/servicios/spinner-handler.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { Cliente, ClienteAConfirmar } from 'src/app/clases/cliente';
import { Anonimo } from 'src/app/clases/anonimo';
import { map } from 'rxjs/operators';
import { SonidosService } from '../../service/sonidos.service';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-registro-empleado',
  templateUrl: './registro-empleado.page.html',
  styleUrls: ['./registro-empleado.page.scss'],
})
export class RegistroEmpleadoPage implements OnInit {
  private firebase = firebase;
  private usuario: Empleado;
  private clave: string;
  private herramientas: Herramientas = new Herramientas();
  private cajaSonido: CajaSonido = new CajaSonido();
  private listaPerfil: Array<string> = ["dueño", "supervisor", "mozo", "bartender", "candybar", "cocinero"]; // Camarero hace de cocinero
  private ocultarSeccion1: boolean = false;
  private ocultarSeccion2: boolean = true;
  private ocultarSpinner: boolean = true;
  private spinner : any = null;
  private confirmarClave : string;
  private arrayClientes : Cliente[];
  private arrayClientesAConfirmar : ClienteAConfirmar[];
  private arrayEmpleados : Empleado[];
  private arrayAnonimos : Anonimo[];
  public misClases: any;

  constructor(
    private auth: AuthService,
    private router: Router,
    private camera: Camera,
    public barcodeScanner: BarcodeScanner,
    private alertCtrl: AlertController,
    private spinnerHand: SpinnerHandlerService,
    private firestore: AngularFirestore,
    private sonidos: SonidosService,
    private storage: Storage,
  ) {
    this.usuario = new Empleado();
    this.clave = "";
  }

  ngOnInit() {
    this.ocultarSeccion1 = false;
    this.ocultarSeccion2 = true;
    this.usuario = new Empleado();
    this.clave = "";
    this.traerClientes().subscribe((d:Cliente[])=>{
      this.arrayClientes = d;
    });
    this.traerClientesAConfirmar().subscribe((d:ClienteAConfirmar[])=>{
      this.arrayClientesAConfirmar = d;
    });
    this.traerEmpleados().subscribe((d:Empleado[])=>{
      this.arrayEmpleados = d;
    });
    this.traerAnonimos().subscribe((d:Anonimo[])=>{
      this.arrayAnonimos = d;
    });
  }

  ionViewDidEnter() {
   this.misClases = new Array();
   this.storage.get('mis-clases').then(misClases => {
     misClases.forEach( clase => {
       this.misClases.push(clase);
     });
   });
 }

  /*
    Traigo las colecciones de clientes y empleados desde firebase ya ingresados para verificar su existencia.
   */
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
  public traerAnonimos(){
    return this.firestore.collection('anonimos').snapshotChanges()
      .pipe(map((f) => {
        return f.map((a) => {
          const data = a.payload.doc.data() as Anonimo;
          // data.key = a.payload.doc.id;
          return data;
        });
      }));
  }
  /*
    Compruebo la existencia de del usuario a registrar en las colecciones de clientes, clientesAConfirmar, empleados y anónimos.
   */
  public buscarEnClientes(correo:string):boolean{
    let existe = false;
    for(let cliente of this.arrayClientes){
      if(cliente.correo == correo)
      {
        existe = true;
        break;
      }
    }
    return existe
  }
  public buscarEnClientesAConfirmar(correo:string):boolean{
    let existe = false;
    for(let cliente of this.arrayClientesAConfirmar){
      if(cliente.correo == correo)
      {
        existe = true;
        break;
      }
    }
    return existe
  }
  public buscarEnEmpleados(correo:string):boolean{
    let existe = false;
    for(let empleado of this.arrayEmpleados){
      if(empleado.correo == correo)
      {
        existe = true;
        break;
      }
    }
    return existe
  }
  public buscarEnAnonimos(correo:string):boolean{
    let existe = false;
    for(let anonimo of this.arrayAnonimos){
      if(anonimo.correo == correo)
      {
        existe = true;
        break;
      }
    }
    return existe
  }

  public presentAlert(header: string, subHeader: string, message: string) {
    this.alertCtrl.create({
      cssClass: "avisoAlert",
      header,
      subHeader,
      message,
      buttons: ['Aceptar'],
    }).then(a => { a.present(); });
  }

  /*
    *verifica que los datos ingresados en el formulario son correctos, de serlo se muestra un selector
  */
  public ValidarRegistro() {
    var validado: boolean = true;

    if (this.usuario.correo == "") {
      validado = false;
      this.presentAlert('¡Error!', 'Error en el registro', "Debe escribir un correo electronico");
    } else if (this.clave == "") {
      validado = false;
      this.presentAlert('¡Error!', 'Error en el registro', "Debe escribir una clave");
    }
    else if (!this.herramientas.ValidarMail(this.usuario.correo)) {
      validado = false;
      this.presentAlert('¡Error!', 'Error en el registro', "No es un correo electronico valido");
    }
    else if(this.buscarEnClientes(this.usuario.correo)){
      validado = false;
      this.presentAlert("¡Error!","","Usted ya está registrado como Cliente");
    }
    else if(this.buscarEnClientesAConfirmar(this.usuario.correo)){
      validado = false;
      this.presentAlert("¡Error!","","Usted ya se ha registrado. Debe esperar la confirmación del dueño o supervisor");
    }
    else if(this.buscarEnEmpleados(this.usuario.correo)){
      validado = false;
      this.presentAlert("¡Error!","","Usted ya está registrado como Empleado");
    }
    else if(this.buscarEnAnonimos(this.usuario.correo)){
      validado = false;
      this.presentAlert("¡Error!","","Usted ya está registrado como cliente Anónimo");
    }
    else if (this.confirmarClave != this.clave){
      validado = false;
      this.presentAlert("¡Error!","","Las contraseñas deben coincidir");
    }
    else if (this.usuario.tipo == "") {
      validado = false;
      this.presentAlert('¡Error!', 'Error en el registro', "Debe elegir un perfil de empleado");
    } else if (!this.herramientas.ValidarNombre(this.usuario.nombre)) {
      validado = false;
      this.presentAlert('¡Error!', 'Error en el registro', "No es un nombre válido");
    } else if (!this.herramientas.ValidarNombre(this.usuario.apellido)) {
      validado = false;
      this.presentAlert('¡Error!', 'Error en el registro', "No es un apellido válido");
    } else if (!this.herramientas.ValidarDNI(this.usuario.DNI)) {
      validado = false;
      this.presentAlert('¡Error!', 'Error en el registro', "No es un DNI válido");
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
    if (this.sonidos.getActivo()) {
      this.cajaSonido.ReproducirSelecionar();
    }
    // this.cajaSonido.ReproducirSelecionar();
    let imageName = this.usuario.correo + (this.herramientas.GenRanNum(1111111, 9999999).toString());
    try {

      let options: CameraOptions = {
        quality: 50,
        targetHeight: 600,
        targetWidth: 600,
        destinationType: this.camera.DestinationType.DATA_URL,
        encodingType: this.camera.EncodingType.JPEG,
        mediaType: this.camera.MediaType.PICTURE,
        correctOrientation:true,

      };
      let result = await this.camera.getPicture(options);
      this.spinner = await this.spinnerHand.GetAllPageSpinner();
      this.spinner.present();
      let image = `data:image/jpeg;base64,${result}`;
      let pictures = firebase.storage().ref(`fotos/${imageName}`);
      pictures.putString(image, "data_url").then(() => {
        pictures.getDownloadURL().then((url) => {
          this.usuario.foto = (url as string);
          this.Registrar();
          this.spinner.dismiss();
        });
      });

    } catch (error) {
      console.log(error);
      this.spinner.dismiss();
      this.presentAlert('¡Error!', 'Error en el registro', "Ocurrió un error al realizar el alta");
    }
    //este spinner es necesario
    //this.ActivarSpinner(5000);
  }

  /*
    *otorga una foto predefinida, evitando sacar una foto, es utilizada para propocitos de
    prueba o si no tenes ganas de sacar fotos.
  */
  public async SinFoto() {
    this.spinner = await this.spinnerHand.GetAllPageSpinner();
    this.spinner.present();
    this.usuario.foto = "https://firebasestorage.googleapis.com/v0/b/comanda-2019-comicon.appspot.com/o/anonimo.png?alt=media&token=72c4068d-0bb0-4d8a-adce-047df2c46e5b";
    this.Registrar();
    this.spinner.dismiss();
  }

  /*
    *guarda un Usuario del tipo empleado, utilizando un servicio
  */
  public Registrar() {
    this.auth.RegistrarEmpleado(this.usuario, this.clave).then(auth => {
      this.usuario = new Empleado();
      this.clave = "";
      this.ocultarSeccion1 = false;
      this.ocultarSeccion2 = true;
      this.presentAlert('¡Éxito!', null, "El usuario ha sido registrado!");
    }).catch(err => {
      this.presentAlert('¡Error!', null, 'Error en el registro');
    });

  }

  /*
    *borra todos los datos ingresados en el formulario
  */
  public BorrarDatos() {
    this.usuario = new Empleado();
    this.clave = "";
    this.ocultarSeccion1 = false;
    this.ocultarSeccion2 = true;
  }

  /*
    *spinner improvisado.
    @delay : tiempo en milisegundo que aparecera.
  */
  public ActivarSpinner(delay: number) {
    this.ocultarSpinner = false;
    var modelo = this;
    setTimeout(function () {
      modelo.ocultarSpinner = true;
    }, delay);

  }

  /*
    *rellena el formulario con datos aleatorios
  */
  public RellenarDatos() {
    this.usuario.apellido = this.herramientas.AutofillApellido();
    this.usuario.nombre = this.herramientas.AutofillNombre();
    this.usuario.DNI = this.herramientas.GenRanNum(999999999, 22222222);
    this.usuario.CUIL = this.herramientas.GenRanNum(999999999, 22222222).toString();
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

  public EscanearDNI() {
    const options: BarcodeScannerOptions = { prompt: 'Escaneé el DNI', formats: 'PDF_417', resultDisplayDuration: 0 };
    this.barcodeScanner.scan(options).then((barcodeData: BarcodeScanResult) => {
      const scan = (barcodeData.text).split('@');
      this.manejarDNI(scan);
    }, (err) => {
      this.presentAlert('¡Error!', null, 'Error en el registro');
    });
  }

}
