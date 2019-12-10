import { Component, OnInit } from '@angular/core';
import { ToastController, AlertController, ModalController } from '@ionic/angular';
import { ModalPedidoPage } from '../modal-pedido/modal-pedido.page';

import { MesaKey } from 'src/app/clases/mesa';
import { ProductoKey } from 'src/app/clases/producto';
import { AngularFirestore, QuerySnapshot, DocumentSnapshot, DocumentReference } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/servicios/auth.service';
import { SpinnerHandlerService } from 'src/app/servicios/spinner-handler.service';


@Component({
  selector: 'app-generar-pedido',
  templateUrl: './generar-pedido.page.html',
  styleUrls: ['./generar-pedido.page.scss'],
})

export class GenerarPedidoPage implements OnInit {
  // tslint:disable-next-line: variable-name
  private productos: ProductoKey[];
  private mesaDelPedido: MesaKey = null;
  private productosCocina: ProductoKey[];
  private productosBartender: ProductoKey[];
  private productosCandybar: ProductoKey[];
  private totalPedido = 0;
  private spinner = null;
  constructor(
    public modalCtrl: ModalController,
    public toastController: ToastController,
    public alertCtrl: AlertController,
    private firestore: AngularFirestore,
    private router: Router,
    private authServ: AuthService,
    private spinnerHand:SpinnerHandlerService
  ) { }

  // Trae los productos
  public async traerProductos() {
    
    return this.firestore.collection('productos').get().toPromise().then((d: QuerySnapshot<any>) => {
      if (!d.empty) {
        const prodReturn = new Array<ProductoKey>();
        for (const da of d.docs) {
          const prodA = da.data() as ProductoKey;
          prodA.key = da.id;
          prodReturn.unshift(prodA);
        }
        return prodReturn;
      } else {
        return new Array<ProductoKey>();
      }
    });
  }

  // Filtra los productos según su categoria
  public async inicializarProductos() {
    this.spinner = await this.spinnerHand.GetAllPageSpinner();
    this.spinner.present();
    this.traerProductos().then((data: Array<ProductoKey>) => {
      // console.log(data);
      this.productosBartender = data.filter((f: ProductoKey) => {
        return f.quienPuedever === 'bartender';
      });
      this.productosCocina = data.filter((f: ProductoKey) => {
        return f.quienPuedever === 'cocinero';
      });
      this.productosCandybar = data.filter((f: ProductoKey) => {
        return f.quienPuedever === 'candybar';
      });

      this.productos = data;
      this.spinner.dismiss();
      // console.log(this.productosCocina);
    });
  }


  async ngOnInit() {
    // this.traerProductos();
    this.inicializarProductos();
    // console.log('Entro al buscar mesas');
    await this.traerMesa(this.authServ.user.correo);
  }

  restarProducto(key: string) {
    const producto = this.productos.find(prod => prod.key === key);
    if (producto.cantidad > 0) {
      producto.cantidad -= 1;
    } else {
      producto.cantidad = 0;
    }

    const productosPedidos = this.productos.filter(prod => prod.cantidad > 0);
    this.totalPedido = this.calcularPrecioTotal(productosPedidos);
  }

  sumarProducto(key: string) {
    const producto = this.productos.find(prod => prod.key === key);
    producto.cantidad += 1;
    // console.log('Cantidad de productos', producto.cantidad);

    const productosPedidos = this.productos.filter(prod => prod.cantidad > 0);
    this.totalPedido = this.calcularPrecioTotal(productosPedidos);
  }

  calcularPrecioTotal(pedido: ProductoKey[]) {
    let precioTotal = 0;
    pedido.forEach(producto => {
      precioTotal += (producto.precio * producto.cantidad);
    });

    return precioTotal;
  }

  private actualizarDoc(db: string, key: string, data: any) {
    return this.firestore.collection(db).doc(key).update(data);
  }

