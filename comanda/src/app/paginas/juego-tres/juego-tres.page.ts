import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { PedidoKey, VerificacionJuego } from 'src/app/clases/pedido';
import { map } from 'rxjs/operators';
import * as firebase from 'firebase/app';
import { ErrorHandlerService } from 'src/app/servicios/error-handler.service';

@Component({
  selector: 'app-juego-tres',
  templateUrl: './juego-tres.page.html',
  styleUrls: ['./juego-tres.page.scss'],
})
export class JuegoTresPage implements OnInit {

  public currentUser: firebase.User;
  uidUsuario: any;

  public unoUno: any;
  public dosUno: any;
  public tresUno: any;
  public cuatroUno: any;
  public unoDos: any;
  public dosDos: any;
  public tresDos: any;
  public cuatroDos: any;
  public intentos: any;
  // public intentoActual: any;
  public exitos: any;
  public intentoActual = new Array();
  public casilleros = new Array();
  public ganados = new Array();
  public inicio: any;
  public fin: any;
  
  private pedido : PedidoKey;
  private pedidos : PedidoKey[];
  private verificacionesJuegos : VerificacionJuego[];
  private verificacionJuego : VerificacionJuego;

  constructor(
    private router: Router,
    private firestore: AngularFirestore,
    private errorHand:ErrorHandlerService
  ) {
    this.unoUno = true;
    this.dosUno = true;
    this.tresUno = true;
    this.cuatroUno = true;
    this.unoDos = true;
    this.dosDos = true;
    this.tresDos = true;
    this.cuatroDos = true;
    this.inicio = false;
    this.fin = false;
    this.intentos = 4;
    this.ganados = new Array();
    this.intentoActual = new Array();
    firebase.auth().onAuthStateChanged(user => {
      this.currentUser = user;
      this.uidUsuario = user.uid;
    });
  }
  

  ngOnInit() {
    this.traerPedidos().subscribe((d: PedidoKey[]) => {
      this.pedidos = d;
      console.log(this.currentUser.email, this.pedidos);
      this.pedido = this.pedidos.find((m) => {
        if(m.cliente === this.currentUser.email && (m.estado=="aceptado" || m.estado=="entregado"))
        {
          return true;
        }
          return false;
      });
      console.log(this.pedido);
    });
    this.traerVerificacionJuego().subscribe((d:VerificacionJuego[])=>{
      this.verificacionesJuegos = d;
      this.verificacionJuego = this.verificacionesJuegos.find((m:VerificacionJuego)=>{
        return (m.id_pedido == this.pedido.key);
      });
      console.log(this.verificacionJuego);
    });
    setTimeout(() => {

      this.ocultarIconos();

    }, 3000);

  }

  public traerPedidos() {
    return this.firestore.collection('pedidos').snapshotChanges()
      .pipe(map((f) => {
        return f.map((a) => {
          const data = a.payload.doc.data() as PedidoKey;
          data.key = a.payload.doc.id;
          return data;
        });
      }));
  }
  private traerVerificacionJuego(){
    return this.firestore.collection('verificacion-juegos').snapshotChanges()
      .pipe(map((f)=>{
        return f.map((a)=>{
          const data = a.payload.doc.data() as VerificacionJuego;
          data.key = a.payload.doc.id;
          return data;
        });
      }));
  }
  private actualizarDoc(db: string, key: string, data: any) {
    return this.firestore.collection(db).doc(key).update(data);
  }

  ocultarIconos() {
    this.unoUno = false;
    this.dosUno = false;
    this.tresUno = false;
    this.cuatroUno = false;
    this.unoDos = false;
    this.dosDos = false;
    this.tresDos = false;
    this.cuatroDos = false;
  }

  /**
   * [verificar - Cuando se hace click en un casillero se verificar que:
   *  - Sea el primer o segundo intento
   *  - Se pueda seguir Jugando
   *  - Se valida los que se hayan elegidos sean los mismo o distintos
   *  ]
   * @param  opcion [description]
   * @param  valor  [description]
   * @return        [description]
   */
  verificar(opcion, valor) {
    let indice = this.ganados.indexOf(opcion);


    // No hay mas intentos
    if (this.intentos == 0 || indice != -1) {
      return false;
    }

    //
    if (this.casilleros[0] === undefined) {

      this.intentoActual.push({valor}); // [opcion] = (valor);

    } else if (this.casilleros[0] !== undefined && this.casilleros[0].opcion == opcion) {

      // Si elegis el mismo item no se hace nada
      return false;

    } else if (this.casilleros[1] === undefined) {
      // Segundo elemento
      this.intentoActual.push({valor}); // [opcion] = (valor);

    }

    // Agrego el casillero que se eligio
    this.casilleros.push({opcion});

    // Habilito para que se vea la opcion
    this.habilitar(opcion);

    // Si ya hay dos elegidos, se controla
    if (this.intentoActual.length == 2) {
      this.controlar();

    } else {
      // this.habilitar(opcion);
    }
  }

