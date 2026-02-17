import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { CreditCard, Plus, Search, Eye, FileDown, DollarSign, CheckCircle2, XCircle, Clock, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Ban, Printer, Package2, Pencil } from 'lucide-react';
import { mockPagos, mockConsignaciones, mockProductos, mockProveedores, Pago, ConsignacionProveedor } from '../../shared/lib/mockData';
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

// Calcular monto de pago para una consignación
const calcularMontoConsignacion = (consignacion: ConsignacionProveedor): number => {
  return consignacion.cantidad_vendida * consignacion.precio_proveedor;
};

export function PagosView() {
  const { user } = useAuth();
  const [pagos, setPagos] = useState<Pago[]>(mockPagos);
  const [consignaciones] = useState<ConsignacionProveedor[]>(mockConsignaciones);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [anularDialogOpen, setAnularDialogOpen] = useState(false);
  const [generarPagoDialogOpen, setGenerarPagoDialogOpen] = useState(false);
  const [viewingPago, setViewingPago] = useState<Pago | null>(null);
  const [pagoToAnular, setPagoToAnular] = useState<Pago | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [consignacionParaPago, setConsignacionParaPago] = useState<ConsignacionProveedor | null>(null);
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTermPendientes, setSearchTermPendientes] = useState('');
  const [activeTab, setActiveTab] = useState('consignados');

  // Estados para creación y edición
  const [editorDialogOpen, setEditorDialogOpen] = useState(false);
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
  // 1. Consignaciones que no tienen un pago aprobado
  const consignacionesSinPago = consignaciones.filter(c => {
    const tienePagoAprobado = pagos.some(
      p => p.id_consignacion === c.id_consignacion &&
        p.tipo === 'consignacion' &&
        p.estado === 'aprobado'
    );
    return !tienePagoAprobado && c.cantidad_vendida > 0;
  });

  // 2. Pagos que están en estado pendiente
  const pagosPendientes = pagos.filter(p => p.tipo === 'consignacion' && p.estado === 'pendiente');

  // Filtrado para la pestaña de pendientes (aplica a consignaciones y pagos pendientes)
  const filteredConsignacionesPendientes = consignacionesSinPago.filter(c => {
    if (!searchTermPendientes) return true;
    const term = searchTermPendientes.toLowerCase();
    const producto = mockProductos.find(p => p.id_producto === c.id_producto)?.nombre || '';
    const proveedor = mockProveedores.find(p => p.id_proveedor === c.id_proveedor)?.nombre || '';
    const monto = calcularMontoConsignacion(c).toString();

    return producto.toLowerCase().includes(term) ||
      proveedor.toLowerCase().includes(term) ||
      monto.includes(term) ||
      c.id_consignacion.toString().includes(term);
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
  const totalPendientesMonto = consignacionesSinPago.reduce((sum, c) => sum + calcularMontoConsignacion(c), 0) +
    pagosPendientes.reduce((sum, p) => sum + p.monto, 0);
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
    setDetailsDialogOpen(true);
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

  const handleGenerarPago = (consignacion: ConsignacionProveedor) => {
    setConsignacionParaPago(consignacion);
    setMetodoPago('efectivo');
    setGenerarPagoDialogOpen(true);
  };

  const confirmGenerarPago = () => {
    if (consignacionParaPago) {
      const monto = calcularMontoConsignacion(consignacionParaPago);
      const newPago: Pago = {
        id_pago: Math.max(...pagos.map(p => p.id_pago), 0) + 1,
        id_consignacion: consignacionParaPago.id_consignacion,
        monto,
        metodo: metodoPago,
        fecha: new Date().toISOString().split('T')[0],
        referencia: generateConsignacionReference(),
        estado: 'aprobado',
        tipo: 'consignacion',
      };
      setPagos([...pagos, newPago]);
      toast.success(`Pago de consignación generado exitosamente por $${monto.toFixed(2)}`, {
        style: { background: '#10b981', color: '#fff' }
      });
    }
    setGenerarPagoDialogOpen(false);
    setConsignacionParaPago(null);
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
    setEditorDialogOpen(true);
  };

  const handleEdit = (pago: Pago) => {
    setEditingPago(pago);
    setFormData({ ...pago });
    setFormErrors({});
    setEditorDialogOpen(true);
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
    setEditorDialogOpen(false);
  };

  const handlePrint = (pago: Pago) => {
    const consignacion = pago.id_consignacion
      ? consignaciones.find(c => c.id_consignacion === pago.id_consignacion)
      : null;
    const producto = consignacion
      ? mockProductos.find(p => p.id_producto === consignacion.id_producto)?.nombre || 'N/A'
      : 'N/A';
    const proveedor = consignacion
      ? mockProveedores.find(p => p.id_proveedor === consignacion.id_proveedor)?.nombre || 'N/A'
      : 'N/A';

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
          .info-item label { display: block; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
          .info-item span { font-size: 16px; font-weight: 600; }
          .amount { text-align: center; padding: 24px; background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%); color: white; border-radius: 12px; margin: 24px 0; }
          .amount label { display: block; font-size: 14px; opacity: 0.9; margin-bottom: 4px; }
          .amount span { font-size: 36px; font-weight: 700; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
          .status-aprobado { background: #dcfce7; color: #166534; }
          .status-anulado { background: #fef2f2; color: #991b1b; }
          .status-pendiente { background: #fef9c3; color: #854d0e; }
          .status-rechazado { background: #fef2f2; color: #991b1b; }
          .anulacion { margin-top: 20px; padding: 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; }
          .anulacion h3 { color: #dc2626; margin: 0 0 8px; font-size: 14px; }
          .anulacion p { margin: 0; color: #7f1d1d; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; }
          @media print { body { padding: 20px; } }
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
            <label>Método de Pago</label>
            <span>${pago.metodo === 'efectivo' ? 'Efectivo' : pago.metodo === 'tarjeta' ? 'Tarjeta' : 'Transferencia'}</span>
          </div>
          <div class="info-item">
            <label>Estado</label>
            <span class="status status-${pago.estado}">${pago.estado.charAt(0).toUpperCase() + pago.estado.slice(1)}</span>
          </div>
          ${consignacion ? `
          <div class="info-item">
            <label>Producto</label>
            <span>${producto}</span>
          </div>
          <div class="info-item">
            <label>Proveedor</label>
            <span>${proveedor}</span>
          </div>
          ` : ''}
        </div>
        <div class="amount">
          <label>Monto Total</label>
          <span>$${pago.monto.toFixed(2)}</span>
        </div>
        ${pago.estado === 'anulado' ? `
        <div class="anulacion">
          <h3>⚠️ Pago Anulado</h3>
          <p><strong>Motivo:</strong> ${pago.motivo_anulacion}</p>
          <p><strong>Fecha de anulación:</strong> ${pago.fecha_anulacion ? new Date(pago.fecha_anulacion + 'T00:00:00').toLocaleDateString('es-ES') : 'N/A'}</p>
        </div>
        ` : ''}
        <div class="footer">
          <p>Documento generado el ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          <p>Este comprobante es válido como constancia de pago</p>
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
            <Badge variant="secondary" className="ml-1 bg-yellow-100 text-yellow-800">{consignacionesSinPago.length}</Badge>
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
                      <TableHead>Referencia</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPaginatedPagos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No se encontraron pagos de consignación
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentPaginatedPagos.map((pago) => (
                        <TableRow key={pago.id_pago} className={pago.estado === 'anulado' ? 'opacity-60' : ''}>
                          <TableCell>#{pago.id_pago}</TableCell>
                          <TableCell className="font-mono text-xs">{pago.referencia || '-'}</TableCell>
                          <TableCell className="font-medium">${pago.monto.toFixed(2)}</TableCell>
                          <TableCell>{getMetodoBadge(pago.metodo)}</TableCell>
                          <TableCell>{new Date(pago.fecha + 'T00:00:00').toLocaleDateString('es-ES')}</TableCell>
                          <TableCell>{getEstadoBadge(pago.estado)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleView(pago)} title="Ver detalles">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEdit(pago)} title="Editar pago">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              {isAdmin && pago.estado !== 'anulado' && (
                                <Button variant="outline" size="sm" onClick={() => handleAnular(pago)} title="Anular pago" className="text-red-600 hover:text-red-700 hover:border-red-300">
                                  <Ban className="w-4 h-4" />
                                </Button>
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
                      <TableHead>ID</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Cant. Vendida</TableHead>
                      <TableHead>Precio Proveedor</TableHead>
                      <TableHead>Monto a Pagar</TableHead>
                      <TableHead>Fecha Entrega</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* 1. Mostrar Pagos en estado Pendiente (Filtrados) */}
                    {filteredPagosPendientes.length > 0 && filteredPagosPendientes.map((pago) => {
                      const consignacion = consignaciones.find(c => c.id_consignacion === pago.id_consignacion);
                      return (
                        <TableRow key={`pago-p-${pago.id_pago}`} className="bg-yellow-50/50">
                          <TableCell className="font-medium text-blue-600">P-{pago.id_pago}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{consignacion ? getProductoName(consignacion.id_producto) : 'N/A'}</p>
                              <p className="text-xs text-muted-foreground">{pago.referencia || 'Sin ref'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{consignacion ? getProveedorName(consignacion.id_proveedor) : 'N/A'}</p>
                              <p className="text-xs text-muted-foreground capitalize">{pago.metodo}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {consignacion ? consignacion.cantidad_vendida : 'N/A'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-200 border-amber-200">
                              Pago Pendiente
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-slate-900 text-center">
                            ${pago.monto.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            {pago.fecha}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {isAdmin && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(pago)}
                                  className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                                  title="Aprobar / Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleView(pago)}
                                className="h-8 w-8 p-0"
                                title="Ver detalles"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {/* 2. Mostrar Consignaciones sin pago (Filtradas) */}
                    {filteredConsignacionesPendientes.length === 0 && filteredPagosPendientes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No hay consignaciones ni pagos pendientes {searchTermPendientes ? 'que coincidan con la búsqueda' : ''}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredConsignacionesPendientes.map((consignacion) => {
                        const montoAPagar = calcularMontoConsignacion(consignacion);
                        return (
                          <TableRow key={`cons-${consignacion.id_consignacion}`}>
                            <TableCell className="font-medium">C-{consignacion.id_consignacion}</TableCell>
                            <TableCell>{getProductoName(consignacion.id_producto)}</TableCell>
                            <TableCell>{getProveedorName(consignacion.id_proveedor)}</TableCell>
                            <TableCell className="text-center font-medium">{consignacion.cantidad_vendida}</TableCell>
                            <TableCell className="text-center">${consignacion.precio_proveedor.toFixed(2)}</TableCell>
                            <TableCell className="font-bold text-slate-900 text-center">${montoAPagar.toFixed(2)}</TableCell>
                            <TableCell className="text-center">{consignacion.fecha_entrega}</TableCell>
                            <TableCell className="text-right">
                              {isAdmin && (
                                <Button onClick={() => handleGenerarPago(consignacion)} size="sm" className="bg-[#D4AF37] hover:bg-[#B8941F]">
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

              {(consignacionesSinPago.length > 0 || pagosPendientes.length > 0) && (
                <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800">Atención requerida</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    Tienes {consignacionesSinPago.length} consignación(es) sin pago y {pagosPendientes.length} pago(s) pendiente(s) de aprobación.
                    Monto total estimado: <strong>${totalPendientesMonto.toFixed(2)}</strong>.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Detalles del Pago */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Pago #{viewingPago?.id_pago}</DialogTitle>
            <DialogDescription>Información completa del pago de consignación</DialogDescription>
          </DialogHeader>
          {viewingPago && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ID Pago</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">#{viewingPago.id_pago}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Número de Referencia</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-mono text-sm">{viewingPago.referencia}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Monto</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-2xl font-bold text-green-600">
                      ${viewingPago.monto.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Método de Pago</Label>
                  <div className="p-3 bg-muted rounded-md">
                    {getMetodoBadge(viewingPago.metodo)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p>
                      {new Date(viewingPago.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Estado del Pago</Label>
                  <div className="p-3 bg-muted rounded-md">
                    {getEstadoBadge(viewingPago.estado)}
                  </div>
                </div>

                {viewingPago.id_consignacion && (
                  <>
                    <div className="space-y-2">
                      <Label>Consignación Asociada</Label>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="font-medium">#{viewingPago.id_consignacion}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Producto</Label>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="font-medium">
                          {getProductoName(
                            consignaciones.find(c => c.id_consignacion === viewingPago.id_consignacion)?.id_producto || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {viewingPago.estado === 'aprobado' && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Pago Aprobado</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Este pago ha sido aprobado y procesado exitosamente.
                  </AlertDescription>
                </Alert>
              )}

              {viewingPago.estado === 'anulado' && (
                <Alert className="bg-red-50 border-red-200">
                  <Ban className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Pago Anulado</AlertTitle>
                  <AlertDescription className="text-red-700">
                    <p><strong>Motivo:</strong> {viewingPago.motivo_anulacion}</p>
                    {viewingPago.fecha_anulacion && (
                      <p className="mt-1"><strong>Fecha de anulación:</strong> {new Date(viewingPago.fecha_anulacion + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {viewingPago.estado === 'pendiente' && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800">Pago Pendiente</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    Este pago está pendiente de revisión y aprobación.
                  </AlertDescription>
                </Alert>
              )}

              {viewingPago.estado === 'rechazado' && (
                <Alert className="bg-red-50 border-red-200">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Pago Rechazado</AlertTitle>
                  <AlertDescription className="text-red-700">
                    Este pago ha sido rechazado. Por favor, contacta con el administrador para más información.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => viewingPago && handlePrint(viewingPago)}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={() => setDetailsDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Dialog Generar Pago de Consignación */}
      <Dialog open={generarPagoDialogOpen} onOpenChange={setGenerarPagoDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#D4AF37]" />
              Generar Pago de Consignación
            </DialogTitle>
            <DialogDescription>
              Se generará un pago por la consignación seleccionada. El monto se calcula automáticamente y no es editable.
            </DialogDescription>
          </DialogHeader>

          {consignacionParaPago && (
            <div className="space-y-4 py-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Monto Calculado Automáticamente</AlertTitle>
                <AlertDescription className="text-blue-700">
                  El monto se calcula como: Cantidad Vendida ({consignacionParaPago.cantidad_vendida}) × Precio Proveedor (${consignacionParaPago.precio_proveedor.toFixed(2)})
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Producto</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">{getProductoName(consignacionParaPago.id_producto)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">{getProveedorName(consignacionParaPago.id_proveedor)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Monto a Pagar</Label>
                <div className="p-4 bg-gradient-to-r from-[#D4AF37]/10 to-[#B8941F]/10 border-2 border-[#D4AF37] rounded-lg text-center">
                  <p className="text-3xl font-bold text-slate-900">
                    ${calcularMontoConsignacion(consignacionParaPago).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Monto fijo - No editable</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metodo_pago">
                  Método de Pago <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={metodoPago}
                  onValueChange={(value: any) => setMetodoPago(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={new Date().toISOString().split('T')[0]}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">La fecha se establece automáticamente</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setGenerarPagoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmGenerarPago} className="bg-[#D4AF37] hover:bg-[#B8941F]">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog Registro y Edición de Pago */}
      <Dialog open={editorDialogOpen} onOpenChange={setEditorDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPago ? `Editar Pago #${editingPago.id_pago}` : 'Añadir Nuevo Pago'}
            </DialogTitle>
            <DialogDescription>
              {editingPago
                ? 'Modifica los datos del pago. El monto no es editable para mantener la integridad.'
                : 'Ingresa los datos para registrar un nuevo pago en el sistema.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monto">
                  Monto <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    id="monto"
                    type="text"
                    inputMode="decimal"
                    className={`pl-10 ${editingPago ? 'bg-muted cursor-not-allowed text-slate-900 font-bold' : ''}`}
                    value={formData.monto === undefined ? '' : formData.monto}
                    onChange={(e) => {
                      let val = e.target.value;

                      // Quitar ceros a la izquierda si no es un decimal
                      if (val.length > 1 && val[0] === '0' && val[1] !== '.') {
                        val = val.substring(1);
                      }

                      // Permitir solo números y un punto decimal
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setFormData({
                          ...formData,
                          monto: val === '' ? undefined as unknown as number : val as unknown as number
                        });
                      }
                    }}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setFormData({ ...formData, monto: val });
                      }
                    }}
                    placeholder="0.00"
                    readOnly={!!editingPago}
                  />
                </div>
                {formErrors.monto && <p className="text-xs text-red-500">{formErrors.monto}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha">
                  Fecha <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                />
                {formErrors.fecha && <p className="text-xs text-red-500">{formErrors.fecha}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="metodo">
                  Método de Pago <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.metodo}
                  onValueChange={(value: any) => setFormData({ ...formData, metodo: value })}
                >
                  <SelectTrigger id="metodo">
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
                <Label htmlFor="estado">
                  Estado / Destino <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value: any) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger id="estado">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprobado">Pago consignado (Aprobado)</SelectItem>
                    <SelectItem value="pendiente">Pago por consignar (Pendiente)</SelectItem>
                    <SelectItem value="rechazado">Rechazado</SelectItem>
                    {editingPago?.estado === 'anulado' && <SelectItem value="anulado">Anulado</SelectItem>}
                  </SelectContent>
                </Select>
                {formErrors.estado && <p className="text-xs text-red-500">{formErrors.estado}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">
                Tipo de Pago <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Pago General</SelectItem>
                  <SelectItem value="consignacion">Pago de Consignación</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.tipo && <p className="text-xs text-red-500">{formErrors.tipo}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="referencia">Referencia</Label>
              <Input
                id="referencia"
                placeholder="Ej. PAY-123456789"
                value={formData.referencia || ''}
                onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-[#D4AF37] hover:bg-[#B8941F]">
              {editingPago ? 'Guardar Cambios' : 'Registrar Pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
