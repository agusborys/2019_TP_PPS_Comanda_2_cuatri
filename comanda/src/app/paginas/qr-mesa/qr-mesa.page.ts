import { Component, OnInit } from '@angular/core';
import { BarcodeScannerOptions, BarcodeScanner, BarcodeScanResult } from '@ionic-native/barcode-scanner/ngx';
import { AngularFirestore, QuerySnapshot, DocumentSnapshot } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { ClienteKey } from 'src/app/clases/cliente';
import { AnonimoKey } from 'src/app/clases/anonimo';
import { MesaKey, Mesa } from 'src/app/clases/mesa';
import { map } from 'rxjs/operators';
import { AlertController, ModalController } from '@ionic/angular';
import { ReservaKey } from 'src/app/clases/reserva';
import { ListaEsperaClientesKey } from 'src/app/clases/lista-espera-clientes';
import { Router } from '@angular/router';
import { ModalPedidoPage } from '../modal-pedido/modal-pedido.page';
import { EncuestaClientePage } from '../encuesta-cliente/encuesta-cliente.page';
import { AuthService } from 'src/app/servicios/auth.service';
import { ErrorHandlerService } from 'src/app/servicios/error-handler.service';
import { Pedido, PedidoKey } from 'src/app/clases/pedido';
import { SpinnerHandlerService } from 'src/app/servicios/spinner-handler.service';

@Component({
  selector: 'app-qr-mesa',
  templateUrl: './qr-mesa.page.html',
  styleUrls: ['./qr-mesa.page.scss'],
})
export class QrMesaPage implements OnInit {
  private opt: BarcodeScannerOptions = {
    resultDisplayDuration: 0,
  };
  private mesas: MesaKey[];
  private mesaAMostrar: MesaKey = null;
  private reservas: ReservaKey[];
  private reservaAMostrar: ReservaKey;
  private listaEspera: ListaEsperaClientesKey[];
  private mostrarBtnEncuesta : boolean = true;
  private pedido : PedidoKey = null;
  private spinner : any = null;
  constructor(
    private firestore: AngularFirestore,
    private scanner: BarcodeScanner,
    private modalCtrl: ModalController,
    public router: Router,
    private alertCtrl: AlertController,
    private authServ: AuthService,
    private errorHandler:ErrorHandlerService,
    private spinnerHand : SpinnerHandlerService
  ) {
   }

