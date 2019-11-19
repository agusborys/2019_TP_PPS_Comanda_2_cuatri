import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Anonimo } from '../clases/Anonimo';
import { Cliente, ClienteAConfirmar } from '../clases/Cliente';
import { Empleado } from '../clases/Empleado';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private afAuth:AngularFireAuth, private db: AngularFirestore) { }

   /*
    *iniciar sesión con correo y clave guardada en firebase.
    @correo : correo del usuario que quiere ingresar
    @clave : contraseña del usuario
  */
  async Login(correo: string, clave: string) {
    try {
      await this.afAuth.auth.signInWithEmailAndPassword(correo, clave);
      // this.router.navigate(['inicio']);
    } catch (e) {
      alert("Error!" + e.message);
    }
  }
  /*Cerrar sesión de usuario activo*/
  public LogOut() {
    return this.afAuth.auth.signOut()
  }
  /*
    *Registrar usuario del tipo "anónimo" con usuario y contraseña. 
      Se almacenan datos en coleccion "anonimos"
    @usuario : el cliente que se quiere guardar, posee correo.
    @clave : la contraseña empleada para el acceso a firebase.
  */
  RegistrarAnonimo(usuario: Anonimo, clave: string) {
    return new Promise((resolve, reject) => {
      this.afAuth.auth.createUserWithEmailAndPassword(usuario.correo, clave).then(res => {
        const uid = res.user.uid;
        this.db.collection('anonimos').doc(res.user.uid).set({
          correo: usuario.correo,
          nombre: usuario.nombre,
          foto: usuario.foto,
          clave,
        })
        resolve(res)
      }).catch(err => reject(err))
    })
  }
  /*
   *permite guardar un usuario del tipo cliente en una base provisional de firebase para su futuro registro
    con la confirmación del admin o dueño. Guarda sus datos en coleccion 'clientes_a_confirmar'.
   @usuario : datos del cliente que se quiere registrar, posee correo.
   @clave : la contraseña empleada para el acceso a firebase.
 */
  RegistrarClienteAConfirmar(usuario: Cliente, clave: string) {
    const d: ClienteAConfirmar = usuario as ClienteAConfirmar;
    d.clave = clave;
    return this.db.collection('clientes_a_confirmar').add({
      DNI: d.DNI,
      apellido: d.apellido,
      clave: d.clave,
      correo: d.correo,
      foto: d.foto,
      nombre: d.nombre,
    });
  }
  /*
    *permite registrar un usuario del tipo cliente en firebase y
     guarda sus datos en colección 'clientes'.
    @usuario : cliente a registrarse.
    @clave : la contraseña empleada para el acceso a firebase.
  */
  RegistrarClienteConfirmado(usuario: Cliente, clave: string) {
    return new Promise((resolve, reject) => {
      this.afAuth.auth.createUserWithEmailAndPassword(usuario.correo, clave).then(res => {
        const uid = res.user.uid;
        this.db.collection('clientes').doc(res.user.uid).set({
          correo: usuario.correo,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          DNI: usuario.DNI,
          foto: usuario.foto,
        })
        resolve(res)
      }).catch(err => reject(err))
    })
  }
  /*
    *permite registrar un usuario del tipo empleado en firebase y
     guarda sus datos en colección 'empleados'.
    @usuario : el empleado a registrar.
    @clave : la contraseña empleada para el acceso a firebase.
  */
  RegistrarEmpleado(usuario: Empleado, clave: string) {
    return new Promise((resolve, reject) => {
      this.afAuth.auth.createUserWithEmailAndPassword(usuario.correo, clave).then(res => {
        const uid = res.user.uid;
        this.db.collection('empleados').doc(res.user.uid).set({
          correo: usuario.correo,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          DNI: usuario.DNI,
          CUIL: usuario.CUIL,
          foto: usuario.foto,
          tipo: usuario.tipo
        })
        resolve(res)
      }).catch(err => reject(err))
    })
  }
}
