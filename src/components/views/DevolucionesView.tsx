// // import { useState } from 'react';
// // import { Button } from '../ui/button';
// // import { Input } from '../ui/input';
// // import { Label } from '../ui/label';
// // import { Badge } from '../ui/badge';
// // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// // import { Textarea } from '../ui/textarea';
// // import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
// // import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
// // import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
// // import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
// // import { RotateCcw, Plus, FileDown, Eye, Trash2, Search, Calendar, TrendingUp, CheckCircle2, XCircle, Package } from 'lucide-react';
// // import { mockDevolucionesProveedor, mockProveedores, mockDetalleCompras, mockProductos, mockCompras } from '../../shared/lib/mockData';
// // import { toast } from 'sonner';

// // export function DevolucionesView() {
// //   const [devoluciones, setDevoluciones] = useState(mockDevolucionesProveedor);
// //   const [filteredDevoluciones, setFilteredDevoluciones] = useState(mockDevolucionesProveedor);
// //   const [newDevolucionDialogOpen, setNewDevolucionDialogOpen] = useState(false);
// //   const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
// //   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
// //   const [viewingDevolucion, setViewingDevolucion] = useState<any | null>(null);
// //   const [devolucionToDelete, setDevolucionToDelete] = useState<any | null>(null);
// //   const [searchTerm, setSearchTerm] = useState('');
  
// //   // Estados para el formulario de nueva devolución
// //   const [formData, setFormData] = useState({
// //     id_proveedor: '',
// //     id_detalle_compra: '',
// //     fecha: new Date().toISOString().split('T')[0],
// //     motivo: '',
// //     cantidad_devuelta: '1',
// //     estado: 'pendiente',
// //   });

// //   const handleExport = () => {
// //     toast.success('Exportando a Excel...', {
// //       description: `${filteredDevoluciones.length} registros exportados`,
// //       style: { background: '#10b981', color: '#fff' }
// //     });
// //     console.log('Exportando devoluciones:', filteredDevoluciones);
// //   };

// //   const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const term = e.target.value.toLowerCase();
// //     setSearchTerm(term);
    
// //     const filtered = devoluciones.filter(devolucion => {
// //       const idDevolucion = devolucion.id_dev_prov.toString();
// //       const idProveedor = devolucion.id_proveedor.toString();
// //       const idDetalleCompra = devolucion.id_detalle_compra.toString();
// //       const motivo = devolucion.motivo.toLowerCase();
// //       const cantidadDevuelta = devolucion.cantidad_devuelta.toString();
// //       const estado = devolucion.estado.toLowerCase();
// //       const proveedorName = getProveedorName(devolucion.id_proveedor).toLowerCase();
// //       const productoName = getProductoNameFromDetalle(devolucion.id_detalle_compra).toLowerCase();
      
// //       return idDevolucion.includes(term) ||
// //              idProveedor.includes(term) ||
// //              idDetalleCompra.includes(term) ||
// //              motivo.includes(term) ||
// //              devolucion.fecha.includes(term) ||
// //              cantidadDevuelta.includes(term) ||
// //              estado.includes(term) ||
// //              proveedorName.includes(term) ||
// //              productoName.includes(term);
// //     });
// //     setFilteredDevoluciones(filtered);
// //   };

// //   const getProveedorName = (id: number) => {
// //     const proveedor = mockProveedores.find(p => p.id_proveedor === id);
// //     return proveedor?.nombre || 'N/A';
// //   };

// //   const getProductoNameFromDetalle = (idDetalle: number) => {
// //     const detalle = mockDetalleCompras.find(d => d.id_detalle_compra === idDetalle);
// //     if (detalle) {
// //       const producto = mockProductos.find(p => p.id_producto === detalle.id_producto);
// //       return producto?.nombre || 'N/A';
// //     }
// //     return 'N/A';
// //   };

// //   const getCompraFromDetalle = (idDetalle: number) => {
// //     const detalle = mockDetalleCompras.find(d => d.id_detalle_compra === idDetalle);
// //     if (detalle) {
// //       return mockCompras.find(c => c.id_compra === detalle.id_compra);
// //     }
// //     return null;
// //   };

// //   const getEstadoBadge = (estado: string) => {
// //     switch (estado) {
// //       case 'completada':
// //       case 'aprobada':
// //         return <Badge className="bg-green-600">Completada</Badge>;
// //       case 'pendiente':
// //         return <Badge className="bg-yellow-600">Pendiente</Badge>;
// //       case 'rechazada':
// //         return <Badge variant="destructive">Rechazada</Badge>;
// //       default:
// //         return <Badge>{estado}</Badge>;
// //     }
// //   };

