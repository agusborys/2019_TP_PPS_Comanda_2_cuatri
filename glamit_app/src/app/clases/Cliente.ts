export class Cliente {
    public key : string;
    public correo: string;
    public nombre: string;
    public apellido: string;
    public DNI: number;
    public foto: string;

    constructor() {
        this.key = '';
        this.correo = '';
        this.nombre = '';
        this.apellido = '';
        this.DNI = 0;
        this.foto = '';
    }
}

export class ClienteAConfirmar {
    public key : string;
    public correo: string;
    public nombre: string;
    public apellido: string;
    public DNI: number;
    public foto: string;
    public clave: string;

    constructor() {
        this.key = '';
        this.correo = '';
        this.nombre = '';
        this.apellido = '';
        this.DNI = 0;
        this.foto = '';
        this.clave = '';
    }
}
export class ListaEsperaClientes {
    public key: string;
    public correo: string; // el correo del cliente
    public perfil: string; // el perfil del cliente
    public estado: string; // el estado de la espera, valores: 'confirmacionMozo', y otros
    public fecha: number;

    constructor() {
        this.key = '';
        this.correo = '';
        this.perfil = '';
        this.estado = '';
        this.fecha = 0;
    }
}
