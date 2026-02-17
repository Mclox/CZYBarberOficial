// Mock data for all entities
export interface Permiso {
  modulo: string;
  crear: boolean;
  leer: boolean;
  actualizar: boolean;
  eliminar: boolean;
}

export interface Role {
  id_rol: number;
  nombre: string;
  descripcion?: string;
  permisos: Permiso[];
}

export interface Usuario {
  id_usuario: number;
  id_rol: number;
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  avatar?: string;
  estado: 'activo' | 'inactivo';
}

export interface Producto {
  id_producto: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria?: string;
  codigo?: string;
  imagen?: string;
  estado?: 'activo' | 'inactivo';
  tipo_adquisicion?: 'consignacion' | 'compra_directa';
}

export interface Proveedor {
  id_proveedor: number;
  nombre: string;
  nit?: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  estado?: 'activo' | 'inactivo';
}

export interface Compra {
  id_compra: number;
  id_proveedor: number;
  fecha: string;
  total: number;
  estado: 'pendiente' | 'completada' | 'cancelada';
}

export interface DetalleCompra {
  id_detalle_compra: number;
  id_compra: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Devolucion {
  id_devolucion: number;
  id_venta_prod_detalle?: number;
  motivo?: string;
  fecha: string;
  remitido: 'stock' | 'proveedor';
  estado: 'pendiente' | 'aprobada' | 'rechazada';
}

export interface DevolucionProveedor {
  id_dev_prov: number;
  id_detalle_compra: number;
  id_proveedor: number;
  fecha: string;
  motivo?: string;
  cantidad_devuelta: number;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
}

export interface ConsignacionProveedor {
  id_consignacion: number;
  id_proveedor: number;
  id_producto: number;
  cantidad_recibida: number;
  cantidad_vendida: number;
  precio_proveedor: number;
  precio_venta: number;
  fecha_entrega: string;
  fecha_pago?: string;
  estado: 'pendiente' | 'pagado' | 'devuelto';
  observaciones?: string;
}

export interface Servicio {
  id_servicio: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  duracion?: number; // in minutes
  imagen?: string;
}

export interface Cita {
  id_cita: number;
  id_cliente: number;
  id_cliente_temporal?: number; // Para clientes no registrados
  id_servicio: number;
  id_servicios?: number[];
  id_productos?: number[]; // Productos vinculados a la cita
  id_empleado?: number;
  fecha: string;
  hora: string;
  estado: 'pendiente' | 'confirmada' | 'en-ejecucion' | 'completada' | 'cancelada';
  observaciones?: string;
  precios_personalizados?: Record<number, number>; // id_servicio/id_producto -> precio
}

export interface Empleado {
  id_empleado: number;
  id_usuario?: number;
  nombre: string;
  apellido: string;
  cargo: string;
  telefono?: string;
  email?: string;
  fecha_contratacion: string;
  salario?: number;
}

export interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fecha_registro: string;
}

export interface ClienteTemporal {
  id_cliente_temporal: number;
  nombre: string;
  email: string;
  telefono: string;
  fecha_registro: string;
  estado: 'pendiente' | 'registrado'; // pendiente = pre-registro, registrado = se convirtió en usuario
}

export interface Pago {
  id_pago: number;
  id_venta?: number;
  id_consignacion?: number;
  monto: number;
  metodo: 'efectivo' | 'tarjeta' | 'transferencia';
  fecha: string;
  referencia?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'anulado';
  tipo: 'consignacion' | 'general';
  motivo_anulacion?: string;
  fecha_anulacion?: string;
}

export interface Venta {
  id_venta: number;
  id_cliente?: number;
  id_usuario: number;
  fecha: string;
  total: number;
  estado: 'pendiente' | 'pagada' | 'cancelada';
}

