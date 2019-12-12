import { Component, OnInit } from '@angular/core';
import { PedidoKey } from 'src/app/clases/pedido';
import { ProductoKey } from 'src/app/clases/producto';
import { PedidoDetalleKey } from 'src/app/clases/pedidoDetalle';
import { AuthService } from 'src/app/servicios/auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import { AlertController } from '@ionic/angular';
import { Http, Headers, Response, RequestOptions  } from '@angular/http';
import { SpinnerHandlerService } from 'src/app/servicios/spinner-handler.service';

@Component({
  selector: 'app-list-pedidos-detalle',
  templateUrl: './list-pedidos-detalle.page.html',
  styleUrls: ['./list-pedidos-detalle.page.scss'],
})
export class ListPedidosDetallePage implements OnInit {

  apiFCM = 'https://fcm.googleapis.com/fcm/send';

  private pedidos: PedidoKey[];
  private productos: ProductoKey[];
  private pedidoDetalle: PedidoDetalleKey[];
  private spinner : any = null;

  constructor(
    private authServ: AuthService,
    private firestore: AngularFirestore,
    private alertCtrl: AlertController,
    public http: Http,
    private spinnerHand : SpinnerHandlerService) { }

  //#region metodos de FCM
  envioPost(pedidoPush) {
    //let usuarioLogueado = this.authServ.user;
    let tituloNotif = "Pedido listo";


    let bodyNotif = "Pedido para la mesa " + pedidoPush.mesa + " esta listo para ser entregado";

    let header = this.initHeaders();
    let options = new RequestOptions({ headers: header, method: 'post' });
    let data = {
      "notification": {
        "title": tituloNotif,
        "body": bodyNotif,
        "sound": "default",
        "click_action": "FCM_PLUGIN_ACTIVITY",
        "icon": "fcm_push_icon"
      },
      "data": {
        "landing_page": "inicio",
        "price": "5000",
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
    let apiKey = 'key=AAAAN11vLtI:APA91bEwhXPo2yboIARzbRHmaQ72PwOfCvmkZsizri-KjBkpxb0cwKR9_y2oj2UkRG2IUm06u16HzJYYwatkqNSeeBjWOFhsq7iA4isVRY8E2_Y3NOvA0w5sBZw--8cMH2d1NDjdSllQ';
    var headers = new Headers();
    headers.append('Authorization', apiKey);
    headers.append('Content-Type', 'application/json');
    return headers;
  }
  //#endregion

  async ngOnInit() {
    
    this.pedidos = new Array<PedidoKey>();
    this.pedidoDetalle = new Array<PedidoDetalleKey>();
    this.productos = new Array<ProductoKey>();
    this.spinner = await this.spinnerHand.GetAllPageSpinner();
    this.spinner.present();
    await this.authServ.buscarUsuario();
    this.inicializarPedidos();
    this.spinner.dismiss();
  }
  async ionViewDidEnter(){
    this.pedidos = new Array<PedidoKey>();
    this.pedidoDetalle = new Array<PedidoDetalleKey>();
    this.productos = new Array<ProductoKey>();
    // this.spinner = await this.spinnerHand.GetAllPageSpinner();
    // this.spinner.present();
    await this.authServ.buscarUsuario();
    this.inicializarPedidos();
    this.spinner.dismiss();
    console.log("Pedido detalle:",this.pedidoDetalle);
    console.log("Pedidos", this.pedidos);
    console.log("productos",this.productos);
  }
  public async inicializarPedidos() {
    try {
       await this.traerPedidos().subscribe((p: PedidoKey[]) => {
        this.pedidos = p.filter((pe: PedidoKey) => {
          // console.log(pe.estado);
          const auxReturn = (pe.estado !== 'creado' &&
            pe.estado !== 'entregadoMozo' &&
            pe.estado !== 'entregado' &&
            pe.estado !== 'cuenta' &&
            pe.estado !== 'finalizado');

          return auxReturn;
          
        });
        this.pedidos = this.pedidos.sort(this.ordenarPedidoFecha);
        // console.log('Pedidos', this.pedidos);
      });

      await this.traerProductos().subscribe((pr: ProductoKey[]) => {
        this.productos = pr;
        // console.log('Productos', this.productos);
      });

      await this.traerDetalles().subscribe((pd: PedidoDetalleKey[]) => {
        pd = pd.filter((d: PedidoDetalleKey) => {
          return this.verificarExistencia(d);
        });

        pd = pd.filter((d: PedidoDetalleKey) => {
          return this.verificarVisibilidad(d);
        });
        //this.pedidoDetalle = pd;
        this.pedidoDetalle = pd.sort((a,b)=>{
          let pedidoA = this.pedidos.find(pa=>{
            return pa.key==a.id_pedido;
          });
          let pedidoB = this.pedidos.find(pb=>{
            return pb.key==b.id_pedido;
          });
          if(pedidoA.fecha > pedidoB.fecha){
            return 1;
          }
          if(pedidoA.fecha < pedidoB.fecha){
            return -1;
          }   
          return 0;

        });
        // console.log('Detalles', this.pedidoDetalle);
      });
      
    } catch (err) {
      console.log('err', err);
      this.pedidos = new Array<PedidoKey>();
      this.pedidoDetalle = new Array<PedidoDetalleKey>();
      this.productos = new Array<ProductoKey>();
    }
  }
  private ordenarPedidoFecha(a:PedidoKey, b:PedidoKey)
  {
    if(a.fecha < b.fecha){
        return 1;
      }
      if(a.fecha > b.fecha){
        return -1;
      }   
      return 0;
  }
  private ordenarPorPedido(a: PedidoDetalleKey, b: PedidoDetalleKey) {
    // console.log(a.id_pedido.localeCompare(b.id_pedido));
    return (a.id_pedido.localeCompare(b.id_pedido));
  }

  private verificarExistencia(d: PedidoDetalleKey) {
    let auxReturn = false;

    for (const pedido of this.pedidos) {
      if (d.id_pedido === pedido.key) {
        auxReturn = true;
        break;
      }
    }

    return auxReturn;
  }

  private verificarVisibilidad(d: PedidoDetalleKey) {
    let auxReturn = false;

    for (const producto of this.productos) {
      if (d.producto === producto.nombre) {
        if (producto.quienPuedever === this.authServ.tipoUser) {
          auxReturn = true;
          break;
        }
      }
    }

    return auxReturn;
  }

  private traerPedidos() {
    return this.firestore.collection('pedidos').snapshotChanges()
      .pipe(map((f) => {
        return f.map((a) => {
          const data = a.payload.doc.data() as PedidoKey;
          data.key = a.payload.doc.id;
          return data;
        });
      }));
  }

  private traerDetalles() {
    return this.firestore.collection('pedidoDetalle').snapshotChanges()
      .pipe(map((f) => {
        return f.map((a) => {
          const data = a.payload.doc.data() as PedidoDetalleKey;
          data.key = a.payload.doc.id;
          return data;
        });
      }));
  }

  public traerProductos() {
    return this.firestore.collection('productos').snapshotChanges()
      .pipe(map((f) => {
        const d: ProductoKey[] = f.map((a) => {
          const data = a.payload.doc.data() as ProductoKey;
          data.key = a.payload.doc.id;
          return data;
        });

        return d.filter((pr: ProductoKey) => {
          // console.log('Pr', pr.quienPuedever, 'Yo', this.authServ.tipoUser);
          return pr.quienPuedever === this.authServ.tipoUser;
        });
      }));
  }

  private actualizarDoc(db: string, key: string, data: any) {
    return this.firestore.collection(db).doc(key).update(data);
  }

  public async cambiarEstado(d: PedidoDetalleKey, estado: string) {
    // console.log('Pedido', d, 'Estado', estado);
    await this.actualizarDoc('pedidoDetalle', d.key, { estado }).catch(err => {
      console.log(err);
    });

    if (estado === 'listoEntrega') {
      const pedido: PedidoKey = this.pedidos.find(p => {
        return p.key === d.id_pedido;
      });

      if (pedido !== undefined) {
        // console.log(pedido);
        const i = (pedido.cantEnt as number) + 1;
        const data: any = { cantEnt: i };

        if (pedido.cantDet === i) {
          data.estado = estado;
          this.envioPost(pedido);//aca envio el push
        }

        // console.log(data);
/* Ponerlo despues de data) abajo        
 .then((res) => {
          console.log("se envia el push");
            this.envioPost(pedido);//aca envio el push
        
        }) */
        await this.actualizarDoc('pedidos', pedido.key, data).catch(err => {
          console.log('Error en actualizar Pedido', err);
        });
      }
    }
  }

  public async presentAlertConfirmarEntrega(d: PedidoDetalleKey, estado: string) {
    this.alertCtrl.create({
      cssClass:'seleccionarAlert',
      header: 'Confirmar Detalle',
      message: '¿Desea confirmar como finalizado este pedido?',
      buttons: [
        {
          text: 'No',
          handler: () => {
            return true;
          }
        },
        {
          text: 'Sí',
          handler: () => {
            this.cambiarEstado(d, estado);
          }
        },
      ]
    }).then(alert => {
      alert.present();
    });
  }
}
