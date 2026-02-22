import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { RotateCcw, Receipt, Plus, Pencil, Trash2, Search, Eye, FileDown, ShoppingCart, TrendingUp, CheckCircle2, XCircle, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Briefcase, Scissors, Package } from 'lucide-react';
import { mockDevoluciones, mockVentas, mockClientes, mockUsuarios, mockVentasDetalle, mockProductos, mockServicios, Venta, ClienteTemporal } from '../../shared/lib/mockData';
import { dataStore } from '../../shared/lib/dataStore';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth';
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

interface ItemVenta {
  id_item: number;
  tipo: 'producto' | 'servicio';
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface VentasViewProps {
  onNavigate?: (view: string, data?: any) => void;
}

export function VentasView({ onNavigate }: VentasViewProps) {
  const { user } = useAuth();
  const [ventas, setVentas] = useState<Venta[]>(mockVentas);
  const [filteredVentas, setFilteredVentas] = useState<Venta[]>(mockVentas);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editingVenta, setEditingVenta] = useState<Venta | null>(null);
  const [viewingVenta, setViewingVenta] = useState<any | null>(null);
  const [ventaToDelete, setVentaToDelete] = useState<number | null>(null);
  const [ventaToChangeStatus, setVentaToChangeStatus] = useState<Venta | null>(null);
  const [newStatus, setNewStatus] = useState<'pagada' | 'cancelada'>('pagada');
  const [searchTerm, setSearchTerm] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Formulario de venta
  const [formData, setFormData] = useState({
    id_cliente: '',
    id_usuario: user?.id_usuario.toString() || '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'pagada' as 'pagada' | 'cancelada',
  });

  // Ítems en la venta
  const [productosVenta, setProductosVenta] = useState<ItemVenta[]>([]);
  const [itemSeleccionado, setItemSeleccionado] = useState('');
  const [cantidadItem, setCantidadItem] = useState('1');
  const [activeTab, setActiveTab] = useState<'productos' | 'servicios'>('productos');

  // Mapa local de ítems por venta (para ventas creadas en esta sesión)
  const [ventaItemsMap, setVentaItemsMap] = useState<Record<number, ItemVenta[]>>({});

  // Permisos basados en rol
  const isAdmin = user?.id_rol === 1;

  const getClienteName = (id?: number, idTemp?: number) => {
    if (idTemp) {
      const temp = dataStore.clientesTemporales.find((c: ClienteTemporal) => c.id_cliente_temporal === idTemp);
      return temp ? `${temp.nombre} (Temporal)` : 'Desconocido';
    }
    if (!id || id === 0) return 'Cliente General';
    const cliente = dataStore.clientes.find(c => c.id_cliente === id);
    return cliente ? `${cliente.nombre} ${cliente.apellido || ''}` : 'N/A';
  };

  const getUsuarioName = (id: number) => {
    const usuario = dataStore.usuarios.find(u => u.id_usuario === id);
    return usuario?.nombre || 'N/A';
  };

