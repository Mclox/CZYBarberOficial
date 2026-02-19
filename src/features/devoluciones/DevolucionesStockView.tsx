import React, { useState, useEffect, Fragment } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { RotateCcw, Plus, FileDown, Eye, Trash2, Search, Package, CheckCircle2, XCircle, Clock, AlertCircle, Pencil, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Checkbox } from '../../components/ui/checkbox';
import { mockDevoluciones, mockVentasDetalle, mockProductos, Devolucion } from '../../shared/lib/mockData';
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDevolucion, setEditingDevolucion] = useState<Devolucion | null>(null);
  const [viewingDevolucion, setViewingDevolucion] = useState<any | null>(null);
  const [devolucionToDelete, setDevolucionToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Formulario
  const [formData, setFormData] = useState({
    id_venta: '',
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
  });

  const getProductoInfo = (id_venta_prod_detalle?: number) => {
    if (!id_venta_prod_detalle) return { nombre: 'N/A', cantidad: 0, venta_id: 0 };

    const detalle = mockVentasDetalle.find(d => d.id_venta_prod_detalle === id_venta_prod_detalle);
    if (detalle) {
      const producto = mockProductos.find(p => p.id_producto === detalle.id_producto);
      return {
        nombre: producto?.nombre || 'N/A',
        cantidad: detalle.cantidad,
        venta_id: detalle.id_venta,
        precio_unitario: detalle.precio_unitario,
        subtotal: detalle.subtotal,
      };
    }
    return { nombre: 'N/A', cantidad: 0, venta_id: 0 };
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const selectedItems = formData.items.filter(item => item.selected);
    if (selectedItems.length === 0) {
      errors.items = 'Debes seleccionar al menos un producto para devolver';
    }

    selectedItems.forEach((item, index) => {
      if (item.cantidad_devuelta <= 0) {
        errors[`item_${index}_qty`] = 'La cantidad debe ser mayor a 0';
      }
      if (item.cantidad_devuelta > item.max_cantidad) {
        errors[`item_${index}_qty`] = 'La cantidad no puede exceder lo vendido';
      }
      if (item.accion_tomada === 'cambio_otro' && !item.id_producto_cambio) {
        errors.items = 'Debes seleccionar un producto de reemplazo para los cambios';
      }
    });

    if (!formData.motivo.trim()) {
      errors.motivo = 'El motivo es obligatorio';
    } else if (formData.motivo.trim().length < 10) {
      errors.motivo = 'El motivo debe tener al menos 10 caracteres';
    } else if (formData.motivo.trim().length > 500) {
      errors.motivo = 'El motivo no puede exceder 500 caracteres';
    }

    // Validar fecha
    if (!formData.fecha) {
      errors.fecha = 'La fecha es obligatoria';
    } else {
      const fechaDevolucion = new Date(formData.fecha + 'T00:00:00');
      const fechaActual = new Date();
      fechaActual.setHours(0, 0, 0, 0);

      if (fechaDevolucion > fechaActual) {
        errors.fecha = 'La fecha no puede ser futura';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const loadSaleItems = (idVenta: number) => {
    const detalles = mockVentasDetalle.filter(d => d.id_venta === idVenta);

    // Filtrar detalles que ya fueron devueltos (estado aprobada o pendiente)
    const detallesDevueltos = devoluciones
      .filter(dev => dev.estado === 'aprobada' || dev.estado === 'pendiente')
      .map(dev => dev.id_venta_prod_detalle);

    const items = detalles
      .filter(d => !detallesDevueltos.includes(d.id_venta_prod_detalle))
      .map(d => {
        const producto = mockProductos.find(p => p.id_producto === d.id_producto);
        return {
          id_venta_prod_detalle: d.id_venta_prod_detalle,
          selected: false,
          cantidad_devuelta: d.cantidad,
          max_cantidad: d.cantidad,
          estado_producto: 'bueno' as const,
          accion_tomada: 'cambio_mismo' as const,
          nombre_producto: producto?.nombre || 'Producto desconocido',
          precio_unitario_original: d.precio_unitario,
        };
      });

    return items;
  };

  useEffect(() => {
    if (preSelectedSale) {
      setEditingDevolucion(null);
      const items = loadSaleItems(preSelectedSale.id_venta);
      setFormData({
        id_venta: preSelectedSale.id_venta.toString(),
        items,
        motivo: '',
        fecha: new Date().toISOString().split('T')[0],
        remitido: 'stock',
        estado: 'pendiente',
      });
      setFormErrors({});
      setDialogOpen(true);
    }
  }, [preSelectedSale, devoluciones]);

  const handleCreate = () => {
    setEditingDevolucion(null);
    setFormData({
      id_venta: '',
      items: [],
      motivo: '',
      fecha: new Date().toISOString().split('T')[0],
      remitido: 'stock',
      estado: 'pendiente',
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleEdit = (devolucion: Devolucion) => {
    setEditingDevolucion(devolucion);
    const detalle = mockVentasDetalle.find(d => d.id_venta_prod_detalle === devolucion.id_venta_prod_detalle);
    const producto = mockProductos.find(p => p.id_producto === detalle?.id_producto);

    setFormData({
      id_venta: detalle?.id_venta.toString() || '',
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
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleView = (devolucion: Devolucion) => {
    const productoInfo = getProductoInfo(devolucion.id_venta_prod_detalle);
    setViewingDevolucion({ ...devolucion, productoInfo });
    setDetailsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setDevolucionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (devolucionToDelete) {
      setDevoluciones(devoluciones.filter(d => d.id_devolucion !== devolucionToDelete));
      setFilteredDevoluciones(filteredDevoluciones.filter(d => d.id_devolucion !== devolucionToDelete));
      toast.success('Devolución eliminada correctamente', {
        style: { background: '#10b981', color: '#fff' }
      });
    }
    setDeleteDialogOpen(false);
    setDevolucionToDelete(null);
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

    const totalBalance = formData.items
      .filter(i => i.selected && i.accion_tomada === 'cambio_otro' && i.precio_producto_cambio !== undefined)
      .reduce((sum, item) => {
        const diff = (item.precio_producto_cambio! - item.precio_unitario_original) * item.cantidad_devuelta;
        return sum + diff;
      }, 0);

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
      const updated = devoluciones.map(d =>
        d.id_devolucion === editingDevolucion.id_devolucion
          ? {
            ...d,
            id_venta_prod_detalle: formData.items[0].id_venta_prod_detalle,
            motivo: formData.motivo,
            fecha: formData.fecha,
            remitido: formData.remitido,
            estado: formData.estado,
            cantidad_devuelta: formData.items[0].cantidad_devuelta,
            estado_producto: formData.items[0].estado_producto,
            accion_tomada: formData.items[0].accion_tomada,
            id_producto_cambio: formData.items[0].id_producto_cambio,
            nombre_producto_cambio: formData.items[0].nombre_producto_cambio,
            precio_producto_cambio: formData.items[0].precio_producto_cambio,
          }
          : d
      );
      setDevoluciones(updated);
      setFilteredDevoluciones(updated);
      toast.success('Devolución actualizada correctamente', {
        style: { background: '#10b981', color: '#fff' }
      });
    } else {
      const selectedItems = formData.items.filter(item => item.selected);
      const newDevoluciones: Devolucion[] = selectedItems.map((item, index) => ({
        id_devolucion: Math.max(...devoluciones.map(d => d.id_devolucion), 0) + index + 1,
        id_venta_prod_detalle: item.id_venta_prod_detalle,
        motivo: formData.motivo,
        fecha: formData.fecha,
        remitido: formData.remitido,
        estado: formData.estado,
        cantidad_devuelta: item.cantidad_devuelta,
        estado_producto: item.estado_producto,
        accion_tomada: item.accion_tomada,
        id_producto_cambio: item.id_producto_cambio,
        nombre_producto_cambio: item.nombre_producto_cambio,
        precio_producto_cambio: item.precio_producto_cambio,
      }));

      const updatedList = [...devoluciones, ...newDevoluciones];
      setDevoluciones(updatedList);
      setFilteredDevoluciones(updatedList);
      toast.success(`${newDevoluciones.length} devolución(es) registrada(s) exitosamente`, {
        style: { background: '#10b981', color: '#fff' }
      });
    }

    setDialogOpen(false);
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

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <RotateCcw className="w-6 h-6" />
            Devolución al Stock
          </h1>
          <p className="text-muted-foreground">Gestiona las devoluciones de productos al inventario</p>
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

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <RotateCcw className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-blue-600">{totalDevoluciones}</p>
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
                <p className="text-2xl font-bold text-yellow-600">{devolucionesPendientes}</p>
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
                <p className="text-sm text-muted-foreground">Aprobadas</p>
                <p className="text-2xl font-bold text-green-600">{devolucionesAprobadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-600 rounded-lg">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rechazadas</p>
                <p className="text-2xl font-bold text-red-600">{devolucionesRechazadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Lista de Devoluciones</CardTitle>
            <div className="w-full md:w-96">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por ID, producto, cantidad, estado..."
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
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Venta</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
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
                      <TableRow key={devolucion.id_devolucion}>
                        <TableCell>#{devolucion.id_devolucion}</TableCell>
                        <TableCell className="font-medium">{productoInfo.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{productoInfo.cantidad} unid.</Badge>
                        </TableCell>
                        <TableCell>#{productoInfo.venta_id}</TableCell>
                        <TableCell className="max-w-xs truncate">{devolucion.motivo || 'N/A'}</TableCell>
                        <TableCell>{new Date(devolucion.fecha + 'T00:00:00').toLocaleDateString('es-ES')}</TableCell>
                        <TableCell>{getDestinoBadge(devolucion.remitido)}</TableCell>
                        <TableCell>
                          <Select
                            value={devolucion.estado}
                            onValueChange={(value: any) => handleStatusChange(devolucion.id_devolucion, value)}
                          >
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue>
                                {getEstadoBadge(devolucion.estado)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendiente">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-yellow-600" />
                                  <span>Pendiente</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="aprobada">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  <span>Aprobada</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="rechazada">
                                <div className="flex items-center gap-2">
                                  <XCircle className="w-4 h-4 text-red-600" />
                                  <span>Rechazada</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleView(devolucion)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(devolucion)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(devolucion.id_devolucion)}>
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
                <span className="text-sm font-medium px-2 py-1 bg-blue-600 text-white rounded">
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
                Mostrando {filteredDevoluciones.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredDevoluciones.length)} de {filteredDevoluciones.length} registros
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

      {/* Dialog Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDevolucion ? 'Editar Devolución' : 'Nueva Devolución al Stock'}</DialogTitle>
            <DialogDescription>
              {editingDevolucion ? 'Actualiza la información de la devolución' : 'Registra una nueva devolución al inventario'}
            </DialogDescription>
          </DialogHeader>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Información Importante</AlertTitle>
            <AlertDescription className="text-blue-700">
              Esta aplicación es solo para gestión interna. Las devoluciones se registran únicamente desde nuestro establecimiento físico.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Selecciona los productos a devolver</Label>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={formData.items.length > 0 && formData.items.every(i => i.selected)}
                              onCheckedChange={(checked) => {
                                setFormData({
                                  ...formData,
                                  items: formData.items.map(i => ({ ...i, selected: !!checked }))
                                });
                              }}
                              disabled={editingDevolucion !== null}
                            />
                          </TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead className="w-24 text-center">Cant. Vend.</TableHead>
                          <TableHead className="w-32 text-center">Cant. Devol.</TableHead>
                          <TableHead className="w-40">Estado</TableHead>
                          <TableHead className="w-44">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.items.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4 text-muted-foreground italic">
                              No hay productos disponibles para esta venta
                            </TableCell>
                          </TableRow>
                        ) : (
                          formData.items.map((item, index) => (
                            <Fragment key={item.id_venta_prod_detalle}>
                              <TableRow className={item.selected ? 'bg-blue-50/30' : ''}>
                                <TableCell>
                                  <Checkbox
                                    checked={item.selected}
                                    onCheckedChange={(checked) => {
                                      const newItems = [...formData.items];
                                      newItems[index].selected = !!checked;
                                      setFormData({ ...formData, items: newItems });
                                    }}
                                    disabled={editingDevolucion !== null}
                                  />
                                </TableCell>
                                <TableCell className="font-medium text-sm">
                                  {item.nombre_producto}
                                  <div className="text-xs text-muted-foreground">
                                    ${item.precio_unitario_original.toFixed(2)} c/u
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="secondary">{item.max_cantidad}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="1"
                                    max={item.max_cantidad}
                                    value={item.cantidad_devuelta}
                                    onChange={(e) => {
                                      const qty = Math.min(parseInt(e.target.value) || 0, item.max_cantidad);
                                      const newItems = [...formData.items];
                                      newItems[index].cantidad_devuelta = qty;
                                      setFormData({ ...formData, items: newItems });
                                    }}
                                    className={`h-8 text-center ${formErrors[`item_${index}_qty`] ? 'border-red-500' : ''}`}
                                    disabled={!item.selected}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={item.estado_producto}
                                    onValueChange={(val: any) => {
                                      const newItems = [...formData.items];
                                      newItems[index].estado_producto = val;
                                      setFormData({ ...formData, items: newItems });
                                    }}
                                    disabled={!item.selected}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="bueno">Buen estado (Vuelve a Stock)</SelectItem>
                                      <SelectItem value="defectuoso">Defectuoso (Va a Prov.)</SelectItem>
                                      <SelectItem value="perdida">Pérdida</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={item.accion_tomada}
                                    onValueChange={(val: any) => {
                                      const newItems = [...formData.items];
                                      newItems[index].accion_tomada = val;
                                      // Limpiar producto de cambio si cambia de acción
                                      if (val !== 'cambio_otro') {
                                        newItems[index].id_producto_cambio = undefined;
                                        newItems[index].nombre_producto_cambio = undefined;
                                        newItems[index].precio_producto_cambio = undefined;
                                      }
                                      setFormData({ ...formData, items: newItems });
                                    }}
                                    disabled={!item.selected}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="cambio_mismo">Cambio mismo ítem</SelectItem>
                                      <SelectItem value="cambio_otro">Cambio otro ítem</SelectItem>
                                      <SelectItem value="reembolso">Reembolso dinero</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              </TableRow>

                              {item.selected && item.accion_tomada === 'cambio_otro' && (
                                <TableRow className="bg-muted/30 border-t-0">
                                  <TableCell colSpan={2}></TableCell>
                                  <TableCell colSpan={4} className="py-3 pr-4">
                                    <div className="space-y-3 p-3 border rounded-md bg-white shadow-sm">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold text-blue-700">Seleccionar Producto de Reemplazo</Label>
                                        {item.precio_producto_cambio !== undefined && (
                                          <Badge variant="outline" className="text-[10px] h-5">
                                            Dif: ${((item.precio_producto_cambio - item.precio_unitario_original) * item.cantidad_devuelta).toFixed(2)}
                                          </Badge>
                                        )}
                                      </div>
                                      <Select
                                        value={item.id_producto_cambio?.toString()}
                                        onValueChange={(val) => {
                                          const product = mockProductos.find(p => p.id_producto === parseInt(val));
                                          if (product) {
                                            const newItems = [...formData.items];
                                            newItems[index].id_producto_cambio = product.id_producto;
                                            newItems[index].nombre_producto_cambio = product.nombre;
                                            newItems[index].precio_producto_cambio = product.precio;
                                            setFormData({ ...formData, items: newItems });
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue placeholder="Buscar producto..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {mockProductos.map(p => (
                                            <SelectItem key={p.id_producto} value={p.id_producto.toString()}>
                                              {p.nombre} - ${p.precio.toFixed(2)}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      {item.id_producto_cambio && (
                                        <div className="flex justify-between items-center text-[10px] px-1">
                                          <span className="text-muted-foreground italic">
                                            Reemplaza por {item.nombre_producto_cambio}
                                          </span>
                                          <span className="font-bold">
                                            Total Reemplazo: ${(item.precio_producto_cambio! * item.cantidad_devuelta).toFixed(2)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </Fragment>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {formErrors.items && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.items}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha">
                      Fecha <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => {
                        setFormData({ ...formData, fecha: e.target.value });
                        if (formErrors.fecha) {
                          setFormErrors({ ...formErrors, fecha: '' });
                        }
                      }}
                      max={new Date().toISOString().split('T')[0]}
                      className={formErrors.fecha ? 'border-red-500' : ''}
                    />
                    {formErrors.fecha && (
                      <p className="text-xs text-red-500">{formErrors.fecha}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remitido">
                      Destino <span className="text-red-500">*</span>
                    </Label>
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
                  <Label htmlFor="motivo">
                    Motivo de Devolución <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="motivo"
                    value={formData.motivo}
                    onChange={(e) => {
                      setFormData({ ...formData, motivo: e.target.value });
                      if (formErrors.motivo) {
                        setFormErrors({ ...formErrors, motivo: '' });
                      }
                    }}
                    placeholder="Describe el motivo de la devolución (mínimo 10 caracteres)..."
                    rows={4}
                    className={formErrors.motivo ? 'border-red-500' : ''}
                  />
                  {formErrors.motivo && (
                    <p className="text-xs text-red-500">{formErrors.motivo}</p>
                  )}
                </div>

                {/* Resumen de Operación Section */}
                {formData.items.some(i => i.selected) && (
                  <div className="mt-6 border-t pt-4">
                    <Card className="bg-muted/30 border-dashed">
                      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                          <RotateCcw className="w-4 h-4 mr-2 text-blue-500" />
                          Resumen de Operación
                        </CardTitle>
                        {(() => {
                          const totalBalance = formData.items
                            .filter(i => i.selected && i.accion_tomada === 'cambio_otro' && i.precio_producto_cambio !== undefined)
                            .reduce((sum, item) => {
                              const diff = (item.precio_producto_cambio! - item.precio_unitario_original) * item.cantidad_devuelta;
                              return sum + diff;
                            }, 0);

                          if (totalBalance > 0) return <Badge className="bg-red-100 text-red-700 border-red-200">Deuda: ${totalBalance.toFixed(2)}</Badge>;
                          if (totalBalance < 0) return <Badge className="bg-green-100 text-green-700 border-green-200">Devolución: ${Math.abs(totalBalance).toFixed(2)}</Badge>;
                          return <Badge variant="outline">Sin diferencia</Badge>;
                        })()}
                      </CardHeader>
                      <CardContent className="py-2 px-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-start space-x-3 p-2 rounded-md bg-white border">
                            <Package className="w-5 h-5 text-green-500 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Retorno Físico</p>
                              <p className="text-lg font-bold">
                                {formData.items.filter(i => i.selected && i.estado_producto === 'bueno').reduce((acc, i) => acc + i.cantidad_devuelta, 0)}
                                <span className="text-xs font-normal text-muted-foreground ml-1">unid.</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3 p-2 rounded-md bg-white border">
                            <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Defectuosos</p>
                              <p className="text-lg font-bold">
                                {formData.items.filter(i => i.selected && i.estado_producto === 'defectuoso').reduce((acc, i) => acc + i.cantidad_devuelta, 0)}
                                <span className="text-xs font-normal text-muted-foreground ml-1">unid.</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {formData.items.some(i => i.selected && i.accion_tomada === 'cambio_otro') && (
                          <div className="p-3 rounded-md bg-blue-50 border border-blue-100">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-blue-800">Ajuste de Caja por Cambios:</span>
                              {(() => {
                                const totalBalance = formData.items
                                  .filter(i => i.selected && i.accion_tomada === 'cambio_otro' && i.precio_producto_cambio !== undefined)
                                  .reduce((sum, item) => {
                                    const diff = (item.precio_producto_cambio! - item.precio_unitario_original) * item.cantidad_devuelta;
                                    return sum + diff;
                                  }, 0);
                                return (
                                  <span className={`text-sm font-bold ${totalBalance > 0 ? 'text-red-600' : totalBalance < 0 ? 'text-green-600' : 'text-blue-600'}`}>
                                    {totalBalance > 0 ? `+ $${totalBalance.toFixed(2)}` : totalBalance < 0 ? `- $${Math.abs(totalBalance).toFixed(2)}` : '$0.00'}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="sticky bottom-0 bg-background pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingDevolucion ? 'Guardar Cambios' : 'Registrar Devolución'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalles */}
      < Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen} >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Devolución #{viewingDevolucion?.id_devolucion}</DialogTitle>
            <DialogDescription>Información completa de la devolución</DialogDescription>
          </DialogHeader>
          {viewingDevolucion && (
            <div className="space-y-6 py-4">
              {/* Información General */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ID Devolución</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">#{viewingDevolucion.id_devolucion}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <div className="p-3 bg-muted rounded-md">
                    {getEstadoBadge(viewingDevolucion.estado)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Producto</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">{viewingDevolucion.productoInfo?.nombre}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <Badge variant="outline" className="text-base">
                      {viewingDevolucion.productoInfo?.cantidad} unidades
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Venta Original</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">#{viewingDevolucion.productoInfo?.venta_id}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p>
                      {new Date(viewingDevolucion.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Destino</Label>
                  <div className="p-3 bg-muted rounded-md">
                    {getDestinoBadge(viewingDevolucion.remitido)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Motivo de la Devolución</Label>
                <div className="p-4 bg-muted rounded-lg">
                  <p>{viewingDevolucion.motivo || 'N/A'}</p>
                </div>
              </div>

              {/* Información del Producto */}
              {viewingDevolucion.productoInfo && (
                <div className="space-y-2">
                  <Label>Información de la Venta Original</Label>
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Precio Unitario:</span>
                        <span className="font-medium">${viewingDevolucion.productoInfo.precio_unitario?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm font-semibold">Total Devuelto:</span>
                        <span className="font-bold text-blue-600">
                          ${viewingDevolucion.productoInfo.subtotal?.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {viewingDevolucion.estado === 'aprobada' && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Devolución Aprobada</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Esta devolución ha sido aprobada y procesada correctamente.
                  </AlertDescription>
                </Alert>
              )}

              {viewingDevolucion.estado === 'rechazada' && (
                <Alert className="bg-red-50 border-red-200">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Devolución Rechazada</AlertTitle>
                  <AlertDescription className="text-red-700">
                    Esta devolución ha sido rechazada y no se procesará.
                  </AlertDescription>
                </Alert>
              )}

              {viewingDevolucion.estado === 'pendiente' && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800">Devolución Pendiente</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    Esta devolución está pendiente de revisión y aprobación.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* Dialog Eliminar */}
      < AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La devolución será eliminada permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog >
    </div >
  );
}