export interface VentaProductoDetalle {
  id_venta_prod_detalle: number;
  id_venta: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

// Mock Data
export const mockRoles: Role[] = [
  {
    id_rol: 1,
    nombre: 'Admin',
    descripcion: 'Administrador con acceso total al sistema',
    permisos: [
      { modulo: 'Roles', crear: true, leer: true, actualizar: true, eliminar: true },
      { modulo: 'Usuarios', crear: true, leer: true, actualizar: true, eliminar: true },
      { modulo: 'Productos', crear: true, leer: true, actualizar: true, eliminar: true },
      { modulo: 'Proveedores', crear: true, leer: true, actualizar: true, eliminar: true },
      { modulo: 'Compras', crear: true, leer: true, actualizar: true, eliminar: true },
      { modulo: 'DetalleCompras', crear: true, leer: true, actualizar: true, eliminar: true },
      { modulo: 'Devoluciones', crear: true, leer: true, actualizar: true, eliminar: true },
      { modulo: 'DevolucionesProveedor', crear: true, leer: true, actualizar: true, eliminar: true },
      { modulo: 'Consignaciones', crear: true, leer: true, actualizar: true, eliminar: true },
      { modulo: 'Servicios', crear: true, leer: true, actualizar: true, eliminar: true },
      { modulo: 'Citas', crear: true, leer: true, actualizar: true, eliminar: true },
      { modulo: 'Empleados', crear: true, leer: true, actualizar: true, eliminar: true },
      { modulo: 'Clientes', crear: true, leer: true, actualizar: true, eliminar: true },
      { modulo: 'Pagos', crear: true, leer: true, actualizar: true, eliminar: true },
      { modulo: 'Ventas', crear: true, leer: true, actualizar: true, eliminar: true },
      { modulo: 'VentasDetalle', crear: true, leer: true, actualizar: true, eliminar: true },
    ],
  },
  {
    id_rol: 2,
    nombre: 'Barbero',
    descripcion: 'Barbero que realiza servicios y atiende clientes',
    permisos: [
      { modulo: 'Roles', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'Usuarios', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'Productos', crear: false, leer: true, actualizar: false, eliminar: false },
      { modulo: 'Proveedores', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'Compras', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'DetalleCompras', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'Devoluciones', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'DevolucionesProveedor', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'Consignaciones', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'Servicios', crear: false, leer: true, actualizar: false, eliminar: false },
      { modulo: 'Citas', crear: true, leer: true, actualizar: true, eliminar: true },
      { modulo: 'Empleados', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'Clientes', crear: true, leer: true, actualizar: true, eliminar: true },
      { modulo: 'Pagos', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'Ventas', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'VentasDetalle', crear: false, leer: false, actualizar: false, eliminar: false },
    ],
  },
  {
    id_rol: 3,
    nombre: 'Cliente',
    descripcion: 'Cliente que agenda citas y realiza compras',
    permisos: [
      { modulo: 'Roles', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'Usuarios', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'Productos', crear: false, leer: true, actualizar: false, eliminar: false },
      { modulo: 'Proveedores', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'Compras', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'DetalleCompras', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'Devoluciones', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'DevolucionesProveedor', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'Consignaciones', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'Servicios', crear: false, leer: true, actualizar: false, eliminar: false },
      { modulo: 'Citas', crear: true, leer: true, actualizar: true, eliminar: true },
      { modulo: 'Empleados', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'Clientes', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'Pagos', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'Ventas', crear: false, leer: false, actualizar: false, eliminar: false },
      { modulo: 'VentasDetalle', crear: false, leer: false, actualizar: false, eliminar: false },
    ],
  },
];

export const mockUsuarios: Usuario[] = [
  {
    id_usuario: 1,
    id_rol: 1,
    nombre: 'Admin Principal',
    email: 'admin@barberia.com',
    password: 'admin123',
    telefono: '555-0001',
    estado: 'activo',
  },
  {
    id_usuario: 2,
    id_rol: 2,
    nombre: 'Carlos Barbero',
    email: 'carlos@barberia.com',
    password: 'barbero123',
    telefono: '555-0002',
    estado: 'activo',
  },
  {
    id_usuario: 3,
    id_rol: 2,
    nombre: 'Pedro Barbero',
    email: 'pedro@barberia.com',
    password: 'barbero123',
    telefono: '555-0003',
    estado: 'activo',
  },
  {
    id_usuario: 4,
    id_rol: 3,
    nombre: 'Juan Cliente',
    email: 'juan@cliente.com',
    password: 'cliente123',
    telefono: '555-0004',
    estado: 'activo',
  },
  {
    id_usuario: 5,
    id_rol: 3,
    nombre: 'María Cliente',
    email: 'maria@cliente.com',
    password: 'cliente123',
    telefono: '555-0005',
    estado: 'activo',
  },
];

export const mockProductos: Producto[] = [
  {
    id_producto: 1,
    nombre: 'Pomada para Cabello',
    descripcion: 'Pomada de fijación fuerte',
    precio: 15.99,
    stock: 25,
    categoria: 'Cuidado Capilar',
    codigo: 'POM001',
    imagen: 'https://images.unsplash.com/photo-1542818279-04aa19d54f06?w=400',
    estado: 'activo',
    tipo_adquisicion: 'consignacion',
  },
  {
    id_producto: 2,
    nombre: 'Gel Fijador',
    descripcion: 'Gel fijación extrema',
    precio: 12.99,
    stock: 30,
    categoria: 'Cuidado Capilar',
    codigo: 'GEL001',
    imagen: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=400',
    estado: 'activo',
    tipo_adquisicion: 'consignacion',
  },
  {
    id_producto: 3,
    nombre: 'Aceite para Barba',
    descripcion: 'Aceite hidratante para barba',
    precio: 18.50,
    stock: 20,
    categoria: 'Cuidado de Barba',
    codigo: 'ACE001',
    imagen: 'https://images.unsplash.com/photo-1643123158602-c5e19b5c96ca?w=400',
    estado: 'activo',
    tipo_adquisicion: 'consignacion',
  },
  {
    id_producto: 4,
    nombre: 'Bálsamo para Barba',
    descripcion: 'Bálsamo suavizante',
    precio: 16.99,
    stock: 15,
    categoria: 'Cuidado de Barba',
    codigo: 'BAL001',
    imagen: 'https://images.unsplash.com/photo-1619451334792-150fd785ee74?w=400',
    estado: 'activo',
    tipo_adquisicion: 'consignacion',
  },
  {
    id_producto: 5,
    nombre: 'Cera para Bigote',
    descripcion: 'Cera moldeadora para bigote',
    precio: 14.50,
    stock: 18,
    categoria: 'Cuidado de Barba',
    codigo: 'CEX001',
    imagen: 'https://images.unsplash.com/photo-1585232350370-6adc49653456?w=400',
    estado: 'activo',
    tipo_adquisicion: 'consignacion',
  },
  {
    id_producto: 6,
    nombre: 'Shampoo Masculino',
    descripcion: 'Shampoo para hombre',
    precio: 11.99,
    stock: 40,
    categoria: 'Cuidado Capilar',
    codigo: 'SHA001',
    imagen: 'https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=400',
    estado: 'activo',
    tipo_adquisicion: 'consignacion',
  },
  {
    id_producto: 7,
    nombre: 'Loción After Shave',
    descripcion: 'Loción refrescante post-afeitado',
    precio: 13.99,
    stock: 22,
    categoria: 'Afeitado',
    codigo: 'LOC001',
    imagen: 'https://images.unsplash.com/photo-1615397349754-facc0352b620?w=400',
    estado: 'activo',
    tipo_adquisicion: 'consignacion',
  },
  {
    id_producto: 8,
    nombre: 'Navaja de Afeitar',
    descripcion: 'Navaja profesional de barbero',
    precio: 45.00,
    stock: 8,
    categoria: 'Herramientas',
    codigo: 'NAV001',
    imagen: 'https://images.unsplash.com/photo-1621607509029-c4f8f7e95e04?w=400',
    estado: 'activo',
    tipo_adquisicion: 'compra_directa',
  },
  {
    id_producto: 9,
    nombre: 'Tijeras Profesionales',
    descripcion: 'Tijeras de acero inoxidable para corte',
    precio: 65.00,
    stock: 10,
    categoria: 'Herramientas',
    codigo: 'TIJ001',
    imagen: 'https://images.unsplash.com/photo-1656921350183-7935040cf7fb?w=400',
    estado: 'activo',
    tipo_adquisicion: 'compra_directa',
  },
  {
    id_producto: 10,
    nombre: 'Máquina Cortapelo',
    descripcion: 'Máquina eléctrica profesional',
    precio: 120.00,
    stock: 8,
    categoria: 'Herramientas',
    codigo: 'MAQ001',
    imagen: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400',
    estado: 'activo',
    tipo_adquisicion: 'compra_directa',
  },
  {
    id_producto: 11,
    nombre: 'Brocha de Afeitar',
    descripcion: 'Brocha de pelo natural para afeitado',
    precio: 22.00,
    stock: 15,
    categoria: 'Afeitado',
    codigo: 'BRO001',
    imagen: 'https://images.unsplash.com/photo-1630660664223-9d0d28e08244?w=400',
    estado: 'activo',
    tipo_adquisicion: 'compra_directa',
  },
  {
    id_producto: 12,
    nombre: 'Crema de Afeitar',
    descripcion: 'Crema espumosa para afeitado suave',
    precio: 10.99,
    stock: 35,
    categoria: 'Afeitado',
    codigo: 'CRE001',
    imagen: 'https://images.unsplash.com/photo-1564029875275-9acc2b94a89b?w=400',
    estado: 'activo',
    tipo_adquisicion: 'consignacion',
  },
  {
    id_producto: 13,
    nombre: 'Talco Barbero',
    descripcion: 'Talco perfumado para después del corte',
    precio: 8.50,
    stock: 45,
    categoria: 'Cuidado Capilar',
    codigo: 'TAL001',
    imagen: 'https://images.unsplash.com/photo-1612832021836-f6e0a7aff6de?w=400',
    estado: 'activo',
    tipo_adquisicion: 'consignacion',
  },
  {
    id_producto: 14,
    nombre: 'Cepillo para Cuello',
    descripcion: 'Cepillo suave para limpieza de cuello',
    precio: 6.99,
    stock: 24,
    categoria: 'Herramientas',
    codigo: 'CEP001',
    imagen: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400',
    estado: 'activo',
    tipo_adquisicion: 'compra_directa',
  },
  {
    id_producto: 15,
    nombre: 'Peine Profesional',
    descripcion: 'Peine de carbono para barbero',
    precio: 8.99,
    stock: 12,
    categoria: 'Herramientas',
    codigo: 'PEI001',
    imagen: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    estado: 'activo',
    tipo_adquisicion: 'compra_directa',
  },
  {
    id_producto: 16,
    nombre: 'Coca Cola 500ml',
    descripcion: 'Refresco de cola',
    precio: 1.50,
    stock: 60,
    categoria: 'Bebidas',
    codigo: 'COC001',
    imagen: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400',
    estado: 'activo',
    tipo_adquisicion: 'compra_directa',
  },
  {
    id_producto: 17,
    nombre: 'Agua Mineral 600ml',
    descripcion: 'Agua embotellada',
    precio: 1.00,
    stock: 80,
    categoria: 'Bebidas',
    codigo: 'AGU001',
    imagen: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400',
    estado: 'activo',
    tipo_adquisicion: 'compra_directa',
  },
  {
    id_producto: 18,
    nombre: 'Sprite 500ml',
    descripcion: 'Refresco de lima-limón',
    precio: 1.50,
    stock: 50,
    categoria: 'Bebidas',
    codigo: 'SPR001',
    imagen: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400',
    estado: 'activo',
    tipo_adquisicion: 'compra_directa',
  },
  {
    id_producto: 19,
    nombre: 'Galletas Saladas',
    descripcion: 'Paquete de galletas saladas',
    precio: 2.50,
    stock: 35,
    categoria: 'Snacks',
    codigo: 'GAL001',
    imagen: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400',
    estado: 'activo',
    tipo_adquisicion: 'compra_directa',
  },
  {
    id_producto: 20,
    nombre: 'Papas Fritas',
    descripcion: 'Bolsa de papas fritas',
    precio: 3.00,
    stock: 45,
    categoria: 'Snacks',
    codigo: 'PAP001',
    imagen: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400',
    estado: 'activo',
    tipo_adquisicion: 'compra_directa',
  },
  {
    id_producto: 21,
    nombre: 'Cerveza Artesanal',
    descripcion: 'Cerveza local artesanal',
    precio: 4.50,
    stock: 24,
    categoria: 'Bebidas',
    codigo: 'CER001',
    imagen: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400',
    estado: 'activo',
    tipo_adquisicion: 'compra_directa',
  },
  // Agregando más productos de consignación
  {
    id_producto: 22,
    nombre: 'Cera Moldeadora Strong',
    descripcion: 'Cera de máxima fijación para todo tipo de peinado',
    precio: 19.99,
    stock: 20,
    categoria: 'Cuidado Capilar',
    codigo: 'CEW002',
    imagen: 'https://images.unsplash.com/photo-1585232350370-6adc49653456?w=400',
    estado: 'activo',
    tipo_adquisicion: 'consignacion',
  },
  {
    id_producto: 23,
    nombre: 'Gel Wet Look',
    descripcion: 'Gel efecto mojado de larga duración',
    precio: 14.99,
    stock: 28,
    categoria: 'Cuidado Capilar',
    codigo: 'GEL002',
    imagen: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=400',
    estado: 'activo',
    tipo_adquisicion: 'consignacion',
  },
  {
    id_producto: 24,
    nombre: 'Crema para Peinar Mate',
    descripcion: 'Crema de acabado mate y flexible',
    precio: 17.50,
    stock: 22,
    categoria: 'Cuidado Capilar',
    codigo: 'CRP001',
    imagen: 'https://images.unsplash.com/photo-1542818279-04aa19d54f06?w=400',
    estado: 'activo',
    tipo_adquisicion: 'consignacion',
  },
  {
    id_producto: 25,
    nombre: 'Crema Peinado Clásico',
    descripcion: 'Crema tradicional para peinados vintage',
    precio: 16.50,
    stock: 18,
    categoria: 'Cuidado Capilar',
    codigo: 'CRP002',
    imagen: 'https://images.unsplash.com/photo-1542818279-04aa19d54f06?w=400',
    estado: 'activo',
    tipo_adquisicion: 'consignacion',
  },
];

export const mockProveedores: Proveedor[] = [
  {
    id_proveedor: 1,
    nombre: 'Distribuidora Barbería Pro',
    nit: '123456789',
    contacto: 'Carlos Pérez',
    telefono: '555-1001',
    email: 'ventas@barberiapro.com',
    direccion: 'Av. Principal 123',
    estado: 'activo',
  },
  {
    id_proveedor: 2,
    nombre: 'Suministros La Navaja',
    nit: '987654321',
    contacto: 'Ana García',
    telefono: '555-1002',
    email: 'contacto@lanavaja.com',
    direccion: 'Calle Comercio 456',
    estado: 'activo',
  },
  {
    id_proveedor: 3,
    nombre: 'Bebidas y Snacks SA',
    nit: '1122334455',
    contacto: 'Luis Rodríguez',
    telefono: '555-1003',
    email: 'ventas@bebidasysnacks.com',
    direccion: 'Zona Industrial 789',
    estado: 'activo',
  },
];

export const mockCompras: Compra[] = [
  {
    id_compra: 1,
    id_proveedor: 1,
    fecha: '2025-11-01',
    total: 5000.00,
    estado: 'completada',
  },
  {
    id_compra: 2,
    id_proveedor: 2,
    fecha: '2025-11-05',
    total: 3200.00,
    estado: 'pendiente',
  },
];

export const mockDetalleCompras: DetalleCompra[] = [
  {
    id_detalle_compra: 1,
    id_compra: 1,
    id_producto: 1,
    cantidad: 10,
    precio_unitario: 500.00,
    subtotal: 5000.00,
  },
];

export const mockDevoluciones: Devolucion[] = [
  {
    id_devolucion: 1,
    id_venta_prod_detalle: 1,
    motivo: 'Producto defectuoso - El cliente reportó que la pomada estaba seca y no servía para su uso',
    fecha: '2025-11-06',
    remitido: 'stock',
    estado: 'aprobada',
  },
  {
    id_devolucion: 2,
    id_venta_prod_detalle: 3,
    motivo: 'Cliente insatisfecho con el producto - No cumplió con las expectativas de fijación esperadas',
    fecha: '2025-11-07',
    remitido: 'proveedor',
    estado: 'pendiente',
  },
  {
    id_devolucion: 3,
    id_venta_prod_detalle: 6,
    motivo: 'Producto caducado - Se vendió por error un aceite para barba que estaba próximo a vencer',
    fecha: '2025-11-08',
    remitido: 'proveedor',
    estado: 'aprobada',
  },
  {
    id_devolucion: 4,
    id_venta_prod_detalle: 10,
    motivo: 'Error en la compra - El cliente compró por equivocación pensando que era otro producto similar',
    fecha: '2025-11-09',
    remitido: 'stock',
    estado: 'rechazada',
  },
  {
    id_devolucion: 5,
    id_venta_prod_detalle: 15,
    motivo: 'Alergia al producto - El cliente presentó reacción alérgica a los componentes de la cera',
    fecha: '2025-11-10',
    remitido: 'stock',
    estado: 'aprobada',
  },
  {
    id_devolucion: 6,
    id_venta_prod_detalle: 22,
    motivo: 'Producto derramado durante transporte - La botella llegó rota al domicilio del cliente',
    fecha: '2025-11-11',
    remitido: 'proveedor',
    estado: 'pendiente',
  },
  {
    id_devolucion: 7,
    id_venta_prod_detalle: 27,
    motivo: 'No cumple especificaciones - La crema de afeitar no genera suficiente espuma según el cliente',
    fecha: '2025-11-12',
    remitido: 'stock',
    estado: 'pendiente',
  },
  {
    id_devolucion: 8,
    id_venta_prod_detalle: 31,
    motivo: 'Producto duplicado - El cliente compró dos veces el mismo artículo por error en el sistema',
    fecha: '2025-11-13',
    remitido: 'stock',
    estado: 'aprobada',
  },
  {
    id_devolucion: 9,
    id_venta_prod_detalle: 2,
    motivo: 'Cambio de opinión - El cliente desea devolver producto aunque no tiene defectos',
    fecha: '2025-11-14',
    remitido: 'stock',
    estado: 'rechazada',
  },
  {
    id_devolucion: 10,
    id_venta_prod_detalle: 9,
    motivo: 'Envase dañado - El producto llegó con el envase roto aunque el contenido está intacto',
    fecha: '2025-11-15',
    remitido: 'proveedor',
    estado: 'aprobada',
  },
];

export const mockDevolucionesProveedor: DevolucionProveedor[] = [
  {
    id_dev_prov: 1,
    id_detalle_compra: 1,
    id_proveedor: 1,
    fecha: '2025-11-07',
    motivo: 'Producto dañado en tránsito',
    cantidad_devuelta: 2,
    estado: 'pendiente',
  },
];

export const mockConsignaciones: ConsignacionProveedor[] = [
  {
    id_consignacion: 1,
    id_proveedor: 1,
    id_producto: 1,
    cantidad_recibida: 20,
    cantidad_vendida: 5,
    precio_proveedor: 450.00,
    precio_venta: 799.99,
    fecha_entrega: '2025-10-15',
    estado: 'pendiente',
  },
];

export const mockServicios: Servicio[] = [
  {
    id_servicio: 1,
    nombre: 'Corte de cabello',
    descripcion: 'Corte clásico para hombre',
    precio: 15.00,
    duracion: 30,
    imagen: 'https://images.unsplash.com/photo-1654097801176-cb1795fd0c5e?w=400',
  },
  {
    id_servicio: 2,
    nombre: 'Corte + Barba',
    descripcion: 'Corte y perfilado de barba',
    precio: 25.00,
    duracion: 45,
    imagen: 'https://images.unsplash.com/photo-1654097803253-d481b6751f29?w=400',
  },
  {
    id_servicio: 3,
    nombre: 'Barba',
    descripcion: 'Perfilado de barba',
    precio: 12.00,
    duracion: 20,
    imagen: 'https://images.unsplash.com/photo-1654097803253-d481b6751f29?w=400',
  },
  {
    id_servicio: 4,
    nombre: 'Tinte',
    descripcion: 'Tinte de cabello',
    precio: 35.00,
    duracion: 60,
    imagen: 'https://images.unsplash.com/photo-1712213396688-c6f2d536671f?w=400',
  },
  {
    id_servicio: 5,
    nombre: 'Afeitado completo',
    descripcion: 'Afeitado al ras con toalla caliente',
    precio: 18.00,
    duracion: 30,
    imagen: 'https://images.unsplash.com/photo-1593702233354-259d1f794ed1?w=400',
  },
  {
    id_servicio: 6,
    nombre: 'Tratamiento Capilar',
    descripcion: 'Tratamiento hidratante para cabello',
    precio: 40.00,
    duracion: 45,
    imagen: 'https://images.unsplash.com/photo-1617606795870-bd2aa4633ebd?w=400',
  },
  {
    id_servicio: 7,
    nombre: 'Diseño de Barba',
    descripcion: 'Diseño y esculpido de barba personalizado',
    precio: 20.00,
    duracion: 35,
    imagen: 'https://images.unsplash.com/photo-1654097803253-d481b6751f29?w=400',
  },
];

export const mockCitas: Cita[] = [
  // Ejemplos actualizados para Febrero 2026 (muestran disponibilidad distinta por barbero)
  {
    id_cita: 1,
    id_cliente: 1,
    id_servicio: 1,
    id_servicios: [1],
    id_empleado: 1,
    fecha: '2026-02-04',
    hora: '09:00',
    estado: 'confirmada',
    observaciones: 'Corte clásico',
  },
  {
    id_cita: 2,
    id_cliente: 2,
    id_servicio: 3,
    id_servicios: [3],
    id_empleado: 1,
    fecha: '2026-02-04',
    hora: '10:30',
    estado: 'pendiente',
    observaciones: undefined,
  },
  {
    id_cita: 3,
    id_cliente: 2,
    id_servicio: 6,
    id_servicios: [6],
    id_empleado: 2,
    fecha: '2026-02-04',
    hora: '09:30',
    estado: 'confirmada',
    observaciones: 'Tratamiento capilar',
  },
  {
    id_cita: 4,
    id_cliente: 1,
    id_servicio: 7,
    id_servicios: [7],
    id_empleado: 3,
    fecha: '2026-02-05',
    hora: '14:00',
    estado: 'confirmada',
    observaciones: 'Diseño de barba',
  },
  {
    id_cita: 5,
    id_cliente: 1,
    id_servicio: 2,
    id_servicios: [2],
    id_empleado: 2,
    fecha: '2026-02-06',
    hora: '16:00',
    estado: 'pendiente',
    observaciones: undefined,
  },
  {
    id_cita: 6,
    id_cliente: 2,
    id_servicio: 4,
    id_servicios: [4],
    id_empleado: 1,
    fecha: '2026-02-07',
    hora: '11:00',
    estado: 'confirmada',
    observaciones: undefined,
  },
];

export const mockEmpleados: Empleado[] = [
  {
    id_empleado: 1,
    id_usuario: 1,
    nombre: 'Pedro',
    apellido: 'Martínez',
    cargo: 'Barbero Senior',
    telefono: '555-2001',
    email: 'pedro@barberia.com',
    fecha_contratacion: '2023-01-15',
    salario: 1800.00,
  },
  {
    id_empleado: 2,
    id_usuario: 2,
    nombre: 'Carlos',
    apellido: 'Ruiz',
    cargo: 'Barbero',
    telefono: '555-2002',
    email: 'carlos@barberia.com',
    fecha_contratacion: '2024-03-20',
    salario: 1500.00,
  },
  {
    id_empleado: 3,
    nombre: 'Miguel',
    apellido: 'Torres',
    cargo: 'Barbero Junior',
    telefono: '555-2003',
    email: 'miguel@barberia.com',
    fecha_contratacion: '2024-08-10',
    salario: 1200.00,
  },
];

export const mockClientes: Cliente[] = [
  {
    id_cliente: 1,
    nombre: 'Roberto',
    apellido: 'Sánchez',
    email: 'roberto@email.com',
    telefono: '555-3001',
    direccion: 'Calle 123',
    fecha_registro: '2025-10-01',
  },
  {
    id_cliente: 2,
    nombre: 'Laura',
    apellido: 'Gómez',
    email: 'laura@email.com',
    telefono: '555-3002',
    direccion: 'Av. 456',
    fecha_registro: '2025-10-15',
  },
  {
    id_cliente: 3,
    nombre: 'Juan',
    apellido: 'Cliente',
    email: 'juan@cliente.com',
    telefono: '555-0004',
    direccion: 'Calle Principal 789',
    fecha_registro: '2025-09-01',
  },
  {
    id_cliente: 4,
    nombre: 'María',
    apellido: 'Cliente',
    email: 'maria@cliente.com',
    telefono: '555-0005',
    direccion: 'Avenida Central 456',
    fecha_registro: '2025-09-15',
  },
];

export const mockClientesTemporales: ClienteTemporal[] = [
  {
    id_cliente_temporal: 1,
    nombre: 'Miguel Temporal',
    email: 'miguel.temp@email.com',
    telefono: '555-4001',
    fecha_registro: '2025-11-08',
    estado: 'pendiente',
  },
];

export const mockPagos: Pago[] = [
  {
    id_pago: 1,
    id_venta: 1,
    monto: 829.98,
    metodo: 'tarjeta',
    fecha: '2025-11-05',
    referencia: 'PAY-1730808000000-001',
    estado: 'aprobado',
    tipo: 'general',
  },
  {
    id_pago: 2,
    monto: 150.00,
    metodo: 'efectivo',
    fecha: '2025-11-08',
    referencia: 'PAY-1731024000000-002',
    estado: 'aprobado',
    tipo: 'general',
  },
  {
    id_pago: 3,
    monto: 250.50,
    metodo: 'transferencia',
    fecha: '2025-11-10',
    referencia: 'PAY-1731196800000-003',
    estado: 'pendiente',
    tipo: 'general',
  },
  {
    id_pago: 4,
    monto: 85.00,
    metodo: 'efectivo',
    fecha: '2025-11-11',
    referencia: 'PAY-1731283200000-004',
    estado: 'aprobado',
    tipo: 'general',
  },
  {
    id_pago: 5,
    monto: 320.75,
    metodo: 'tarjeta',
    fecha: '2025-11-11',
    referencia: 'PAY-1731283200000-005',
    estado: 'rechazado',
    tipo: 'general',
  },
  {
    id_pago: 6,
    monto: 175.00,
    metodo: 'transferencia',
    fecha: '2025-11-12',
    referencia: 'PAY-1731369600000-006',
    estado: 'pendiente',
    tipo: 'general',
  },
  {
    id_pago: 7,
    monto: 450.00,
    metodo: 'tarjeta',
    fecha: '2025-11-12',
    referencia: 'PAY-1731369600000-007',
    estado: 'aprobado',
    tipo: 'general',
  },
  {
    id_pago: 8,
    monto: 95.50,
    metodo: 'efectivo',
    fecha: '2025-11-13',
    referencia: 'PAY-1731456000000-008',
    estado: 'aprobado',
    tipo: 'general',
  },
  {
    id_pago: 9,
    monto: 280.00,
    metodo: 'transferencia',
    fecha: '2025-11-13',
    referencia: 'PAY-1731456000000-009',
    estado: 'rechazado',
    tipo: 'general',
  },
  {
    id_pago: 10,
    monto: 125.00,
    metodo: 'efectivo',
    fecha: '2025-11-14',
    referencia: 'PAY-1731542400000-010',
    estado: 'pendiente',
    tipo: 'general',
  },
  {
    id_pago: 11,
    monto: 560.00,
    metodo: 'tarjeta',
    fecha: '2025-11-15',
    referencia: 'PAY-1731628800000-011',
    estado: 'aprobado',
    tipo: 'general',
  },
  {
    id_pago: 12,
    monto: 75.00,
    metodo: 'efectivo',
    fecha: '2025-11-15',
    referencia: 'PAY-1731628800000-012',
    estado: 'aprobado',
    tipo: 'general',
  },
  {
    id_pago: 13,
    monto: 380.25,
    metodo: 'transferencia',
    fecha: '2025-11-16',
    referencia: 'PAY-1731715200000-013',
    estado: 'pendiente',
    tipo: 'general',
  },
  {
    id_pago: 14,
    monto: 220.00,
    metodo: 'tarjeta',
    fecha: '2025-11-17',
    referencia: 'PAY-1731801600000-014',
    estado: 'aprobado',
    tipo: 'general',
  },
  {
    id_pago: 15,
    monto: 150.75,
    metodo: 'efectivo',
    fecha: '2025-11-18',
    referencia: 'PAY-1731888000000-015',
    estado: 'rechazado',
    tipo: 'general',
  },
  // Pagos de consignación
  {
    id_pago: 16,
    id_consignacion: 1,
    monto: 2250.00,
    metodo: 'transferencia',
    fecha: '2025-11-20',
    referencia: 'CON-1732060800000-001',
    estado: 'aprobado',
    tipo: 'consignacion',
  },
  {
    id_pago: 17,
    id_consignacion: 1,
    monto: 2250.00,
    metodo: 'efectivo',
    fecha: '2025-11-22',
    referencia: 'CON-1732233600000-002',
    estado: 'anulado',
    tipo: 'consignacion',
    motivo_anulacion: 'Error en el monto consignado, se generará un nuevo pago con el monto correcto.',
    fecha_anulacion: '2025-11-23',
  },
];

export const mockVentas: Venta[] = [
  {
    id_venta: 1,
    id_cliente: 1,
    id_usuario: 2,
    fecha: '2025-11-05',
    total: 79.48,
    estado: 'pagada',
  },
  {
    id_venta: 2,
    id_cliente: 2,
    id_usuario: 2,
    fecha: '2025-11-06',
    total: 48.49,
    estado: 'pendiente',
  },
  {
    id_venta: 3,
    id_cliente: 3,
    id_usuario: 3,
    fecha: '2025-11-07',
    total: 91.98,
    estado: 'pagada',
  },
  {
    id_venta: 4,
    id_cliente: undefined,
    id_usuario: 2,
    fecha: '2025-11-08',
    total: 34.49,
    estado: 'cancelada',
  },
  {
    id_venta: 5,
    id_cliente: 4,
    id_usuario: 3,
    fecha: '2025-11-09',
    total: 120.00,
    estado: 'pagada',
  },
  {
    id_venta: 6,
    id_cliente: 1,
    id_usuario: 2,
    fecha: '2025-11-10',
    total: 87.96,
    estado: 'pendiente',
  },
  {
    id_venta: 7,
    id_cliente: undefined,
    id_usuario: 3,
    fecha: '2025-11-11',
    total: 156.47,
    estado: 'pagada',
  },
  {
    id_venta: 8,
    id_cliente: 2,
    id_usuario: 2,
    fecha: '2025-11-12',
    total: 75.96,
    estado: 'pagada',
  },
];

export const mockVentasDetalle: VentaProductoDetalle[] = [
  // Venta 1 - Pomada + Gel Fijador + Agua
  {
    id_venta_prod_detalle: 1,
    id_venta: 1,
    id_producto: 1,
    cantidad: 2,
    precio_unitario: 15.99,
    subtotal: 31.98,
  },
  {
    id_venta_prod_detalle: 2,
    id_venta: 1,
    id_producto: 2,
    cantidad: 3,
    precio_unitario: 12.99,
    subtotal: 38.97,
  },
  {
    id_venta_prod_detalle: 3,
    id_venta: 1,
    id_producto: 17,
    cantidad: 2,
    precio_unitario: 1.00,
    subtotal: 2.00,
  },
  {
    id_venta_prod_detalle: 4,
    id_venta: 1,
    id_producto: 16,
    cantidad: 2,
    precio_unitario: 1.50,
    subtotal: 3.00,
  },
  {
    id_venta_prod_detalle: 5,
    id_venta: 1,
    id_producto: 20,
    cantidad: 1,
    precio_unitario: 3.00,
    subtotal: 3.00,
  },

  // Venta 2 - Aceite para Barba + Cepillo
  {
    id_venta_prod_detalle: 6,
    id_venta: 2,
    id_producto: 3,
    cantidad: 2,
    precio_unitario: 18.50,
    subtotal: 37.00,
  },
  {
    id_venta_prod_detalle: 7,
    id_venta: 2,
    id_producto: 14,
    cantidad: 1,
    precio_unitario: 6.99,
    subtotal: 6.99,
  },
  {
    id_venta_prod_detalle: 8,
    id_venta: 2,
    id_producto: 19,
    cantidad: 2,
    precio_unitario: 2.25,
    subtotal: 4.50,
  },

  // Venta 3 - Bálsamo + Shampoo + Talco
  {
    id_venta_prod_detalle: 9,
    id_venta: 3,
    id_producto: 4,
    cantidad: 2,
    precio_unitario: 16.99,
    subtotal: 33.98,
  },
  {
    id_venta_prod_detalle: 10,
    id_venta: 3,
    id_producto: 6,
    cantidad: 3,
    precio_unitario: 11.99,
    subtotal: 35.97,
  },
  {
    id_venta_prod_detalle: 11,
    id_venta: 3,
    id_producto: 13,
    cantidad: 1,
    precio_unitario: 8.50,
    subtotal: 8.50,
  },
  {
    id_venta_prod_detalle: 12,
    id_venta: 3,
    id_producto: 17,
    cantidad: 3,
    precio_unitario: 1.00,
    subtotal: 3.00,
  },
  {
    id_venta_prod_detalle: 13,
    id_venta: 3,
    id_producto: 18,
    cantidad: 2,
    precio_unitario: 1.50,
    subtotal: 3.00,
  },
  {
    id_venta_prod_detalle: 14,
    id_venta: 3,
    id_producto: 19,
    cantidad: 3,
    precio_unitario: 2.25,
    subtotal: 6.75,
  },

  // Venta 4 - Cera para Bigote + Loción
  {
    id_venta_prod_detalle: 15,
    id_venta: 4,
    id_producto: 5,
    cantidad: 1,
    precio_unitario: 14.50,
    subtotal: 14.50,
  },
  {
    id_venta_prod_detalle: 16,
    id_venta: 4,
    id_producto: 7,
    cantidad: 1,
    precio_unitario: 13.99,
    subtotal: 13.99,
  },
  {
    id_venta_prod_detalle: 17,
    id_venta: 4,
    id_producto: 16,
    cantidad: 2,
    precio_unitario: 1.50,
    subtotal: 3.00,
  },
  {
    id_venta_prod_detalle: 18,
    id_venta: 4,
    id_producto: 20,
    cantidad: 1,
    precio_unitario: 3.00,
    subtotal: 3.00,
  },

  // Venta 5 - Máquina Cortapelo
  {
    id_venta_prod_detalle: 19,
    id_venta: 5,
    id_producto: 10,
    cantidad: 1,
    precio_unitario: 120.00,
    subtotal: 120.00,
  },

  // Venta 6 - Cera Moldeadora + Gel Wet + Bebidas
  {
    id_venta_prod_detalle: 20,
    id_venta: 6,
    id_producto: 22,
    cantidad: 2,
    precio_unitario: 19.99,
    subtotal: 39.98,
  },
  {
    id_venta_prod_detalle: 21,
    id_venta: 6,
    id_producto: 23,
    cantidad: 2,
    precio_unitario: 14.99,
    subtotal: 29.98,
  },
  {
    id_venta_prod_detalle: 22,
    id_venta: 6,
    id_producto: 17,
    cantidad: 5,
    precio_unitario: 1.00,
    subtotal: 5.00,
  },
  {
    id_venta_prod_detalle: 23,
    id_venta: 6,
    id_producto: 16,
    cantidad: 3,
    precio_unitario: 1.50,
    subtotal: 4.50,
  },
  {
    id_venta_prod_detalle: 24,
    id_venta: 6,
    id_producto: 20,
    cantidad: 3,
    precio_unitario: 3.00,
    subtotal: 9.00,
  },

  // Venta 7 - Navaja + Brocha + Crema de Afeitar + Productos varios
  {
    id_venta_prod_detalle: 25,
    id_venta: 7,
    id_producto: 8,
    cantidad: 2,
    precio_unitario: 45.00,
    subtotal: 90.00,
  },
  {
    id_venta_prod_detalle: 26,
    id_venta: 7,
    id_producto: 11,
    cantidad: 1,
    precio_unitario: 22.00,
    subtotal: 22.00,
  },
  {
    id_venta_prod_detalle: 27,
    id_venta: 7,
    id_producto: 12,
    cantidad: 3,
    precio_unitario: 10.99,
    subtotal: 32.97,
  },
  {
    id_venta_prod_detalle: 28,
    id_venta: 7,
    id_producto: 17,
    cantidad: 4,
    precio_unitario: 1.00,
    subtotal: 4.00,
  },
  {
    id_venta_prod_detalle: 29,
    id_venta: 7,
    id_producto: 18,
    cantidad: 2,
    precio_unitario: 1.50,
    subtotal: 3.00,
  },
  {
    id_venta_prod_detalle: 30,
    id_venta: 7,
    id_producto: 21,
    cantidad: 1,
    precio_unitario: 4.50,
    subtotal: 4.50,
  },

  // Venta 8 - Tijeras + Peine + Talco
  {
    id_venta_prod_detalle: 31,
    id_venta: 8,
    id_producto: 9,
    cantidad: 1,
    precio_unitario: 65.00,
    subtotal: 65.00,
  },
  {
    id_venta_prod_detalle: 32,
    id_venta: 8,
    id_producto: 15,
    cantidad: 1,
    precio_unitario: 8.99,
    subtotal: 8.99,
  },
  {
    id_venta_prod_detalle: 33,
    id_venta: 8,
    id_producto: 13,
    cantidad: 2,
    precio_unitario: 8.50,
    subtotal: 17.00,
  },
  {
    id_venta_prod_detalle: 34,
    id_venta: 8,
    id_producto: 19,
    cantidad: 1,
    precio_unitario: 2.50,
    subtotal: 2.50,
  },
];