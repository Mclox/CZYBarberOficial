import { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import {
  Receipt, Plus, Search, Eye, FileDown, ShoppingCart, TrendingUp, Briefcase,
  Scissors, Package, CreditCard, Trash2, RotateCcw, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth';
import { exportToExcelXLSX } from '../../shared/lib/exportUtils';
import { fetchApi } from '../../lib/api';
import { formatCOP } from '../../lib/format';
import { Pagination } from '../common/Pagination';


const searchInDate = (dateStr: string, searchTerm: string): boolean => {
  if (!dateStr) return false;
  const term = searchTerm.toLowerCase().trim();
  try {
    const date = new Date(dateStr);
    if (date.toLocaleDateString('es-ES').includes(term)) return true;
    if (dateStr.includes(term)) return true;
    return false;
  } catch { return false; }
};

interface ItemVenta {
  id_item: number;
  tipo: 'producto' | 'servicio';
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  iva_porcentaje: number;
}

interface VentasViewProps {
  onNavigate?: (view: string, data?: any) => void;
}

export function VentasView({ onNavigate }: VentasViewProps) {
  const { user } = useAuth();

  // Estados de datos reales desde BD
  const [ventas, setVentas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados UI
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [viewingVenta, setViewingVenta] = useState<any | null>(null);
  const [detallesVenta, setDetallesVenta] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Formulario de creación
  const [formData, setFormData] = useState({
    id_cliente: '',
    id_vendedor: user?.id_usuario?.toString() || '',
    metodo_pago: 'Efectivo',
  });

  const [productosVenta, setProductosVenta] = useState<ItemVenta[]>([]);
  const [itemSeleccionado, setItemSeleccionado] = useState('');
  const [cantidadItem, setCantidadItem] = useState('1');
  const [activeTab, setActiveTab] = useState<'productos' | 'servicios'>('productos');



  // --- CARGA INICIAL DE DATOS ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [ventasRes, clientesRes, prodRes, servRes] = await Promise.all([
        fetchApi('/sales').catch(() => ({ success: false, data: [] })),
        fetchApi('/clients').catch(() => ({ success: false, data: [] })),
        fetchApi('/products').catch(() => ({ success: false, data: [] })),
        fetchApi('/services').catch(() => ({ success: false, data: [] }))
      ]);

      if (ventasRes.success) setVentas(ventasRes.data);
      if (clientesRes.success) setClientes(clientesRes.data);
      if (prodRes.success) setProductos(prodRes.data);
      if (servRes.success) setServicios(servRes.data);
    } catch (error) {
      toast.error('Error al cargar datos del sistema');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ESTADOS DERIVADOS / DE APOYO ---
  const activeClientes = useMemo(() => {
    return clientes.filter(c => c.estado === 'Activo' || !c.id_usuario);
  }, [clientes]);

  const selectedClienteObj = useMemo(() => {
    if (!formData.id_cliente) return null;
    return clientes.find(c => c.id_cliente.toString() === formData.id_cliente);
  }, [formData.id_cliente, clientes]);

  const selectedClienteDoc = useMemo(() => {
    if (!selectedClienteObj) return '';
    if (!selectedClienteObj.documento) return 'No registrado';
    return `${selectedClienteObj.tipo_documento || 'CC'} - ${selectedClienteObj.documento}`;
  }, [selectedClienteObj]);

  // --- HELPERS ---
  const getClienteName = (id_cliente: number | null) => {
    if (!id_cliente) return 'Cliente General';
    const c = clientes.find(c => c.id_cliente === id_cliente);
    return c ? (c.nombre_final || c.nombre || 'Desconocido') : 'Desconocido';
  };

  const calcularTotal = (): number => {
    return productosVenta.reduce((sum, p) => sum + p.subtotal, 0);
  };

  // --- FILTROS Y PAGINACIÓN ---
  const filteredVentas = useMemo(() => {
    if (!searchTerm.trim()) return ventas;
    const term = searchTerm.toLowerCase();
    const cleanTerm = term.replace('#', '').trim();

    return ventas.filter(v =>
      v.id_venta.toString().includes(cleanTerm) ||
      getClienteName(v.id_cliente).toLowerCase().includes(term) ||
      (v.vendedor_nombre || '').toLowerCase().includes(term) ||
      (v.metodo_pago || '').toLowerCase().includes(term) ||
      searchInDate(v.fecha, term)
    );
  }, [ventas, searchTerm, clientes]);

  const totalPages = Math.ceil(filteredVentas.length / itemsPerPage);
  const currentPaginatedVentas = filteredVentas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalIngresos = filteredVentas.reduce((sum, v) => sum + (v.total || 0), 0);

  // --- HANDLERS ---
  const handleCreate = () => {
    setFormData({ id_cliente: '', id_vendedor: user?.id_usuario?.toString() || '', metodo_pago: 'Efectivo' });
    setProductosVenta([]);
    setItemSeleccionado('');
    setCantidadItem('1');
    setDialogOpen(true);
  };

  const handleAgregarItem = () => {
    if (!itemSeleccionado) return toast.error('Selecciona un ítem');
    const cantidad = parseInt(cantidadItem);
    if (isNaN(cantidad) || cantidad <= 0) return toast.error('Cantidad inválida');

    let itemData: any;
    if (activeTab === 'productos') {
      itemData = productos.find(p => p.id_producto.toString() === itemSeleccionado);
      if (itemData && itemData.stock < cantidad) return toast.error(`Stock insuficiente. Disponible: ${itemData.stock}`);
    } else {
      itemData = servicios.find(s => s.id_servicio.toString() === itemSeleccionado);
    }

    if (!itemData) return;

    const id_real = activeTab === 'productos' ? itemData.id_producto : itemData.id_servicio;
    const tipoNormalizado: 'producto' | 'servicio' = activeTab === 'productos' ? 'producto' : 'servicio';

    if (productosVenta.some(p => p.id_item === id_real && p.tipo === tipoNormalizado)) {
      return toast.error('El ítem ya está en la lista. Ajusta la cantidad ahí.');
    }

    const precio = itemData.precio_neto || 0;

    setProductosVenta([...productosVenta, {
      id_item: id_real,
      tipo: tipoNormalizado,
      nombre: itemData.nombre,
      cantidad,
      precio_unitario: precio,
      subtotal: cantidad * precio,
      iva_porcentaje: parseFloat(itemData.iva_porcentaje || 0)
    }]);

    setItemSeleccionado('');
    setCantidadItem('1');
  };

  const handleEliminarItem = (id_item: number, tipo: string) => {
    setProductosVenta(productosVenta.filter(p => !(p.id_item === id_item && p.tipo === tipo)));
  };

  const handleCantidadChange = (id_item: number, tipo: string, nuevaCantidad: string) => {
    const cantidad = parseInt(nuevaCantidad);
    if (isNaN(cantidad) || cantidad <= 0) return;
    setProductosVenta(productosVenta.map(p =>
      (p.id_item === id_item && p.tipo === tipo) ? { ...p, cantidad, subtotal: cantidad * p.precio_unitario } : p
    ));
  };

  // --- GUARDAR EN BD ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (productosVenta.length === 0) return toast.error('Agrega al menos un producto o servicio');

    try {
      const payload = {
        // id_cliente: formData.id_cliente ? parseInt(formData.id_cliente) : null,
        id_cliente: formData.id_cliente && formData.id_cliente !== '0' ? parseInt(formData.id_cliente) : null,
        id_vendedor: parseInt(formData.id_vendedor),
        metodo_pago: formData.metodo_pago,
        detalles: productosVenta.map(p => ({
          tipo: p.tipo === 'producto' ? 'Producto' : 'Servicio',
          id_producto: p.tipo === 'producto' ? p.id_item : null,
          id_servicio: p.tipo === 'servicio' ? p.id_item : null,
          id_barbero: null,
          cantidad: p.cantidad,
          precio_unitario_neto: p.precio_unitario,
          iva_porcentaje: 0 // Evita errores de NaN en el backend
        }))
      };

      await fetchApi('/sales', { method: 'POST', body: JSON.stringify(payload) });

      toast.success('Venta registrada exitosamente', { style: { background: '#10b981', color: '#fff' } });
      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar la venta');
    }
  };

  // --- VER DETALLES ---
  const handleView = async (venta: any) => {
    setViewingVenta(venta);
    setDetallesVenta([]);
    setDetailsDialogOpen(true);
    try {
      const res = await fetchApi(`/sales/${venta.id_venta}/details`);
      if (res.success) setDetallesVenta(res.data);
    } catch (error) { toast.error('No se pudieron cargar los detalles.'); }
  };

  const handleExport = () => {
    const dataToExport = ventas.map(v => ({
      'ID': v.id_venta,
      'Cliente': getClienteName(v.id_cliente),
      'Vendedor': v.vendedor_nombre,
      'Método Pago': v.metodo_pago,
      'Fecha': new Date(v.fecha).toLocaleDateString('es-ES'),
      'Total': formatCOP(v.total),
    }));
    const fechaActual = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    exportToExcelXLSX(dataToExport, `Ventas_${fechaActual}`, 'Ventas');
    toast.success('Exportado exitosamente');
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-bold text-2xl"><Receipt className="w-6 h-6 text-blue-800" /> Ventas</h1>
          <p className="text-muted-foreground">Gestiona las ventas realizadas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" /> Nueva Venta</Button>
          <Button onClick={handleExport} variant="outline"><FileDown className="w-4 h-4 mr-2" /> Exportar</Button>
        </div>
      </div>

      {/* TARJETAS RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-lg"><Receipt className="w-6 h-6 text-white" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Ingresos Totales (Real)</p>
              <p className="text-2xl font-bold text-blue-800">{formatCOP(totalIngresos)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-300">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-600 rounded-lg"><CheckCircle2 className="w-6 h-6 text-white" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Ventas Pagadas</p>
              <p className="text-2xl font-bold text-green-600">{ventas.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLA DE VENTAS */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle>Lista de Ventas</CardTitle>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Buscar por ID, Cliente, Vendedor..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-10" />
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
                  <TableHead>Método Pago</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">Cargando datos del servidor...</TableCell></TableRow>
                ) : currentPaginatedVentas.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No se encontraron ventas</TableCell></TableRow>
                ) : (
                  currentPaginatedVentas.map((venta) => (
                    <TableRow key={venta.id_venta}>
                      <TableCell className="font-bold">#{venta.id_venta}</TableCell>
                      <TableCell>{getClienteName(venta.id_cliente)}</TableCell>
                      <TableCell>{venta.vendedor_nombre || 'Sistema'}</TableCell>
                      <TableCell>{new Date(venta.fecha).toLocaleDateString('es-ES')}</TableCell>
                      <TableCell><Badge variant="outline" className="font-bold bg-green-50 text-green-700">{venta.metodo_pago}</Badge></TableCell>
                      <TableCell className="font-bold text-blue-800">{formatCOP(venta.total)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleView(venta)}><Eye className="w-4 h-4" /></Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onNavigate && onNavigate('devoluciones', { sale: venta })}
                            title="Generar Devolución"
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginador UI */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Mostrar:</Label>
              <Select value={itemsPerPage.toString()} onValueChange={v => { setItemsPerPage(parseInt(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-[80px] h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['5', '10', '20', '50'].map(val => <SelectItem key={val} value={val}>{val}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredVentas.length}
            />
          </div>
        </CardContent>
      </Card>

      {/* --- SHEET CREAR VENTA (EL PANEL LATERAL HERMOSO) --- */}
      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent side="right" className="sm:max-w-2xl w-full flex flex-col p-0 h-full">
          <SheetHeader className="p-6 border-b bg-background flex-none">
            <SheetTitle>Nueva Venta</SheetTitle>
            <SheetDescription>Registra una nueva venta en el sistema</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Información Cabecera */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Cliente</Label>
                  <Select
                    value={formData.id_cliente || "0"}
                    onValueChange={v => setFormData({ ...formData, id_cliente: v === "0" ? "" : v })}
                  >
                    <SelectTrigger className="h-11 border-muted-foreground/25 focus:ring-2 focus:ring-blue-500/20">
                      <SelectValue placeholder="Cliente General" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Cliente General</SelectItem>
                      {activeClientes.map(c => (
                        <SelectItem key={c.id_cliente} value={c.id_cliente.toString()}>
                          {c.nombre_final || c.nombre || `Cliente #${c.id_cliente}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Documento Identidad (Cliente)</Label>
                  <Input
                    value={selectedClienteDoc || 'Cliente General'}
                    readOnly
                    className="h-11 bg-muted/40 border-muted/50 text-muted-foreground font-medium select-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Método de Pago <span className="text-red-500">*</span></Label>
                  <Select value={formData.metodo_pago} onValueChange={v => setFormData({ ...formData, metodo_pago: v })}>
                    <SelectTrigger className="h-11 border-muted-foreground/25 focus:ring-2 focus:ring-blue-500/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Efectivo"><span className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Efectivo</span></SelectItem>
                      <SelectItem value="Nequi">Nequi</SelectItem>
                      <SelectItem value="Daviplata">Daviplata</SelectItem>
                      <SelectItem value="Transferencia">Transferencia</SelectItem>
                      <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Selector de Ítems */}
              <div className="space-y-4 p-5 bg-muted/40 rounded-xl border-2 border-dashed border-muted">
                <h3 className="font-bold text-lg flex items-center gap-2"><Plus className="w-5 h-5 text-blue-800" /> Agregar Ítems</h3>
                <Tabs value={activeTab} onValueChange={(v: any) => { setActiveTab(v); setItemSeleccionado(''); }} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4 bg-background border">
                    <TabsTrigger value="productos" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"><ShoppingCart className="w-4 h-4 mr-2" /> Productos</TabsTrigger>
                    <TabsTrigger value="servicios" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700"><Scissors className="w-4 h-4 mr-2" /> Servicios</TabsTrigger>
                  </TabsList>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{activeTab === 'productos' ? 'Producto' : 'Servicio'}</Label>
                      <Select value={itemSeleccionado} onValueChange={setItemSeleccionado}>
                        <SelectTrigger className="h-11"><SelectValue placeholder={`Selecciona un ${activeTab.slice(0, -1)}...`} /></SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {activeTab === 'productos'
                            ? productos.filter(p => p.estado === 'Activo').map(p => <SelectItem key={p.id_producto} value={p.id_producto.toString()}>{p.nombre}</SelectItem>)
                            : servicios.map(s => <SelectItem key={s.id_servicio} value={s.id_servicio.toString()}>{s.nombre}</SelectItem>)
                          }
                        </SelectContent>
                      </Select>
                    </div>

                    {itemSeleccionado && (
                      <div className="p-3 bg-white rounded-lg border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4">
                          {activeTab === 'productos' ? (() => {
                            const p = productos.find(x => x.id_producto.toString() === itemSeleccionado);
                            if (!p) return null;
                            return (
                              <>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Precio Unitario</span>
                                   <span className="font-black text-blue-700 text-base">{formatCOP(p.precio_neto)}</span>
                                </div>
                                <div className="w-px h-8 bg-border"></div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Stock Disponible</span>
                                  <Badge variant={p.stock > 5 ? 'secondary' : 'destructive'} className="w-fit font-bold rounded-md py-0 px-2 text-xs">
                                    {p.stock} unidades
                                  </Badge>
                                </div>
                              </>
                            );
                          })() : (() => {
                            const s = servicios.find(x => x.id_servicio.toString() === itemSeleccionado);
                            if (!s) return null;
                            return (
                              <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Precio del Servicio</span>
                                 <span className="font-black text-orange-700 text-base">{formatCOP(s.precio_neto)}</span>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider mr-1">Cant.</span>
                          <Input type="number" min="1" value={cantidadItem} onChange={e => setCantidadItem(e.target.value)} className="h-9 w-16 text-center font-bold" />
                          <Button type="button" onClick={handleAgregarItem} className={`h-9 px-3 ${activeTab === 'productos' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}><Plus className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Tabs>
              </div>

              {/* Carrito */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-500" /> Detalle de Venta
                  <Badge variant="secondary" className="ml-2">{productosVenta.length} ítems</Badge>
                </h3>
                {productosVenta.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl bg-muted/20 text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm">No has agregado ítems aún</p>
                  </div>
                ) : (
                  <div className="rounded-xl border shadow-sm bg-background overflow-hidden font-medium">
                    <Table>
                      <TableHeader className="bg-muted/50"><TableRow><TableHead className="py-4">Ítem</TableHead><TableHead className="text-right">Precio Unit.</TableHead><TableHead className="w-24 text-center">Cant.</TableHead><TableHead className="text-right">Subtotal</TableHead><TableHead className="w-16"></TableHead></TableRow></TableHeader>
                      <TableBody>
                        {productosVenta.map((item, index) => (
                          <TableRow key={`${item.tipo}-${item.id_item}-${index}`} className="group hover:bg-muted/30 transition-colors">
                            <TableCell className="py-4">
                              <div className="flex items-center gap-3">
                                {item.tipo === 'producto' ? <ShoppingCart className="w-4 h-4 text-blue-500" /> : <Briefcase className="w-4 h-4 text-orange-500" />}
                                <div><p className="font-bold">{item.nombre}</p><p className="text-[10px] uppercase text-muted-foreground tracking-widest">{item.tipo}</p></div>
                              </div>
                            </TableCell>
                             <TableCell className="text-right text-muted-foreground">{formatCOP(item.precio_unitario)}</TableCell>
                            <TableCell><Input type="number" min="1" value={item.cantidad} onChange={e => handleCantidadChange(item.id_item, item.tipo, e.target.value)} className="h-8 w-16 text-center focus:ring-1 mx-auto" /></TableCell>
                            <TableCell className="text-right"><p className="font-black text-blue-800">{formatCOP(item.subtotal)}</p></TableCell>
                            <TableCell className="text-center"><Button type="button" variant="ghost" size="icon" onClick={() => handleEliminarItem(item.id_item, item.tipo)} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Total Summary */}
              <div className="w-full space-y-3 pt-2">
                <div className="flex items-center justify-between px-1"><h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-800" /> Resumen de Pago</h3></div>
                <Card className="overflow-hidden border border-blue-200 bg-gradient-to-br from-blue-50 via-background to-blue-100 shadow-sm">
                  <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Desglose de Subtotales y Tributos */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 w-full md:w-auto">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-blue-600/70 tracking-wider">Subtotal Productos</span>
                        <span className="text-base font-black text-blue-700">
                          {formatCOP(productosVenta.filter(p => p.tipo === 'producto').reduce((sum, p) => sum + p.subtotal, 0))}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-orange-600/70 tracking-wider">Subtotal Servicios</span>
                        <span className="text-base font-black text-orange-700">
                          {formatCOP(productosVenta.filter(p => p.tipo === 'servicio').reduce((sum, p) => sum + p.subtotal, 0))}
                        </span>
                      </div>
                      <div className="flex flex-col border-t sm:border-t-0 sm:border-l pt-2 sm:pt-0 sm:pl-4 border-blue-200">
                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Base Gravable</span>
                        <span className="text-base font-black text-gray-700">
                          {formatCOP(productosVenta.reduce((sum, p) => sum + (p.subtotal / (1 + (p.iva_porcentaje || 0) / 100)), 0))}
                        </span>
                      </div>
                      <div className="flex flex-col border-t sm:border-t-0 sm:border-l pt-2 sm:pt-0 sm:pl-4 border-blue-200">
                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">IVA (19% Incl.)</span>
                        <span className="text-base font-black text-gray-700">
                          {formatCOP(calcularTotal() - productosVenta.reduce((sum, p) => sum + (p.subtotal / (1 + (p.iva_porcentaje || 0) / 100)), 0))}
                        </span>
                      </div>
                    </div>

                    {/* Total on the right */}
                    <div className="flex items-center gap-3 bg-blue-600 text-white py-2 px-6 rounded-xl shadow-md shrink-0 w-full md:w-auto justify-center md:justify-start">
                      <div className="flex flex-col items-center md:items-end">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-blue-100/90 leading-none">Total Cobrar</span>
                        <span className="text-2xl font-black tracking-tight tabular-nums">
                          {formatCOP(calcularTotal())}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <SheetFooter className="p-4 border-t bg-background flex-none">
              <div className="flex gap-3 w-full">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 h-12 text-base font-bold hover:bg-red-50 hover:text-red-600 border-2">Cancelar</Button>
                <Button type="submit" className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-base font-bold shadow-lg shadow-blue-200/50">Confirmar Venta</Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* --- MODAL VER DETALLES (CON EL DISEÑO SEPARADO DE PRODUCTOS/SERVICIOS) --- */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Venta #{viewingVenta?.id_venta}</DialogTitle>
            <DialogDescription>Información completa de la venta y desglose</DialogDescription>
          </DialogHeader>

          {viewingVenta && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>ID Venta</Label><div className="p-3 bg-muted rounded-md font-medium">#{viewingVenta.id_venta}</div></div>
                <div className="space-y-2"><Label>Cliente</Label><div className="p-3 bg-muted rounded-md font-medium">{getClienteName(viewingVenta.id_cliente)}</div></div>
                <div className="space-y-2"><Label>Vendedor</Label><div className="p-3 bg-muted rounded-md font-medium">{viewingVenta.vendedor_nombre || 'Sistema'}</div></div>
                <div className="space-y-2"><Label>Fecha y Método</Label><div className="p-3 bg-muted rounded-md font-medium">{new Date(viewingVenta.fecha).toLocaleDateString('es-ES')} - {viewingVenta.metodo_pago}</div></div>
              </div>

              {detallesVenta.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">Cargando detalles...</div>
              ) : (
                <>
                  {/* TABLA DE SERVICIOS */}
                  {detallesVenta.some((d: any) => d.tipo === 'Servicio') && (
                    <div className="space-y-3">
                      <h3 className="font-bold flex items-center gap-2 text-orange-700">
                        <div className="p-1.5 bg-orange-100 rounded-lg"><Scissors className="w-4 h-4 text-orange-600" /></div> Servicios Realizados
                      </h3>
                      <div className="rounded-xl border-2 border-orange-100 overflow-hidden">
                        <Table>
                          <TableHeader className="bg-orange-50"><TableRow><TableHead className="text-orange-800">Servicio</TableHead><TableHead className="text-orange-800">Cant.</TableHead><TableHead className="text-orange-800">Precio Unit.</TableHead><TableHead className="text-right text-orange-800">Subtotal</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {detallesVenta.filter((d: any) => d.tipo === 'Servicio').map((detalle: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{detalle.servicio_nombre}</TableCell>
                                <TableCell>{detalle.cantidad}</TableCell>
                                <TableCell>{formatCOP(detalle.precio_unitario_neto)}</TableCell>
                                <TableCell className="text-right font-bold text-orange-700">{formatCOP(detalle.subtotal_item)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* TABLA DE PRODUCTOS */}
                  {detallesVenta.some((d: any) => d.tipo === 'Producto') && (
                    <div className="space-y-3">
                      <h3 className="font-bold flex items-center gap-2 text-blue-700">
                        <div className="p-1.5 bg-blue-100 rounded-lg"><Package className="w-4 h-4 text-blue-600" /></div> Productos Vendidos
                      </h3>
                      <div className="rounded-xl border-2 border-blue-100 overflow-hidden">
                        <Table>
                          <TableHeader className="bg-blue-50"><TableRow><TableHead className="text-blue-800">Producto</TableHead><TableHead className="text-blue-800">Cant.</TableHead><TableHead className="text-blue-800">Precio Unit.</TableHead><TableHead className="text-right text-blue-800">Subtotal</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {detallesVenta.filter((d: any) => d.tipo === 'Producto').map((detalle: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{detalle.producto_nombre}</TableCell>
                                <TableCell>{detalle.cantidad}</TableCell>
                                <TableCell>{formatCOP(detalle.precio_unitario_neto)}</TableCell>
                                <TableCell className="text-right font-bold text-blue-700">{formatCOP(detalle.subtotal_item)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* RESUMEN TOTAL */}
                  <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
                    <div className="p-4 space-y-2">
                      {detallesVenta.some((d: any) => d.tipo === 'Servicio') && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="flex items-center gap-2 text-orange-600 font-medium"><Scissors className="w-3.5 h-3.5" /> Subtotal Servicios</span>
                          <span className="font-bold text-orange-700">{formatCOP(detallesVenta.filter((d: any) => d.tipo === 'Servicio').reduce((s: number, d: any) => s + d.subtotal_item, 0))}</span>
                        </div>
                      )}
                      {detallesVenta.some((d: any) => d.tipo === 'Producto') && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="flex items-center gap-2 text-blue-600 font-medium"><Package className="w-3.5 h-3.5" /> Subtotal Productos</span>
                          <span className="font-bold text-blue-700">{formatCOP(detallesVenta.filter((d: any) => d.tipo === 'Producto').reduce((s: number, d: any) => s + d.subtotal_item, 0))}</span>
                        </div>
                      )}

                      <div className="w-full h-px bg-blue-200/50 my-1"></div>

                      {(() => {
                        const total = viewingVenta.total || 0;
                        const base = total / 1.19;
                        const iva = total - base;
                        return (
                          <>
                            <div className="flex justify-between items-center text-sm text-muted-foreground font-semibold">
                              <span>Base Gravable (Subtotal)</span>
                              <span>{formatCOP(base)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-muted-foreground font-semibold">
                              <span>IVA (19% Incluido)</span>
                              <span>{formatCOP(iva)}</span>
                            </div>
                          </>
                        );
                      })()}

                      <div className="flex justify-between items-center pt-2 border-t-2 border-blue-200">
                        <span className="font-black text-lg uppercase tracking-tight">Total Cobrado</span>
                        <span className="font-black text-2xl text-blue-800">{formatCOP(viewingVenta.total)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter><Button onClick={() => setDetailsDialogOpen(false)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}