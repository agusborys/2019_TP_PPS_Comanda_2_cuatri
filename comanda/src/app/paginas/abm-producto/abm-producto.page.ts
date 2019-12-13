import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { AlertController, ToastController } from '@ionic/angular';
import { AngularFireStorage, AngularFireStorageReference } from '@angular/fire/storage';
import { AngularFirestore, QuerySnapshot } from '@angular/fire/firestore';
import { AuthService } from '../../servicios/auth.service';
import { SpinnerHandlerService } from 'src/app/servicios/spinner-handler.service';
import { Producto } from 'src/app/clases/producto';

@Component({
  selector: 'app-abm-producto',
  templateUrl: './abm-producto.page.html',
  styleUrls: ['./abm-producto.page.scss'],
})
export class AbmProductoPage implements OnInit {
  private formMesas: FormGroup;
  private fotos: Array<string>;
  private spinner : any = null;

  constructor(
    private camera: Camera,
    private alertCtrl: AlertController,
    /*  private scanner: BarcodeScanner, */
    private toastController: ToastController,
    private storage: AngularFireStorage,
    private firestore: AngularFirestore,
    private authService: AuthService,
    private spinnerHand : SpinnerHandlerService,
  ) { }

    existe: boolean;//aca se va a guardar el booleano que indica si un producto ya existe en la base

  public ngOnInit() {
    this.formMesas = new FormGroup({
      nombreCtrl: new FormControl('', Validators.required),
      descCtrl: new FormControl('', Validators.required),
      tiempoCtrl: new FormControl('', Validators.required),
      precioCtrl: new FormControl('', Validators.required),
      quienPuedeverCtrl: new FormControl('', Validators.required),
    });
    this.fotos = new Array<string>();
    // console.log(this.authService.tipoUser);

  }

  public async tomarFoto() {
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      correctOrientation: true,
      sourceType: this.camera.PictureSourceType.CAMERA
    };
    this.spinner = await this.spinnerHand.GetAllPageSpinner();
    this.spinner.present();
    this.camera.getPicture(options).then((imageData) => {
      this.fotos.unshift('data:image/jpeg;base64,' + imageData);
    }, (err) => {
      this.subidaErronea("Se cerró la cámara");
    });
    this.spinner.dismiss();
  }

  public agregarMesas() {
    if (this.formMesas.value.nombreCtrl === '') {
      this.mostrarFaltanDatos('El nombre del producto es obligatorio');
      return true;
    }
    if (this.formMesas.value.descCtrl === '') {
      this.mostrarFaltanDatos('La descripción del producto es obligatorio');
      return true;
    }
    if (this.formMesas.value.tiempoCtrl === '' || this.formMesas.value.tiempoCtrl < 0) {
      this.mostrarFaltanDatos('El tiempo de preparación es inválido o incorrecto');
      return true;
    }
    if (this.formMesas.value.precioCtrl === '' || this.formMesas.value.tiempoCtrl < 0) {
      this.mostrarFaltanDatos('El precio es inválido o incorrecto');
    }
    if (this.fotos.length === 0) {
      this.mostrarFaltanDatos('Debe subir una foto');
      return true;
    }
    if(this.revisarProducto(this.authService.tipoUser, this.formMesas.value.nombreCtrl))
    {
      this.mostrarFaltanDatos('Ya existe un producto con ese nombre');
      return true;
    }

    this.comenzarSubida();
  }

  private obtenerFotoOriginal(foto): string {
    return (foto as string).split(',', 2)[1];
  }

  // Se fija que el firebase no exista un producto con el mismo nombre.
   private async revisarProducto(user, nombre) {

    // Trae los productos por perfil      
    this.existe = false;// por defecto voy a asignarle false
      await this.firestore.collection('productos').ref.where('quienPuedever', '==', user).get()
      .then((d: QuerySnapshot<any>) => {
        d.forEach(doc => {
          let p = doc.data() as Producto;
          // Si el titulo se condice con el que se quiere cargar, devuelve que existe
          if (doc.data().nombre.includes(nombre) ) {

            this.existe = true;//si entra al if le asigno true, indicando que el producto ya existe
          }
        });
      });
      //console.log("Aux retorno es: " + this.existe);
      
  }

  private async comenzarSubida() {
    /* let valor: Boolean; */
    const datos: any = {
      cantidad: 0,
      nombre: this.formMesas.value.nombreCtrl,
      descripcion: this.formMesas.value.descCtrl,
      tiempo: this.formMesas.value.tiempoCtrl,
      precio: this.formMesas.value.precioCtrl,
      quienPuedever: this.authService.tipoUser,
      // quienPuedever: this.formMesas.value.quienPuedeverCtrl,
      fotos: new Array<string>(),
    };
    let contador = 0;
    let errores = 0;
    this.spinner = await this.spinnerHand.GetAllPageSpinner();
    this.spinner.present();
    // Revisamos que el nombre del producto no exista, espero que la funcion se ejecute para seguir
    await this.revisarProducto(this.authService.tipoUser, this.formMesas.value.nombreCtrl);
    
    // Existe el titulo, se sale
    if (this.existe === true) {
      this.mostrarFaltanDatos('Ya existe un producto con ese nombre');
      this.spinner.dismiss();
      //console.log("el producto ya existe su valor es: " + this.existe);
      return false;
    }
    else {
      // No existe el producto, se carga. 
      for (let foto of this.fotos) {
        const filename: string = datos.nombre + '_' + contador;
        const imageRef: AngularFireStorageReference = this.storage.ref(`productos/${filename}.jpg`);
        foto = this.obtenerFotoOriginal(foto);
        await imageRef.putString(foto, 'base64', { contentType: 'image/jpeg' })
          .then(async (snapshot) => {
            datos.fotos.push(await snapshot.ref.getDownloadURL());
            contador++;
          }).catch(() => {
            this.subidaErronea(`Error al subir la foto ${contador}, se canceló el alta.`);
            errores++;
          });
      }

      if (errores === 0) {
        this.guardardatosDeProducto(datos);
      }
      this.spinner.dismiss();
    }
  }

  private guardardatosDeProducto(datos) {
    this.firestore.collection('productos').add(datos)
      .then((a) => {
        this.subidaExitosa('El alta se realizó de manera exitosa.');
      }).catch(err => {
        console.log('Error al guardarDatosDeProducto', err);
        this.subidaErronea('Error al subir a base de datos.');
      });
  }

  private async subidaExitosa(mensaje) {
    const alert = await this.alertCtrl.create({
      header: '',
      subHeader: 'Éxito',
      message: mensaje,
      buttons: ['Aceptar']
    });

    await alert.present();
    // clear the previous photo data in the variable
    this.clearInputs();
  }

  private async subidaErronea(mensaje: string) {
    const alert = await this.alertCtrl.create({
      header: '',
      subHeader: 'Error',
      message: mensaje,
      buttons: ['Aceptar']
    });

    await alert.present();
  }

  private clearInputs() {
    this.formMesas.reset();
    this.fotos = new Array<string>();
  }

  public async mostrarFaltanDatos(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      color: 'danger',
      showCloseButton: false,
      position: 'bottom',
      closeButtonText: 'Cerrar',
      duration: 3000
    });
    toast.present();
  }
}
