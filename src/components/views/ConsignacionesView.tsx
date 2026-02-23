import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Package2, Plus, Pencil, Trash2, Search, Eye, FileDown } from 'lucide-react';
import { mockConsignaciones, mockProductos, mockProveedores, ConsignacionProveedor } from '../../shared/lib/mockData';
import { toast } from 'sonner';

export function ConsignacionesView() {
  const [consignaciones, setConsignaciones] = useState<ConsignacionProveedor[]>(mockConsignaciones);
  const [filteredConsignaciones, setFilteredConsignaciones] = useState<ConsignacionProveedor[]>(mockConsignaciones);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingConsignacion, setEditingConsignacion] = useState<ConsignacionProveedor | null>(null);
  const [viewingConsignacion, setViewingConsignacion] = useState<ConsignacionProveedor | null>(null);
  const [consignacionToDelete, setConsignacionToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    id_proveedor: '',
    id_producto: '',
    cantidad_recibida: '',
    cantidad_vendida: '',
    precio_proveedor: '',
    precio_venta: '',
    fecha_entrega: '',
    fecha_pago: '',
    estado: 'pendiente_consignar' as 'pendiente_consignar' | 'consignado' | 'devuelto',
    observaciones: '',
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = consignaciones.filter(consignacion => {
      const productoName = getProductoName(consignacion.id_producto).toLowerCase();
      const idConsignacion = consignacion.id_consignacion.toString();
      const precioProveedor = consignacion.precio_proveedor.toString();
      const precioVenta = consignacion.precio_venta.toString();
      const cantidad = consignacion.cantidad_recibida.toString();
      const estado = consignacion.estado.toLowerCase();

      return productoName.includes(term) ||
        idConsignacion.includes(term) ||
        consignacion.fecha_entrega.includes(term) ||
        consignacion.fecha_pago?.includes(term) ||
        precioProveedor.includes(term) ||
        precioVenta.includes(term) ||
        cantidad.includes(term) ||
        estado.includes(term);
    });
    setFilteredConsignaciones(filtered);
  };

  const handleExport = () => {
    toast.success('Exportando a Excel...');
    console.log('Exportando consignaciones:', consignaciones);
  };

  const handleCreate = () => {
    setEditingConsignacion(null);
    setFormData({
      id_proveedor: '',
      id_producto: '',
      cantidad_recibida: '',
      cantidad_vendida: '',
      precio_proveedor: '',
      precio_venta: '',
      fecha_entrega: new Date().toISOString().split('T')[0],
      fecha_pago: '',
      estado: 'pendiente_consignar',
      observaciones: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (consignacion: ConsignacionProveedor) => {
    setEditingConsignacion(consignacion);
    setFormData({
      id_proveedor: consignacion.id_proveedor.toString(),
      id_producto: consignacion.id_producto.toString(),
      cantidad_recibida: consignacion.cantidad_recibida.toString(),
      cantidad_vendida: consignacion.cantidad_vendida.toString(),
      precio_proveedor: consignacion.precio_proveedor.toString(),
      precio_venta: consignacion.precio_venta.toString(),
      fecha_entrega: consignacion.fecha_entrega,
      fecha_pago: consignacion.fecha_pago || '',
      estado: consignacion.estado,
      observaciones: consignacion.observaciones || '',
    });
    setDialogOpen(true);
  };

  const handleView = (consignacion: ConsignacionProveedor) => {
    setViewingConsignacion(consignacion);
    setDetailsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setConsignacionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (consignacionToDelete) {
      setConsignaciones(consignaciones.filter(c => c.id_consignacion !== consignacionToDelete));
      setFilteredConsignaciones(filteredConsignaciones.filter(c => c.id_consignacion !== consignacionToDelete));
      toast.success('Consignación eliminada correctamente');
    }
    setDeleteDialogOpen(false);
    setConsignacionToDelete(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingConsignacion) {
      const updated = consignaciones.map(c =>
        c.id_consignacion === editingConsignacion.id_consignacion
          ? {
            ...c,
            id_proveedor: parseInt(formData.id_proveedor),
            id_producto: parseInt(formData.id_producto),
            cantidad_recibida: parseInt(formData.cantidad_recibida),
            cantidad_vendida: parseInt(formData.cantidad_vendida),
            precio_proveedor: parseFloat(formData.precio_proveedor),
            precio_venta: parseFloat(formData.precio_venta),
            fecha_entrega: formData.fecha_entrega,
            fecha_pago: formData.fecha_pago,
            estado: formData.estado,
            observaciones: formData.observaciones,
          }
          : c
      );
      setConsignaciones(updated);
      setFilteredConsignaciones(updated);
      toast.success('Consignación actualizada correctamente');
    } else {
      const newConsignacion: ConsignacionProveedor = {
        id_consignacion: Math.max(...consignaciones.map(c => c.id_consignacion), 0) + 1,
        id_proveedor: parseInt(formData.id_proveedor),
        id_producto: parseInt(formData.id_producto),
        cantidad_recibida: parseInt(formData.cantidad_recibida),
        cantidad_vendida: parseInt(formData.cantidad_vendida),
        precio_proveedor: parseFloat(formData.precio_proveedor),
        precio_venta: parseFloat(formData.precio_venta),
        fecha_entrega: formData.fecha_entrega,
        fecha_pago: formData.fecha_pago,
        estado: formData.estado,
        observaciones: formData.observaciones,
      };
      setConsignaciones([...consignaciones, newConsignacion]);
      setFilteredConsignaciones([...consignaciones, newConsignacion]);
      toast.success('Consignación creada correctamente');
    }

    setDialogOpen(false);
  };

  const getProductoName = (id: number) => {
    return mockProductos.find(p => p.id_producto === id)?.nombre || 'N/A';
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'consignado':
        return <Badge variant="default" className="bg-green-600">Consignado</Badge>;
      case 'pendiente_consignar':
        return <Badge variant="secondary" className="bg-yellow-600">Pendiente por consignar</Badge>;
      case 'devuelto':
        return <Badge variant="destructive">Devuelto</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Package2 className="w-6 h-6" />
            Consignaciones
          </h1>
          <p className="text-muted-foreground">Gestiona los productos en consignación</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Consignación
          </Button>
          <Button onClick={handleExport}>
            <FileDown className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Lista de Consignaciones</CardTitle>
            <div className="w-full md:w-96">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar consignaciones..."
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
                  <TableHead>Cantidad Recibida</TableHead>
                  <TableHead>Cantidad Vendida</TableHead>
                  <TableHead>Fecha Entrega</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsignaciones.map((consignacion) => (
                  <TableRow key={consignacion.id_consignacion}>
                    <TableCell>#{consignacion.id_consignacion}</TableCell>
                    <TableCell>{getProductoName(consignacion.id_producto)}</TableCell>
                    <TableCell>{consignacion.cantidad_recibida}</TableCell>
                    <TableCell>{consignacion.cantidad_vendida}</TableCell>
                    <TableCell>{new Date(consignacion.fecha_entrega + 'T00:00:00').toLocaleDateString('es-ES')}</TableCell>
                    <TableCell>{getEstadoBadge(consignacion.estado)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleView(consignacion)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(consignacion)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(consignacion.id_consignacion)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingConsignacion ? 'Editar Consignación' : 'Nueva Consignación'}</DialogTitle>
            <DialogDescription>
              {editingConsignacion ? 'Actualiza la información de la consignación' : 'Registra una nueva consignación'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="id_proveedor">Proveedor *</Label>
                <Select
                  value={formData.id_proveedor}
                  onValueChange={(value) => setFormData({ ...formData, id_proveedor: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProveedores.map((proveedor) => (
                      <SelectItem key={proveedor.id_proveedor} value={proveedor.id_proveedor.toString()}>
                        {proveedor.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="id_producto">Producto *</Label>
                <Select
                  value={formData.id_producto}
                  onValueChange={(value) => setFormData({ ...formData, id_producto: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProductos.map((producto) => (
                      <SelectItem key={producto.id_producto} value={producto.id_producto.toString()}>
                        {producto.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cantidad_recibida">Cantidad Recibida *</Label>
                <Input
                  id="cantidad_recibida"
                  type="number"
                  value={formData.cantidad_recibida}
                  onChange={(e) => setFormData({ ...formData, cantidad_recibida: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cantidad_vendida">Cantidad Vendida *</Label>
                <Input
                  id="cantidad_vendida"
                  type="number"
                  value={formData.cantidad_vendida}
                  onChange={(e) => setFormData({ ...formData, cantidad_vendida: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio_proveedor">Precio Proveedor *</Label>
                <Input
                  id="precio_proveedor"
                  type="number"
                  step="0.01"
                  value={formData.precio_proveedor}
                  onChange={(e) => setFormData({ ...formData, precio_proveedor: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio_venta">Precio Venta *</Label>
                <Input
                  id="precio_venta"
                  type="number"
                  step="0.01"
                  value={formData.precio_venta}
                  onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_entrega">Fecha Entrega *</Label>
                <Input
                  id="fecha_entrega"
                  type="date"
                  value={formData.fecha_entrega}
                  onChange={(e) => setFormData({ ...formData, fecha_entrega: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_pago">Fecha Pago</Label>
                <Input
                  id="fecha_pago"
                  type="date"
                  value={formData.fecha_pago}
                  onChange={(e) => setFormData({ ...formData, fecha_pago: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado *</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value: any) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente_consignar">Pendiente por consignar</SelectItem>
                    <SelectItem value="consignado">Consignado</SelectItem>
                    <SelectItem value="devuelto">Devuelto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Input
                  id="observaciones"
                  type="text"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingConsignacion ? 'Actualizar' : 'Crear'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalles */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Consignación #{viewingConsignacion?.id_consignacion}</DialogTitle>
            <DialogDescription>Información completa</DialogDescription>
          </DialogHeader>
          {viewingConsignacion && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Producto</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{getProductoName(viewingConsignacion.id_producto)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cantidad Recibida</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{viewingConsignacion.cantidad_recibida}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cantidad Vendida</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{viewingConsignacion.cantidad_vendida}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Precio Proveedor</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">${viewingConsignacion.precio_proveedor.toFixed(2)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Precio Venta</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">${viewingConsignacion.precio_venta.toFixed(2)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fecha Entrega</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p>
                    {new Date(viewingConsignacion.fecha_entrega + 'T00:00:00').toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fecha Pago</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p>
                    {viewingConsignacion.fecha_pago
                      ? new Date(viewingConsignacion.fecha_pago + 'T00:00:00').toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                      : 'No pagado'}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <div className="p-3 bg-muted rounded-md">
                  {getEstadoBadge(viewingConsignacion.estado)}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{viewingConsignacion.observaciones}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La consignación será eliminada permanentemente.
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
    </div>
  );
}