  // Deshabilitar los casilleros
  deshabilitar(opcion) {

    switch (opcion) {
       case 'unoUno': {
          this.unoUno = false;
          break;
       }
       case 'dosUno': {
          this.dosUno = false;
          break;
       }
       case 'tresUno': {
          this.tresUno = false;
          break;
       }
       case 'cuatroUno': {
          this.cuatroUno = false;
          break;
       }
       case 'unoDos': {
          this.unoDos = false;
          break;
       }
       case 'dosDos': {
          this.dosDos = false;
          break;
       }
       case 'tresDos': {
          this.tresDos = false;
          break;
       }
       case 'cuatroDos': {
          this.cuatroDos = false;
          break;
       }
       default: {
          console.log('Invalid choice');
          break;
       }
    }
  }

  // Habilitar casilleros
  habilitar(opcion) {
    switch (opcion) {
       case 'unoUno': {
          this.unoUno = true;
          break;
       }
       case 'dosUno': {
          this.dosUno = true;
          break;
       }
       case 'tresUno': {
          this.tresUno = true;
          break;
       }
       case 'cuatroUno': {
          this.cuatroUno = true;
          break;
       }
       case 'unoDos': {
          this.unoDos = true;
          break;
       }
       case 'dosDos': {
          this.dosDos = true;
          break;
       }
       case 'tresDos': {
          this.tresDos = true;
          break;
       }
       case 'cuatroDos': {
          this.cuatroDos = true;
          break;
       }
       default: {
          console.log('Invalid choice');
          break;
       }
    }
  }

  // Controlar lo que se eligio
  controlar() {

    if (this.intentoActual[0].valor !== this.intentoActual[1].valor) {
      setTimeout(() => {
        // console.log(this.casilleros);
        for(var index in this.casilleros)
        {
            this.deshabilitar(this.casilleros[index].opcion);
            // console.log(this.casilleros[index].opcion);  // output: Apple Orange Banana
        }
        this.intentos--;
      }, 800);

    } else {
      // Guardo lo que se ganó
      for (var index in this.casilleros)
      {
          this.ganados.push(this.casilleros[index].opcion);
      }
    }


    // Limpio los arrays para trabajar
    setTimeout( () => {
      this.limpiarArrays();
    }, 1000)

    if (this.ganados.length > 5 && this.intentos > 1) {
      //alert('Ganaste');
      if(this.verificacionJuego.jugoBebida==false)
      {
        this.errorHand.mostrarErrorSolo("¡Felicitaciones!", "¡Has ganado una bebida gratis! Se te descontará al final de tu cuenta");
        this.pedido.juegoBebida = true;
        this.actualizarDoc("pedidos",this.pedido.key,this.pedido);
      }
      else{
        this.errorHand.mostrarErrorSolo("¡Felicitaciones!", "¡Has ganado!");
      }
      
      this.verificacionJuego.jugoBebida = true;
      this.actualizarDoc("verificacion-juegos", this.verificacionJuego.key,this.verificacionJuego);
      setTimeout( () => {
        this.router.navigateByUrl('qr-mesa');
      }, 2000);
    }
    if(this.ganados.length<5 && this.intentos == 1){
      this.errorHand.mostrarErrorSolo("¡Perdiste!", "La próxima vez será!");
      this.verificacionJuego.jugoBebida = true;
      this.actualizarDoc("verificacion-juegos", this.verificacionJuego.key,this.verificacionJuego);
      setTimeout( () => {
        this.router.navigateByUrl('qr-mesa');
      }, 2000);
    }
  }

  limpiarArrays() {
    this.intentoActual = [];
    this.casilleros = [];
  }

  volver() {
    // this.limpiarArrays();
    this.router.navigateByUrl('qr-mesa');
  }
}
