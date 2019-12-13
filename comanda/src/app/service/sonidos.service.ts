import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

@Injectable({
  providedIn: 'root'
})
export class SonidosService {
  public isActive: any;
  constructor(private storage: Storage) {
    this.storage.get('sonido').then(sonido => {
      if (sonido !== null) {
        this.isActive = sonido;
      } else {
        this.isActive = true;
      }
    });

  }

  public desactivarSonidos(valor) {
    this.storage.set('sonido', valor);
    this.isActive = valor;
  }

  public getActivo() {
    return this.isActive;
  }
}
