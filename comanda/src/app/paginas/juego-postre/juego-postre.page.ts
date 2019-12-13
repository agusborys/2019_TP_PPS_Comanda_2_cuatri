import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore, QuerySnapshot, DocumentSnapshot } from '@angular/fire/firestore';


import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import { map } from 'rxjs/operators';
import { PedidoKey, VerificacionJuego } from 'src/app/clases/pedido';
import { ErrorHandlerService } from 'src/app/servicios/error-handler.service';
// import { MesasService } from 'src/app/services/mesas/mesas.service';
// import { EventService } from '../services/event/event.service';
@Component({
  selector: 'app-juego-postre',
  templateUrl: './juego-postre.page.html',
  styleUrls: ['./juego-postre.page.scss'],
})

// Clase de Juegos
export class JuegoPostrePage implements OnInit {


  public currentUser: firebase.User;
  uidUsuario: any;

  private verificacionesJuegos : VerificacionJuego[];
  private verificacionJuego : VerificacionJuego;
  private pedido : PedidoKey;
  private pedidos : PedidoKey[];
  private startDelay = 1000;
  private lightDuration = 500;
  private lightDelay = 1000;
  private boxs = ['green', 'red', 'yellow', 'blue'];

  private game: Game;
  private isStart: boolean;
  private isStrict: boolean;
  private canStart: boolean;
  private canPress: boolean;
  private msg: string;
  private jugando: boolean;
  private audio: any[];
  codigoMesa: any;
  mesas: any;

  // NO CAMBIAR LA LÓGICA DEL JUEGO
  // ES UN JUEGO A 11 VUELTAS CONSECUTIVAS PARA GANAR
  // SI PERDES, VUELVE A HOME
  // BUSCAR LA PALABRA: Julián.
  // NO CAMBIAR LA LÓGICA DEL JUEGO