  private actualizarMesa() {
    const mesaKey = this.mesaDelPedido.key;
    const data = this.mesaDelPedido as any;
    delete data.key;
    // console.log(data);
    this.actualizarDoc('mesas', mesaKey, data);
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

  public async generarPedido() {
    // console.log('Entro a generar pedido');
    // Se genera una copia de la lista de productos
    const productosPedidos = this.productos.filter(prod => {
      return prod.cantidad > 0;
    });
    // console.log(productosPedidos);
    if (productosPedidos.length > 0) {
      if (this.mesaDelPedido === null) {
        this.presentAlertSinMesa();
      } else {
        const pedido: any = {
          cantDet: productosPedidos.length,
          cantEnt: 0,
          cliente: this.authServ.user.correo,
          estado: 'creado',
          fecha: (new Date()).getTime(),
          juegoBebida: false,
          juegoComida: false,
          juegoDescuento: false,
          mesa: this.mesaDelPedido.nromesa,
          preciototal: this.calcularPrecioTotal(productosPedidos),
          propina: 0,
        };

        // console.log('Creo el pedido');
        await this.firestore.collection('pedidos').add(pedido)
          .then(async (doc: DocumentReference) => {
            this.mesaDelPedido.pedidoActual = doc.id;
            this.actualizarMesa();
            // console.log('Ya tengo los detalles');
            await this.hacerPedidoDetalle(productosPedidos, doc.id);
            this.verPedido(doc.id);
          });
        this.presentToast('Pedido generado.');
      }
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

  async presentAlertSinMesa() {
    const alert = await this.alertCtrl.create({
      subHeader: 'Cliente sin mesa',
      message: 'Usted no está asignado a ninguna mesa.',
      buttons: ['OK']
    });
    await alert.present();
  }

  private async traerMesa(correo: string) {
    // console.log('mesas');
    await this.firestore.collection('mesas').ref.where('cliente', '==', correo).get()
      .then((d: QuerySnapshot<any>) => {
        // console.log(d);
        if (!d.empty) {
          this.mesaDelPedido = d.docs[0].data() as MesaKey;
          this.mesaDelPedido.key = d.docs[0].id;
        } else {
          this.mesaDelPedido = null;
        }

        // console.log('Mesa encontrada', this.mesaDelPedido);
      });
  }

  public obtenerPedidoMensaje(): string {
    let auxReturn = '';
    const prodPedidos = this.productos.filter(prod => prod.cantidad > 0);

    for (const p of prodPedidos) {
      auxReturn += `${p.cantidad} ${p.nombre}<br>`;
    }

    return auxReturn;
  }

  public confirmarPedido() {
    this.alertCtrl.create({
      header: 'Confirmación de Pedido',
      subHeader: '¿Desea confirmar su pedido?',
      cssClass: 'avisoAlert',
      message: this.obtenerPedidoMensaje(),
      buttons: [
        {
          text: 'Sí',
          handler: () => {
            this.generarPedido();
          }
        },
        {
          text: 'No',
          handler: () => {
            return true;
          }
        }
      ]
    }).then(alert => {
      alert.present();
    });
  }


  //Opciones del Slider de comidas
  // slideOpts = {
  //   on: {
  //     beforeInit() {
  //       const swiper = this;
  //       swiper.classNames.push(`${swiper.params.containerModifierClass}fade`);
  //       const overwriteParams = {
  //         slidesPerView: 1,
  //         slidesPerColumn: 1,
  //         slidesPerGroup: 1,
  //         watchSlidesProgress: true,
  //         spaceBetween: 0,
  //         virtualTranslate: true,
  //       };
  //       swiper.params = Object.assign(swiper.params, overwriteParams);
  //       swiper.params = Object.assign(swiper.originalParams, overwriteParams);
  //     },
  //     setTranslate() {
  //       const swiper = this;
  //       const { slides } = swiper;
  //       for (let i = 0; i < slides.length; i += 1) {
  //         const $slideEl = swiper.slides.eq(i);
  //         const offset$$1 = $slideEl[0].swiperSlideOffset;
  //         let tx = -offset$$1;
  //         if (!swiper.params.virtualTranslate) tx -= swiper.translate;
  //         let ty = 0;
  //         if (!swiper.isHorizontal()) {
  //           ty = tx;
  //           tx = 0;
  //         }
  //         const slideOpacity = swiper.params.fadeEffect.crossFade
  //           ? Math.max(1 - Math.abs($slideEl[0].progress), 0)
  //           : 1 + Math.min(Math.max($slideEl[0].progress, -1), 0);
  //         $slideEl
  //           .css({
  //             opacity: slideOpacity,
  //           })
  //           .transform(`translate3d(${tx}px, ${ty}px, 0px)`);
  //       }
  //     },
  //     setTransition(duration) {
  //       const swiper = this;
  //       const { slides, $wrapperEl } = swiper;
  //       slides.transition(duration);
  //       if (swiper.params.virtualTranslate && duration !== 0) {
  //         let eventTriggered = false;
  //         slides.transitionEnd(() => {
  //           if (eventTriggered) return;
  //           if (!swiper || swiper.destroyed) return;
  //           eventTriggered = true;
  //           swiper.animating = false;
  //           const triggerEvents = ['webkitTransitionEnd', 'transitionend'];
  //           for (let i = 0; i < triggerEvents.length; i += 1) {
  //             $wrapperEl.trigger(triggerEvents[i]);
  //           }
  //         });
  //       }
  //     },
  //   }
  // }
}