// //   const handleOpenNewDevolucion = () => {
// //     setFormData({
// //       id_proveedor: '',
// //       id_detalle_compra: '',
// //       fecha: new Date().toISOString().split('T')[0],
// //       motivo: '',
// //       cantidad_devuelta: '1',
// //       estado: 'pendiente',
// //     });
// //     setNewDevolucionDialogOpen(true);
// //   };

// //   const handleSubmitDevolucion = (e: React.FormEvent) => {
// //     e.preventDefault();
    
// //     // Validaciones
// //     if (!formData.id_proveedor) {
// //       toast.error('Error de validación', {
// //         description: 'Debes seleccionar un proveedor',
// //         style: { background: '#ef4444', color: '#fff' }
// //       });
// //       return;
// //     }

// //     if (!formData.id_detalle_compra) {
// //       toast.error('Error de validación', {
// //         description: 'Debes seleccionar un detalle de compra',
// //         style: { background: '#ef4444', color: '#fff' }
// //       });
// //       return;
// //     }

// //     if (!formData.motivo.trim()) {
// //       toast.error('Error de validación', {
// //         description: 'Debes ingresar un motivo para la devolución',
// //         style: { background: '#ef4444', color: '#fff' }
// //       });
// //       return;
// //     }

// //     const cantidadDevuelta = parseInt(formData.cantidad_devuelta);
// //     if (isNaN(cantidadDevuelta) || cantidadDevuelta <= 0) {
// //       toast.error('Error de validación', {
// //         description: 'La cantidad devuelta debe ser mayor a 0',
// //         style: { background: '#ef4444', color: '#fff' }
// //       });
// //       return;
// //     }

// //     // Validar que la cantidad no exceda la cantidad comprada
// //     const detalle = mockDetalleCompras.find(d => d.id_detalle_compra === parseInt(formData.id_detalle_compra));
// //     if (detalle && cantidadDevuelta > detalle.cantidad) {
// //       toast.error('Error de validación', {
// //         description: `La cantidad devuelta no puede ser mayor a ${detalle.cantidad} (cantidad comprada)`,
// //         style: { background: '#ef4444', color: '#fff' }
// //       });
// //       return;
// //     }

// //     const newDevolucion = {
// //       id_dev_prov: devoluciones.length + 1,
// //       id_proveedor: parseInt(formData.id_proveedor),
// //       id_detalle_compra: parseInt(formData.id_detalle_compra),
// //       fecha: formData.fecha,
// //       motivo: formData.motivo,
// //       cantidad_devuelta: cantidadDevuelta,
// //       estado: formData.estado as 'pendiente' | 'aprobada' | 'rechazada',
// //     };

// //     const updatedDevoluciones = [...devoluciones, newDevolucion];
// //     setDevoluciones(updatedDevoluciones);
// //     setFilteredDevoluciones(updatedDevoluciones);
    
// //     toast.success('Devolución registrada exitosamente', {
// //       description: `${cantidadDevuelta} unidades devueltas al proveedor ${getProveedorName(newDevolucion.id_proveedor)}`,
// //       style: { background: '#10b981', color: '#fff' }
// //     });
    
// //     setNewDevolucionDialogOpen(false);
// //   };

// //   const handleView = (devolucion: any) => {
// //     setViewingDevolucion(devolucion);
// //     setDetailsDialogOpen(true);
// //   };

// //   const handleDeleteClick = (devolucion: any) => {
// //     setDevolucionToDelete(devolucion);
// //     setDeleteDialogOpen(true);
// //   };

// //   const confirmDelete = () => {
// //     if (devolucionToDelete) {
// //       const updatedDevoluciones = devoluciones.filter(d => d.id_dev_prov !== devolucionToDelete.id_dev_prov);
// //       setDevoluciones(updatedDevoluciones);
// //       setFilteredDevoluciones(updatedDevoluciones);
      
// //       toast.success('Devolución eliminada exitosamente', {
// //         description: `La devolución #${devolucionToDelete.id_dev_prov} ha sido eliminada`,
// //         style: { background: '#10b981', color: '#fff' }
// //       });
// //     }
// //     setDeleteDialogOpen(false);
// //   };

// //   // Estadísticas
// //   const totalDevoluciones = filteredDevoluciones.length;
// //   const devolucionesPendientes = filteredDevoluciones.filter(d => d.estado === 'pendiente').length;
// //   const devolucionesCompletadas = filteredDevoluciones.filter(d => d.estado === 'completada' || d.estado === 'aprobada').length;
// //   const totalUnidadesDevueltas = filteredDevoluciones.reduce((sum, d) => sum + d.cantidad_devuelta, 0);

