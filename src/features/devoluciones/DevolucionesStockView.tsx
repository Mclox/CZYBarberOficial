import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { RotateCcw, Plus, Search, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { fetchApi } from '../../lib/api';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';

interface DevolucionesStockViewProps {
  preSelectedSale?: any;
}

export function DevolucionesStockView({ preSelectedSale }: DevolucionesStockViewProps) {
  // Datos Reales
  const [devoluciones, setDevoluciones] = useState<any[]>([]);
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // UI
  const [newDevolucionDialogOpen, setNewDevolucionDialogOpen] = useState(false);

  // Formulario
  const [idVentaSeleccionada, setIdVentaSeleccionada] = useState<string>('');
  const [motivo, setMotivo] = useState('');
  const [productosVenta, setProductosVenta] = useState<any[]>([]);
  const [loadingDetalles, setLoadingDetalles] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [devRes, ventasRes] = await Promise.all([
        fetchApi('/stock-returns').catch(() => ({ success: false, data: [] })),
        fetchApi('/sales').catch(() => ({ success: false, data: [] }))
      ]);
      if (devRes.success) setDevoluciones(devRes.data);
      if (ventasRes.success) setVentas(ventasRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Si viene una venta preseleccionada desde la vista de Ventas
  useEffect(() => {
    if (preSelectedSale) {
      handleSelectVenta(preSelectedSale.id_venta.toString());
      setNewDevolucionDialogOpen(true);
    }
  }, [preSelectedSale]);

  const handleSelectVenta = async (id_venta: string) => {
    setIdVentaSeleccionada(id_venta);
    setProductosVenta([]);
    if (!id_venta) return;

    setLoadingDetalles(true);
    try {
      const res = await fetchApi(`/sales/${id_venta}/details`);
      if (res.success) {
        // Solo permitimos devolver Productos
        const soloProductos = res.data
          .filter((d: any) => d.tipo === 'Producto')
          .map((d: any) => ({
            ...d,
            cantidad_devolver: 0 
          }));
        setProductosVenta(soloProductos);
      }
    } catch (error) {
      toast.error('Error al cargar detalles de la venta');
    } finally {
      setLoadingDetalles(false);
    }
  };

  const handleCantidadChange = (id_detalle: number, cantidadStr: string, maxCantidad: number) => {
    let cant = parseInt(cantidadStr);
    if (isNaN(cant) || cant < 0) cant = 0;
    if (cant > maxCantidad) cant = maxCantidad;

    setProductosVenta(prev => prev.map(p => 
      p.id_detalle === id_detalle ? { ...p, cantidad_devolver: cant } : p
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idVentaSeleccionada) return toast.error('Selecciona una venta');
    if (!motivo.trim()) return toast.error('El motivo es obligatorio');
    
    const itemsADevolver = productosVenta.filter(p => p.cantidad_devolver > 0);
    if (itemsADevolver.length === 0) return toast.error('Debes devolver al menos 1 producto');

    try {
      const payload = {
        id_venta: parseInt(idVentaSeleccionada),
        motivo: motivo.trim(),
        detalles: itemsADevolver.map(p => ({
          id_producto: p.id_producto,
          cantidad_devolver: p.cantidad_devolver
        }))
      };

      await fetchApi('/stock-returns', { method: 'POST', body: JSON.stringify(payload) });
      
      toast.success('Devolución procesada y stock recuperado', { style: { background: '#10b981', color: '#fff' }});
      setNewDevolucionDialogOpen(false);
      setIdVentaSeleccionada('');
      setMotivo('');
      setProductosVenta([]);
      fetchData(); 
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar devolución');
    }
  };

  const filteredDevoluciones = devoluciones.filter(d => 
    d.id_venta?.toString().includes(searchTerm) ||
    (d.producto_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.motivo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDevueltos = devoluciones.reduce((acc, curr) => acc + (curr.cantidad || 0), 0);

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-bold text-2xl text-blue-800">
            <RotateCcw className="w-6 h-6" /> Devoluciones al Stock
          </h1>
          <p className="text-muted-foreground">Retornos de inventario por ventas canceladas o ajustadas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => {setIdVentaSeleccionada(''); setMotivo(''); setProductosVenta([]); setNewDevolucionDialogOpen(true);}} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Nueva Devolución
          </Button>
        </div>
      </div>

      {/* TARJETAS SUPERIORES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-lg"><RotateCcw className="w-6 h-6 text-white" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Operaciones</p>
              <p className="text-2xl font-bold text-blue-700">{devoluciones.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-600 rounded-lg"><Package className="w-6 h-6 text-white" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Unidades Recuperadas (Stock)</p>
              <p className="text-2xl font-bold text-emerald-700">+{totalDevueltos}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle>Historial de Devoluciones</CardTitle>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Buscar por producto, motivo o venta..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Dev</TableHead>
                  <TableHead>Venta Original</TableHead>
                  <TableHead>Producto Devuelto</TableHead>
                  <TableHead className="text-center">Cant. Recuperada</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Responsable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">Cargando base de datos...</TableCell></TableRow>
                ) : filteredDevoluciones.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hay devoluciones registradas.</TableCell></TableRow>
                ) : (
                  filteredDevoluciones.map((dev) => (
                    <TableRow key={dev.id_devolucion}>
                      <TableCell className="font-bold text-muted-foreground">#{dev.id_devolucion}</TableCell>
                      <TableCell className="font-bold">#{dev.id_venta}</TableCell>
                      <TableCell className="font-medium text-blue-700">{dev.producto_nombre}</TableCell>
                      <TableCell className="text-center"><Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">+{dev.cantidad}</Badge></TableCell>
                      <TableCell className="max-w-[200px] truncate" title={dev.motivo}>{dev.motivo}</TableCell>
                      <TableCell>{new Date(dev.fecha).toLocaleDateString('es-ES')}</TableCell>
                      <TableCell>{dev.usuario_nombre}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL CREAR DEVOLUCIÓN */}
      <Dialog open={newDevolucionDialogOpen} onOpenChange={setNewDevolucionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-800"><RotateCcw className="w-5 h-5"/> Nueva Devolución al Stock</DialogTitle>
            <DialogDescription>Selecciona la venta original y los productos que retornarán al inventario físico.</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Aviso de Inventario</AlertTitle>
              <AlertDescription className="text-blue-700">
                Los productos seleccionados sumarán su cantidad automáticamente al stock disponible en la base de datos.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Venta Original <span className="text-red-500">*</span></Label>
                <Select value={idVentaSeleccionada} onValueChange={handleSelectVenta}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar venta..." /></SelectTrigger>
                  <SelectContent>
                    {ventas.map(v => (
                      <SelectItem key={v.id_venta} value={v.id_venta.toString()}>
                        Venta #{v.id_venta} - {new Date(v.fecha).toLocaleDateString('es-ES')} - ${v.total?.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Destino</Label>
                <Input value="Stock (Estante Físico)" disabled className="bg-muted font-bold text-blue-700" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Motivo de la devolución <span className="text-red-500">*</span></Label>
              <Textarea 
                placeholder="Ej: Cliente se arrepintió de la compra, producto equivocado..." 
                value={motivo} 
                onChange={e => setMotivo(e.target.value)}
                rows={3} 
              />
            </div>

            {idVentaSeleccionada && (
              <div className="space-y-4">
                <Label className="flex items-center gap-2"><Package className="w-4 h-4"/> Productos de la Venta #{idVentaSeleccionada}</Label>
                
                {loadingDetalles ? (
                  <div className="text-center p-4 border rounded text-muted-foreground">Cargando productos...</div>
                ) : productosVenta.length === 0 ? (
                  <div className="text-center p-4 border rounded bg-muted text-muted-foreground">Esta venta no contiene productos retornables (solo servicios).</div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-center">Vendido</TableHead>
                          <TableHead className="text-center">A Devolver</TableHead>
                          <TableHead className="text-right">Monto a Reembolsar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productosVenta.map((prod) => (
                          <TableRow key={prod.id_detalle}>
                            <TableCell className="font-bold">{prod.producto_nombre}</TableCell>
                            <TableCell className="text-center text-muted-foreground">{prod.cantidad} unid.</TableCell>
                            <TableCell className="text-center">
                              <Input 
                                type="number" 
                                min="0" 
                                max={prod.cantidad}
                                value={prod.cantidad_devolver}
                                onChange={(e) => handleCantidadChange(prod.id_detalle, e.target.value, prod.cantidad)}
                                className="w-20 mx-auto text-center font-bold text-blue-600"
                              />
                            </TableCell>
                            <TableCell className="text-right font-bold text-orange-600">
                              ${(prod.cantidad_devolver * prod.precio_unitario_neto).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewDevolucionDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={!idVentaSeleccionada || productosVenta.length === 0} className="bg-blue-600 hover:bg-blue-700">Confirmar Devolución</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}