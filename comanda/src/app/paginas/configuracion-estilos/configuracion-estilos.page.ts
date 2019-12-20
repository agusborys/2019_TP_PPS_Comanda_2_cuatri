import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../service/theme.service';
import { Storage } from '@ionic/storage';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { File } from '@ionic-native/file/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';

const themes = {
  naif: {
    primary: '#F78154',
    secondary: '#4D9078',
    tertiary: '#B4436C',
    light: '#FDE8DF',
    medium: '#FCD0A2',
    dark: '#B89876',
    font: 'Modak',
    btnwidth: '70%',
    btnheight: '20px',
    size: '0.9em',
    brdrRadius: '100px',
    img: ''
  },
  profesional: {
    primary: '#8CBA80',
    secondary: '#FCFF6C',
    tertiary: '#FE5F55',
    medium: '#BCC2C7',
    dark: '#202b28',
    light: '#ACB3B9',
    font: 'Manjari',
    btnwidth: '90%',
    btnheight: '20px',
    size: '1.2em',
    brdrRadius: '10px',
    img: 'https://66.media.tumblr.com/4ef968306e2f4a0f74cdfa81d70af249/tumblr_nmlqhvQCpB1t0k6q7o1_640.jpg'
  },
  argentina: {
    primary: '#7FCFCE',
    secondary: '#2A7B62',
    tertiary: '#FF5E79',
    light: '#F0F8F7',
    medium: '#BFC2FF',
    dark: '#B1B5FF',
    font: 'Lato',
    btnwidth: '100%',
    btnheight: '20px',
    size: '1em',
    brdrRadius: '50px',
    img: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Flag_of_Argentina.svg'
  }
};


@Component({
  selector: 'app-configuracion-estilos',
  templateUrl: './configuracion-estilos.page.html',
  styleUrls: ['./configuracion-estilos.page.scss'],
})
export class ConfiguracionEstilosPage implements OnInit {

  public misClases: any;
  public estaActivo: any;
  public loading: boolean;
  public ancho: any;
  public alto: any;
  public radius: any;
  public tamanio: any;
  public letras: string[] = ['Lato', 'Manjari', 'Modak', 'Oswald'];

  public custom = {
      primary: '#7FCFCE',
      secondary: '#2A7B62',
      tertiary: '#FF5E79',
      light: '#F0F8F7',
      medium: '#BFC2FF',
      dark: '#B1B5FF',
      font: 'Modak',
      btnwidth: '40',
      btnheight: '20',
      size: '1em',
      brdrRadius: '50px',
      img: ''
    };

  public estilos = {
    custom: false,
    naif: false,
    argentina: false,
    profesional: false,
    default: false
  }

  estilosArr: string[] = ['argentina', 'naif', 'profesional', 'custom'];

  public botones = {
    icono: 'arrow-round-forward',
  }

  public fotos: any;
  constructor(
    private camera: Camera,
    private file: File,
    private webview: WebView,
    private theme: ThemeService,
    private storage: Storage
  ) {
 }

  ngOnInit() {
    this.loading = true;
    this.misClases = new Array();
    this.ancho = 40;
    this.radius = 10;
    this.alto = 50;
    this.tamanio = 1;
  }

  ionViewDidEnter() {
    this.misClases = new Array();
    this.storage.get('mis-clases').then(misClases => {
      misClases.forEach( clase => {
        this.misClases.push(clase);
      });
    });
    this.storage.get('tema').then(temaSeleccionado => {
      this.activarChecked(temaSeleccionado);
    });
    setTimeout(() => {
        this.loading = false;
    }, 1500);
  }

  changeTheme(name) {
    this.misClases = [];
    this.storage.set('tema', name);

    if (name === '') {
      this.activarChecked('default');
    }

    if (name === 'custom') {
      this.activarChecked('custom');

      this.custom.btnwidth = this.ancho + '%';
      this.custom.btnheight = this.alto + 'px';
      this.custom.size = this.tamanio + 'em';
      this.custom.brdrRadius = this.radius + 'px';
      this.custom.img = (this.fotos[0]) ? this.fotos[0].src : '';
      this.theme.setTheme(this.custom);

      this.misClases.push('custom');
      this.misClases.push('img-fondo');

    } else {
      this.theme.setTheme(themes[name]);
    }

    if (name == 'profesional') {
      this.activarChecked('profesional');
      this.misClases.push('profesional');
      this.misClases.push('img-fondo');
    }

    if (name == 'argentina') {
      this.activarChecked('argentina');
      this.misClases.push('argentina');
      this.misClases.push('img-fondo');
    }

    if ( name == 'naif') {
      this.activarChecked('naif');
      this.misClases.push('naif');
      this.misClases.push('img-none');
    }
    this.storage.set('mis-clases', this.misClases)
  }

  getExpand() {
    return 'full';
  }

  activarChecked(estilo) {
    for ( let index in this.estilos) {
      if (estilo === index) {
        this.estilos[index] = true;
      } else {
        this.estilos[index] = false;
      }
    }
  }

  async getPicture () {
    this.fotos = new Array();
    const options: CameraOptions = {
       quality: 50,
       destinationType: this.camera.DestinationType.FILE_URI,
       encodingType: this.camera.EncodingType.JPEG,
       correctOrientation: true,
     }
    const tempImage = await this.camera.getPicture(options);
    const tempFilename = tempImage.substr(tempImage.lastIndexOf('/') + 1);
    const tempBaseFilesystemPath = tempImage.substr(0, tempImage.lastIndexOf('/') + 1);
    const newBaseFilesystemPath = this.file.dataDirectory;
    await this.file.copyFile(tempBaseFilesystemPath, tempFilename,
                             newBaseFilesystemPath, tempFilename);

    const storedPhoto = newBaseFilesystemPath + tempFilename;
    const displayImage = this.webview.convertFileSrc(storedPhoto);
    this.fotos.push({src: displayImage});
    // console.log(displayImage);
  }

}