  async ngOnInit() {
    this.spinner = await this.spinnerHand.GetAllPageSpinner();
    this.spinner.present();
    await this.authServ.buscarUsuario();
    this.spinner.dismiss();
    this.traerMesas().subscribe((d: MesaKey[]) => {
      // console.log('Tengo las mesas', d);
      this.mesas = d;

      // console.log('Antes de entrar', this.authServ.user.correo);
      if (this.authServ.tipoUser === 'cliente' || this.authServ.tipoUser === 'anonimo') {
        if (this.estaEnMesa()) {
          // console.log('Después de entrar', this.authServ.user.correo);
          this.mesaAMostrar = this.mesas.find(m => {
            return m.cliente === this.authServ.user.correo;
          });
          if(this.mesaAMostrar.pedidoActual != "")
          {
            this.buscarPedido().subscribe((d)=>{  
            this.pedido = d.data() as PedidoKey;
            this.pedido.key = d.id;
            console.log(this.pedido);
            });
          }
          
        } else {
          console.log('No está en mesa');
        }
      }
    });
    this.traerReservas().subscribe((d: ReservaKey[]) => {
      // console.log('Tengo las mesas', d);
      this.reservas = d;
    });

    this.traerListaEspera().subscribe((d: ListaEsperaClientesKey[]) => {
      // console.log('Tengo la lista de espera', d);
      this.listaEspera = d;
    });
    
    this.traerEncuestas().subscribe((d:any)=>{
      for(let element of d)
      {
        if(element.pedido == this.mesaAMostrar.pedidoActual)
        {
          console.log(element.pedido);
          this.mostrarBtnEncuesta = false;
          break;
        }
        else{
          this.mostrarBtnEncuesta = true;
        }
      }
    });
    console.log(this.mostrarBtnEncuesta);
  }
  ionViewDidLoad()
  {
    if(!this.estaEnMesa())
    {
      this.router.navigateByUrl('inicio');
    }
  }
  public buscarPedido(){
    return this.firestore.collection('pedidos').doc(this.mesaAMostrar.pedidoActual).get();
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
  public traerMesas() {
    return this.firestore.collection('mesas').snapshotChanges()
      .pipe(map((f) => {
        return f.map((a) => {
          const data = a.payload.doc.data() as MesaKey;
          data.key = a.payload.doc.id;
          return data;
        });
      }));
  }

  public traerReservas() {
    return this.firestore.collection('reservademesas').snapshotChanges()
      .pipe(map((f) => {
        return f.map((a) => {
          const data = a.payload.doc.data() as ReservaKey;
          data.key = a.payload.doc.id;
          return data;
        });
      }));
  }
  public traerEncuestas() {
    return this.firestore.collection('encuestas-cliente').snapshotChanges()
      .pipe(map((f) => {
        return f.map((a) => {
          const data = a.payload.doc.data() as any;
          return data;
        });
      }));
  }

  private buscarMesa(nroMesa: number) {
    this.mesaAMostrar = this.mesas.find(m => {
      return m.nromesa === nroMesa;
    });
  }

  public doScan() {
    this.scanner.scan(this.opt)
      .then(async (data: BarcodeScanResult) => {
        console.log('La mesa escaneada es ', data);
        const nroMesa: number = parseInt(data.text, 10);
        // alert(nroMesa); // Si el numero de mesa es valido
        try {
          this.manejarQr(nroMesa);
        } catch (err) {
          console.log('Error en el try', err);
          //this.presentAlert('¡Error!', 'Error al leer el código.', 'Error desconocido.');
          this.errorHandler.mostrarErrorSolo("¡Error!", "Error al leer el código de mesa.");
        }
      }).catch(err => {
        console.log('Error al escanear el qr', err);
        //this.presentAlert('¡Error!', 'Error al leer el código.', 'Error desconocido.');
        this.errorHandler.mostrarErrorSolo("¡Error!", "Error al leer el código de mesa.");
        // this.manejarQr(6);
      });
  }

  private manejarQr(nroMesa: number) {
    if (!isNaN(nroMesa)) {
      // Busco la mesa en la db
      this.buscarMesa(nroMesa);
      // alert(this.mesaAMostrar); // Si hay mesa
      if (this.mesaAMostrar !== undefined) {
        // Verifico el tipo de usuario
        if (this.authServ.tipoUser === 'cliente' || this.authServ.tipoUser === 'anonimo') {
          // alert('Es un usuario'); // Reviso el estado de la mesa
          if (this.mesaAMostrar.estado === 'libre') {
            // alert('La mesa está libre'); // Si la mesa está reservada y ya pasó la hora que figura en la reserva
            if (this.mesaAMostrar.reservada) {
              // alert('La mesa está reservada');
              // Si el cliente escaneando el qr es el de la reserva, se le da la opción de ocupar la mesa
              // de lo contrario, solo se informa
              if (this.validarHorario()) {
                if (this.reservaAMostrar.correo === this.authServ.user.correo) {
                  this.presentAlertClienteConReserva();
                } else {
                  this.presentAlert(
                    'Estado de mesa',
                    `Mesa: ${this.mesaAMostrar.nromesa}`,
                    `La mesa está reservada`);
                    this.mesaAMostrar = null;
                    return;
                }
              } else {
                this.errorHandler.mostrarErrorSolo(
                  'Estado de mesa',
                  `Mesa: ${this.mesaAMostrar.nromesa}`+
                  `<br>La mesa está reservada pero no en este horario`);
                  this.mesaAMostrar = null;
              }
            } else {
              // alert('La mesa NO ESTÁ reservada'); // La mesa no está reservada o está fuera del horario de reserva
              const puestoLista: boolean | ListaEsperaClientesKey = this.estaEnLista();
              // alert(puestoLista);
              if (puestoLista !== false) {
                // alert('puestoLista es un ListaEsperaClientesKey, está en la lista'); // Si el cliente está en la lista de espera
                if ((puestoLista as ListaEsperaClientesKey).estado === 'esperandoMesa') {
                  this.presentAlertCliente();
                } else if ((puestoLista as ListaEsperaClientesKey).estado === 'confirmacionMozo') {
                  this.errorHandler.mostrarErrorSolo('Error!', `Usted sigue en lista de espera.<br>` + 
                  `Debe esperar a que el mozo lo confirme`);
                  this.mesaAMostrar = null;
                  return;
                }
              } else {
                // Si el cliente no esta en lista de espera
                if (this.estaEnMesa()) {
                  // alert('puestoMesa es un MesaKey, el cliente ya ocupa mesa'); // Valido que el cliente NO esté usando otra mesa
                  this.errorHandler.mostrarErrorSolo('Error!', 'Mesa ocupada <br>'+ 'Usted ya se encuentra ocupando una mesa');
                  this.mesaAMostrar = null;
                  return;
                } else {
                  // alert('puestoMesa es un false, el cliente no ocupa una mesa ni está en la lista'); // No está en lista ni en mesa
                  this.errorHandler.mostrarErrorSolo(
                    '¡Error!',
                    'No se encuentra en lista de espera.<br>'+
                    'Debe escanear el QR de ingreso al local.');
                    this.mesaAMostrar = null;
                    return;
                }
              }
            }
          } else {
            // alert('La mesa está ocupada'); // Si la mesa esta ocupada
            if (this.mesaAMostrar.cliente === this.authServ.user.correo) {
              // alert('El cliente es el quien la ocupa'); // Si el que escanea es el que ocupa la mesa
              if (this.mesaAMostrar.pedidoActual !== '') {
                // Si ya hizo un pedido
                this.presentAlertConPedido();
              } else { // Si aun no hizo un pedido
                this.errorHandler.mostrarErrorSolo(
                  `Mesa: ${this.mesaAMostrar.nromesa}`,
                  'Mesa sin pedido<br>'+
                  'Todavía no ha realizado ningún pedido'
                );
              }
            } else {
              // alert('La mesa está ocupada y no es el cliente quien escanea');  // Si el que escanea no es quien ocupa la mesa
              this.errorHandler.mostrarErrorSolo(
                'Estado de mesa',
                `Mesa: ${this.mesaAMostrar.nromesa}`+
                `<br>La mesa se encuentra ${this.mesaAMostrar.estado}`);
                this.mesaAMostrar = null;
                return;
            }
          }
        } else {
          // alert('El que escanea no es un cliente');
          this.errorHandler.mostrarErrorSolo(
            'Estado de mesa',
            `Mesa: ${this.mesaAMostrar.nromesa}`+
            `<br>La mesa se encuentra ${this.mesaAMostrar.estado}`);
            this.mesaAMostrar = null;
        }
      } else {
        this.errorHandler.mostrarErrorSolo('¡Error!', 'Error en la Mesa.'+ '<br>El número de la Mesa no es correcto.');
        this.mesaAMostrar = null;
      }
    } else {
      this.errorHandler.mostrarErrorSolo('¡Error!', 'Error en la Mesa.<br>'+'El número de la Mesa no es correcto.');
      this.mesaAMostrar = null;
    }
  }

  public presentAlert(header: string, subHeader: string, message: string) {
    this.alertCtrl.create({
      header,
      subHeader,
      message,
      buttons: ['OK']
    }).then(a => { a.present(); });
  }

  public async presentAlertClienteConReserva() {
    this.alertCtrl.create({
      cssClass:'seleccionarAlert',
      header: 'Estado de mesa',
      subHeader: `Mesa: ${this.mesaAMostrar.nromesa}`,
      message: '¡Bienvenido! Su reserva fue confirmada. ¿Desea ocuparla la mesa?',
      buttons: [
        {
          text: 'No',
          handler: () => {
            this.mesaAMostrar = null;
            return true;
          }
        },
        {
          text: 'Sí',
          handler: () => {
            this.ocuparMesaReservada();
          }
        },
      ]
    }).then(alert => {
      alert.present();
    });
  }

  public presentAlertCliente() {
    this.alertCtrl.create({
      header: 'Estado de mesa',
      subHeader: 'Mesa: ' + this.mesaAMostrar.nromesa,
      message: 'La mesa se encuentra libre. ¿Desea ocuparla?',
      cssClass:'seleccionarAlert',
      buttons: [
        {
          cssClass:'button-Cancel',
          text: 'No',
          handler: () => {
            this.mesaAMostrar = null;
            return true;
          }
        },
        {
          cssClass:'button-Ok',
          text: 'Sí',
          handler: () => {
            this.ocuparMesa();
          }
        },
        
      ]
    }).then(alert => {
      alert.present();
    });
  }

  public presentAlertConPedido() {
    this.alertCtrl.create({
      header: 'Mesa: ' + this.mesaAMostrar.nromesa,
      subHeader: '¿Pedido o encuesta?',
      message: '¿Desea ver el estado de su pedido o acceder a la encuesta de satisfacción?',
      buttons: [
        {
          text: 'Pedido',
          handler: () => {
            this.verPedido(this.mesaAMostrar.pedidoActual);
          }
        },
        {
          text: 'Encuesta',
          handler: () => {
            this.verEncuesta(this.mesaAMostrar.pedidoActual);
          }
        },
      ]
    }).then(alert => { alert.present(); });
  }

  public verPedido(pedido: string) {
    // alert('La página de pedido no está implementada');
    this.modalCtrl.create({
      component: ModalPedidoPage,
      componentProps: {
        pedido,
      }
    }).then(modal => {
      modal.present();
    });
  }

  public verEncuesta(pedido) {
    // Implementar verificación por si ya hay encuesta
    this.modalCtrl.create({
      component: EncuestaClientePage,
      componentProps: {
        pedido,
      }
    }).then(modal => {
      modal.present();
    });
  }

  private removerDoc(db: string, key: string) {
    return this.firestore.collection(db).doc(key).delete();
  }

  private actualizarDoc(db: string, key: string, data: any) {
    return this.firestore.collection(db).doc(key).update(data);
  }

  public ocuparMesa() {
    // Cambio el estado de la mesa y la asocio al cliente
    this.mesaAMostrar.estado = 'ocupada';
    this.mesaAMostrar.cliente = this.authServ.user.correo;
    const mesaKey = this.mesaAMostrar.key;
    const data = this.mesaAMostrar as any;
    delete data.key;
    // console.log(data);
    this.actualizarDoc('mesas', mesaKey, data);

    // Se elimina el cliente de la lista de espera
    const l = this.estaEnLista() !== false ? (this.estaEnLista() as ListaEsperaClientesKey).key : '';
    if (l !== '') {
      this.removerDoc('listaEsperaClientes', l);
    }
  }

  private ocuparMesaReservada() {
    // Cambio el estado de la mesa y la asocio al cliente
    this.mesaAMostrar.reservada = false;
    this.mesaAMostrar.estado = 'ocupada';
    this.mesaAMostrar.cliente = this.authServ.user.correo;
    const mesaKey = this.mesaAMostrar.key;
    const data = this.mesaAMostrar as any;
    delete data.key;
    // console.log(data);
    this.removerDoc('reservademesas', this.reservaAMostrar.key);
    this.actualizarDoc('mesas', mesaKey, data);

    // Saco al cliente de lista de espera
    const l = this.estaEnLista() !== false ? (this.estaEnLista() as ListaEsperaClientesKey).key : '';
    if (l !== '') {
      this.removerDoc('listaEsperaClientes', l);
    }
  }

  public validarHorario(): boolean {
    this.reservaAMostrar = this.reservas.find(r => r.mesaSeleccionada === this.mesaAMostrar.nromesa);

    if (this.reservaAMostrar === undefined) {
      return false;
    } else {
      const dateReserva = this.reservaAMostrar.fecha;
      const dateNow = Date.now();
      // alert(Date.now() > dateReserva.getTime());

      if (dateNow >= (dateReserva - 2400000) && dateNow <= (dateReserva + 2400000)) {
        return false;
      } else {
        return true;
      }
    }
  }

  public estaEnLista(): boolean | ListaEsperaClientesKey {
    const auxReturn = this.listaEspera.find(m => {
      return m.correo === this.authServ.user.correo;
    });

    if (auxReturn !== undefined) {
      return auxReturn;
    } else {
      return false;
    }
  }

  public estaEnMesa(): boolean {
    const auxReturn = this.mesas.find(m => {
      return m.cliente === this.authServ.user.correo;
    });
    // console.log(auxReturn);

    if (auxReturn !== undefined) {
      return true;
    } else {
      return false;
    }
  }
}
