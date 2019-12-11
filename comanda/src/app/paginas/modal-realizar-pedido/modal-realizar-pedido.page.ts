import { Component, OnInit } from '@angular/core';
import { ProductoKey } from 'src/app/clases/producto';
import { ModalController, ToastController } from '@ionic/angular';
import { AngularFirestore, DocumentReference } from '@angular/fire/firestore';
import { ModalPedidoPage } from '../modal-pedido/modal-pedido.page';
import { Router } from '@angular/router';
import { MesaKey } from 'src/app/clases/mesa';
import { SpinnerHandlerService } from 'src/app/servicios/spinner-handler.service';

@Component({
  selector: 'app-modal-realizar-pedido',
  templateUrl: './modal-realizar-pedido.page.html',
  styleUrls: ['./modal-realizar-pedido.page.scss'],
})
export class ModalRealizarPedidoPage implements OnInit {

  private productosPedidos : ProductoKey[];
  private pedido : any;
  private mesaDelPedido : MesaKey;
  private mostrarCocina : boolean = false;
  private mostrarBebida : boolean = false;
  private mostrarPostre : boolean = false;
  private spinner : any = null;

  constructor(
    private modalCtrl: ModalController,
    private firestore: AngularFirestore,
    public toastController: ToastController,
    public router : Router,
    private spinnerHand:SpinnerHandlerService,

  ) { }

  ngOnInit() {
    for(let p of this.productosPedidos)
    {
      if(p.quienPuedever == "cocinero"){
        this.mostrarCocina = true;
      }
      if(p.quienPuedever == "bartender"){
        this.mostrarBebida = true;
      }
      if(p.quienPuedever == "candybar"){
        this.mostrarPostre = true;
      }
    }

  }

  public async ConfirmarPedido()
  {
    this.pedido.fecha = (new Date()).getTime();
    this.spinner = await this.spinnerHand.GetAllPageSpinner();
    this.spinner.present();
    await this.firestore.collection('pedidos').add(this.pedido)
      .then(async (doc: DocumentReference) => {
        this.mesaDelPedido.pedidoActual = doc.id;
        this.actualizarMesa();
        // console.log('Ya tengo los detalles');
        await this.hacerPedidoDetalle(this.productosPedidos, doc.id);
        this.verPedido(doc.id);
      });
    this.presentToast('Pedido generado.');
    this.spinner.dismiss();
  }

  private actualizarMesa() {
    const mesaKey = this.mesaDelPedido.key;
    const data = this.mesaDelPedido as any;
    delete data.key;
    // console.log(data);
    this.actualizarDoc('mesas', mesaKey, data);
  }

  private actualizarDoc(db: string, key: string, data: any) {
    return this.firestore.collection(db).doc(key).update(data);
  }

  private async hacerPedidoDetalle(productosPedidos, idPedido) {
    for (const producto of productosPedidos) {
      // tslint:disable-next-line: variable-name
      const pedido_detalle: any = {
        id_pedido: idPedido,
        producto: producto.nombre,
        precio: producto.precio,
        cantidad: producto.cantidad,
        estado: 'creado'
      };
      await this.firestore.collection('pedidoDetalle').add(pedido_detalle);
    }
  }

  public verPedido(pedido: string) {
    this.router.navigate(['inicio']);

    // alert('La página de pedido no está implementada');
    this.modalCtrl.create({
      component: ModalPedidoPage,
      componentProps: {
        pedido
      }
    }).then(modal => {
      modal.present();
      modal.onDidDismiss().then(() => {
        this.router.navigate(['qr-mesa']);
      });
    });
  }

  public cerrarModal() {
    this.modalCtrl.dismiss();
  }

  async presentToast(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      color: 'success',
      showCloseButton: false,
      position: 'bottom',
      closeButtonText: 'Done',
      duration: 2000
    });
    toast.present();
  }

}
