import { Component, OnInit } from '@angular/core';
import { ClienteKey, ClienteAConfirmar, ClienteAConfirmarKey } from 'src/app/clases/cliente';
import { AngularFirestore } from '@angular/fire/firestore';
import { ToastController } from '@ionic/angular';
import { map } from 'rxjs/operators';
import { EmailComposer } from '@ionic-native/email-composer/ngx';
import { AuthService } from 'src/app/servicios/auth.service';
import { SpinnerHandlerService } from 'src/app/servicios/spinner-handler.service';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-list-confirmar-cliente-alta',
  templateUrl: './list-confirmar-cliente-alta.page.html',
  styleUrls: ['./list-confirmar-cliente-alta.page.scss'],
})
export class ListConfirmarClienteAltaPage implements OnInit {
  private clientes = new Array<ClienteAConfirmarKey>();
  private spinner: any = null;
  public misClases: any;
  constructor(
    private firestore: AngularFirestore,
    private toastCtrl: ToastController,
    private sendEmail: EmailComposer,
    private authServ: AuthService,
    private spinnerHand: SpinnerHandlerService,
    private storage: Storage,
  ) { }

  public async ngOnInit() {
    this.spinner = await this.spinnerHand.GetAllPageSpinner();
    this.spinner.present();
    this.traerClientes().subscribe((d: ClienteAConfirmarKey[]) => {
      // console.log('Tengo la lista de clientes', d);
      this.clientes = d;
    });
    this.spinner.dismiss();
  }

  ionViewDidEnter() {
   this.misClases = new Array();
   this.storage.get('mis-clases').then(misClases => {
     misClases.forEach( clase => {
       this.misClases.push(clase);
     });
   });
 }

  public traerClientes() {
    return this.firestore.collection('clientes-confirmar').snapshotChanges()
      .pipe(map((f) => {
        return f.map((a) => {
          const data = a.payload.doc.data() as ClienteAConfirmarKey;
          data.key = a.payload.doc.id;
          return data;
        });
      }));
  }

  /* private actualizarDoc(db: string, key: string, data: any) {
    return this.firestore.collection(db).doc(key).update(data);
  } */

  public async confirmarCliente(cliente: ClienteAConfirmarKey, id: string) {
    // console.log('Confirmo el cliente', cliente, 'con id', id);
    const clave: string = cliente.clave;
    const data: any = cliente as any;
    delete data.key;
    delete data.clave;
    await this.authServ.RegistrarClienteConfirmado(data, clave)
      .then(() => {
        this.removerDoc('clientes-confirmar', id);
      });
    this.enviarCorreo(cliente.correo, true);
    this.presentToast('Cliente confirmado', 'success');
  }

  private removerDoc(db, key) {
    return this.firestore.collection(db).doc(key).delete();
  }

  public rechazarCliente(cliente: ClienteKey, id: string) {
    // console.log('Rechazo el cliente', cliente, 'con id', id);
    this.removerDoc('clientes-confirmar', id);
    this.enviarCorreo(cliente.correo, false);
    this.presentToast('Cliente rechazado', 'danger');
  }

  private async presentToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      color,
      showCloseButton: false,
      position: 'top',
      closeButtonText: 'Aceptar',
      duration: 3000
    });
    toast.present();
  }

  private obtenerMensaje(acepta) {
    let auxReturn = `Hola cliente! <br>
    Le queríamos informar que su solicitud de registro ha sido
    ${(acepta === true ? 'aceptada' : 'denegada')}.<br>`;
    if (acepta) {
      auxReturn += `Felicidades! Ya tiene acceso a nuestra app y puede  disfrutar de todos beneficios y comidas.<br>`;
    } else {
      auxReturn += `Lamentamos las molestias ocasionadas.<br>`;
    }
    auxReturn += `<br>Saludos!<br>Equipo de Glamit Restó.`;
    return auxReturn;
  }

  private enviarCorreo(correo: string, acepta: boolean) {
    const email = {
      to: correo,
      subject: 'Glamit - Inscripción ' + (acepta === true ? 'Aceptado' : 'Denegado'),
      body: this.obtenerMensaje(acepta),
      isHtml: true
    };
    // Enviar mensaje con las opciones por default
    this.sendEmail.open(email).catch(err => {
      console.log(err);
    });
  }
}