  const getVentaDetalle = (id_venta: number) => {
    const detalles = dataStore.ventasDetalle.filter(d => d.id_venta === id_venta);
    return detalles.map(d => {
      const nombre = d.tipo === 'producto'
        ? dataStore.productos.find(p => p.id_producto === d.id_producto)?.nombre
        : dataStore.servicios.find(s => s.id_servicio === d.id_servicio)?.nombre;
      return { ...d, producto: nombre || 'N/A' };
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = ventas.filter(venta => {
      const cleanTerm = term.replace('#', '').trim();
      const idVenta = venta.id_venta.toString();
      const total = venta.total.toString();
      const clienteName = getClienteName(venta.id_cliente).toLowerCase();
      const usuarioName = getUsuarioName(venta.id_usuario).toLowerCase();
      const estadoTexto = venta.estado.toLowerCase();

      // Búsqueda por ID (con o sin #)
      if (term.startsWith('#') && idVenta.includes(cleanTerm)) {
        return true;
      }

      return idVenta.includes(cleanTerm) ||
        searchInDate(venta.fecha, term) ||
        clienteName.includes(term) ||
        usuarioName.includes(term) ||
        estadoTexto.includes(term) ||
        total.includes(term);
    });

    setFilteredVentas(filtered);
    setCurrentPage(1);
  };

  const handleExport = () => {
    const dataToExport = ventas.map(venta => ({
      'ID': venta.id_venta,
      'Cliente': getClienteName(venta.id_cliente),
      'Vendedor': getUsuarioName(venta.id_usuario),
      'Fecha': new Date(venta.fecha + 'T00:00:00').toLocaleDateString('es-ES'),
      'Total': `$${venta.total.toFixed(2)}`,
      'Estado': venta.estado === 'pagada' ? 'Pagada' : 'Cancelada',
    }));

    const fechaActual = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    exportToExcelXLSX(dataToExport, `Ventas_${fechaActual}`, 'Ventas');

    toast.success('Archivo Excel descargado exitosamente', {
      style: { background: '#10b981', color: '#fff' }
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validar fecha
    if (!formData.fecha) {
      errors.fecha = 'La fecha es obligatoria';
    } else {
      const fechaVenta = new Date(formData.fecha + 'T00:00:00');
      const fechaActual = new Date();
      fechaActual.setHours(0, 0, 0, 0);

      if (fechaVenta > fechaActual) {
        errors.fecha = 'La fecha no puede ser futura';
      }
    }

    // Validar productos
    if (productosVenta.length === 0) {
      errors.productos = 'Debe agregar al menos un producto a la venta';
    }

    // Validar caracteres especiales en cliente (si está seleccionado)
    if (formData.id_cliente) {
      const idCliente = parseInt(formData.id_cliente);
      if (isNaN(idCliente)) {
        errors.id_cliente = 'ID de cliente inválido';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = () => {
    setEditingVenta(null);
    setFormData({
      id_cliente: '',
      id_usuario: user?.id_usuario.toString() || '',
      fecha: new Date().toISOString().split('T')[0],
      estado: 'pagada',
    });
    setProductosVenta([]);
    setItemSeleccionado('');
    setCantidadItem('1');
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleEdit = (venta: Venta) => {
    setEditingVenta(venta);
    setFormData({
      id_cliente: venta.id_cliente?.toString() || '',
      id_usuario: venta.id_usuario.toString(),
      fecha: venta.fecha,
      estado: venta.estado,
    });

    // Cargar los productos de la venta (simplificado como productos por ahora)
    const detalles = getVentaDetalle(venta.id_venta);
    const productos = detalles.map(d => ({
      id_item: mockProductos.find(p => p.nombre === d.producto)?.id_producto || 0,
      tipo: 'producto' as const,
      nombre: d.producto,
      cantidad: d.cantidad,
      precio_unitario: d.precio_unitario,
      subtotal: d.cantidad * d.precio_unitario,
    }));
    setProductosVenta(productos);
    setItemSeleccionado('');
    setCantidadItem('1');
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleView = (venta: Venta) => {
    // Primero intentar obtener ítems del mapa local (ventas nuevas/editadas en esta sesión)
    const itemsFromMap = ventaItemsMap[venta.id_venta];
    if (itemsFromMap && itemsFromMap.length > 0) {
      // Convertir ItemVenta al formato de detalle esperado por el dialog
      const detalles = itemsFromMap.map(item => ({
        producto: item.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        tipo: item.tipo,
      }));
      setViewingVenta({ ...venta, detalles });
    } else {
      // Fallback: obtener de mockVentasDetalle (ventas del mock data)
      const detalles = getVentaDetalle(venta.id_venta);
      setViewingVenta({ ...venta, detalles });
    }
    setDetailsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setVentaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (ventaToDelete) {
      setVentas(ventas.filter(v => v.id_venta !== ventaToDelete));
      setFilteredVentas(filteredVentas.filter(v => v.id_venta !== ventaToDelete));
      toast.success('Venta eliminada correctamente', {
        style: { background: '#10b981', color: '#fff' }
      });
    }
    setDeleteDialogOpen(false);
    setVentaToDelete(null);
  };

  const isSaleReturnable = (id_venta: number) => {
    // Una venta es retornable si tiene al menos un detalle que no haya sido devuelto aún (estado aprobada)
    const detalles = mockVentasDetalle.filter(d => d.id_venta === id_venta);
    if (detalles.length === 0) return false;

    // Verificar si cada detalle ha sido devuelto
    const detallesDevueltos = mockDevoluciones.filter(dev =>
      dev.estado === 'aprobada' || dev.estado === 'pendiente'
    ).map(dev => dev.id_venta_prod_detalle);

    return detalles.some(d => !detallesDevueltos.includes(d.id_venta_prod_detalle));
  };

  const handleGenerateReturn = (venta: Venta) => {
    if (onNavigate) {
      onNavigate('devoluciones', { sale: venta });
    }
  };

  const handleChangeStatus = (venta: Venta) => {
    setVentaToChangeStatus(venta);
    setNewStatus(venta.estado);
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = () => {
    if (ventaToChangeStatus) {
      const updated = ventas.map(v =>
        v.id_venta === ventaToChangeStatus.id_venta
          ? { ...v, estado: newStatus }
          : v
      );
      setVentas(updated);
      setFilteredVentas(updated);

      const statusMessages = {
        pagada: 'Venta marcada como pagada',
        cancelada: 'Venta cancelada',
      };

      toast.success(statusMessages[newStatus], {
        style: { background: '#10b981', color: '#fff' }
      });
    }
    setStatusDialogOpen(false);
    setVentaToChangeStatus(null);
  };

  const handleAgregarItem = () => {
    if (!itemSeleccionado) {
      toast.error('Selecciona un ítem', {
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    const cantidad = parseInt(cantidadItem);
    if (isNaN(cantidad) || cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0', {
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    let itemMetadata: any;
    if (activeTab === 'productos') {
      itemMetadata = mockProductos.find(p => p.id_producto === parseInt(itemSeleccionado));
    } else {
      itemMetadata = mockServicios.find(s => s.id_servicio === parseInt(itemSeleccionado));
    }

    if (!itemMetadata) return;

    // Ajuste de lógica de búsqueda para mayor precisión
    const itemId = activeTab === 'productos' ? itemMetadata.id_producto : itemMetadata.id_servicio;
    const itemYaAgregado = productosVenta.find(p => p.id_item === itemId && p.tipo === (activeTab === 'productos' ? 'producto' : 'servicio'));

    if (itemYaAgregado) {
      toast.error('Este ítem ya está agregado. Edita la cantidad desde la tabla.', {
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    const nuevoItem: ItemVenta = {
      id_item: itemId,
      tipo: activeTab === 'productos' ? 'producto' : 'servicio',
      nombre: itemMetadata.nombre,
      cantidad: cantidad,
      precio_unitario: itemMetadata.precio,
      subtotal: cantidad * itemMetadata.precio,
    };

    setProductosVenta([...productosVenta, nuevoItem]);
    setItemSeleccionado('');
    setCantidadItem('1');

    if (formErrors.productos) {
      setFormErrors({ ...formErrors, productos: '' });
    }
  };

  const handleEliminarItem = (id_item: number, tipo: 'producto' | 'servicio') => {
    setProductosVenta(productosVenta.filter(p => !(p.id_item === id_item && p.tipo === tipo)));
  };

  const handleCantidadChange = (id_item: number, tipo: 'producto' | 'servicio', nuevaCantidad: string) => {
    const cantidad = parseInt(nuevaCantidad);
    if (isNaN(cantidad) || cantidad <= 0) return;

    setProductosVenta(productosVenta.map(p =>
      (p.id_item === id_item && p.tipo === tipo)
        ? { ...p, cantidad, subtotal: cantidad * p.precio_unitario }
        : p
    ));
  };

  const calcularTotal = (): number => {
    return productosVenta.reduce((sum, p) => sum + p.subtotal, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario', {
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    const total = calcularTotal();

    if (editingVenta) {
      const updated = ventas.map(v =>
        v.id_venta === editingVenta.id_venta
          ? {
            ...v,
            id_cliente: formData.id_cliente ? parseInt(formData.id_cliente) : undefined,
            id_usuario: parseInt(formData.id_usuario),
            fecha: formData.fecha,
            total: total,
            estado: formData.estado,
          }
          : v
      );
      setVentas(updated);
      setFilteredVentas(updated);
      // Actualizar ítems en el mapa
      setVentaItemsMap(prev => ({ ...prev, [editingVenta.id_venta]: [...productosVenta] }));
      toast.success('Venta actualizada correctamente', {
        style: { background: '#10b981', color: '#fff' }
      });
    } else {
      const newId = Math.max(...ventas.map(v => v.id_venta), 0) + 1;
      const newVenta: Venta = {
        id_venta: newId,
        id_cliente: formData.id_cliente ? parseInt(formData.id_cliente) : undefined,
        id_usuario: parseInt(formData.id_usuario),
        fecha: formData.fecha,
        total: total,
        estado: formData.estado,
      };
      const updatedList = [...ventas, newVenta];
      setVentas(updatedList);
      setFilteredVentas(updatedList);
      // Guardar ítems en el mapa para esta nueva venta
      setVentaItemsMap(prev => ({ ...prev, [newId]: [...productosVenta] }));
      toast.success('Venta registrada exitosamente', {
        style: { background: '#10b981', color: '#fff' }
      });
    }

    setDialogOpen(false);
    setItemSeleccionado('');
    setCantidadItem('1');
    setActiveTab('productos');
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { bg: string; text: string; icon: any }> = {
      pagada: { bg: 'bg-green-600', text: 'Pagada', icon: CheckCircle2 },
      cancelada: { bg: 'bg-red-600', text: 'Cancelada', icon: XCircle },
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

  const totalVentas = filteredVentas.reduce((sum, venta) => sum + venta.total, 0);
  const ventasPagadas = filteredVentas.filter(v => v.estado === 'pagada').length;

  // Paginación
  const totalPages = Math.ceil(filteredVentas.length / itemsPerPage);
  const currentPaginatedVentas = filteredVentas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Receipt className="w-6 h-6" />
            Ventas
          </h1>
          <p className="text-muted-foreground">Gestiona las ventas realizadas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreate} className="bg-[#D4AF37] hover:bg-[#B8941F]">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Venta
          </Button>
          <Button onClick={handleExport} variant="outline">
            <FileDown className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-[#D4AF37]/10 to-[#B8941F]/10 border-[#D4AF37]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#D4AF37] rounded-lg">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                <p className="text-2xl font-bold text-[#D4AF37]">${totalVentas.toFixed(2)}</p>
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
                <p className="text-sm text-muted-foreground">Ventas Pagadas</p>
                <p className="text-2xl font-bold text-green-600">{ventasPagadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Lista de Ventas</CardTitle>
            <div className="w-full md:w-96">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar ventas..."
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
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-center w-28">Composición</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPaginatedVentas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron ventas
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPaginatedVentas.map((venta) => {
                    // Usar mapa local para ventas nuevas, fallback a mock data
                    const itemsFromMap = ventaItemsMap[venta.id_venta];
                    const allItems = itemsFromMap && itemsFromMap.length > 0 ? itemsFromMap : null;
                    const mockDetalles = !allItems ? getVentaDetalle(venta.id_venta) : [];

                    const tieneProductos = allItems
                      ? allItems.some(i => i.tipo === 'producto')
                      : mockDetalles.some(d => d.tipo === 'producto');
                    const tieneServicios = allItems
                      ? allItems.some(i => i.tipo === 'servicio')
                      : mockDetalles.some(d => d.tipo === 'servicio');
                    return (
                      <TableRow key={venta.id_venta}>
                        <TableCell>#{venta.id_venta}</TableCell>
                        <TableCell>{getClienteName(venta.id_cliente, venta.id_cliente_temporal)}</TableCell>
                        <TableCell>{getUsuarioName(venta.id_usuario)}</TableCell>
                        <TableCell>{new Date(venta.fecha + 'T00:00:00').toLocaleDateString('es-ES')}</TableCell>
                        <TableCell className="font-medium">${venta.total.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {tieneProductos && (
                              <span title="Contiene Productos" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                                <Package className="w-3 h-3" />
                                Prod.
                              </span>
                            )}
                            {tieneServicios && (
                              <span title="Contiene Servicios" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-bold">
                                <Scissors className="w-3 h-3" />
                                Serv.
                              </span>
                            )}
                            {!tieneProductos && !tieneServicios && (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => isAdmin && handleChangeStatus(venta)}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            disabled={!isAdmin}
                          >
                            {getEstadoBadge(venta.estado)}
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleView(venta)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateReturn(venta)}
                              disabled={!isSaleReturnable(venta.id_venta)}
                              title="Generar Devolución"
                              className={isSaleReturnable(venta.id_venta) ? "text-orange-600 border-orange-200 hover:bg-orange-50" : ""}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                            {isAdmin && (
                              <Button variant="outline" size="sm" onClick={() => handleEdit(venta)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                            {isAdmin && (
                              <Button variant="outline" size="sm" onClick={() => handleDelete(venta.id_venta)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
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
                Mostrando {filteredVentas.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredVentas.length)} de {filteredVentas.length} registros
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

      {/* Sheet Crear/Editar (Panel Lateral) */}
      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent side="right" className="sm:max-w-2xl w-full flex flex-col p-0 gap-0 h-full">
          <SheetHeader className="p-6 border-b bg-background flex-none">
            <SheetTitle>{editingVenta ? 'Editar Venta' : 'Nueva Venta'}</SheetTitle>
            <SheetDescription>
              {editingVenta ? 'Actualiza la información de la venta' : 'Registra una nueva venta en el sistema'}
            </SheetDescription>

            {!editingVenta && (
              <Alert className="bg-blue-50 border-blue-200 mt-4">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700 text-xs">
                  Ventas registradas únicamente desde el establecimiento físico.
                </AlertDescription>
              </Alert>
            )}
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Información General */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id_cliente">Cliente</Label>
                  <Select
                    value={formData.id_cliente || '0'}
                    onValueChange={(value) => setFormData({ ...formData, id_cliente: value === '0' ? '' : value })}
                  >
                    <SelectTrigger className={formErrors.id_cliente ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Cliente General" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Cliente General</SelectItem>
                      {mockClientes.map((cliente) => (
                        <SelectItem key={cliente.id_cliente} value={cliente.id_cliente.toString()}>
                          {cliente.nombre} {cliente.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.id_cliente && (
                    <p className="text-xs text-red-500">{formErrors.id_cliente}</p>
                  )}
                </div>

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
                  <Label htmlFor="id_usuario">
                    Vendedor <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.id_usuario}
                    onValueChange={(value) => setFormData({ ...formData, id_usuario: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockUsuarios.map((usuario) => (
                        <SelectItem key={usuario.id_usuario} value={usuario.id_usuario.toString()}>
                          {usuario.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 lg:col-span-1">
                  <Label htmlFor="estado">
                    Estado <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value: any) => setFormData({ ...formData, estado: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pagada">Pagada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sección de Ítems - Refinada */}
              <div className="space-y-6">
                <div className="space-y-4 p-5 bg-muted/40 rounded-xl border-2 border-dashed border-muted">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Plus className="w-5 h-5 text-[#D4AF37]" />
                      Agregar Ítems
                    </h3>
                  </div>

                  <Tabs value={activeTab} onValueChange={(v: any) => { setActiveTab(v); setItemSeleccionado(''); }} className="w-full">
                    <TabsList className="grid w-full grid-cols-1 mb-4 bg-background border">
                      <TabsTrigger value="productos" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Productos únicamente
                      </TabsTrigger>
                    </TabsList>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="space-y-2 sm:col-span-3">
                        <Label htmlFor="item" className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                          Producto
                        </Label>
                        <Select
                          value={itemSeleccionado}
                          onValueChange={setItemSeleccionado}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Selecciona un producto..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {mockProductos.map((p) => (
                              <SelectItem key={p.id_producto} value={p.id_producto.toString()}>
                                {p.nombre} — ${p.precio.toFixed(2)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cantidad" className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                          Cant.
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="cantidad"
                            type="number"
                            min="1"
                            value={cantidadItem}
                            onChange={(e) => setCantidadItem(e.target.value)}
                            className="h-11 text-center font-bold"
                          />
                          <Button
                            type="button"
                            onClick={handleAgregarItem}
                            className={`h-11 px-4 ${activeTab === 'productos' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                          >
                            <Plus className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Tabs>

                  {formErrors.productos && (
                    <p className="text-sm font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
                      {formErrors.productos}
                    </p>
                  )}
                </div>

                {/* Lista de Ítems Agregados (Carrito) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-blue-500" />
                      Detalle de Venta
                      <Badge variant="secondary" className="ml-2">
                        {productosVenta.length} {productosVenta.length === 1 ? 'ítem' : 'ítems'}
                      </Badge>
                    </h3>
                  </div>

                  {productosVenta.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl bg-muted/20 text-muted-foreground">
                      <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
                      <p className="text-sm">No has agregado ítems aún</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border shadow-sm bg-background overflow-hidden font-medium">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="py-4">Ítem</TableHead>
                            <TableHead className="text-right">Precio Unit.</TableHead>
                            <TableHead className="w-24 text-center">Cant.</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                            <TableHead className="w-16"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productosVenta.map((item, index) => (
                            <TableRow key={`${item.tipo}-${item.id_item}-${index}`} className="group hover:bg-muted/30 transition-colors">
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  {item.tipo === 'producto'
                                    ? <ShoppingCart className="w-4 h-4 text-blue-500" />
                                    : <Briefcase className="w-4 h-4 text-orange-500" />
                                  }
                                  <div>
                                    <p className="font-bold">{item.nombre}</p>
                                    <p className="text-[10px] uppercase text-muted-foreground tracking-widest">{item.tipo}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                ${item.precio_unitario.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.cantidad}
                                  onChange={(e) => handleCantidadChange(item.id_item, item.tipo, e.target.value)}
                                  className="h-8 w-16 text-center focus:ring-1 mx-auto"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <p className="font-black text-[#D4AF37]">${item.subtotal.toFixed(2)}</p>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEliminarItem(item.id_item, item.tipo)}
                                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full space-y-4 pt-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                    Resumen de Pago
                  </h3>
                </div>

                <Card className="overflow-hidden border-2 border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/10 via-background to-[#B8941F]/10 shadow-lg shadow-[#D4AF37]/5">
                  <CardContent className="p-0">
                    <div className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-[#D4AF37] rounded-2xl shadow-inner shadow-black/10">
                          <Receipt className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase text-[#B8941F] tracking-widest mb-1 leading-none">Total Cobrar</p>
                          <p className="text-4xl md:text-5xl font-black text-foreground tracking-tighter tabular-nums drop-shadow-sm">
                            ${calcularTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Desglose de Subtotales */}
                    <div className="grid grid-cols-2 divide-x border-t border-[#D4AF37]/20 bg-[#D4AF37]/5">
                      <div className="px-6 py-3 flex flex-col items-center justify-center gap-0.5">
                        <span className="text-[10px] uppercase font-bold text-blue-600/70 tracking-tighter">Productos</span>
                        <span className="text-sm font-black text-blue-700">
                          ${productosVenta.filter(p => p.tipo === 'producto').reduce((sum, p) => sum + p.subtotal, 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="px-6 py-3 flex flex-col items-center justify-center gap-0.5">
                        <span className="text-[10px] uppercase font-bold text-orange-600/70 tracking-tighter">Servicios</span>
                        <span className="text-sm font-black text-orange-700">
                          ${productosVenta.filter(p => p.tipo === 'servicio').reduce((sum, p) => sum + p.subtotal, 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <SheetFooter className="p-4 border-t bg-background flex-none">
              <div className="flex gap-3 w-full">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 h-12 font-bold hover:bg-red-50 hover:text-red-600 border-2">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-[2] h-12 bg-[#D4AF37] hover:bg-[#B8941F] text-lg font-black shadow-lg shadow-[#D4AF37]/20">
                  {editingVenta ? 'Guardar Cambios' : 'Confirmar Venta'}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Dialog Detalles */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Venta #{viewingVenta?.id_venta}</DialogTitle>
            <DialogDescription>Información completa de la venta</DialogDescription>
          </DialogHeader>
          {viewingVenta && (
            <div className="space-y-6 py-4">
              {/* Información General */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ID Venta</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">#{viewingVenta.id_venta}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">{getClienteName(viewingVenta.id_cliente)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Vendedor</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">{getUsuarioName(viewingVenta.id_usuario)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p>
                      {new Date(viewingVenta.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <div className="p-3 bg-muted rounded-md">
                    {getEstadoBadge(viewingVenta.estado)}
                  </div>
                </div>
              </div>

              {/* Servicios Realizados */}
              {viewingVenta.detalles?.filter((d: any) => d.tipo === 'servicio').length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold flex items-center gap-2 text-orange-700">
                    <div className="p-1.5 bg-orange-100 rounded-lg">
                      <Scissors className="w-4 h-4 text-orange-600" />
                    </div>
                    Servicios Realizados
                  </h3>
                  <div className="rounded-xl border-2 border-orange-100 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-orange-50">
                        <TableRow>
                          <TableHead className="text-orange-800">Servicio</TableHead>
                          <TableHead className="text-orange-800">Cant.</TableHead>
                          <TableHead className="text-orange-800">Precio Unit.</TableHead>
                          <TableHead className="text-right text-orange-800">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewingVenta.detalles?.filter((d: any) => d.tipo === 'servicio').map((detalle: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{detalle.producto}</TableCell>
                            <TableCell>{detalle.cantidad}</TableCell>
                            <TableCell>${detalle.precio_unitario.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-bold text-orange-700">
                              ${(detalle.cantidad * detalle.precio_unitario).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Productos Vendidos */}
              {viewingVenta.detalles?.filter((d: any) => d.tipo !== 'servicio').length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold flex items-center gap-2 text-blue-700">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    Productos Vendidos
                  </h3>
                  <div className="rounded-xl border-2 border-blue-100 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-blue-50">
                        <TableRow>
                          <TableHead className="text-blue-800">Producto</TableHead>
                          <TableHead className="text-blue-800">Cant.</TableHead>
                          <TableHead className="text-blue-800">Precio Unit.</TableHead>
                          <TableHead className="text-right text-blue-800">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewingVenta.detalles?.filter((d: any) => d.tipo !== 'servicio').map((detalle: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{detalle.producto}</TableCell>
                            <TableCell>{detalle.cantidad}</TableCell>
                            <TableCell>${detalle.precio_unitario.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-bold text-blue-700">
                              ${(detalle.cantidad * detalle.precio_unitario).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Total con desglose */}
              <div className="rounded-xl border-2 border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/5 to-[#B8941F]/5 overflow-hidden">
                <div className="p-4 space-y-2">
                  {viewingVenta.detalles?.some((d: any) => d.tipo === 'servicio') && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2 text-orange-600 font-medium">
                        <Scissors className="w-3.5 h-3.5" /> Servicios
                      </span>
                      <span className="font-bold text-orange-700">
                        ${viewingVenta.detalles?.filter((d: any) => d.tipo === 'servicio').reduce((s: number, d: any) => s + d.cantidad * d.precio_unitario, 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {viewingVenta.detalles?.some((d: any) => d.tipo !== 'servicio') && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2 text-blue-600 font-medium">
                        <Package className="w-3.5 h-3.5" /> Productos
                      </span>
                      <span className="font-bold text-blue-700">
                        ${viewingVenta.detalles?.filter((d: any) => d.tipo !== 'servicio').reduce((s: number, d: any) => s + d.cantidad * d.precio_unitario, 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t-2 border-[#D4AF37]/40">
                    <span className="font-black text-lg uppercase tracking-tight">Total</span>
                    <span className="font-black text-2xl text-[#D4AF37]">${viewingVenta.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Alertas según estado */}
              {viewingVenta.estado === 'pagada' && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Venta Pagada</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Esta venta ha sido pagada exitosamente.
                  </AlertDescription>
                </Alert>
              )}

              {viewingVenta.estado === 'cancelada' && (
                <Alert className="bg-red-50 border-red-200">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Venta Cancelada</AlertTitle>
                  <AlertDescription className="text-red-700">
                    Esta venta ha sido cancelada.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Cambiar Estado */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Estado de la Venta</DialogTitle>
            <DialogDescription>
              Modifica el estado de la venta #{ventaToChangeStatus?.id_venta}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Estado Actual</Label>
              <div className="p-3 bg-muted rounded-md">
                {ventaToChangeStatus && getEstadoBadge(ventaToChangeStatus.estado)}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newStatus">
                Nuevo Estado <span className="text-red-500">*</span>
              </Label>
              <Select
                value={newStatus}
                onValueChange={(value: any) => setNewStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pagada">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Pagada
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelada">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Cancelada
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newStatus === 'pagada' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  La venta será marcada como pagada.
                </AlertDescription>
              </Alert>
            )}

            {newStatus === 'cancelada' && (
              <Alert className="bg-red-50 border-red-200">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  La venta será cancelada. Esta acción puede requerir seguimiento.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmStatusChange}>
              Confirmar Cambio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La venta será eliminada permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}