// //   return (
// //     <div className="p-4 md:p-8 space-y-6">
// //       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
// //         <div>
// //           <h1 className="flex items-center gap-2">
// //             <RotateCcw className="w-6 h-6" />
// //             Devoluciones al Proveedor
// //           </h1>
// //           <p className="text-muted-foreground">Gestiona las devoluciones de productos a proveedores</p>
// //         </div>
// //         <div className="flex gap-2">
// //           <Button onClick={handleOpenNewDevolucion} className="bg-orange-600 hover:bg-orange-700">
// //             <Plus className="w-4 h-4 mr-2" />
// //             Nueva Devolución
// //           </Button>
// //           <Button onClick={handleExport} variant="outline">
// //             <FileDown className="w-4 h-4 mr-2" />
// //             Exportar
// //           </Button>
// //         </div>
// //       </div>

// //       {/* Estadísticas */}
// //       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
// //         <Card>
// //           <CardContent className="p-6">
// //             <div className="flex items-center gap-4">
// //               <div className="p-3 bg-orange-100 rounded-lg">
// //                 <RotateCcw className="w-6 h-6 text-orange-600" />
// //               </div>
// //               <div>
// //                 <p className="text-sm text-muted-foreground">Total Devoluciones</p>
// //                 <p className="text-2xl font-bold">{totalDevoluciones}</p>
// //               </div>
// //             </div>
// //           </CardContent>
// //         </Card>
        
// //         <Card>
// //           <CardContent className="p-6">
// //             <div className="flex items-center gap-4">
// //               <div className="p-3 bg-yellow-100 rounded-lg">
// //                 <XCircle className="w-6 h-6 text-yellow-600" />
// //               </div>
// //               <div>
// //                 <p className="text-sm text-muted-foreground">Pendientes</p>
// //                 <p className="text-2xl font-bold">{devolucionesPendientes}</p>
// //               </div>
// //             </div>
// //           </CardContent>
// //         </Card>

// //         <Card>
// //           <CardContent className="p-6">
// //             <div className="flex items-center gap-4">
// //               <div className="p-3 bg-green-100 rounded-lg">
// //                 <CheckCircle2 className="w-6 h-6 text-green-600" />
// //               </div>
// //               <div>
// //                 <p className="text-sm text-muted-foreground">Completadas</p>
// //                 <p className="text-2xl font-bold">{devolucionesCompletadas}</p>
// //               </div>
// //             </div>
// //           </CardContent>
// //         </Card>

// //         <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-500">
// //           <CardContent className="p-6">
// //             <div className="flex items-center gap-4">
// //               <div className="p-3 bg-orange-600 rounded-lg">
// //                 <Package className="w-6 h-6 text-white" />
// //               </div>
// //               <div>
// //                 <p className="text-sm text-muted-foreground">Unidades Devueltas</p>
// //                 <p className="text-2xl font-bold text-orange-600">{totalUnidadesDevueltas}</p>
// //               </div>
// //             </div>
// //           </CardContent>
// //         </Card>
// //       </div>

// //       <Card>
// //         <CardHeader>
// //           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
// //             <CardTitle>Lista de Devoluciones</CardTitle>
// //             <div className="w-full md:w-96">
// //               <div className="relative">
// //                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
// //                 <Input
// //                   placeholder="Buscar por ID, proveedor, producto, motivo..."
// //                   value={searchTerm}
// //                   onChange={handleSearch}
// //                   className="pl-10"
// //                 />
// //               </div>
// //             </div>
// //           </div>
// //         </CardHeader>
// //         <CardContent>
// //           <div className="rounded-md border overflow-x-auto">
// //             <Table>
// //               <TableHeader>
// //                 <TableRow>
// //                   <TableHead>ID</TableHead>
// //                   <TableHead>Proveedor</TableHead>
// //                   <TableHead>Producto</TableHead>
// //                   <TableHead>Cantidad</TableHead>
// //                   <TableHead>Motivo</TableHead>
// //                   <TableHead>Fecha</TableHead>
// //                   <TableHead>Estado</TableHead>
// //                   <TableHead className="text-right">Acciones</TableHead>
// //                 </TableRow>
// //               </TableHeader>
// //               <TableBody>
// //                 {filteredDevoluciones.length === 0 ? (
// //                   <TableRow>
// //                     <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
// //                       No se encontraron devoluciones
// //                     </TableCell>
// //                   </TableRow>
// //                 ) : (
// //                   filteredDevoluciones.map((devolucion) => (
// //                     <TableRow key={devolucion.id_dev_prov}>
// //                       <TableCell>#{devolucion.id_dev_prov}</TableCell>
// //                       <TableCell>{getProveedorName(devolucion.id_proveedor)}</TableCell>
// //                       <TableCell>{getProductoNameFromDetalle(devolucion.id_detalle_compra)}</TableCell>
// //                       <TableCell>
// //                         <Badge variant="outline">{devolucion.cantidad_devuelta} unidades</Badge>
// //                       </TableCell>
// //                       <TableCell className="max-w-xs truncate">{devolucion.motivo}</TableCell>
// //                       <TableCell>{new Date(devolucion.fecha + 'T00:00:00').toLocaleDateString('es-ES')}</TableCell>
// //                       <TableCell>{getEstadoBadge(devolucion.estado)}</TableCell>
// //                       <TableCell className="text-right">
// //                         <div className="flex gap-2 justify-end">
// //                           <Button variant="outline" size="sm" onClick={() => handleView(devolucion)}>
// //                             <Eye className="w-4 h-4" />
// //                           </Button>
// //                           <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(devolucion)}>
// //                             <Trash2 className="w-4 h-4" />
// //                           </Button>
// //                         </div>
// //                       </TableCell>
// //                     </TableRow>
// //                   ))
// //                 )}
// //               </TableBody>
// //             </Table>
// //           </div>
// //         </CardContent>
// //       </Card>

