import { Component, OnInit } from '@angular/core';
import { BarcodeScanner, BarcodeScanResult, BarcodeScannerOptions } from '@ionic-native/barcode-scanner/ngx';
import { AlertController, ToastController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/firestore';
import { ClienteKey } from 'src/app/clases/cliente';
import { AnonimoKey } from 'src/app/clases/anonimo';
import { MesaKey } from 'src/app/clases/mesa';
import { map } from 'rxjs/operators';
import { ListaEsperaClientesKey } from 'src/app/clases/lista-espera-clientes';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/servicios/auth.service';
import { Http, Headers, Response, RequestOptions  } from '@angular/http';
import { HttpClient } from '@angular/common/http';
import { SpinnerHandlerService } from 'src/app/servicios/spinner-handler.service';

@Component({
  selector: 'app-qr-ingreso-local',
  templateUrl: './qr-ingreso-local.page.html',
  styleUrls: ['./qr-ingreso-local.page.scss'],
})
export class QrIngresoLocalPage implements OnInit {
  
  apiFCM = 'https://fcm.googleapis.com/fcm/send';
  private opt: BarcodeScannerOptions = {
    resultDisplayDuration: 0,
  };

  private mesas = new Array<MesaKey>();
  private listaEspera = new Array<ListaEsperaClientesKey>();
  private spinner : any = null;
  constructor(
    private scanner: BarcodeScanner,
    private alertCtrl: AlertController,
    private firestore: AngularFirestore,
    private router: Router,
    private authServ: AuthService,
    private toastCtrl: ToastController,
    public http: Http,
    public httpClient: HttpClient,
    public spinnerHand : SpinnerHandlerService,
  ) { }

  //#region metodos de FCM
  envioPost() {
    // console.log("estoy en envioPost. Pedido: ", pedido);
    // console.log("estoy en envioPost. Pedido cliente: ", pedido.cliente);
    /* let usuarioLogueado = JSON.parse(sessionStorage.getItem("usuario")); */

    let usuarioLogueado = this.authServ.user;

    let tituloNotif = "Cliente en espera";


    let bodyNotif = "El cliente " + usuarioLogueado.nombre + " se agregó a la lista de espera."; 

    let header = this.initHeaders();
    let options = new RequestOptions({ headers: header, method: 'post'});
    let data =  {
      "notification": {
        "title": tituloNotif,
        "body": bodyNotif ,
        "sound": "default",
        "click_action": "FCM_PLUGIN_ACTIVITY",
        "icon": "fcm_push_icon"
      },
      "data": {
        "landing_page": "inicio",
      },
        "to": "/topics/notificacionMesa",
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

  private esCliente(): boolean {
    return (this.authServ.tipoUser === 'cliente' || this.authServ.tipoUser === 'anonimo');
  }
  async ngOnInit() {
    this.spinner = await this.spinnerHand.GetAllPageSpinner();
    this.spinner.present();
    await this.authServ.buscarUsuario();

    this.traerMesas().subscribe((d: MesaKey[]) => {
      // console.log('Tengo las mesas', d);
      this.mesas = d;

      if (this.esCliente() && this.estaEnMesa()) {
        this.presentToast('Ya tiene una mesa asignada', 'verdeleon');
        this.router.navigate(['inicio']);
      }
    });
    this.traerListaEspera().subscribe((d: ListaEsperaClientesKey[]) => {
      // console.log('Tengo la lista de espera', d);
      this.listaEspera = d;
      
      // console.log('Ya tengo las listas');
      if (this.esCliente() && this.estaEnLista()) {
        this.presentToast('Ha sido agregado a la lista de espera', 'verdeleon');
        this.router.navigate(['inicio']);
      }
    });
    this.spinner.dismiss();
  }

  public estaEnMesa(): boolean {
    const aux = this.mesas.find(m => {
      return m.cliente === this.authServ.user.correo;
    });
    let auxReturn = false;

    if (aux !== undefined) {
      auxReturn = true;
    } else {
      auxReturn = false;
    }

    return auxReturn;
  }

  public estaEnLista(): boolean {
    const aux = this.listaEspera.find(m => {
      return m.correo === this.authServ.user.correo;
    });
    let auxReturn = false;

    if (aux !== undefined) {
      auxReturn = true;
    } else {
      auxReturn = false;
    }

    return auxReturn;
  }

  public async presentToast(message: string, color: string) {
    this.toastCtrl.create({
      message,
      
      showCloseButton: false,
      position: 'bottom',
      closeButtonText: 'Aceptar',
      duration: 2000
    }).then(toast => {
      toast.present();
    });
  }

  public doScan() {
    this.scanner.scan(this.opt)
      .then(async (data: BarcodeScanResult) => {
        // console.log('Lo escaneado es', data.text);
        if (data.text === 'IngresoLocal') {
          this.manejarQR();
        } else {
          this.presentAlert('QR Erroneo', null, 'El QR no pertenece al de ingreso al local.<br>Por favor, escanee el código de Ingreso al Local');
        }
      }).catch(async (err) => {
        console.log('Error al escanear el qr', err);
        // this.presentAlert('QR Erroneo', null, 'Error en el lector');
        // this.manejarQR();
      });
  }

  private manejarQR() {
    // Obtengo el cliente activo en la base de clientes registrados
    // Si el cliente está registrado, entonces prosigo con la operación
    if (this.authServ.tipoUser === 'cliente') {
      // console.log('Hay cliente registrado', auxUser);
      this.buscarMesa(this.authServ.user, true);
    } else if (this.authServ.tipoUser === 'anonimo') {
      // Si el cliente no está registrado, voy a buscar a la base de datos de clientes anonimos.
      this.buscarMesa(this.authServ.user, false);
    } else {
      // Si no encuentro cliente anonimo, significa que soy un empleado y supervisor
      console.log('No hay cliente, es un empleado o un desconocido.');
      this.presentAlert('¡Error!', null, 'Usted no es un cliente, no puede colocarse en la lista.');
    }
  }

  public presentAlert(header: string, subHeader: string, message: string) {
    this.alertCtrl.create({
      header,
      subHeader,
      message,
      buttons: ['Aceptar'],
      cssClass:'avisoAlert'
    }).then(a => { a.present(); });
  }

  private buscarMesa(usuario: ClienteKey | AnonimoKey, esRegistrado: boolean) {
    let nroMesa = -1;

    // Recorro las mesas buscando si ya tiene una asignada
    for (const mesa of this.mesas) {
      if (mesa.cliente === usuario.correo) {
        nroMesa = mesa.nromesa;
        break;
      }
    }

    // Si hay una mesa asignada, se avisa
    if (nroMesa !== -1) {
      this.presentAlert(null, 'Ya tiene mesa asignada.', `Su mesa asignada es la ${nroMesa}.`);
    } else {
      let estaEnListaEspera = false;

      // De lo contrario verifico si se encuentra en la lista de espera
      for (const turnoEspera of this.listaEspera) {
        if (turnoEspera.correo === usuario.correo) {
          estaEnListaEspera = true;
          break;
        }
      }

      // Si ya se encuentra en la lista de espera, se avisa
      if (estaEnListaEspera) {
        this.presentAlert(null, 'Ya está en la lista', 'Usted ya se encuentra en la lista de espera.');
      } else {
        const d = new Date();
        // De lo contrario, se lo agrega a la lista de espera
        const datos: any = {
          correo: usuario.correo,
          perfil: esRegistrado === true ? 'cliente' : 'clienteAnonimo',
          estado: 'confirmacionMozo',
          fecha: d.getTime(),
        };
        

        this.enviarDatos(datos).then(docRef => {
          this.router.navigate(['/list-confirmar-cliente-mesa']); // Aún sin implementar
        })
          .catch(err => {
            this.presentAlert('¡Error!', null, 'Error en la base de datos. No se ha podido agregar a la lista.');
          });
        this.envioPost();
      }
    }
  }

  private enviarDatos(d: any) {
    return this.firestore.collection('listaEsperaClientes').add(d);
  }

  public traerMesas() {
    return this.firestore.collection('mesas').snapshotChanges().pipe(map((f) => {
      return f.map((a) => {
        const data = a.payload.doc.data() as MesaKey;
        data.key = a.payload.doc.id;
        return data;
      });
    }));
  }

  public traerListaEspera() {
    return this.firestore.collection('listaEsperaClientes').snapshotChanges().pipe(map((f) => {
      return f.map((a) => {
        const data = a.payload.doc.data() as ListaEsperaClientesKey;
        data.key = a.payload.doc.id;
        return data;
      });
    }));
  }
}
