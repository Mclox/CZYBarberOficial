import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { RotateCcw, Plus, FileDown, Eye, Trash2, Search, Package, CheckCircle2, XCircle, Clock, AlertCircle, Pencil, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowRight } from 'lucide-react';
import { Checkbox } from '../../components/ui/checkbox';
import { mockDevoluciones, mockVentasDetalle, mockProductos, Devolucion, Venta, VentaProductoDetalle, Producto } from '../../shared/lib/mockData';
import { dataStore } from '../../shared/lib/dataStore';
import { toast } from 'sonner';
import { exportToExcelXLSX } from '../../shared/lib/exportUtils';

// Función para buscar en fechas con múltiples formatos
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



interface DevolucionesStockViewProps {
  preSelectedSale?: any;
}

export function DevolucionesStockView({ preSelectedSale }: DevolucionesStockViewProps) {
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>(mockDevoluciones);
  const [filteredDevoluciones, setFilteredDevoluciones] = useState<Devolucion[]>(mockDevoluciones);
  const [view, setView] = useState<'list' | 'form' | 'details'>('list');
  const [editingDevolucion, setEditingDevolucion] = useState<Devolucion | null>(null);
  const [viewingDevolucion, setViewingDevolucion] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formProductsPage, setFormProductsPage] = useState(1);
  const formProductsPerPage = 5;

  // Formulario
  const [formData, setFormData] = useState({
    id_venta: '',
    id_cliente: null as number | null,
    items: [] as Array<{
      id_venta_prod_detalle: number;
      selected: boolean;
      cantidad_devuelta: number;
      max_cantidad: number;
      estado_producto: 'bueno' | 'defectuoso' | 'perdida';
      accion_tomada: 'cambio_mismo' | 'cambio_otro' | 'reembolso';
      nombre_producto: string;
      precio_unitario_original: number;
      id_producto_cambio?: number;
      nombre_producto_cambio?: string;
      precio_producto_cambio?: number;
    }>,
    motivo: '',
    fecha: new Date().toISOString().split('T')[0],
    remitido: 'stock' as 'stock' | 'proveedor',
    estado: 'pendiente' as 'pendiente' | 'aprobada' | 'rechazada',
    metodo_diferencia: 'efectivo' as 'efectivo' | 'tarjeta' | 'transferencia' | 'saldo_a_favor',
  });

  const getProductoInfo = (id_venta_prod_detalle?: number) => {
    if (!id_venta_prod_detalle) return { nombre: 'N/A', cantidad: 0, venta_id: 0, precio_unitario: 0, subtotal: 0 };

    const detalle = dataStore.ventasDetalle.find((d: VentaProductoDetalle) => d.id_venta_prod_detalle === id_venta_prod_detalle);
    if (detalle) {
      const producto = dataStore.productos.find((p: Producto) => p.id_producto === detalle.id_producto);
      return {
        nombre: producto?.nombre || 'N/A',
        cantidad: detalle.cantidad,
        venta_id: detalle.id_venta,
        precio_unitario: detalle.precio_unitario,
        subtotal: detalle.subtotal,
      };
    }
    return { nombre: 'N/A', cantidad: 0, venta_id: 0, precio_unitario: 0, subtotal: 0 };
  };



  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = devoluciones.filter(devolucion => {
      const cleanTerm = term.replace('#', '').trim();
      const idDevolucion = devolucion.id_devolucion.toString();
      const idVentaDetalle = devolucion.id_venta_prod_detalle?.toString() || '';
      const motivo = devolucion.motivo?.toLowerCase() || '';
      const remitido = devolucion.remitido.toLowerCase();
      const estado = devolucion.estado.toLowerCase();
      const productoInfo = getProductoInfo(devolucion.id_venta_prod_detalle);
      const productoNombre = productoInfo.nombre.toLowerCase();
      const cantidad = productoInfo.cantidad.toString();
      const ventaId = productoInfo.venta_id.toString();

      // Búsqueda por ID (con o sin #)
      if (term.startsWith('#') && idDevolucion.includes(cleanTerm)) {
        return true;
      }

      return idDevolucion.includes(cleanTerm) ||
        idVentaDetalle.includes(cleanTerm) ||
        searchInDate(devolucion.fecha, term) ||
        motivo.includes(term) ||
        remitido.includes(term) ||
        estado.includes(term) ||
        productoNombre.includes(term) ||
        cantidad.includes(term) ||
        ventaId.includes(term);
    });

    setFilteredDevoluciones(filtered);
    setCurrentPage(1);
  };

  const handleExport = () => {
    const dataToExport = devoluciones.map(devolucion => {
      const productoInfo = getProductoInfo(devolucion.id_venta_prod_detalle);
      return {
        'ID': devolucion.id_devolucion,
        'Producto': productoInfo.nombre,
        'Cantidad': productoInfo.cantidad,
        'Venta': `#${productoInfo.venta_id}`,
        'Motivo': devolucion.motivo || 'N/A',
        'Fecha': new Date(devolucion.fecha + 'T00:00:00').toLocaleDateString('es-ES'),
        'Destino': devolucion.remitido === 'stock' ? 'Stock' : 'Proveedor',
        'Estado': devolucion.estado === 'aprobada' ? 'Aprobada' : devolucion.estado === 'rechazada' ? 'Rechazada' : 'Pendiente',
      };
    });

    const fechaActual = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    exportToExcelXLSX(dataToExport, `Devoluciones_Stock_${fechaActual}`, 'Devoluciones');

    toast.success('Archivo Excel descargado exitosamente', {
      style: { background: '#10b981', color: '#fff' }
    });
  };

  const validateForm = () => {
    const errors: any = {};
    if (!formData.id_venta) errors.items = 'Debes seleccionar una venta original';
    if (formData.items.filter(i => i.selected).length === 0) errors.items = 'Selecciona al menos un producto para devolver';
    if (!formData.fecha) errors.fecha = 'La fecha es requerida';
    if (!formData.motivo || formData.motivo.trim().length < 10) errors.motivo = 'El motivo debe tener al menos 10 caracteres';

    formData.items.forEach((item, index) => {
      if (item.selected) {
        if (item.cantidad_devuelta <= 0) errors[`item_${index}_qty`] = 'La cantidad debe ser mayor a 0';
        if (item.cantidad_devuelta > item.max_cantidad) errors[`item_${index}_qty`] = 'No puedes devolver más de lo comprado';
        if (item.accion_tomada === 'cambio_otro' && !item.id_producto_cambio) errors[`item_${index}_action`] = 'Selecciona un producto de reemplazo';
      }
    });

    // Validar liquidación si hay diferencia
    const calculateBalanceLocal = (item: any) => {
      if (item.accion_tomada === 'cambio_otro' && item.precio_producto_cambio !== undefined) {
        return (item.precio_producto_cambio - item.precio_unitario_original) * item.cantidad_devuelta;
      }
      if (item.accion_tomada === 'reembolso') {
        return -(item.precio_unitario_original * item.cantidad_devuelta);
      }
      return 0;
    };

    const totalBalance = formData.items
      .filter(i => i.selected)
      .reduce((sum, item) => sum + calculateBalanceLocal(item), 0);

    if (totalBalance !== 0 && !formData.metodo_diferencia) {
      errors.metodo_diferencia = 'Debes seleccionar un método para resolver la diferencia de precio';
    }

    const fechaDevolucion = new Date(formData.fecha + 'T00:00:00');
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);

    if (fechaDevolucion > fechaActual) {
      errors.fecha = 'La fecha no puede ser futura';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const loadSaleItems = (idVenta: number) => {
    const detalles = dataStore.ventasDetalle.filter((d: VentaProductoDetalle) => d.id_venta === idVenta);

    // Calcular cuánto se ha devuelto ya de cada detalle
    const getCantidadYaDevuelta = (idDetalle: number) => {
      return devoluciones
        .filter(dev => dev.id_venta_prod_detalle === idDetalle && (dev.estado === 'aprobada' || dev.estado === 'pendiente'))
        .reduce((sum, dev) => sum + (dev.cantidad_devuelta || 0), 0);
    };

    const items = detalles
      .map((d: VentaProductoDetalle) => {
        const yaDevuelto = getCantidadYaDevuelta(d.id_venta_prod_detalle);
        const maxDisponible = d.cantidad - yaDevuelto;

        if (maxDisponible <= 0) return null;

        const producto = dataStore.productos.find((p: Producto) => p.id_producto === d.id_producto);
        return {
          id_venta_prod_detalle: d.id_venta_prod_detalle,
          selected: false,
          cantidad_devuelta: maxDisponible,
          max_cantidad: maxDisponible,
          estado_producto: 'bueno' as const,
          accion_tomada: 'cambio_mismo' as const,
          nombre_producto: producto?.nombre || 'Producto desconocido',
          precio_unitario_original: d.precio_unitario,
        };
      })
      .filter(i => i !== null) as Array<any>;

    return items;
  };

  useEffect(() => {
    if (preSelectedSale) {
      setEditingDevolucion(null);
      const items = loadSaleItems(preSelectedSale.id_venta);
      setFormData({
        id_venta: preSelectedSale.id_venta.toString(),
        id_cliente: preSelectedSale.id_cliente || preSelectedSale.id_cliente_temporal || null,
        items,
        motivo: '',
        fecha: new Date().toISOString().split('T')[0],
        remitido: 'stock',
        estado: 'pendiente',
        metodo_diferencia: 'efectivo',
      });
      setFormErrors({});
      setView('form');
    }
  }, [preSelectedSale]);

  const handleCreate = () => {
    setEditingDevolucion(null);
    setFormData({
      id_venta: '',
      id_cliente: null,
      items: [],
      motivo: '',
      fecha: new Date().toISOString().split('T')[0],
      remitido: 'stock',
      estado: 'pendiente',
      metodo_diferencia: 'efectivo',
    });
    setFormErrors({});
    setView('form');
  };

  const handleEdit = (devolucion: Devolucion) => {
    setEditingDevolucion(devolucion);
    const detalle = mockVentasDetalle.find(d => d.id_venta_prod_detalle === devolucion.id_venta_prod_detalle);
    const producto = mockProductos.find(p => p.id_producto === detalle?.id_producto);

    setFormData({
      id_venta: detalle?.id_venta.toString() || '',
      id_cliente: null, // This will be updated if needed based on the actual sale
      items: [{
        id_venta_prod_detalle: devolucion.id_venta_prod_detalle!,
        selected: true,
        cantidad_devuelta: devolucion.cantidad_devuelta || 1,
        max_cantidad: detalle?.cantidad || 1,
        estado_producto: devolucion.estado_producto || 'bueno',
        accion_tomada: devolucion.accion_tomada || 'cambio_mismo',
        nombre_producto: producto?.nombre || 'Producto desconocido',
        precio_unitario_original: detalle?.precio_unitario || 0,
        id_producto_cambio: devolucion.id_producto_cambio,
        nombre_producto_cambio: devolucion.nombre_producto_cambio,
        precio_producto_cambio: devolucion.precio_producto_cambio,
      }],
      motivo: devolucion.motivo || '',
      fecha: devolucion.fecha,
      remitido: devolucion.remitido,
      estado: devolucion.estado,
      metodo_diferencia: devolucion.metodo_diferencia || 'efectivo',
    });
    setFormErrors({});
    setView('form');
  };

  const handleView = (devolucion: Devolucion) => {
    const productoInfo = getProductoInfo(devolucion.id_venta_prod_detalle);
    setViewingDevolucion({ ...devolucion, productoInfo });
    setView('details');
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta devolución? Esta acción no se puede deshacer.')) {
      setDevoluciones(devoluciones.filter(d => d.id_devolucion !== id));
      setFilteredDevoluciones(filteredDevoluciones.filter(d => d.id_devolucion !== id));
      toast.success('Devolución eliminada correctamente', {
        style: { background: '#10b981', color: '#fff' }
      });
    }
  };

  const handleStatusChange = (id: number, newStatus: 'pendiente' | 'aprobada' | 'rechazada') => {
    const updated = devoluciones.map(d =>
      d.id_devolucion === id
        ? { ...d, estado: newStatus }
        : d
    );
    setDevoluciones(updated);
    setFilteredDevoluciones(updated.filter(d => {
      // Mantener los filtros de búsqueda
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const cleanTerm = term.replace('#', '').trim();
      const idDevolucion = d.id_devolucion.toString();
      const idVentaDetalle = d.id_venta_prod_detalle?.toString() || '';
      const motivo = d.motivo?.toLowerCase() || '';
      const remitido = d.remitido.toLowerCase();
      const estado = d.estado.toLowerCase();
      const productoInfo = getProductoInfo(d.id_venta_prod_detalle);
      const productoNombre = productoInfo.nombre.toLowerCase();
      const cantidad = productoInfo.cantidad.toString();
      const ventaId = productoInfo.venta_id.toString();

      if (term.startsWith('#') && idDevolucion.includes(cleanTerm)) {
        return true;
      }

      return idDevolucion.includes(cleanTerm) ||
        idVentaDetalle.includes(cleanTerm) ||
        searchInDate(d.fecha, term) ||
        motivo.includes(term) ||
        remitido.includes(term) ||
        estado.includes(term) ||
        productoNombre.includes(term) ||
        cantidad.includes(term) ||
        ventaId.includes(term);
    }));

    const statusMessages = {
      aprobada: 'Devolución aprobada exitosamente',
      rechazada: 'Devolución rechazada',
      pendiente: 'Devolución marcada como pendiente',
    };

    toast.success(statusMessages[newStatus], {
      style: { background: '#10b981', color: '#fff' }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario', {
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    const calculateBalance = (item: any) => {
      if (item.accion_tomada === 'cambio_otro' && item.precio_producto_cambio !== undefined) {
        return (item.precio_producto_cambio - item.precio_unitario_original) * item.cantidad_devuelta;
      }
      if (item.accion_tomada === 'reembolso') {
        return -(item.precio_unitario_original * item.cantidad_devuelta);
      }
      return 0; // cambio_mismo no tiene diferencia de precio
    };

    const totalBalance = formData.items
      .filter(i => i.selected)
      .reduce((sum, item) => sum + calculateBalance(item), 0);

    const stockSummary = {
      bueno: formData.items.filter(i => i.selected && i.estado_producto === 'bueno').reduce((acc, i) => acc + i.cantidad_devuelta, 0),
      defectuoso: formData.items.filter(i => i.selected && i.estado_producto === 'defectuoso').reduce((acc, i) => acc + i.cantidad_devuelta, 0),
      perdida: formData.items.filter(i => i.selected && i.estado_producto === 'perdida').reduce((acc, i) => acc + i.cantidad_devuelta, 0),
    };

    console.group('%c🚀 Devolución: Resumen Final de Operación', 'color: #3b82f6; font-weight: bold; font-size: 14px;');
    console.log('%cMotivo:', 'font-weight: bold;', formData.motivo);
    console.log('%cItems Seleccionados:', 'font-weight: bold;', formData.items.filter(i => i.selected).map(i => ({
      producto: i.nombre_producto,
      cantidad: i.cantidad_devuelta,
      estado: i.estado_producto,
      accion: i.accion_tomada,
      reemplazo: i.nombre_producto_cambio || 'N/A'
    })));
    console.log('%cResumen de Stock:', 'font-weight: bold;', stockSummary);
    console.log('%cBalance de Caja:', 'font-weight: bold;', totalBalance > 0 ? `Cliente paga: $${totalBalance.toFixed(2)}` : totalBalance < 0 ? `Devolver: $${Math.abs(totalBalance).toFixed(2)}` : '$0.00');
    console.log('%cJSON Final:', 'font-weight: bold;', JSON.stringify({
      ...formData,
      items: formData.items.filter(i => i.selected),
      resumen_stock: stockSummary,
      balance_final: totalBalance
    }, null, 2));
    console.groupEnd();

    if (editingDevolucion) {
      const item = formData.items[0];
      const balance = calculateBalance(item);
      let tipo: Devolucion['tipo_diferencia'] = 'sin_diferencia';
      if (balance > 0) tipo = 'pago_adicional';
      else if (balance < 0) tipo = item.accion_tomada === 'reembolso' ? 'reembolso' : 'saldo_a_favor';

      const updated = devoluciones.map(d =>
        d.id_devolucion === editingDevolucion.id_devolucion
          ? {
            ...d,
            id_venta_prod_detalle: item.id_venta_prod_detalle,
            motivo: formData.motivo.trim(),
            fecha: formData.fecha,
            remitido: formData.remitido,
            estado: formData.estado,
            cantidad_devuelta: item.cantidad_devuelta,
            estado_producto: item.estado_producto,
            accion_tomada: item.accion_tomada,
            id_producto_cambio: item.id_producto_cambio,
            nombre_producto_cambio: item.nombre_producto_cambio,
            precio_producto_cambio: item.precio_producto_cambio,
            total_diferencia: balance,
            tipo_diferencia: tipo,
            metodo_diferencia: formData.metodo_diferencia,
          }
          : d
      );
      setDevoluciones(updated);
      setFilteredDevoluciones(updated);
      setEditingDevolucion(null);
      toast.success('Devolución actualizada correctamente');
      setView('list');
    } else {
      const selectedItems = formData.items.filter(item => item.selected);
      const newDevoluciones: Devolucion[] = selectedItems.map((item, index) => {
        const balance = calculateBalance(item);
        let tipo: Devolucion['tipo_diferencia'] = 'sin_diferencia';
        if (balance > 0) tipo = 'pago_adicional';
        else if (balance < 0) tipo = item.accion_tomada === 'reembolso' ? 'reembolso' : 'saldo_a_favor';

        return {
          id_devolucion: Math.max(...devoluciones.map(d => d.id_devolucion), 0) + index + 1,
          id_venta_prod_detalle: item.id_venta_prod_detalle,
          motivo: formData.motivo.trim(),
          fecha: formData.fecha,
          remitido: formData.remitido,
          estado: formData.estado,
          cantidad_devuelta: item.cantidad_devuelta,
          estado_producto: item.estado_producto,
          accion_tomada: item.accion_tomada,
          id_producto_cambio: item.id_producto_cambio,
          nombre_producto_cambio: item.nombre_producto_cambio,
          precio_producto_cambio: item.precio_producto_cambio,
          total_diferencia: balance,
          tipo_diferencia: tipo,
          metodo_diferencia: formData.metodo_diferencia,
        };
      });

      const updatedList = [...devoluciones, ...newDevoluciones];
      setDevoluciones(updatedList);
      setFilteredDevoluciones(updatedList);
      toast.success(`${newDevoluciones.length} devolución(es) registrada(s) exitosamente`);
      setView('list');
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'aprobada':
        return (
          <Badge className="bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Aprobada
          </Badge>
        );
      case 'rechazada':
        return (
          <Badge className="bg-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Rechazada
          </Badge>
        );
      case 'pendiente':
        return (
          <Badge className="bg-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  const getDestinoBadge = (remitido: string) => {
    if (remitido === 'stock') {
      return (
        <Badge className="bg-blue-600">
          <Package className="w-3 h-3 mr-1" />
          Stock
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-orange-600">
          <RotateCcw className="w-3 h-3 mr-1" />
          Proveedor
        </Badge>
      );
    }
  };

  const totalDevoluciones = filteredDevoluciones.length;
  const devolucionesPendientes = filteredDevoluciones.filter(d => d.estado === 'pendiente').length;
  const devolucionesAprobadas = filteredDevoluciones.filter(d => d.estado === 'aprobada').length;
  const devolucionesRechazadas = filteredDevoluciones.filter(d => d.estado === 'rechazada').length;

  // Paginación
  const totalPages = Math.ceil(filteredDevoluciones.length / itemsPerPage);
  const currentPaginatedDevoluciones = filteredDevoluciones.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderListView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <RotateCcw className="w-6 h-6 text-blue-600" />
            Control de Devoluciones
          </h1>
          <p className="text-muted-foreground">Gestiona las devoluciones y ajustes de inventario</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Devolución
          </Button>
          <Button onClick={handleExport} variant="outline">
            <FileDown className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <RotateCcw className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground/70">Total</p>
                <p className="text-xl font-black text-blue-600 leading-tight">{totalDevoluciones}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-600 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground/70">Pendientes</p>
                <p className="text-xl font-black text-yellow-600 leading-tight">{devolucionesPendientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground/70">Aprobadas</p>
                <p className="text-xl font-black text-green-600 leading-tight">{devolucionesAprobadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600 rounded-lg">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground/70">Rechazadas</p>
                <p className="text-xl font-black text-red-600 leading-tight">{devolucionesRechazadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Historial de Operaciones</CardTitle>
            <div className="w-full md:w-96">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar devolución..."
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
                <TableRow className="h-10 bg-muted/30">
                  <TableHead className="w-[60px] text-[10px] uppercase font-bold">ID</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Detalle de Producto</TableHead>
                  <TableHead className="w-[70px] text-[10px] uppercase font-bold">Venta</TableHead>
                  <TableHead className="max-w-[200px] text-[10px] uppercase font-bold">Motivo de Devolución</TableHead>
                  <TableHead className="w-[100px] text-[10px] uppercase font-bold">Fecha</TableHead>
                  <TableHead className="w-[110px] text-[10px] uppercase font-bold">Destino</TableHead>
                  <TableHead className="w-[140px] text-[10px] uppercase font-bold">Estado</TableHead>
                  <TableHead className="w-[120px] text-[10px] uppercase font-bold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPaginatedDevoluciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No se encontraron devoluciones
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPaginatedDevoluciones.map((devolucion) => {
                    const productoInfo = getProductoInfo(devolucion.id_venta_prod_detalle);
                    return (
                      <TableRow key={devolucion.id_devolucion} className="group hover:bg-muted/50 transition-colors h-12">
                        <TableCell className="font-mono text-[10px] font-bold text-muted-foreground">#{devolucion.id_devolucion}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-blue-900 leading-tight truncate max-w-[180px]">
                              {productoInfo.nombre}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-medium">
                              {devolucion.cantidad_devuelta} unid. x ${productoInfo.precio_unitario.toFixed(2)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground font-black">#{productoInfo.venta_id}</TableCell>
                        <TableCell>
                          <p className="text-[10px] text-muted-foreground/80 leading-relaxed italic line-clamp-2 max-w-[250px]" title={devolucion.motivo}>
                            "{devolucion.motivo || 'Sin motivo especificado'}"
                          </p>
                        </TableCell>
                        <TableCell className="text-[10px] font-medium text-muted-foreground">
                          {new Date(devolucion.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </TableCell>
                        <TableCell>{getDestinoBadge(devolucion.remitido)}</TableCell>
                        <TableCell>
                          <Select
                            value={devolucion.estado}
                            onValueChange={(value: any) => handleStatusChange(devolucion.id_devolucion, value)}
                          >
                            <SelectTrigger className="w-[130px] h-7 text-[11px]">
                              <SelectValue>
                                {getEstadoBadge(devolucion.estado)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendiente">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3 h-3 text-yellow-600" />
                                  <span>Pendiente</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="aprobada">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                                  <span>Aprobada</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="rechazada">
                                <div className="flex items-center gap-2">
                                  <XCircle className="w-3 h-3 text-red-600" />
                                  <span>Rechazada</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleView(devolucion)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600" onClick={() => handleEdit(devolucion)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDelete(devolucion.id_devolucion)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

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

              <div className="flex items-center gap-1 font-medium text-xs">
                <span className="text-muted-foreground px-2">Página</span>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200">
                  {currentPage}
                </span>
                <span className="text-muted-foreground px-2">de {totalPages || 1}</span>
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

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                Mostrando {filteredDevoluciones.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredDevoluciones.length)} de {filteredDevoluciones.length} registros
              </span>
              <div className="flex items-center gap-2 border-l pl-4">
                <Label htmlFor="itemsPerPage" className="whitespace-nowrap">Ver:</Label>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(parseInt(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[70px] h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFormView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView('list')} className="h-8 w-8 p-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {editingDevolucion ? <Pencil className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-blue-500" />}
              {editingDevolucion ? 'Editar Devolución' : 'Nueva Devolución al Stock'}
            </h1>
            <p className="text-xs text-muted-foreground">Registra los detalles del retorno de productos</p>
          </div>
        </div>
      </div>

      <Alert className="bg-blue-50 border-blue-200 py-2">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-xs text-blue-700">
          Esta operación afectará el inventario disponible y el balance de caja según el ajuste económico.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="id_venta_select" className="text-xs uppercase font-bold text-muted-foreground">Venta Original</Label>
                {editingDevolucion ? (
                  <div className="p-2 border rounded-md bg-muted text-sm font-medium">Venta #{formData.id_venta}</div>
                ) : (
                  <Select
                    value={formData.id_venta}
                    onValueChange={(val) => {
                      const id = parseInt(val);
                      const venta = dataStore.ventas.find(v => v.id_venta === id);
                      const items = loadSaleItems(id);
                      setFormData({
                        ...formData,
                        id_venta: val,
                        id_cliente: venta?.id_cliente || venta?.id_cliente_temporal || null,
                        items
                      });
                      setFormProductsPage(1);
                    }}
                  >
                    <SelectTrigger id="id_venta_select" className={formErrors.id_venta ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccionar venta..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dataStore.ventas.filter((v: Venta) => v.estado === 'pagada').map((v: Venta) => (
                        <SelectItem key={v.id_venta} value={v.id_venta.toString()}>
                          #{v.id_venta} - {new Date(v.fecha + 'T00:00:00').toLocaleDateString()} - ${v.total.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {formErrors.id_venta && <p className="text-[10px] text-red-500">{formErrors.id_venta}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha" className="text-xs uppercase font-bold text-muted-foreground">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className={formErrors.fecha ? 'border-red-500' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remitido" className="text-xs uppercase font-bold text-muted-foreground">Destino</Label>
                <Select
                  value={formData.remitido}
                  onValueChange={(value: any) => setFormData({ ...formData, remitido: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="proveedor">Proveedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo" className="text-xs uppercase font-bold text-muted-foreground">Motivo</Label>
              <Input
                id="motivo"
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                className={formErrors.motivo ? 'border-red-500' : ''}
              />
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Productos
                </h3>
              </div>

              <div className="border rounded-md overflow-hidden bg-white">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="h-10">
                      <TableHead className="w-10 text-center">
                        <Checkbox
                          checked={formData.items.length > 0 && formData.items.every(i => i.selected)}
                          onCheckedChange={(checked) => setFormData({ ...formData, items: formData.items.map(i => ({ ...i, selected: !!checked })) })}
                          disabled={editingDevolucion !== null}
                        />
                      </TableHead>
                      <TableHead className="text-xs">Producto</TableHead>
                      <TableHead className="w-20 text-center text-xs">Cant.</TableHead>
                      <TableHead className="w-28 text-center text-xs font-bold">Subtotal</TableHead>
                      <TableHead className="w-32 text-xs">Estado</TableHead>
                      <TableHead className="w-40 text-xs">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items
                      .slice((formProductsPage - 1) * formProductsPerPage, formProductsPage * formProductsPerPage)
                      .map((item) => {
                        const originalIndex = formData.items.findIndex(i => i.id_venta_prod_detalle === item.id_venta_prod_detalle);
                        return (
                          <TableRow key={item.id_venta_prod_detalle} className={item.selected ? 'bg-blue-50/20' : ''}>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={item.selected}
                                onCheckedChange={(checked) => {
                                  const newItems = [...formData.items];
                                  newItems[originalIndex].selected = !!checked;
                                  setFormData({ ...formData, items: newItems });
                                }}
                                disabled={editingDevolucion !== null}
                              />
                            </TableCell>
                            <TableCell className="text-xs font-medium">{item.nombre_producto}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                max={item.max_cantidad}
                                value={item.cantidad_devuelta}
                                onChange={(e) => {
                                  const qty = Math.min(parseInt(e.target.value) || 0, item.max_cantidad);
                                  const newItems = [...formData.items];
                                  newItems[originalIndex].cantidad_devuelta = qty;
                                  setFormData({ ...formData, items: newItems });
                                }}
                                className="h-7 text-center text-xs px-1"
                                disabled={!item.selected}
                              />
                            </TableCell>
                            <TableCell className="text-xs font-bold font-mono text-center">
                              ${(item.precio_unitario_original * item.cantidad_devuelta).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={item.estado_producto}
                                onValueChange={(val: any) => {
                                  const newItems = [...formData.items];
                                  newItems[originalIndex].estado_producto = val;
                                  setFormData({ ...formData, items: newItems });
                                }}
                                disabled={!item.selected}
                              >
                                <SelectTrigger className="h-7 text-[10px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="bueno">Excelente</SelectItem>
                                  <SelectItem value="defectuoso">Defectuoso</SelectItem>
                                  <SelectItem value="perdida">Pérdida</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Select
                                  value={item.accion_tomada}
                                  onValueChange={(val: any) => {
                                    const newItems = [...formData.items];
                                    newItems[originalIndex].accion_tomada = val;
                                    if (val !== 'cambio_otro') {
                                      newItems[originalIndex].id_producto_cambio = undefined;
                                      newItems[originalIndex].nombre_producto_cambio = undefined;
                                      newItems[originalIndex].precio_producto_cambio = undefined;
                                    }
                                    setFormData({ ...formData, items: newItems });
                                  }}
                                  disabled={!item.selected}
                                >
                                  <SelectTrigger className="h-7 text-[10px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cambio_mismo">Mismo Item</SelectItem>
                                    <SelectItem value="cambio_otro">Otro Item</SelectItem>
                                    <SelectItem value="reembolso">Reembolso</SelectItem>
                                  </SelectContent>
                                </Select>

                                {item.accion_tomada === 'cambio_otro' && (
                                  <Select
                                    value={item.id_producto_cambio?.toString()}
                                    onValueChange={(val) => {
                                      const prodId = parseInt(val);
                                      const product = dataStore.productos.find(p => p.id_producto === prodId);
                                      if (product) {
                                        const newItems = [...formData.items];
                                        newItems[originalIndex].id_producto_cambio = product.id_producto;
                                        newItems[originalIndex].nombre_producto_cambio = product.nombre;
                                        newItems[originalIndex].precio_producto_cambio = product.precio;
                                        setFormData({ ...formData, items: newItems });
                                      }
                                    }}
                                    disabled={!item.selected}
                                  >
                                    <SelectTrigger className="h-7 text-[9px] border-blue-400">
                                      <SelectValue placeholder="Buscar reemplazo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {dataStore.productos
                                        .filter(p => p.estado !== 'inactivo')
                                        .map(p => (
                                          <SelectItem key={p.id_producto} value={p.id_producto.toString()}>
                                            {p.nombre} - ${p.precio.toFixed(2)}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                )}
                                {item.accion_tomada === 'cambio_otro' && item.id_producto_cambio && (
                                  <div className="text-[9px] text-blue-600 font-bold px-1">
                                    Dif: $
                                    {((item.precio_producto_cambio || 0) - item.precio_unitario_original).toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>

              {formData.items.length > formProductsPerPage && (
                <div className="flex justify-center gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFormProductsPage(p => Math.max(1, p - 1))} disabled={formProductsPage === 1}>
                    Anterior
                  </Button>
                  <span className="text-xs flex items-center">{formProductsPage} / {Math.ceil(formData.items.length / formProductsPerPage)}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFormProductsPage(p => p + 1)} disabled={formProductsPage >= Math.ceil(formData.items.length / formProductsPerPage)}>
                    Siguiente
                  </Button>
                </div>
              )}
            </div>


            {/* Liquidación de Diferencia */}
            {(() => {
              const selectedItems = formData.items.filter(i => i.selected);
              if (selectedItems.length === 0) return null;

              const totalOriginal = selectedItems.reduce((sum, i) => sum + (i.precio_unitario_original * i.cantidad_devuelta), 0);
              const totalReemplazo = selectedItems.reduce((sum, i) => {
                if (i.accion_tomada === 'cambio_mismo') return sum + (i.precio_unitario_original * i.cantidad_devuelta);
                if (i.accion_tomada === 'cambio_otro' && i.precio_producto_cambio !== undefined) return sum + (i.precio_producto_cambio * i.cantidad_devuelta);
                return sum;
              }, 0);

              const totalAjusteCambios = totalReemplazo - (selectedItems.filter(i => i.accion_tomada !== 'reembolso').reduce((sum, i) => sum + (i.precio_unitario_original * i.cantidad_devuelta), 0));
              const totalReembolsos = selectedItems.filter(i => i.accion_tomada === 'reembolso').reduce((sum, i) => sum + (i.precio_unitario_original * i.cantidad_devuelta), 0);

              const finalBalance = totalAjusteCambios - totalReembolsos;
              const hasRefund = totalReembolsos > 0;

              if (finalBalance === 0 && !hasRefund) return null;

              return (
                <div className={`space-y-4 pt-4 border-t px-4 py-6 rounded-lg ${finalBalance > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'} border mb-6`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Resolución de Diferencia Económica
                      </h3>
                      <p className="text-[10px] text-muted-foreground">
                        {finalBalance > 0
                          ? 'El nuevo producto tiene un valor superior. Se requiere un pago adicional.'
                          : 'Existe un saldo a favor del cliente que debe ser liquidado.'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground opacity-70 font-mono">Original Seleccionado: ${totalOriginal.toFixed(2)}</div>
                      <div className="text-lg font-black font-mono">
                        {finalBalance > 0 ? `Cobrar: $${finalBalance.toFixed(2)}` : `Liquidar: $${Math.abs(finalBalance).toFixed(2)}`}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="metodo_diferencia" className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1">
                        {finalBalance > 0 ? <Plus className="w-3 h-3 text-amber-600" /> : <ArrowRight className="w-3 h-3 text-green-600" />}
                        {finalBalance > 0 ? 'Método de Pago Adicional' : 'Destino del Saldo'}
                      </Label>
                      <Select
                        value={formData.metodo_diferencia}
                        onValueChange={(val: any) => setFormData({ ...formData, metodo_diferencia: val })}
                      >
                        <SelectTrigger id="metodo_diferencia" className={formErrors.metodo_diferencia ? 'border-red-500 bg-red-50' : 'border-muted-foreground/30 bg-white'}>
                          <SelectValue placeholder="Seleccionar opción..." />
                        </SelectTrigger>
                        <SelectContent>
                          {finalBalance > 0 ? (
                            <>
                              <SelectItem value="efectivo">Efectivo</SelectItem>
                              <SelectItem value="tarjeta">Tarjeta (Débito/Crédito)</SelectItem>
                              <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="efectivo">Devolución en Efectivo</SelectItem>
                              <SelectItem value="transferencia">Transferencia al Cliente</SelectItem>
                              <SelectItem value="saldo_a_favor">Saldo a Favor (Crédito Tienda)</SelectItem>
                              <SelectItem value="tarjeta">Reintegro a Tarjeta</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      {formErrors.metodo_diferencia && <p className="text-[10px] text-red-500 font-bold animate-pulse">{formErrors.metodo_diferencia}</p>}
                    </div>

                    <div className="bg-white/50 p-3 rounded border border-dashed border-muted-foreground/30 flex flex-col justify-center">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1">Desglose de Operación</p>
                      <div className="flex justify-between text-[11px]">
                        <span>Ajuste por Cambios:</span>
                        <span className={totalAjusteCambios >= 0 ? 'text-amber-700 font-bold' : 'text-green-700 font-bold'}>
                          {totalAjusteCambios >= 0 ? '+' : ''}${totalAjusteCambios.toFixed(2)}
                        </span>
                      </div>
                      {hasRefund && (
                        <div className="flex justify-between text-[11px] mt-1 text-red-700">
                          <span>Reembolsos Directos:</span>
                          <span className="font-bold">-${totalReembolsos.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t mt-2 pt-1 flex justify-between text-[11px] font-black">
                        <span>TOTAL FINAL:</span>
                        <span>${finalBalance.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setView('list')}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {editingDevolucion ? 'Guardar Cambios' : 'Confirmar Devolución'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  const renderDetailsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView('list')} className="h-8 w-8 p-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Detalle de Devolución #{viewingDevolucion?.id_devolucion}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Fecha</Label>
                <p className="text-sm font-medium">{viewingDevolucion?.fecha}</p>
              </div>
              <div>
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Venta</Label>
                <p className="text-sm font-medium">#{viewingDevolucion?.productoInfo?.venta_id}</p>
              </div>
            </div>
            <div>
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Motivo</Label>
              <p className="text-sm p-3 bg-muted rounded-md italic">"{viewingDevolucion?.motivo}"</p>
            </div>
            <div className="pt-4 border-t">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-2 block">Producto</Label>
              <div className="border rounded-md">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="h-9">
                      <TableHead className="text-[10px]">Nombre</TableHead>
                      <TableHead className="text-[10px] text-center">Cant.</TableHead>
                      <TableHead className="text-[10px] text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="h-11">
                      <TableCell className="text-xs font-semibold">{viewingDevolucion?.productoInfo?.nombre}</TableCell>
                      <TableCell className="text-center text-xs">{viewingDevolucion?.cantidad_devuelta}</TableCell>
                      <TableCell className="text-right text-xs font-bold font-mono text-blue-700">
                        ${(viewingDevolucion?.productoInfo?.precio_unitario * (viewingDevolucion?.cantidad_devuelta || 0)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-blue-600 text-white">
            <CardHeader className="py-4">
              <CardTitle className="text-[10px] uppercase opacity-80 font-bold">Impacto Económico</CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <p className="text-3xl font-extrabold">${Math.abs(viewingDevolucion?.total_diferencia || 0).toFixed(2)}</p>
              <p className="text-[10px] mt-2 opacity-80">
                {viewingDevolucion?.total_diferencia > 0 ? 'Cobro adicional' :
                  viewingDevolucion?.accion_tomada === 'reembolso' ? 'Reintegro al cliente' : 'Saldo a favor'}
              </p>
              {viewingDevolucion?.metodo_diferencia && (
                <p className="text-[10px] mt-1 font-bold uppercase tracking-wider">
                  Vía: {viewingDevolucion.metodo_diferencia}
                </p>
              )}
            </CardContent>
          </Card>
          <Button variant="outline" className="w-full" onClick={() => setView('list')}>
            <ChevronLeft className="w-4 h-4 mr-2" /> Volver al Listado
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500">
      {view === 'list' && renderListView()}
      {view === 'form' && renderFormView()}
      {view === 'details' && renderDetailsView()}
    </div>
  );
};

export default DevolucionesStockView;

