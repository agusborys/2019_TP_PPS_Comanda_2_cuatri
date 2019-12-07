import { Component, OnInit } from '@angular/core';

import { Platform, ToastController  } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { timer } from 'rxjs/internal/observable/timer';

//import { timer } from 'rxjs/observable/timer';

//FCM y Router se agregan para el funcionamiento de push notifications, lo mis con events
import { FCM } from '@ionic-native/fcm/ngx';
import { Router } from '@angular/router';
import { Events } from '@ionic/angular';
import { present } from '@ionic/core/dist/types/utils/overlays';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit {
  splash = true;
  public appPages;
  
  constructor(
    public platform: Platform,
    public statusBar: StatusBar,
    public splashScreen: SplashScreen,
    private fcm: FCM,
    public events: Events,
    private router: Router,
    public toastController: ToastController
  ) { }

  ngOnInit() {
    this.initializeApp();
  }

  public initializeApp() {
    // this.platform.ready().then(() => {
    //   this.statusBar.styleDefault();
    //   this.splashScreen.hide();
    // });
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      timer(4000).subscribe(() => this.splash = false);
    });

    this.fcm.onNotification().subscribe(data => {
      console.log(data);
      if (data.wasTapped) {
        console.log('Received in background');
        //this.router.navigateByUrl('/list-confirmar-cliente-mesa');
        this.router.navigate(['/login']);
      } else {
        console.log('Received in foreground');
        let objetoAuxDos = JSON.stringify(data.body);
        this.presentToast(objetoAuxDos);
      }
    });
  }
  async presentToast(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 5000,
      position: 'top',
      color: 'warning',
      translucent: false,
      cssClass: 'toast-noti',
    });
    toast.present();
  }
}
