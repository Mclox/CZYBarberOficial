import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { CreditCard, Plus, Search, Eye, FileDown, DollarSign, CheckCircle2, XCircle, Clock, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Ban, Printer, Package2, Pencil, ArrowLeft } from 'lucide-react';
import { mockPagos, mockConsignaciones, mockProductos, mockProveedores, mockVentasDetalle, Pago, ConsignacionProveedor, VentaProductoDetalle, Producto, Proveedor } from '../../shared/lib/mockData';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth';
import { exportToExcelXLSX } from '../../shared/lib/exportUtils';

// Función para generar número de referencia único para consignación
const generateConsignacionReference = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `CON-${timestamp}-${random}`;
};

// Función para normalizar y buscar en fechas con múltiples formatos
const searchInDate = (dateStr: string, searchTerm: string): boolean => {
  const term = searchTerm.toLowerCase().trim();

  try {
    const date = new Date(dateStr + 'T00:00:00');

    const ddmmyyyy = date.toLocaleDateString('es-ES');
    if (ddmmyyyy.includes(term)) return true;

    const ddmmyyyyDash = ddmmyyyy.replace(/\//g, '-');
    if (ddmmyyyyDash.includes(term)) return true;

    if (dateStr.includes(term)) return true;

    const monthLong = date.toLocaleDateString('es-ES', { month: 'long' });
    if (monthLong.includes(term)) return true;

    const monthShort = date.toLocaleDateString('es-ES', { month: 'short' });
    if (monthShort.includes(term)) return true;

    const year = date.getFullYear().toString();
    if (year.includes(term)) return true;

    const day = date.getDate().toString();
    if (day === term || day.padStart(2, '0') === term) return true;

    const month = (date.getMonth() + 1).toString();
    if (month === term || month.padStart(2, '0') === term) return true;

    return false;
  } catch {
    return false;
  }
};

// Calcular desglose de pago para una venta de producto en consignación
const calcularDesgloseConsignacion = (detalle: VentaProductoDetalle, producto: Producto, proveedor: Proveedor) => {
  const totalVendido = detalle.subtotal;

  // Prioridad de porcentajes: Producto > Proveedor > Default (30/70)
  const pctBarberia = producto.porcentaje_ganancia_barberia ?? proveedor.porcentaje_ganancia_barberia ?? 30;
  const pctProveedor = producto.porcentaje_pago_proveedor ?? proveedor.porcentaje_pago_proveedor ?? 70;

  const comisionBarberia = totalVendido * (pctBarberia / 100);
  const pagoProveedor = totalVendido * (pctProveedor / 100);

  return {
    totalVendido,
    comisionBarberia,
    pagoProveedor,
    pctBarberia,
    pctProveedor
  };
};

export function PagosView() {
  const { user } = useAuth();
  const [pagos, setPagos] = useState<Pago[]>(mockPagos);
  const [consignaciones] = useState<ConsignacionProveedor[]>(mockConsignaciones);
  const [ventasDetalle, setVentasDetalle] = useState<VentaProductoDetalle[]>(
    mockVentasDetalle.map(d => {
      const prod = mockProductos.find(p => p.id_producto === d.id_producto);
      if (prod?.tipo_adquisicion === 'consignacion' && !d.estado_consignacion) {
        return { ...d, estado_consignacion: 'pendiente_consignar' };
      }
      return d;
    })
  );
  const [currentView, setCurrentView] = useState<'list' | 'generate' | 'editor' | 'details'>('list');
  const [anularDialogOpen, setAnularDialogOpen] = useState(false);
  const [viewingPago, setViewingPago] = useState<Pago | null>(null);
  const [pagoToAnular, setPagoToAnular] = useState<Pago | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [detalleParaPago, setDetalleParaPago] = useState<VentaProductoDetalle | null>(null);
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'no_definido'>('no_definido');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTermPendientes, setSearchTermPendientes] = useState('');
  const [activeTab, setActiveTab] = useState('consignados');
  const [mesPago, setMesPago] = useState<string>(new Date().toLocaleString('es-ES', { month: 'long' }).toLowerCase());

  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  // Estados para creación y edición
  const [editingPago, setEditingPago] = useState<Pago | null>(null);
  const [formData, setFormData] = useState<Partial<Pago>>({
    monto: undefined as unknown as number, // Permitir campo vacío inicialmente
    metodo: 'efectivo',
    fecha: new Date().toISOString().split('T')[0],
    referencia: '',
    estado: 'pendiente',
    tipo: 'consignacion',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Estados de paginación - Consignados
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Permisos basados en rol
  const isAdmin = user?.id_rol === 1;

  // --- Filtrado de pagos consignados (Pestaña 1) ---
  const pagosConsignadosTab = pagos.filter(p => p.tipo === 'consignacion' && p.estado !== 'pendiente');

  const filteredPagosConsignacion = pagosConsignadosTab.filter(pago => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const cleanTerm = term.replace('#', '').trim();
    const idPago = pago.id_pago.toString();
    const monto = pago.monto.toString();

    const metodoTexto = pago.metodo === 'efectivo' ? 'efectivo' :
      pago.metodo === 'tarjeta' ? 'tarjeta' : 'transferencia';
    const estadoTexto = pago.estado;

    return metodoTexto.includes(term) ||
      estadoTexto.includes(term) ||
      idPago.includes(cleanTerm) ||
      searchInDate(pago.fecha, term) ||
      pago.referencia?.toLowerCase().includes(term) ||
      monto.includes(term);
  });

  // --- Pendientes por Consignar (Pestaña 2) ---
  // 1. Detalles de venta (productos en consignación) que no han sido consignados
  const ventasPendientesConsignar = ventasDetalle.filter(detalle => {
    const prod = mockProductos.find(p => p.id_producto === detalle.id_producto);
    return prod?.tipo_adquisicion === 'consignacion' && detalle.estado_consignacion === 'pendiente_consignar';
  });

  // Agrupación de ventas pendientes por proveedor (para visualización)
  const groupedVentasPendientes = ventasPendientesConsignar.reduce((acc, current) => {
    const prod = mockProductos.find(p => p.id_producto === current.id_producto);
    const provId = mockConsignaciones.find(c => c.id_producto === current.id_producto)?.id_proveedor;

    if (!provId) return acc;

    if (!acc[provId]) {
      acc[provId] = {
        id_proveedor: provId,
        productos: [],
        total_pago: 0,
        cantidad_items: 0,
        fecha_min: current.id_venta // Usaremos el ID de venta como referencia temporal si no hay fecha
      };
    }

    const prov = mockProveedores.find(p => p.id_proveedor === provId);
    if (prod && prov) {
      const { pagoProveedor } = calcularDesgloseConsignacion(current, prod, prov);
      acc[provId].productos.push({
        ...current,
        nombre_producto: prod.nombre,
        pago_individual: pagoProveedor
      });
      acc[provId].total_pago += pagoProveedor;
      acc[provId].cantidad_items += current.cantidad;
    }

    return acc;
  }, {} as Record<number, any>);

  const listadoGruposPendientes = Object.values(groupedVentasPendientes);

  // 2. Pagos que están en estado pendiente
  const pagosPendientes = pagos.filter(p => p.tipo === 'consignacion' && p.estado === 'pendiente');

  // Filtrado para la pestaña de pendientes
  const filteredGruposPendientes = listadoGruposPendientes.filter((grupo: any) => {
    if (!searchTermPendientes) return true;
    const term = searchTermPendientes.toLowerCase();
    const proveedor = mockProveedores.find(p => p.id_proveedor === grupo.id_proveedor)?.nombre || '';

    return proveedor.toLowerCase().includes(term) ||
      grupo.productos.some((p: any) => p.nombre_producto.toLowerCase().includes(term));
  });

  const filteredPagosPendientes = pagosPendientes.filter(pago => {
    if (!searchTermPendientes) return true;
    const term = searchTermPendientes.toLowerCase();
    const cleanTerm = term.replace('#', '').trim();
    const idPago = pago.id_pago.toString();
    const monto = pago.monto.toString();

    const metodoTexto = pago.metodo === 'efectivo' ? 'efectivo' :
      pago.metodo === 'tarjeta' ? 'tarjeta' : 'transferencia';

    // Obtener info de la consignación asociada para el filtro
    const cons = consignaciones.find(c => c.id_consignacion === pago.id_consignacion);
    const producto = cons ? mockProductos.find(p => p.id_producto === cons.id_producto)?.nombre || '' : '';
    const proveedor = cons ? mockProveedores.find(p => p.id_proveedor === cons.id_proveedor)?.nombre || '' : '';

    return metodoTexto.includes(term) ||
      idPago.includes(cleanTerm) ||
      searchInDate(pago.fecha, term) ||
      pago.referencia?.toLowerCase().includes(term) ||
      monto.includes(term) ||
      producto.toLowerCase().includes(term) ||
      proveedor.toLowerCase().includes(term);
  });

  // --- Totales ---
  const totalConsignados = filteredPagosConsignacion.reduce((sum, p) => sum + p.monto, 0);
  const totalAprobados = filteredPagosConsignacion.filter(p => p.estado === 'aprobado').reduce((sum, p) => sum + p.monto, 0);
  const totalPendientesMonto = ventasPendientesConsignar.reduce((sum, d) => {
    const prod = mockProductos.find(p => p.id_producto === d.id_producto);
    const provId = mockConsignaciones.find(c => c.id_producto === d.id_producto)?.id_proveedor;
    const prov = mockProveedores.find(p => p.id_proveedor === provId);
    if (prod && prov) {
      return sum + calcularDesgloseConsignacion(d, prod, prov).pagoProveedor;
    }
    return sum;
  }, 0) + pagosPendientes.reduce((sum, p) => sum + p.monto, 0);
  const totalAnulados = filteredPagosConsignacion.filter(p => p.estado === 'anulado').reduce((sum, p) => sum + p.monto, 0);

  // Paginación
  const totalPages = Math.ceil(filteredPagosConsignacion.length / itemsPerPage);
  const currentPaginatedPagos = filteredPagosConsignacion.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
    setCurrentPage(1);
  };

  const handleSearchPendientes = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTermPendientes(e.target.value.toLowerCase());
  };

  const handleExport = () => {
    const dataToExport = pagosConsignadosTab.map((pago: Pago) => ({
      'ID': pago.id_pago,
      'Referencia': pago.referencia || 'N/A',
      'Monto': `$${pago.monto.toFixed(2)}`,
      'Método de Pago': pago.metodo === 'efectivo' ? 'Efectivo' : pago.metodo === 'tarjeta' ? 'Tarjeta' : 'Transferencia',
      'Fecha': new Date(pago.fecha + 'T00:00:00').toLocaleDateString('es-ES'),
      'Estado': pago.estado === 'aprobado' ? 'Aprobado' : pago.estado === 'anulado' ? 'Anulado' : pago.estado === 'rechazado' ? 'Rechazado' : 'Pendiente',
      'Motivo Anulación': pago.motivo_anulacion || '',
    }));

    const fechaActual = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    exportToExcelXLSX(dataToExport, `Pagos_Consignacion_${fechaActual}`, 'Pagos');

    toast.success('Archivo Excel descargado exitosamente', {
      style: { background: '#10b981', color: '#fff' }
    });
  };

  const handleView = (pago: Pago) => {
    setViewingPago(pago);
    setCurrentView('details');
  };

  const handleAnular = (pago: Pago) => {
    setPagoToAnular(pago);
    setMotivoAnulacion('');
    setAnularDialogOpen(true);
  };

  const confirmAnular = () => {
    if (pagoToAnular && motivoAnulacion.trim()) {
      const updated = pagos.map(p =>
        p.id_pago === pagoToAnular.id_pago
          ? {
            ...p,
            estado: 'anulado' as const,
            motivo_anulacion: motivoAnulacion.trim(),
            fecha_anulacion: new Date().toISOString().split('T')[0],
          }
          : p
      );
      setPagos(updated);

      // Si es un pago de consignación con IDs específicos rescatados, usarlos
      if (pagoToAnular.tipo === 'consignacion' && pagoToAnular.ids_productos_consignacion) {
        setVentasDetalle(prev => prev.map(d =>
          pagoToAnular.ids_productos_consignacion?.includes(d.id_venta_prod_detalle)
            ? { ...d, estado_consignacion: 'pendiente_consignar' }
            : d
        ));
      } else if (pagoToAnular.tipo === 'consignacion' && pagoToAnular.id_proveedor) {
        // Fallback: Si no tiene IDs (pagos antiguos), revertir por proveedor y mes
        setVentasDetalle(prev => prev.map(d => {
          const provId = mockConsignaciones.find(c => c.id_producto === d.id_producto)?.id_proveedor;
          return (provId === pagoToAnular.id_proveedor && d.estado_consignacion === 'consignado')
            ? { ...d, estado_consignacion: 'pendiente_consignar' }
            : d;
        }));
      }

      toast.success('Pago anulado correctamente', {
        style: { background: '#10b981', color: '#fff' }
      });
    } else if (!motivoAnulacion.trim()) {
      toast.error('Debes indicar el motivo de la anulación', {
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }
    setAnularDialogOpen(false);
    setPagoToAnular(null);
    setMotivoAnulacion('');
  };

  // Nueva función para generar pago por proveedor (agrupado)
  const [grupoParaPago, setGrupoParaPago] = useState<any | null>(null);

  const handleGenerarPagoProveedor = (grupo: any) => {
    setGrupoParaPago(grupo);
    setMetodoPago('no_definido');
    setCurrentView('generate');
    window.scrollTo(0, 0);
  };

  const confirmGenerarPago = () => {
    if (grupoParaPago) {
      const proveedor = mockProveedores.find(p => p.id_proveedor === grupoParaPago.id_proveedor);

      if (!proveedor) {
        toast.error('Error: No se encontró información del proveedor');
        return;
      }

      const newPago: Pago = {
        id_pago: Math.max(...pagos.map(p => p.id_pago), 0) + 1,
        id_proveedor: proveedor.id_proveedor,
        monto: grupoParaPago.total_pago,
        metodo: metodoPago,
        fecha: new Date().toISOString().split('T')[0],
        referencia: generateConsignacionReference(),
        estado: 'aprobado',
        tipo: 'consignacion',
        mes: mesPago,
        cantidad_vendida: grupoParaPago.cantidad_items,
        pago_proveedor: grupoParaPago.total_pago,
        ids_productos_consignacion: grupoParaPago.productos.map((p: any) => p.id_venta_prod_detalle)
      };

      // Actualizar estado de TODOS los detalles de venta del grupo a "consignado"
      const detailIdsInGroup = grupoParaPago.productos.map((p: any) => p.id_venta_prod_detalle);
      setVentasDetalle(prev => prev.map(d =>
        detailIdsInGroup.includes(d.id_venta_prod_detalle)
          ? { ...d, estado_consignacion: 'consignado' }
          : d
      ));

      setPagos([...pagos, newPago]);
      toast.success(`Pago de consignación generado exitosamente por $${grupoParaPago.total_pago.toFixed(2)}`, {
        style: { background: '#10b981', color: '#fff' }
      });
      setCurrentView('list');
    }
    setGrupoParaPago(null);
  };

  const handleCreate = () => {
    setEditingPago(null);
    setFormData({
      monto: 0,
      metodo: 'efectivo',
      fecha: new Date().toISOString().split('T')[0],
      referencia: '',
      estado: 'pendiente',
      tipo: 'consignacion',
    });
    setFormErrors({});
    setCurrentView('editor');
    window.scrollTo(0, 0);
  };

  const handleEdit = (pago: Pago) => {
    setEditingPago(pago);
    setFormData({ ...pago });
    setFormErrors({});
    setCurrentView('editor');
    window.scrollTo(0, 0);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.monto || formData.monto <= 0) errors.monto = 'El monto debe ser mayor a 0';
    if (!formData.fecha) errors.fecha = 'La fecha es obligatoria';
    if (!formData.metodo) errors.metodo = 'El método de pago es obligatorio';
    if (!formData.estado) errors.estado = 'El estado es obligatorio';
    if (!formData.tipo) errors.tipo = 'El tipo de pago es obligatorio';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.error('Por favor, corrige los errores en el formulario');
      return;
    }

    // Asegurar que el monto sea un número (puede venir como string desde el input text)
    const sanitizedData = {
      ...formData,
      monto: typeof formData.monto === 'string' ? parseFloat(formData.monto) : formData.monto
    };

    if (editingPago) {
      // Actualizar pago existente
      const updatedPagos = pagos.map(p =>
        p.id_pago === editingPago.id_pago ? { ...p, ...sanitizedData } as Pago : p
      );
      setPagos(updatedPagos);
      toast.success('Pago actualizado correctamente');
    } else {
      // Crear nuevo pago
      const newPago: Pago = {
        ...sanitizedData,
        id_pago: Math.max(...pagos.map(p => p.id_pago), 0) + 1,
      } as Pago;
      setPagos([...pagos, newPago]);
      setCurrentPage(1); // Reset to page 1 to ensure visibility
      toast.success('Pago registrado correctamente');
    }
    setCurrentView('list');
  };

  const handleBack = () => {
    setCurrentView('list');
    setEditingPago(null);
    setDetalleParaPago(null);
    setViewingPago(null);
    setFormData({
      monto: undefined as unknown as number,
      metodo: 'efectivo',
      fecha: new Date().toISOString().split('T')[0],
      referencia: '',
      estado: 'pendiente',
      tipo: 'consignacion',
    });
    window.scrollTo(0, 0);
  };

  const handlePrint = (pago: Pago) => {
    const producto = pago.id_producto ? mockProductos.find(p => p.id_producto === pago.id_producto)?.nombre : 'N/A';
    const proveedor = pago.id_proveedor ? mockProveedores.find(p => p.id_proveedor === pago.id_proveedor)?.nombre : 'N/A';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprobante de Pago #${pago.id_pago}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; }
          .header { text-align: center; border-bottom: 3px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #D4AF37; margin: 0; font-size: 28px; }
          .header p { color: #666; margin: 5px 0 0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .info-item { padding: 12px; background: #f8f8f8; border-radius: 8px; border-left: 4px solid #D4AF37; }
          .info-item label { display: block; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
          .info-item span { font-size: 14px; font-weight: 600; }
          .breakdown { margin: 24px 0; border: 1px solid #eee; border-radius: 12px; overflow: hidden; }
          .breakdown-row { display: flex; justify-content: space-between; padding: 12px 20px; border-bottom: 1px solid #eee; }
          .breakdown-row:last-child { border-bottom: none; background: #fcfcfc; }
          .breakdown-row.total { background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%); color: white; font-weight: bold; font-size: 18px; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
          .status-aprobado { background: #dcfce7; color: #166534; }
          .status-anulado { background: #fef2f2; color: #991b1b; }
          .anulacion { margin-top: 20px; padding: 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Comprobante de Pago</h1>
          <p>Pago de Consignación #${pago.id_pago}</p>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <label>Referencia</label>
            <span>${pago.referencia || 'N/A'}</span>
          </div>
          <div class="info-item">
            <label>Fecha</label>
            <span>${new Date(pago.fecha + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div class="info-item">
            <label>Venta Asociada</label>
            <span>V-${pago.id_venta || 'N/A'}</span>
          </div>
          <div class="info-item">
            <label>Estado</label>
            <span class="status status-${pago.estado}">${pago.estado.charAt(0).toUpperCase() + pago.estado.slice(1)}</span>
          </div>
          <div class="info-item">
            <label>Producto</label>
            <span>${producto}</span>
          </div>
          <div class="info-item">
            <label>Proveedor</label>
            <span>${proveedor}</span>
          </div>
        </div>

        <div class="breakdown">
          <div class="breakdown-row">
            <span>Total Vendido (${pago.cantidad_vendida || 0} und)</span>
            <span>$${pago.total_vendido?.toFixed(2) || '0.00'}</span>
          </div>
          <div class="breakdown-row">
            <span>Comisión Barbería</span>
            <span>- $${pago.comision_barberia?.toFixed(2) || '0.00'}</span>
          </div>
          <div class="breakdown-row total">
            <span>VALOR PAGADO AL PROVEEDOR</span>
            <span>$${pago.monto.toFixed(2)}</span>
          </div>
        </div>

        ${pago.estado === 'anulado' ? `
        <div class="anulacion">
          <p><strong>⚠️ Pago Anulado:</strong> ${pago.motivo_anulacion}</p>
        </div>
        ` : ''}
        <div class="footer">
          <p>Documento generado el ${new Date().toLocaleString('es-ES')}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const getMetodoBadge = (metodo: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      efectivo: { bg: 'bg-green-600', text: 'Efectivo' },
      tarjeta: { bg: 'bg-blue-600', text: 'Tarjeta' },
      transferencia: { bg: 'bg-purple-600', text: 'Transferencia' },
    };

    const variant = variants[metodo] || { bg: 'bg-gray-600', text: metodo };

    return (
      <Badge className={variant.bg}>
        {variant.text}
      </Badge>
    );
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { bg: string; text: string; icon: any }> = {
      aprobado: { bg: 'bg-green-600', text: 'Aprobado', icon: CheckCircle2 },
      rechazado: { bg: 'bg-red-600', text: 'Rechazado', icon: XCircle },
      pendiente: { bg: 'bg-yellow-600', text: 'Pendiente', icon: Clock },
      anulado: { bg: 'bg-gray-600', text: 'Anulado', icon: Ban },
    };

    const variant = variants[estado] || { bg: 'bg-gray-600', text: estado, icon: AlertCircle };
    const Icon = variant.icon;

    return (
      <Badge className={variant.bg}>
        <Icon className="w-3 h-3 mr-1" />
        {variant.text}
      </Badge>
    );
  };



  const getProductoName = (id: number) => {
    return mockProductos.find(p => p.id_producto === id)?.nombre || 'N/A';
  };

  const getProveedorName = (id: number) => {
    return mockProveedores.find(p => p.id_proveedor === id)?.nombre || 'N/A';
  };

  if (currentView === 'generate' && grupoParaPago) {
    const proveedor = mockProveedores.find(p => p.id_proveedor === grupoParaPago.id_proveedor);

    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2 hover:bg-transparent -ml-2">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium underline">Volver a la lista</span>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#D4AF37] rounded-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Generar Pago de Consignación</h1>
            <p className="text-muted-foreground text-sm">Registro de liquidación consolidada por proveedor</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen de Liquidación Agrupada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">Proveedor Destino</Label>
              <div className="p-4 bg-muted/40 rounded-lg border flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">{proveedor?.nombre}</p>
                  <p className="text-xs text-muted-foreground">NIT: {proveedor?.nit || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30">
                    {grupoParaPago.productos.length} Productos distintos
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold border-b pb-2 flex items-center gap-2">
                <Package2 className="w-4 h-4" /> Productos Incluidos
              </h3>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-center">Cant.</TableHead>
                      <TableHead className="text-right">Subtotal Venta</TableHead>
                      <TableHead className="text-right text-[#D4AF37]">Monto Proveedor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grupoParaPago.productos.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="text-xs font-medium">{item.nombre_producto}</TableCell>
                        <TableCell className="text-center text-xs">{item.cantidad}</TableCell>
                        <TableCell className="text-right text-xs">${item.subtotal.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-xs font-bold text-[#D4AF37]">${item.pago_individual.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metodo_pago" className="font-bold">
                    Método de Pago <span className="text-red-500">*</span>
                  </Label>
                  <Select value={metodoPago} onValueChange={(value: any) => setMetodoPago(value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecciona un método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_definido">No especificado</SelectItem>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mes_pago" className="font-bold">
                    Mes del Pago <span className="text-red-500">*</span>
                  </Label>
                  <Select value={mesPago} onValueChange={(value: any) => setMesPago(value)}>
                    <SelectTrigger id="mes_pago" className="h-10">
                      <SelectValue placeholder="Selecciona el mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {meses.map((m) => (
                        <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 text-center">
                <Label className="font-bold">Valor Neto a Pagar al Proveedor</Label>
                <div className="p-6 bg-gradient-to-r from-[#D4AF37]/10 to-[#B8941F]/10 border-2 border-[#D4AF37] rounded-lg flex flex-col justify-center items-center h-full">
                  <p className="text-4xl font-extrabold text-slate-900 leading-none">
                    ${grupoParaPago.total_pago.toFixed(2)}
                  </p>
                  <p className="text-xs text-[#D4AF37] font-semibold mt-2 uppercase tracking-wider">Monto Calculado Automáticamente</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 max-w-sm">
              <Label className="font-bold">Fecha de Registro</Label>
              <Input
                type="date"
                value={new Date().toISOString().split('T')[0]}
                readOnly
                className="bg-muted cursor-not-allowed h-10"
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button variant="outline" onClick={handleBack} size="lg">
                Cancelar
              </Button>
              <Button onClick={confirmGenerarPago} className="bg-[#D4AF37] hover:bg-[#B8941F]" size="lg">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Registrar Pago de Consignación
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentView === 'editor') {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2 hover:bg-transparent -ml-2">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium underline">Volver a la lista</span>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#D4AF37] rounded-lg">
            <Pencil className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {editingPago ? `Editar Pago #${editingPago.id_pago}` : 'Registrar Nuevo Pago'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {editingPago ? 'Actualiza la información del pago registrado' : 'Ingresa los detalles para un nuevo desembolso'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Formulario de Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="monto" className="font-bold">
                  Monto <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    id="monto"
                    type="text"
                    inputMode="decimal"
                    className={`pl-10 h-10 ${editingPago ? 'bg-muted cursor-not-allowed font-bold' : ''}`}
                    value={formData.monto === undefined ? '' : formData.monto}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val.length > 1 && val[0] === '0' && val[1] !== '.') val = val.substring(1);
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setFormData({ ...formData, monto: val === '' ? undefined as unknown as number : val as unknown as number });
                      }
                    }}
                    placeholder="0.00"
                    readOnly={!!editingPago}
                  />
                  {editingPago && <p className="text-xs text-muted-foreground mt-1">El monto no es editable por integridad</p>}
                </div>
                {formErrors.monto && <p className="text-xs text-red-500">{formErrors.monto}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha" className="font-bold">
                  Fecha <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fecha"
                  type="date"
                  className="h-10"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                />
                {formErrors.fecha && <p className="text-xs text-red-500">{formErrors.fecha}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="metodo" className="font-bold">
                  Método de Pago <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.metodo} onValueChange={(value: any) => setFormData({ ...formData, metodo: value })}>
                  <SelectTrigger id="metodo" className="h-10">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.metodo && <p className="text-xs text-red-500">{formErrors.metodo}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado" className="font-bold">
                  Estado del registro <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.estado} onValueChange={(value: any) => setFormData({ ...formData, estado: value })}>
                  <SelectTrigger id="estado" className="h-10">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprobado">Aprobado / Pagado</SelectItem>
                    <SelectItem value="pendiente">Pendiente de Procesar</SelectItem>
                    <SelectItem value="rechazado">Rechazado</SelectItem>
                    {editingPago?.estado === 'anulado' && <SelectItem value="anulado">Anulado</SelectItem>}
                  </SelectContent>
                </Select>
                {formErrors.estado && <p className="text-xs text-red-500">{formErrors.estado}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo" className="font-bold">
                  Tipo de Transacción <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger id="tipo" className="h-10">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Gasto General</SelectItem>
                    <SelectItem value="consignacion">Liquidación de Consignación</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.tipo && <p className="text-xs text-red-500">{formErrors.tipo}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="referencia" className="font-bold">Referencia / Comprobante</Label>
                <Input
                  id="referencia"
                  placeholder="Ej. PAY-123456789"
                  className="h-10"
                  value={formData.referencia || ''}
                  onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button variant="outline" onClick={handleBack} size="lg">
                Volver
              </Button>
              <Button onClick={handleSave} className="bg-[#D4AF37] hover:bg-[#B8941F]" size="lg">
                {editingPago ? 'Guardar Cambios' : 'Registrar Pago'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentView === 'details' && viewingPago) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between border-b pb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleBack} className="rounded-full shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-[#D4AF37]" />
                Detalles del Pago #{viewingPago.id_pago}
              </h1>
              <p className="text-muted-foreground mt-1">Información completa y desglose de la liquidación de consignación</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => handlePrint(viewingPago)} className="h-11 px-6 shadow-sm">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Comprobante
            </Button>
            {isAdmin && viewingPago.estado !== 'anulado' && (
              <Button
                variant="destructive"
                onClick={() => handleAnular(viewingPago)}
                className="h-11 px-6 shadow-sm"
              >
                <Ban className="w-4 h-4 mr-2" />
                Anular Pago
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Información General */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-md border-t-4 border-t-[#D4AF37]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">Datos del Registro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-muted/30 p-4 rounded-xl space-y-1">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Referencia</Label>
                    <p className="font-mono text-sm break-all font-semibold">{viewingPago.referencia || 'N/A'}</p>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-xl space-y-1">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Método de Pago</Label>
                    <div className="pt-1">{getMetodoBadge(viewingPago.metodo)}</div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-xl space-y-1">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Fecha de Pago</Label>
                    <p className="font-bold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#D4AF37]" />
                      {new Date(viewingPago.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-xl space-y-1">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Estado Actual</Label>
                    <div className="pt-1">{getEstadoBadge(viewingPago.estado)}</div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-xl space-y-1">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Proveedor Beneficiario</Label>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30 text-[#D4AF37] font-bold">
                        {getProveedorName(viewingPago.id_pago || 0).charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{getProveedorName(viewingPago.id_proveedor || 0)}</p>
                        <p className="text-[10px] text-muted-foreground">ID Proveedor: {viewingPago.id_proveedor}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alertas de Estado */}
            <div className="space-y-4">
              {viewingPago.estado === 'aprobado' && (
                <Alert className="bg-green-50 border-green-200 shadow-sm py-6">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div className="ml-2">
                    <AlertTitle className="text-green-800 font-bold text-base">Transacción Confirmada</AlertTitle>
                    <AlertDescription className="text-green-700 mt-1">
                      Este desembolso ha sido procesado y conciliado correctamente en los estados financieros.
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {viewingPago.estado === 'anulado' && (
                <Alert className="bg-red-50 border-red-200 shadow-sm py-6">
                  <Ban className="h-6 w-6 text-red-600" />
                  <div className="ml-2">
                    <AlertTitle className="text-red-800 font-bold text-base">Pago Invalidado</AlertTitle>
                    <AlertDescription className="text-red-700 mt-2 space-y-1">
                      <p><strong>Motivo:</strong> {viewingPago.motivo_anulacion}</p>
                      {viewingPago.fecha_anulacion && (
                        <p className="text-xs pt-2"><strong>Fecha de anulación:</strong> {new Date(viewingPago.fecha_anulacion + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </div>
          </div>

          {/* Columna Derecha: Tabla de Productos y Totales */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg border-none overflow-hidden">
              <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Package2 className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="font-bold text-lg uppercase tracking-tight">Desglose de Productos Liquidados</h3>
                </div>
                <Badge className="bg-[#D4AF37] hover:bg-[#D4AF37] px-4 py-1 text-xs uppercase font-bold tracking-widest">{viewingPago.mes}</Badge>
              </div>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="border-b">
                        <TableHead className="py-4 px-6 font-bold text-xs uppercase text-slate-600">Descripción del Producto</TableHead>
                        <TableHead className="py-4 text-center font-bold text-xs uppercase text-slate-600 w-[100px]">Cantidad</TableHead>
                        <TableHead className="py-4 text-right px-6 font-bold text-xs uppercase text-slate-600 w-[150px]">Monto Proveedor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingPago.ids_productos_consignacion ? (
                        ventasDetalle.filter(d =>
                          viewingPago.ids_productos_consignacion?.includes(d.id_venta_prod_detalle)
                        ).map((d, idx) => {
                          const prod = mockProductos.find(p => p.id_producto === d.id_producto);
                          const prov = mockProveedores.find(p => p.id_proveedor === viewingPago.id_proveedor);
                          const paymentInfo = (prod && prov) ? calcularDesgloseConsignacion(d, prod, prov) : { pagoProveedor: 0 };
                          return (
                            <TableRow key={idx} className="hover:bg-muted/20 transition-colors">
                              <TableCell className="py-4 px-6 font-medium">{prod?.nombre}</TableCell>
                              <TableCell className="py-4 text-center font-semibold text-slate-600">{d.cantidad}</TableCell>
                              <TableCell className="py-4 text-right px-6 font-bold text-[#D4AF37]">${paymentInfo.pagoProveedor.toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        ventasDetalle.filter(d => {
                          const provId = mockConsignaciones.find(c => c.id_producto === d.id_producto)?.id_proveedor;
                          return provId === viewingPago.id_proveedor && d.estado_consignacion === 'consignado';
                        }).map((d, idx) => {
                          const prod = mockProductos.find(p => p.id_producto === d.id_producto);
                          const prov = mockProveedores.find(p => p.id_proveedor === viewingPago.id_proveedor);
                          const paymentInfo = (prod && prov) ? calcularDesgloseConsignacion(d, prod, prov) : { pagoProveedor: 0 };
                          return (
                            <TableRow key={idx} className="hover:bg-muted/20 transition-colors">
                              <TableCell className="py-4 px-6 font-medium">{prod?.nombre}</TableCell>
                              <TableCell className="py-4 text-center font-semibold text-slate-600">{d.cantidad}</TableCell>
                              <TableCell className="py-4 text-right px-6 font-bold text-[#D4AF37]">${paymentInfo.pagoProveedor.toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="p-8 bg-slate-50 border-t space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Unidades Vendidas</p>
                      <p className="text-xl font-bold">{viewingPago.cantidad_vendida || 0} Unds</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Venta Bruta Total</p>
                      <p className="text-xl font-bold">${viewingPago.total_vendido?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Comisión Barbería</p>
                      <p className="text-xl font-bold text-blue-600">- ${viewingPago.comision_barberia?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="space-y-1 bg-[#D4AF37]/10 p-4 rounded-xl border border-[#D4AF37]/20 flex flex-col justify-center">
                      <p className="text-[9px] font-black uppercase text-[#D4AF37] tracking-widest leading-none mb-1">Total a Transferir</p>
                      <p className="text-2xl font-black text-slate-900 leading-none">${viewingPago.monto.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-start">
              <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2 text-muted-foreground hover:text-slate-900">
                <ChevronLeft className="w-4 h-4" />
                Volver al listado de pagos realizados
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <CreditCard className="w-6 h-6" />
            Gestión de pagos en consignación
          </h1>
          <p className="text-muted-foreground">Gestiona los pagos de consignación realizados y pendientes</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreate} className="bg-[#D4AF37] hover:bg-[#B8941F]">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo pago
          </Button>
          <Button onClick={handleExport} variant="outline">
            <FileDown className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-[#D4AF37]/10 to-[#B8941F]/10 border-[#D4AF37]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#D4AF37] rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Consignados</p>
                <p className="text-2xl font-bold text-[#D4AF37]">${totalConsignados.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-600 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aprobados</p>
                <p className="text-2xl font-bold text-green-600">${totalAprobados.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-600 rounded-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">${totalPendientesMonto.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-600 rounded-lg">
                <Ban className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Anulados</p>
                <p className="text-2xl font-bold text-gray-600">${totalAnulados.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="consignados" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Pagos Consignados
            <Badge variant="secondary" className="ml-1">{pagosConsignadosTab.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pendientes" className="flex items-center gap-2">
            <Package2 className="w-4 h-4" />
            Pendientes por Consignar
            <Badge variant="secondary" className="ml-1 bg-yellow-100 text-yellow-800">{ventasPendientesConsignar.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Pagos Consignados */}
        <TabsContent value="consignados">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle>Pagos de Consignación Realizados</CardTitle>
                <div className="w-full md:w-96">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar pagos..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Fecha Pago</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPaginatedPagos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No se encontraron pagos de consignación
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentPaginatedPagos.map((pago) => (
                        <TableRow key={pago.id_pago} className={pago.estado === 'anulado' ? 'opacity-60' : ''}>
                          <TableCell>#{pago.id_pago}</TableCell>
                          <TableCell className="font-bold">{getProveedorName(pago.id_proveedor || 0)}</TableCell>
                          <TableCell className="font-mono text-[10px]">{pago.referencia || '-'}</TableCell>
                          <TableCell className="font-medium">${pago.monto.toFixed(2)}</TableCell>
                          <TableCell>{getMetodoBadge(pago.metodo)}</TableCell>
                          <TableCell className="text-xs">{new Date(pago.fecha + 'T00:00:00').toLocaleDateString('es-ES')}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-[10px] h-5">
                              {pago.mes || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{getEstadoBadge(pago.estado)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleView(pago)} title="Ver detalles">
                                <Eye className="w-4 h-4" />
                              </Button>
                              {isAdmin && pago.estado !== 'anulado' && (
                                <div className="flex gap-2">
                                  {/* Eliminamos el botón de editar para pagos de consignación */}
                                  {pago.tipo !== 'consignacion' && (
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(pago)} title="Editar pago">
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button variant="outline" size="sm" onClick={() => handleAnular(pago)} title="Anular pago" className="text-red-600 hover:text-red-700 hover:border-red-300">
                                    <Ban className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* Paginador */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground px-2">
                      Página
                    </span>
                    <span className="text-sm font-medium px-2 py-1 bg-[#D4AF37] text-white rounded">
                      {currentPage}
                    </span>
                    <span className="text-sm text-muted-foreground px-2">
                      de {totalPages || 1}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Mostrando {filteredPagosConsignacion.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredPagosConsignacion.length)} de {filteredPagosConsignacion.length} registros
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="itemsPerPage" className="text-sm text-muted-foreground">
                    Mostrar:
                  </Label>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(parseInt(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[80px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Pendientes por Consignar */}
        <TabsContent value="pendientes">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle>Consignaciones Pendientes de Pago</CardTitle>
                <div className="w-full md:w-96">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar consignaciones..."
                      value={searchTermPendientes}
                      onChange={handleSearchPendientes}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proveedor</TableHead>
                      <TableHead className="text-center">Cant. Items</TableHead>
                      <TableHead className="text-center">Productos</TableHead>
                      <TableHead className="text-right text-[#D4AF37]">Total a Pagar</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* 1. Mostrar Pagos en estado Pendiente (Filtrados) */}
                    {filteredPagosPendientes.length > 0 && filteredPagosPendientes.map((pago) => {
                      const proveedor = mockProveedores.find(p => p.id_proveedor === pago.id_proveedor);
                      return (
                        <TableRow key={`pago-p-${pago.id_pago}`} className="bg-yellow-50/50">
                          <TableCell>
                            <div>
                              <p className="font-bold">{proveedor?.nombre || 'N/A'}</p>
                              <p className="text-[10px] text-muted-foreground">{pago.referencia || 'Sin ref'}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {pago.cantidad_vendida || 'N/A'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[10px]">
                              Pago Pendiente
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-right text-slate-900">
                            ${pago.monto.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {isAdmin && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(pago)}
                                  className="text-blue-600 h-8 w-8 p-0"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleView(pago)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {/* 2. Mostrar Grupos de Ventas Pendientes (Filtrados) */}
                    {filteredGruposPendientes.length === 0 && filteredPagosPendientes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No hay ventas pendientes por consignar {searchTermPendientes ? 'que coincidan con la búsqueda' : ''}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredGruposPendientes.map((grupo: any) => {
                        const proveedor = mockProveedores.find(p => p.id_proveedor === grupo.id_proveedor);

                        return (
                          <TableRow key={`grupo-${grupo.id_proveedor}`}>
                            <TableCell>
                              <p className="font-bold">{proveedor?.nombre || 'Desconocido'}</p>
                            </TableCell>
                            <TableCell className="text-center font-medium">{grupo.cantidad_items}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col gap-1">
                                {grupo.productos.slice(0, 2).map((p: any, idx: number) => (
                                  <span key={idx} className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                    • {p.nombre_producto}
                                  </span>
                                ))}
                                {grupo.productos.length > 2 && <span className="text-[9px] text-blue-600 font-bold">+{grupo.productos.length - 2} más...</span>}
                              </div>
                            </TableCell>
                            <TableCell className="font-black text-slate-900 text-right">
                              ${grupo.total_pago.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {isAdmin && (
                                <Button onClick={() => handleGenerarPagoProveedor(grupo)} size="sm" className="bg-[#D4AF37] hover:bg-[#B8941F]">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Generar Pago
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {(ventasPendientesConsignar.length > 0 || pagosPendientes.length > 0) && (
                <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800">Atención requerida</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    Tienes {ventasPendientesConsignar.length} venta(s) pendiente(s) por consignar y {pagosPendientes.length} pago(s) pendiente(s) de aprobación.
                    Monto total estimado: <strong>${totalPendientesMonto.toFixed(2)}</strong>.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>



      {/* Dialog Anular Pago */}
      <AlertDialog open={anularDialogOpen} onOpenChange={setAnularDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-600" />
              Anular Pago #{pagoToAnular?.id_pago}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción anulará el pago. El pago no será eliminado pero quedará registrado como anulado.
              Por favor, indica el motivo de la anulación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="motivo_anulacion">
                Motivo de Anulación <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="motivo_anulacion"
                placeholder="Indica el motivo por el cual se anula este pago..."
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                className="min-h-[100px]"
              />
              {motivoAnulacion.trim() === '' && (
                <p className="text-xs text-red-500">El motivo de anulación es obligatorio</p>
              )}
            </div>
            {pagoToAnular && (
              <div className="p-3 bg-muted rounded-md text-sm">
                <p><strong>Monto:</strong> ${pagoToAnular.monto.toFixed(2)}</p>
                <p><strong>Referencia:</strong> {pagoToAnular.referencia}</p>
                <p><strong>Fecha:</strong> {new Date(pagoToAnular.fecha + 'T00:00:00').toLocaleDateString('es-ES')}</p>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAnular}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!motivoAnulacion.trim()}
            >
              <Ban className="w-4 h-4 mr-2" />
              Confirmar Anulación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
