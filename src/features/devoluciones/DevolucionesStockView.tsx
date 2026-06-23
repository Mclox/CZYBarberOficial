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
import { RotateCcw, Plus, Search, Package, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';
import { fetchApi } from '../../lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCOP } from '../../lib/format';
import { Pagination } from '../../components/common/Pagination';


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
  const [selectedDevolucion, setSelectedDevolucion] = useState<any | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);


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

  const handleToggleEstado = async (dev: any) => {
    const nuevoEstado = dev.estado === 'Activo' ? 'Inactivo' : 'Activo';
    const toastId = toast.loading(`Cambiando estado a ${nuevoEstado}...`);
    try {
      await fetchApi(`/stock-returns/${dev.id_devolucion}`, {
        method: 'PUT',
        body: JSON.stringify({ estado: nuevoEstado })
      });
      toast.success(`Estado de devolución actualizado a ${nuevoEstado}`, { id: toastId });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar el estado', { id: toastId });
    }
  };

  const handleViewDetails = (dev: any) => {
    setSelectedDevolucion(dev);
    setDetailsDialogOpen(true);
  };

  const handleDownloadReport = (dev: any) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Encabezado CzBarber
      doc.setFillColor(212, 175, 55); // Color dorado
      doc.rect(0, 0, 210, 15, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(26, 26, 26);
      doc.text('CZBARBER', 14, 30);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Estilo, Elegancia, Excelencia', 14, 35);
      doc.text('Reporte Oficial de Devolución al Stock', 14, 40);

      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.5);
      doc.line(14, 45, 196, 45);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138); // Azul
      doc.text('Detalles del Registro', 14, 53);

      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);

      const infoData = [
        ['ID Devolución:', `#${dev.id_devolucion}`, 'Fecha Registro:', new Date(dev.fecha).toLocaleDateString('es-ES')],
        ['Venta Original:', `#${dev.id_venta}`, 'Estado:', dev.estado || 'Activo'],
        ['Responsable:', dev.usuario_nombre || 'N/A', 'Destino:', 'Stock (Estante Físico)'],
      ];

      autoTable(doc, {
        startY: 57,
        head: [],
        body: infoData,
        theme: 'plain',
        styles: {
          fontSize: 10,
          cellPadding: 2,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 35 },
          1: { cellWidth: 60 },
          2: { fontStyle: 'bold', cellWidth: 35 },
          3: { cellWidth: 60 },
        },
      });

      const nextY1 = (doc as any).lastAutoTable.finalY + 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138);
      doc.text('Motivo de la Devolución', 14, nextY1);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const splitMotivo = doc.splitTextToSize(dev.motivo || 'Sin motivo especificado', 180);
      doc.text(splitMotivo, 14, nextY1 + 5);

      const nextY2 = nextY1 + 5 + (splitMotivo.length * 5) + 5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138);
      doc.text('Productos Retornados al Stock', 14, nextY2);

      const productsHeaders = ['Producto', 'Cantidad Retornada'];
      const productsData = [
        [dev.producto_nombre || 'N/A', `${dev.cantidad} unidad(es)`]
      ];

      autoTable(doc, {
        startY: nextY2 + 4,
        head: [productsHeaders],
        body: productsData,
        theme: 'striped',
        styles: {
          fontSize: 10,
          cellPadding: 4,
        },
        headStyles: {
          fillColor: [212, 175, 55],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });

      const nextY3 = (doc as any).lastAutoTable.finalY + 25;
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.5);
      doc.line(14, nextY3, 80, nextY3);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Firma del Responsable', 14, nextY3 + 4);
      doc.setFont('helvetica', 'bold');
      doc.text(dev.usuario_nombre || 'Responsable', 14, nextY3 + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Impreso el: ${new Date().toLocaleString('es-ES')}`, 14, 285);

      doc.save(`devolucion_stock_${dev.id_devolucion}.pdf`);
      toast.success('Reporte de devolución PDF descargado correctamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el reporte PDF');
    }
  };

  const filteredDevoluciones = devoluciones.filter(d => 
    d.id_venta?.toString().includes(searchTerm) ||
    (d.producto_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.motivo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDevueltos = devoluciones.reduce((acc, curr) => acc + (curr.cantidad || 0), 0);
  const totalPages = Math.ceil(filteredDevoluciones.length / itemsPerPage);
  const currentPaginatedDevoluciones = filteredDevoluciones.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


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
                  <TableHead>Cant. Recuperada</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8">Cargando base de datos...</TableCell></TableRow>
                ) : filteredDevoluciones.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No hay devoluciones registradas.</TableCell></TableRow>
                ) : (
                  currentPaginatedDevoluciones.map((dev) => (
                    <TableRow key={dev.id_devolucion}>
                      <TableCell className="font-bold text-muted-foreground">#{dev.id_devolucion}</TableCell>
                      <TableCell className="font-bold">#{dev.id_venta}</TableCell>
                      <TableCell className="font-medium text-blue-700">{dev.producto_nombre}</TableCell>
                      <TableCell><Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">+{dev.cantidad}</Badge></TableCell>
                      <TableCell className="max-w-[200px] truncate" title={dev.motivo}>{dev.motivo}</TableCell>
                      <TableCell>{new Date(dev.fecha).toLocaleDateString('es-ES')}</TableCell>
                      <TableCell>{dev.usuario_nombre}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggleEstado(dev)}
                          className="focus:outline-none transition-transform active:scale-95"
                          title={`Cambiar a ${dev.estado === 'Activo' ? 'Inactivo' : 'Activo'}`}
                        >
                          <Badge
                            className={`
                              cursor-pointer px-3 py-1 rounded-full border-2 transition-all duration-200
                              ${dev.estado === 'Activo'
                                ? 'bg-green-600 text-white hover:bg-green-700 border-transparent shadow-sm'
                                : 'bg-red-600 text-white hover:bg-red-700 border-transparent shadow-sm'}
                            `}
                          >
                            <span className={`w-2 h-2 rounded-full mr-2 ${dev.estado === 'Activo' ? 'bg-green-200' : 'bg-red-200'}`}></span>
                            {dev.estado || 'Activo'}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(dev)} className="hover:bg-blue-50 text-blue-600" title="Ver Detalle">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
              totalItems={filteredDevoluciones.length}
            />
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


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Venta Original <span className="text-red-500">*</span></Label>
                <Select value={idVentaSeleccionada} onValueChange={handleSelectVenta}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar venta..." /></SelectTrigger>
                  <SelectContent>
                    {ventas.map(v => (
                      <SelectItem key={v.id_venta} value={v.id_venta.toString()}>
                        Venta #{v.id_venta} - {new Date(v.fecha).toLocaleDateString('es-ES')} - {formatCOP(v.total)}
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
                              {formatCOP(prod.cantidad_devolver * prod.precio_unitario_neto)}
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

      {/* MODAL DETALLES DE DEVOLUCIÓN */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-800">
              <RotateCcw className="w-5 h-5"/> Detalles de Devolución al Stock
            </DialogTitle>
            <DialogDescription>
              Ficha técnica e información de retorno de inventario.
            </DialogDescription>
          </DialogHeader>

          {selectedDevolucion && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase block">ID Devolución</span>
                  <p className="font-bold text-lg text-slate-800">#{selectedDevolucion.id_devolucion}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase block">Venta de Origen</span>
                  <p className="font-bold text-lg text-slate-800">Venta #{selectedDevolucion.id_venta}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase block">Fecha de Operación</span>
                  <p className="text-slate-700">{new Date(selectedDevolucion.fecha).toLocaleString('es-ES')}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase block">Responsable</span>
                  <p className="text-slate-700">{selectedDevolucion.usuario_nombre}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase block">Destino del Stock</span>
                  <p className="font-medium text-blue-700">Stock (Estante Físico)</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase block">Estado Actual</span>
                  <div>
                    <Badge className={selectedDevolucion.estado === 'Activo' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}>
                      {selectedDevolucion.estado || 'Activo'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Producto Retornado</span>
                <div className="bg-slate-50 border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">{selectedDevolucion.producto_nombre}</p>
                    <p className="text-xs text-muted-foreground">ID Producto: #{selectedDevolucion.id_producto}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 font-bold text-sm">
                      +{selectedDevolucion.cantidad} unidades
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Motivo de la Devolución</span>
                <p className="text-slate-700 whitespace-pre-wrap bg-slate-50 border rounded-lg p-3 italic">
                  "{selectedDevolucion.motivo || 'Sin motivo especificado'}"
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col md:flex-row gap-2">
            <Button 
              type="button" 
              onClick={() => handleDownloadReport(selectedDevolucion)} 
              className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
              disabled={!selectedDevolucion}
            >
              <Download className="w-4 h-4"/> Descargar Reporte PDF
            </Button>
            <Button type="button" variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}