// //       {/* Dialog Nueva Devolución */}
// //       <Dialog open={newDevolucionDialogOpen} onOpenChange={setNewDevolucionDialogOpen}>
// //         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
// //           <DialogHeader>
// //             <DialogTitle>Registrar Nueva Devolución</DialogTitle>
// //             <DialogDescription>
// //               Complete el formulario para registrar una devolución al proveedor
// //             </DialogDescription>
// //           </DialogHeader>
          
// //           <form onSubmit={handleSubmitDevolucion}>
// //             <div className="space-y-6 py-4">
// //               <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
// //                 <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
// //                   ℹ️ Gestión Interna - Solo Punto Físico
// //                 </p>
// //                 <p className="text-xs text-blue-700 dark:text-blue-300">
// //                   Esta aplicación es solo para gestión interna del negocio. Las devoluciones se gestionan únicamente desde nuestro establecimiento físico.
// //                 </p>
// //               </div>

// //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //                 <div className="space-y-2">
// //                   <Label htmlFor="proveedor">Proveedor <span className="text-red-500">*</span></Label>
// //                   <Select
// //                     value={formData.id_proveedor}
// //                     onValueChange={(value) => setFormData({ ...formData, id_proveedor: value })}
// //                   >
// //                     <SelectTrigger id="proveedor">
// //                       <SelectValue placeholder="Selecciona un proveedor" />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       {mockProveedores.map(proveedor => (
// //                         <SelectItem key={proveedor.id_proveedor} value={proveedor.id_proveedor.toString()}>
// //                           {proveedor.nombre}
// //                         </SelectItem>
// //                       ))}
// //                     </SelectContent>
// //                   </Select>
// //                 </div>

// //                 <div className="space-y-2">
// //                   <Label htmlFor="detalle_compra">Detalle de Compra <span className="text-red-500">*</span></Label>
// //                   <Select
// //                     value={formData.id_detalle_compra}
// //                     onValueChange={(value) => setFormData({ ...formData, id_detalle_compra: value })}
// //                   >
// //                     <SelectTrigger id="detalle_compra">
// //                       <SelectValue placeholder="Selecciona un detalle de compra" />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       {mockDetalleCompras.map(detalle => {
// //                         const producto = mockProductos.find(p => p.id_producto === detalle.id_producto);
// //                         return (
// //                           <SelectItem key={detalle.id_detalle_compra} value={detalle.id_detalle_compra.toString()}>
// //                             #{detalle.id_detalle_compra} - {producto?.nombre || 'N/A'} ({detalle.cantidad} unidades)
// //                           </SelectItem>
// //                         );
// //                       })}
// //                     </SelectContent>
// //                   </Select>
// //                 </div>

// //                 <div className="space-y-2">
// //                   <Label htmlFor="fecha">Fecha <span className="text-red-500">*</span></Label>
// //                   <div className="relative">
// //                     <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
// //                     <Input
// //                       id="fecha"
// //                       type="date"
// //                       value={formData.fecha}
// //                       onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
// //                       className="pl-10"
// //                       required
// //                     />
// //                   </div>
// //                 </div>

// //                 <div className="space-y-2">
// //                   <Label htmlFor="cantidad">Cantidad Devuelta <span className="text-red-500">*</span></Label>
// //                   <Input
// //                     id="cantidad"
// //                     type="number"
// //                     min="1"
// //                     value={formData.cantidad_devuelta}
// //                     onChange={(e) => setFormData({ ...formData, cantidad_devuelta: e.target.value })}
// //                     required
// //                   />
// //                 </div>

