export class Mesa {
    public cantcomen: number; // Cantidad de comenzales
    public cliente: string; // El correo del cliente que posee la mesa
    public estado: string; // El estado de la mesa
    public foto: string; // El link de la foto de la mesa en el storage
    public nromesa: number; // El numero de mesa
    public tmesa: string; // El tipo de mesa, valores posibles: 'vip', 'discapacitados', 'normal'
    public reservada: boolean; // Muestra si la mesa está reservada o no
    public pedidoActual: string; // Indica el UID de Firestore en firebase del pedido que se está llevando a cabo

    constructor() {
        this.cantcomen = 0;
        this.cliente = '';
        this.estado = '';
        this.foto = '';
        this.nromesa = 0;
        this.tmesa = '';
        this.reservada = false;
        this.pedidoActual = '';
    }
}

export interface MesaKey {
    key: string; // UID de Firestore en Firebase
    cantcomen: number;
    cliente: string;
    estado: string;
    foto: string;
    nromesa: number;
    tmesa: string;
    reservada: boolean;
    pedidoActual: string;
}
