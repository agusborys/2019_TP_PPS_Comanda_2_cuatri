import { Component, OnInit } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { timer } from 'rxjs/internal/observable/timer';
import { ToastController } from '@ionic/angular';
//import { timer } from 'rxjs/observable/timer';

//FCM y Router se agregan para el funcionamiento de push notifications, lo mis con events
import { FCM } from '@ionic-native/fcm/ngx';
import { Router } from '@angular/router';
import { Events } from '@ionic/angular';

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
        this.router.navigateByUrl('/login');
      } else {
        console.log('Received in foreground');
        /* this.router.navigateByUrl('/login'); */
        this.presentToastWithOptions(data)
      }
    });
  }

  async presentToastWithOptions(mensaje: any) {
    const toast = await this.toastController.create({
      header: mensaje.notification.title,
      message: mensaje.notification.body,
      position: 'top',
      buttons: [
        {
          side: 'start',
          icon: 'star',
          text: 'Ir',
          handler: () => {
            console.log('Favorite clicked');
            this.router.navigateByUrl('/list-confirmar-cliente-mesa');
          }
        }, {
          text: 'Cerrar',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
            toast.dismiss();
          }
        }
      ]
    });
    toast.present();
  }
}