// //                 <div className="space-y-2">
// //                   <Label htmlFor="estado">Estado <span className="text-red-500">*</span></Label>
// //                   <Select
// //                     value={formData.estado}
// //                     onValueChange={(value) => setFormData({ ...formData, estado: value })}
// //                   >
// //                     <SelectTrigger id="estado">
// //                       <SelectValue />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       <SelectItem value="pendiente">Pendiente</SelectItem>
// //                       <SelectItem value="aprobada">Aprobada</SelectItem>
// //                       <SelectItem value="rechazada">Rechazada</SelectItem>
// //                     </SelectContent>
// //                   </Select>
// //                 </div>
// //               </div>

// //               <div className="space-y-2">
// //                 <Label htmlFor="motivo">Motivo de Devolución <span className="text-red-500">*</span></Label>
// //                 <Textarea
// //                   id="motivo"
// //                   value={formData.motivo}
// //                   onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
// //                   placeholder="Describe el motivo de la devolución..."
// //                   rows={4}
// //                   required
// //                 />
// //               </div>

// //               {/* Nota informativa */}
// //               <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
// //                 <p className="text-sm text-amber-800 dark:text-amber-200">
// //                   <span className="font-semibold">Nota:</span> Esta es una versión demo. En producción, los datos se guardarían en la base de datos y se notificaría al proveedor.
// //                 </p>
// //               </div>
// //             </div>

// //             <DialogFooter>
// //               <Button type="button" variant="outline" onClick={() => setNewDevolucionDialogOpen(false)}>
// //                 Cancelar
// //               </Button>
// //               <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
// //                 <RotateCcw className="w-4 h-4 mr-2" />
// //                 Registrar Devolución
// //               </Button>
// //             </DialogFooter>
// //           </form>
// //         </DialogContent>
// //       </Dialog>

// //       {/* Dialog Detalles de Devolución */}
// //       <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
// //         <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
// //           <DialogHeader>
// //             <DialogTitle>Detalles de la Devolución #{viewingDevolucion?.id_dev_prov}</DialogTitle>
// //             <DialogDescription>
// //               Información completa de la devolución al proveedor
// //             </DialogDescription>
// //           </DialogHeader>
// //           {viewingDevolucion && (
// //             <div className="space-y-6 py-4">
// //               <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
// //                 <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
// //                   ℹ️ Gestión Interna - Solo Punto Físico
// //                 </p>
// //                 <p className="text-xs text-blue-700 dark:text-blue-300">
// //                   Esta aplicación es solo para gestión interna del negocio. Las devoluciones se gestionan únicamente desde nuestro establecimiento físico.
// //                 </p>
// //               </div>

// //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //                 <div className="space-y-2">
// //                   <p className="text-sm font-medium text-muted-foreground">ID Devolución</p>
// //                   <p className="font-medium">#{viewingDevolucion.id_dev_prov}</p>
// //                 </div>

// //                 <div className="space-y-2">
// //                   <p className="text-sm font-medium text-muted-foreground">Estado</p>
// //                   <div>{getEstadoBadge(viewingDevolucion.estado)}</div>
// //                 </div>

// //                 <div className="space-y-2">
// //                   <p className="text-sm font-medium text-muted-foreground">Proveedor</p>
// //                   <p className="font-medium">{getProveedorName(viewingDevolucion.id_proveedor)}</p>
// //                 </div>

// //                 <div className="space-y-2">
// //                   <p className="text-sm font-medium text-muted-foreground">Producto</p>
// //                   <p className="font-medium">{getProductoNameFromDetalle(viewingDevolucion.id_detalle_compra)}</p>
// //                 </div>

// //                 <div className="space-y-2">
// //                   <p className="text-sm font-medium text-muted-foreground">Cantidad Devuelta</p>
// //                   <Badge variant="outline" className="w-fit">
// //                     {viewingDevolucion.cantidad_devuelta} unidades
// //                   </Badge>
// //                 </div>

// //                 <div className="space-y-2">
// //                   <p className="text-sm font-medium text-muted-foreground">Fecha de Devolución</p>
// //                   <p>
// //                     {new Date(viewingDevolucion.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
// //                       year: 'numeric',
// //                       month: 'long',
// //                       day: 'numeric',
// //                     })}
// //                   </p>
// //                 </div>
// //               </div>

// //               <div className="space-y-2">
// //                 <p className="text-sm font-medium text-muted-foreground">Motivo de la Devolución</p>
// //                 <div className="p-4 bg-muted rounded-lg">
// //                   <p>{viewingDevolucion.motivo}</p>
// //                 </div>
// //               </div>

