// Simple data store to make mock data mutable across components
import {
  mockRoles,
  mockUsuarios,
  mockProductos,
  mockProveedores,
  mockCompras,
  mockDetalleCompras,
  mockDevoluciones,
  mockDevolucionesProveedor,
  mockConsignaciones,
  mockServicios,
  mockCitas,
  mockEmpleados,
  mockClientes,
  mockClientesTemporales,
  mockPagos,
  mockVentas,
  mockVentasDetalle,
  mockControlesPagoSilla,
  type ClienteTemporal,
  type Cita
} from './mockData';

// Export mutable references to mock data
export const dataStore = {
  roles: mockRoles,
  usuarios: mockUsuarios,
  productos: mockProductos,
  proveedores: mockProveedores,
  compras: mockCompras,
  detalleCompras: mockDetalleCompras,
  devoluciones: mockDevoluciones,
  devolucionesProveedor: mockDevolucionesProveedor,
  consignaciones: mockConsignaciones,
  servicios: mockServicios,
  citas: mockCitas,
  empleados: mockEmpleados,
  clientes: mockClientes,
  clientesTemporales: mockClientesTemporales,
  pagos: mockPagos,
  ventas: mockVentas,
  ventasDetalle: mockVentasDetalle,
  controlesPagoSilla: mockControlesPagoSilla,
};

// Helper functions
export const addClienteTemporal = (cliente: ClienteTemporal) => {
  dataStore.clientesTemporales.push(cliente);
};

export const addCita = (cita: Cita) => {
  dataStore.citas.push(cita);
};

export const getNextClienteTemporalId = () => {
  return Math.max(...dataStore.clientesTemporales.map(c => c.id_cliente_temporal), 0) + 1;
};

export const getNextCitaId = () => {
  return Math.max(...dataStore.citas.map(c => c.id_cita), 0) + 1;
};