  // Constructor
  constructor(
    private router: Router,
    private firestore: AngularFirestore,
    private errorHand : ErrorHandlerService
    // private mesasService: MesasService
  ) {
    // this.mesasService.TraerMesas().subscribe(data => {
    //
    //   this.mesas = data.map(e => {
    //     return {
    //       id: e.payload.doc.id,
    //       isEdit: false,
    //       codigo: e.payload.doc.data()['codigo'],
    //       estado: e.payload.doc.data()['estado'],
    //       tipo: e.payload.doc.data()['tipo'],
    //       cantPersonas: e.payload.doc.data()['cantPersonas'],
    //       cliente: e.payload.doc.data()['cliente'],
    //       monto: e.payload.doc.data()['monto'],
    //       propina: e.payload.doc.data()['propina'],
    //       descuento10: e.payload.doc.data()['descuento10'],
    //       descuentoBebida: e.payload.doc.data()['descuentoBebida'],
    //       descuentoPostre: e.payload.doc.data()['descuentoPostre'],
    //     };
    //   })
    //   console.log(this.mesas);
    // });
    firebase.auth().onAuthStateChanged(user => {

      this.currentUser = user;
      this.uidUsuario = user.uid;
    });


    this.game = new Game();
    this.isStrict = false;
    this.canPress = false;
    this.canStart = true;
    this.jugando = false;
    this.msg = '';

    // AUDIO
    const sources = [
      'https://s3.amazonaws.com/freecodecamp/simonSound1.mp3',
      'https://s3.amazonaws.com/freecodecamp/simonSound2.mp3',
      'https://s3.amazonaws.com/freecodecamp/simonSound3.mp3',
      'https://s3.amazonaws.com/freecodecamp/simonSound4.mp3'
    ];

    const a0 = document.createElement('audio'),
          a1 = document.createElement('audio'),
          a2 = document.createElement('audio'),
          a3 = document.createElement('audio');
    a0.src = sources[0];
    a1.src = sources[1];
    a2.src = sources[2];
    a3.src = sources[3];

    this.audio = [a0, a1, a2, a3];
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

  // Comienzo del Juego - Julián
  onStart() {
    if (this.canStart) {
      this.game = new Game();
      this.isStart = true;
      this.game.isStart = true;
      this.isStrict = true;
      this.canStart = false;
      this.canPress = false;
      this.msg = '';
      this.jugando = true;

      setTimeout(() => {
        // check level
        this.game.setLevel(0);
        this.nextLevel();
      }, this.startDelay);
    }

  }

  // Siguiente nivel
  nextLevel() {
    this.canStart = false;
    this.canPress = false;
    this.game.setLevel(this.game.getLevel() + 1);
    // Create new box
    this.newBox();
    this.startLevel();
  }

  // Comenzar el nivel
  startLevel() {
    this.canStart = false;
    this.canPress = false;
    this.game.resetPlayer();
    this.msg = 'Nivel ' + this.game.getLevel();

    // turn light on
    setTimeout(() => {
      this.computerPlay();
    }, 1000);
  }

  // Seleccionar el color que se presiono jugando
  select(val: number) {
    if (this.canPress) {
      this.msg = '';
      this.game.addPlayer(this.boxs[val]);
      this.onLight(this.boxs[val]);

      if (this.game.getPlayer().length === this.game.getHistory().length) {
        this.checkWin();
      }
    }
  }

  // Juego de la computadora
  computerPlay() {
    const delay = this.lightDuration + this.lightDelay; // > 1000s onlight
    // Replay history turn
    for (let i = 0; i < this.game.getHistory().length; i++) {
      (( i ) => {
        setTimeout(() => {
          // console.log(i);
          this.onLight(this.game.getHistory()[i]);
        }, delay * i, true, i);
      })(i);
    }

    // Allow player play
    setTimeout(() => {
      this.canPress = true;
      this.canStart = true;
      this.msg = 'Repertí el patrón de luz';
    }, delay * this.game.getHistory().length );
  }

  newBox() {
    const i = Math.floor(Math.random() * this.boxs.length);
    this.game.setBox(this.boxs[i]);
    this.game.addHistory(this.boxs[i]);
  }

  onLight(box) {
    // Play Sound
    this.audio[this.boxs.indexOf(box)].play();
    // Change light
    document.getElementById(box).className += ' ' + box + '2';
    setTimeout(() => {
      document.getElementById(box).className = 'btn-press ' + box;
    }, this.lightDuration);
  }

  // Funcion que verifica el status del Juego - Julián
  checkWin() {
    const delay = this.lightDuration + this.lightDelay;

    // Check win current level
    if (this.game.getPlayer().join(' ') === this.game.getHistory().join(' ')) {
      // Check Win 20 levels
      // CAMBIADO AL NIVEL 11
      if (this.game.getHistory().length === 3) {
        setTimeout(() => {
          // GANASTE EL JUEGO - Julián
          //alert('Felicitaciones Ganaste! Tenes un postre gratis!!!');
          
          this.msg = 'Excelente. Ganaste!';
          this.isStart = true;
          
          if(this.verificacionJuego.jugoComida == false){
            this.errorHand.mostrarErrorSolo("Felicitaciones", "Has ganado un postre gratis! Se te descontará al final de tu cuenta");
            this.pedido.juegoComida = true;
            this.actualizarDoc("pedidos",this.pedido.key,this.pedido);
            this.verificacionJuego.jugoComida = true;
            this.actualizarDoc("verificacion-juegos", this.verificacionJuego.key,this.verificacionJuego);
          }
          else{
            this.errorHand.mostrarErrorSolo("Felicitaciones", "Has ganado!");
          }
          this.verificacionJuego.jugoComida = true;
          this.actualizarDoc("verificacion-juegos", this.verificacionJuego.key,this.verificacionJuego);
          //////////////////////////////////////////////////////////////////////// hacer el alta
          // this.mesas.forEach(element => {////////////////////SI EL CLIENTE ESTA SENTADO EN ALGUNA MESA
          //   if (element.cliente == this.uidUsuario)
          //   {
          //     this.codigoMesa=element.id;
          //
          //   }
          //
          // });
          // this.mesasService.AgregarDescPostre(this.codigoMesa, true);
          this.router.navigateByUrl('qr-mesa');

        }, delay + 500);
      } else {
        // Right -> Next level
        setTimeout(() => {
          this.msg = 'Right answer';
         // this.router.navigateByUrl('home');

        }, delay + 500);

        setTimeout(() => {
          this.nextLevel();
        }, delay + 500);
      }

    } else  {
      // Wrong -> Replay
      if (!this.isStrict) {
        // Normal mode: Replay at current level
        setTimeout(() => {
          //this.errorHand.mostrarErrorSolo("Perdiste1!","La próxima vez será!");
          this.msg = 'Error! Perdiste.';
          //this.verificacionJuego.jugoDescuento = true;
          //this.actualizarDoc("verificacion-juegos", this.verificacionJuego.key,this.verificacionJuego);
        }, 1500);

        setTimeout(() => {
          this.startLevel();
        }, 2000);

      } else {
        // Strict mode: Restart game
        setTimeout(() => {
          this.errorHand.mostrarErrorSolo("Perdiste!","La próxima vez será!");
          this.msg = 'Error! Perdiste.';
          //this.verificacionJuego.jugoDescuento = true;
          //this.actualizarDoc("verificacion-juegos", this.verificacionJuego.key,this.verificacionJuego);
        }, 1000);

        setTimeout(() => {
          // Esto reinicia el Juego
          // this.onStart();

          // PERDISTE
          // ACA SE SALE DEL JUEGO - Julián
          //this.errorHand.mostrarErrorSolo("Perdiste!3","La próxima vez será!");
          this.verificacionJuego.jugoComida = true;
          this.actualizarDoc("verificacion-juegos", this.verificacionJuego.key,this.verificacionJuego);
          this.router.navigateByUrl('qr-mesa');
        }, 3000);

      }
    }
  }

  volver() {
    // this.limpiarArrays();
    this.router.navigateByUrl('qr-mesa');
  }

  onStrict() {
    this.isStrict = !this.isStrict;
  }
}

export class Game {
  private box: string;
  private level: number;
  private history: string[];
  private player: string[];
  private isWin: boolean;
  public isStart: boolean;

  constructor() {
    this.level   = 0;
    this.history = [];
    this.player  = [];
    this.isWin   = false;
    this.isStart   = false;
  }

  setBox(param: string) {
    this.box = param;
  }

  getLevel() {
    return this.level;
  }

  setLevel(param: number) {
    this.level = param;
  }

  getHistory() {
    return this.history;
  }

  addHistory(param: string) {
    this.history.push(param);
  }

  getPlayer() {
    return this.player;
  }

  addPlayer(param: string) {
    this.player.push(param);
  }

  resetPlayer() {
    this.player = [];
  }

  setWin(param: boolean) {
    this.isWin = param;
  }


}