// //               <div className="space-y-2">
// //                 <p className="text-sm font-medium text-muted-foreground">Información de la Compra Original</p>
// //                 <Card>
// //                   <CardContent className="p-4 space-y-2">
// //                     <div className="flex justify-between">
// //                       <span className="text-sm text-muted-foreground">ID Detalle Compra:</span>
// //                       <span className="font-medium">#{viewingDevolucion.id_detalle_compra}</span>
// //                     </div>
// //                     {(() => {
// //                       const detalle = mockDetalleCompras.find(d => d.id_detalle_compra === viewingDevolucion.id_detalle_compra);
// //                       if (detalle) {
// //                         return (
// //                           <>
// //                             <div className="flex justify-between">
// //                               <span className="text-sm text-muted-foreground">Cantidad Original:</span>
// //                               <span className="font-medium">{detalle.cantidad} unidades</span>
// //                             </div>
// //                             <div className="flex justify-between">
// //                               <span className="text-sm text-muted-foreground">Precio Unitario:</span>
// //                               <span className="font-medium">${detalle.precio_unitario.toFixed(2)}</span>
// //                             </div>
// //                             <div className="flex justify-between border-t pt-2">
// //                               <span className="text-sm font-semibold">Monto Devuelto:</span>
// //                               <span className="font-bold text-orange-600">
// //                                 ${(viewingDevolucion.cantidad_devuelta * detalle.precio_unitario).toFixed(2)}
// //                               </span>
// //                             </div>
// //                           </>
// //                         );
// //                       }
// //                       return null;
// //                     })()}
// //                   </CardContent>
// //                 </Card>
// //               </div>
// //             </div>
// //           )}
// //           <DialogFooter>
// //             <Button onClick={() => setDetailsDialogOpen(false)}>Cerrar</Button>
// //           </DialogFooter>
// //         </DialogContent>
// //       </Dialog>

// //       {/* Dialog Eliminar Devolución */}
// //       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
// //         <AlertDialogContent>
// //           <AlertDialogHeader>
// //             <AlertDialogTitle>Eliminar Devolución</AlertDialogTitle>
// //             <AlertDialogDescription>
// //               ¿Estás seguro de que deseas eliminar la devolución #{devolucionToDelete?.id_dev_prov}? 
// //               Esta acción no se puede deshacer y afectará los registros históricos.
// //             </AlertDialogDescription>
// //           </AlertDialogHeader>
// //           <AlertDialogFooter>
// //             <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
// //               Cancelar
// //             </AlertDialogCancel>
// //             <AlertDialogAction
// //               onClick={confirmDelete}
// //               className="bg-red-600 hover:bg-red-700"
// //             >
// //               Eliminar
// //             </AlertDialogAction>
// //           </AlertDialogFooter>
// //         </AlertDialogContent>
// //       </AlertDialog>
// //     </div>
// //   );
// // }

// import { useState, useEffect } from 'react';
// import { Button } from '../ui/button';
// import { Input } from '../ui/input';
// import { Label } from '../ui/label';
// import { Badge } from '../ui/badge';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// import { Textarea } from '../ui/textarea';
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
// import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
// import { RotateCcw, Plus, Search, Package, AlertCircle } from 'lucide-react';
// import { toast } from 'sonner';
// import { fetchApi } from '../../lib/api';
// import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

// export function DevolucionesView() {
//   // Datos Reales
//   const [devoluciones, setDevoluciones] = useState<any[]>([]);
//   const [ventas, setVentas] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');

//   // UI
//   const [newDevolucionDialogOpen, setNewDevolucionDialogOpen] = useState(false);

//   // Formulario
//   const [idVentaSeleccionada, setIdVentaSeleccionada] = useState<string>('');
//   const [motivo, setMotivo] = useState('');
//   const [productosVenta, setProductosVenta] = useState<any[]>([]);
//   const [loadingDetalles, setLoadingDetalles] = useState(false);

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const [devRes, ventasRes] = await Promise.all([
//         fetchApi('/stock-returns').catch(() => ({ success: false, data: [] })),
//         fetchApi('/sales').catch(() => ({ success: false, data: [] }))
//       ]);
//       if (devRes.success) setDevoluciones(devRes.data);
//       if (ventasRes.success) setVentas(ventasRes.data);
//     } catch (error) {
//       toast.error('Error al cargar datos');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   // Cuando selecciona una venta, buscamos sus productos
//   const handleSelectVenta = async (id_venta: string) => {
//     setIdVentaSeleccionada(id_venta);
//     setProductosVenta([]);
//     if (!id_venta) return;

//     setLoadingDetalles(true);
//     try {
//       const res = await fetchApi(`/sales/${id_venta}/details`);
//       if (res.success) {
//         // Solo permitimos devolver Productos (no Servicios)
//         const soloProductos = res.data
//           .filter((d: any) => d.tipo === 'Producto')
//           .map((d: any) => ({
//             ...d,
//             cantidad_devolver: 0 // Iniciamos en 0
//           }));
//         setProductosVenta(soloProductos);
//       }
//     } catch (error) {
//       toast.error('Error al cargar detalles de la venta');
//     } finally {
//       setLoadingDetalles(false);
//     }
//   };

//   const handleCantidadChange = (id_detalle: number, cantidadStr: string, maxCantidad: number) => {
//     let cant = parseInt(cantidadStr);
//     if (isNaN(cant) || cant < 0) cant = 0;
//     if (cant > maxCantidad) cant = maxCantidad;

//     setProductosVenta(prev => prev.map(p => 
//       p.id_detalle === id_detalle ? { ...p, cantidad_devolver: cant } : p
//     ));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!idVentaSeleccionada) return toast.error('Selecciona una venta');
//     if (!motivo.trim()) return toast.error('El motivo es obligatorio');
    
//     const itemsADevolver = productosVenta.filter(p => p.cantidad_devolver > 0);
//     if (itemsADevolver.length === 0) return toast.error('Debes devolver al menos 1 producto');

//     try {
//       const payload = {
//         id_venta: parseInt(idVentaSeleccionada),
//         motivo: motivo.trim(),
//         detalles: itemsADevolver.map(p => ({
//           id_producto: p.id_producto,
//           cantidad_devolver: p.cantidad_devolver
//         }))
//       };

//       await fetchApi('/stock-returns', { method: 'POST', body: JSON.stringify(payload) });
      
//       toast.success('Devolución procesada y stock recuperado', { style: { background: '#10b981', color: '#fff' }});
//       setNewDevolucionDialogOpen(false);
//       fetchData(); // Refrescar historial
//     } catch (error: any) {
//       toast.error(error.message || 'Error al procesar devolución');
//     }
//   };

//   const filteredDevoluciones = devoluciones.filter(d => 
//     d.id_venta?.toString().includes(searchTerm) ||
//     (d.producto_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
//     (d.motivo || '').toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const totalDevueltos = devoluciones.reduce((acc, curr) => acc + (curr.cantidad || 0), 0);

//   return (
//     <div className="p-4 md:p-8 space-y-6">
//       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
//         <div>
//           <h1 className="flex items-center gap-2 font-bold text-2xl text-blue-800">
//             <RotateCcw className="w-6 h-6" /> Devoluciones al Stock
//           </h1>
//           <p className="text-muted-foreground">Retornos de inventario por ventas canceladas o ajustadas</p>
//         </div>
//         <div className="flex gap-2">
//           <Button onClick={() => {setIdVentaSeleccionada(''); setMotivo(''); setProductosVenta([]); setNewDevolucionDialogOpen(true);}} className="bg-blue-600 hover:bg-blue-700">
//             <Plus className="w-4 h-4 mr-2" /> Nueva Devolución
//           </Button>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
//           <CardContent className="p-6 flex items-center gap-4">
//             <div className="p-3 bg-blue-600 rounded-lg"><RotateCcw className="w-6 h-6 text-white" /></div>
//             <div>
//               <p className="text-sm text-muted-foreground">Total de Operaciones</p>
//               <p className="text-2xl font-bold text-blue-700">{devoluciones.length}</p>
//             </div>
//           </CardContent>
//         </Card>
//         <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
//           <CardContent className="p-6 flex items-center gap-4">
//             <div className="p-3 bg-emerald-600 rounded-lg"><Package className="w-6 h-6 text-white" /></div>
//             <div>
//               <p className="text-sm text-muted-foreground">Unidades Recuperadas (Stock)</p>
//               <p className="text-2xl font-bold text-emerald-700">+{totalDevueltos}</p>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <Card>
//         <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//           <CardTitle>Historial de Devoluciones</CardTitle>
//           <div className="relative w-full md:w-96">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
//             <Input placeholder="Buscar por producto, motivo o venta..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="rounded-md border overflow-x-auto">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>ID Dev</TableHead>
//                   <TableHead>Venta Original</TableHead>
//                   <TableHead>Producto Devuelto</TableHead>
//                   <TableHead className="text-center">Cant. Recuperada</TableHead>
//                   <TableHead>Motivo</TableHead>
//                   <TableHead>Fecha</TableHead>
//                   <TableHead>Responsable</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {loading ? (
//                   <TableRow><TableCell colSpan={7} className="text-center py-8">Cargando base de datos...</TableCell></TableRow>
//                 ) : filteredDevoluciones.length === 0 ? (
//                   <TableRow><TableCell colSpan={7} className="text-center py-8">No hay devoluciones registradas.</TableCell></TableRow>
//                 ) : (
//                   filteredDevoluciones.map((dev) => (
//                     <TableRow key={dev.id_devolucion}>
//                       <TableCell className="font-bold text-muted-foreground">#{dev.id_devolucion}</TableCell>
//                       <TableCell className="font-bold">#{dev.id_venta}</TableCell>
//                       <TableCell className="font-medium text-blue-700">{dev.producto_nombre}</TableCell>
//                       <TableCell className="text-center"><Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">+{dev.cantidad}</Badge></TableCell>
//                       <TableCell className="max-w-[200px] truncate" title={dev.motivo}>{dev.motivo}</TableCell>
//                       <TableCell>{new Date(dev.fecha).toLocaleDateString('es-ES')}</TableCell>
//                       <TableCell>{dev.usuario_nombre}</TableCell>
//                     </TableRow>
//                   ))
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>

//       <Dialog open={newDevolucionDialogOpen} onOpenChange={setNewDevolucionDialogOpen}>
//         <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-2 text-blue-800"><RotateCcw className="w-5 h-5"/> Nueva Devolución al Stock</DialogTitle>
//             <DialogDescription>Selecciona la venta original y los productos que retornarán al inventario físico.</DialogDescription>
//           </DialogHeader>
          
//           <form onSubmit={handleSubmit} className="space-y-6 py-4">
//             <Alert className="bg-blue-50 border-blue-200">
//               <AlertCircle className="h-4 w-4 text-blue-600" />
//               <AlertTitle className="text-blue-800">Aviso de Inventario</AlertTitle>
//               <AlertDescription className="text-blue-700">
//                 Los productos seleccionados sumarán su cantidad automáticamente al stock disponible en la base de datos.
//               </AlertDescription>
//             </Alert>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label>Venta Original <span className="text-red-500">*</span></Label>
//                 <Select value={idVentaSeleccionada} onValueChange={handleSelectVenta}>
//                   <SelectTrigger><SelectValue placeholder="Seleccionar venta..." /></SelectTrigger>
//                   <SelectContent>
//                     {ventas.map(v => (
//                       <SelectItem key={v.id_venta} value={v.id_venta.toString()}>
//                         Venta #{v.id_venta} - {new Date(v.fecha).toLocaleDateString('es-ES')} - ${v.total?.toFixed(2)}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="space-y-2">
//                 <Label>Destino</Label>
//                 <Input value="Stock (Estante Físico)" disabled className="bg-muted font-bold text-blue-700" />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label>Motivo de la devolución <span className="text-red-500">*</span></Label>
//               <Textarea 
//                 placeholder="Ej: Cliente se arrepintió de la compra, producto equivocado..." 
//                 value={motivo} 
//                 onChange={e => setMotivo(e.target.value)}
//                 rows={3} 
//               />
//             </div>

//             {idVentaSeleccionada && (
//               <div className="space-y-4">
//                 <Label className="flex items-center gap-2"><Package className="w-4 h-4"/> Productos de la Venta #{idVentaSeleccionada}</Label>
                
//                 {loadingDetalles ? (
//                   <div className="text-center p-4 border rounded">Cargando productos...</div>
//                 ) : productosVenta.length === 0 ? (
//                   <div className="text-center p-4 border rounded bg-muted text-muted-foreground">Esta venta no contiene productos retornables (solo servicios).</div>
//                 ) : (
//                   <div className="border rounded-md overflow-hidden">
//                     <Table>
//                       <TableHeader className="bg-muted/50">
//                         <TableRow>
//                           <TableHead>Producto</TableHead>
//                           <TableHead className="text-center">Vendido</TableHead>
//                           <TableHead className="text-center">A Devolver</TableHead>
//                           <TableHead className="text-right">Monto a Reembolsar</TableHead>
//                         </TableRow>
//                       </TableHeader>
//                       <TableBody>
//                         {productosVenta.map((prod) => (
//                           <TableRow key={prod.id_detalle}>
//                             <TableCell className="font-bold">{prod.producto_nombre}</TableCell>
//                             <TableCell className="text-center text-muted-foreground">{prod.cantidad} unid.</TableCell>
//                             <TableCell className="text-center">
//                               <Input 
//                                 type="number" 
//                                 min="0" 
//                                 max={prod.cantidad}
//                                 value={prod.cantidad_devolver}
//                                 onChange={(e) => handleCantidadChange(prod.id_detalle, e.target.value, prod.cantidad)}
//                                 className="w-20 mx-auto text-center font-bold text-blue-600"
//                               />
//                             </TableCell>
//                             <TableCell className="text-right font-bold text-orange-600">
//                               ${(prod.cantidad_devolver * prod.precio_unitario_neto).toFixed(2)}
//                             </TableCell>
//                           </TableRow>
//                         ))}
//                       </TableBody>
//                     </Table>
//                   </div>
//                 )}
//               </div>
//             )}

//             <DialogFooter>
//               <Button type="button" variant="outline" onClick={() => setNewDevolucionDialogOpen(false)}>Cancelar</Button>
//               <Button type="submit" disabled={!idVentaSeleccionada || productosVenta.length === 0} className="bg-blue-600 hover:bg-blue-700">Confirmar Devolución</Button>
//             </DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }