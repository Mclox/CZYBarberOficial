// import { useState } from 'react';
// import { Button } from '../ui/button';
// import { Input } from '../ui/input';
// import { Label } from '../ui/label';
// import { Badge } from '../ui/badge';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// import { Textarea } from '../ui/textarea';
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
// import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
// import { RotateCcw, Plus, FileDown, Eye, Trash2, Search, Calendar, TrendingUp, CheckCircle2, XCircle, Package } from 'lucide-react';
// import { mockDevolucionesProveedor, mockProveedores, mockDetalleCompras, mockProductos, mockCompras } from '../../lib/mockData';
// import { toast } from 'sonner';

// export function DevolucionesProveedorView() {
//   const [devoluciones, setDevoluciones] = useState(mockDevolucionesProveedor);
//   const [filteredDevoluciones, setFilteredDevoluciones] = useState(mockDevolucionesProveedor);
//   const [newDevolucionDialogOpen, setNewDevolucionDialogOpen] = useState(false);
//   const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [viewingDevolucion, setViewingDevolucion] = useState<any | null>(null);
//   const [devolucionToDelete, setDevolucionToDelete] = useState<any | null>(null);
//   const [searchTerm, setSearchTerm] = useState('');
  
//   // Estados para el formulario de nueva devolución
//   const [formData, setFormData] = useState({
//     id_proveedor: '',
//     id_detalle_compra: '',
//     fecha: new Date().toISOString().split('T')[0],
//     motivo: '',
//     cantidad_devuelta: '1',
//     estado: 'pendiente',
//   });

//   // Estado para vista previa de información
//   const [selectedDetalleInfo, setSelectedDetalleInfo] = useState<any>(null);

//   const handleExport = () => {
//     toast.success('Exportando a Excel...', {
//       description: `${filteredDevoluciones.length} registros exportados`,
//       style: { background: '#10b981', color: '#fff' }
//     });
//     console.log('Exportando devoluciones:', filteredDevoluciones);
//   };

//   const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const term = e.target.value.toLowerCase();
//     setSearchTerm(term);
    
//     const filtered = devoluciones.filter(devolucion => {
//       const idDevolucion = devolucion.id_dev_prov.toString().toLowerCase();
//       const idProveedor = devolucion.id_proveedor.toString().toLowerCase();
//       const idDetalleCompra = devolucion.id_detalle_compra.toString().toLowerCase();
//       const motivo = devolucion.motivo.toLowerCase();
//       const cantidadDevuelta = devolucion.cantidad_devuelta.toString().toLowerCase();
//       const estado = devolucion.estado.toLowerCase();
//       const proveedorName = getProveedorName(devolucion.id_proveedor).toLowerCase();
//       const productoName = getProductoNameFromDetalle(devolucion.id_detalle_compra).toLowerCase();
//       const fecha = devolucion.fecha.toLowerCase();
      
//       return idDevolucion.includes(term) ||
//              idProveedor.includes(term) ||
//              idDetalleCompra.includes(term) ||
//              motivo.includes(term) ||
//              fecha.includes(term) ||
//              cantidadDevuelta.includes(term) ||
//              estado.includes(term) ||
//              proveedorName.includes(term) ||
//              productoName.includes(term);
//     });
//     setFilteredDevoluciones(filtered);
//   };

//   const getProveedorName = (id: number) => {
//     const proveedor = mockProveedores.find(p => p.id_proveedor === id);
//     return proveedor?.nombre || 'N/A';
//   };

//   const getProductoNameFromDetalle = (idDetalle: number) => {
//     const detalle = mockDetalleCompras.find(d => d.id_detalle_compra === idDetalle);
//     if (detalle) {
//       const producto = mockProductos.find(p => p.id_producto === detalle.id_producto);
//       return producto?.nombre || 'N/A';
//     }
//     return 'N/A';
//   };

//   const getCompraFromDetalle = (idDetalle: number) => {
//     const detalle = mockDetalleCompras.find(d => d.id_detalle_compra === idDetalle);
//     if (detalle) {
//       return mockCompras.find(c => c.id_compra === detalle.id_compra);
//     }
//     return null;
//   };

//   const getEstadoBadge = (estado: string) => {
//     switch (estado) {
//       case 'completada':
//       case 'aprobada':
//         return <Badge className="bg-green-600">Completada</Badge>;
//       case 'pendiente':
//         return <Badge className="bg-yellow-600">Pendiente</Badge>;
//       case 'rechazada':
//         return <Badge variant="destructive">Rechazada</Badge>;
//       default:
//         return <Badge>{estado}</Badge>;
//     }
//   };

//   const handleOpenNewDevolucion = () => {
//     setFormData({
//       id_proveedor: '',
//       id_detalle_compra: '',
//       fecha: new Date().toISOString().split('T')[0],
//       motivo: '',
//       cantidad_devuelta: '1',
//       estado: 'pendiente',
//     });
//     setNewDevolucionDialogOpen(true);
//   };

//   const handleSubmitDevolucion = (e: React.FormEvent) => {
//     e.preventDefault();
    
//     // Validaciones
//     if (!formData.id_proveedor) {
//       toast.error('Error de validación', {
//         description: 'Debes seleccionar un proveedor',
//         style: { background: '#ef4444', color: '#fff' }
//       });
//       return;
//     }

//     if (!formData.id_detalle_compra) {
//       toast.error('Error de validación', {
//         description: 'Debes seleccionar un detalle de compra',
//         style: { background: '#ef4444', color: '#fff' }
//       });
//       return;
//     }

//     if (!formData.motivo.trim()) {
//       toast.error('Error de validación', {
//         description: 'Debes ingresar un motivo para la devolución',
//         style: { background: '#ef4444', color: '#fff' }
//       });
//       return;
//     }

//     const cantidadDevuelta = parseInt(formData.cantidad_devuelta);
//     if (isNaN(cantidadDevuelta) || cantidadDevuelta <= 0) {
//       toast.error('Error de validación', {
//         description: 'La cantidad devuelta debe ser mayor a 0',
//         style: { background: '#ef4444', color: '#fff' }
//       });
//       return;
//     }

//     // Validar que la cantidad no exceda la cantidad comprada
//     const detalle = mockDetalleCompras.find(d => d.id_detalle_compra === parseInt(formData.id_detalle_compra));
//     if (detalle && cantidadDevuelta > detalle.cantidad) {
//       toast.error('Error de validación', {
//         description: `La cantidad devuelta no puede ser mayor a ${detalle.cantidad} (cantidad comprada)`,
//         style: { background: '#ef4444', color: '#fff' }
//       });
//       return;
//     }

//     const newDevolucion = {
//       id_dev_prov: devoluciones.length + 1,
//       id_proveedor: parseInt(formData.id_proveedor),
//       id_detalle_compra: parseInt(formData.id_detalle_compra),
//       fecha: formData.fecha,
//       motivo: formData.motivo,
//       cantidad_devuelta: cantidadDevuelta,
//       estado: formData.estado as 'pendiente' | 'aprobada' | 'rechazada',
//     };

//     const updatedDevoluciones = [...devoluciones, newDevolucion];
//     setDevoluciones(updatedDevoluciones);
//     setFilteredDevoluciones(updatedDevoluciones);
    
//     toast.success('Devolución registrada exitosamente', {
//       description: `${cantidadDevuelta} unidades devueltas al proveedor ${getProveedorName(newDevolucion.id_proveedor)}`,
//       style: { background: '#10b981', color: '#fff' }
//     });
    
//     setNewDevolucionDialogOpen(false);
//   };

//   const handleView = (devolucion: any) => {
//     setViewingDevolucion(devolucion);
//     setDetailsDialogOpen(true);
//   };

//   const handleDeleteClick = (devolucion: any) => {
//     setDevolucionToDelete(devolucion);
//     setDeleteDialogOpen(true);
//   };

//   const confirmDelete = () => {
//     if (devolucionToDelete) {
//       const updatedDevoluciones = devoluciones.filter(d => d.id_dev_prov !== devolucionToDelete.id_dev_prov);
//       setDevoluciones(updatedDevoluciones);
//       setFilteredDevoluciones(updatedDevoluciones);
      
//       toast.success('Devolución eliminada exitosamente', {
//         description: `La devolución #${devolucionToDelete.id_dev_prov} ha sido eliminada`,
//         style: { background: '#10b981', color: '#fff' }
//       });
//     }
//     setDeleteDialogOpen(false);
//   };

//   // Estadísticas
//   const totalDevoluciones = filteredDevoluciones.length;
//   const devolucionesPendientes = filteredDevoluciones.filter(d => d.estado === 'pendiente').length;
//   const devolucionesCompletadas = filteredDevoluciones.filter(d => d.estado === 'completada' || d.estado === 'aprobada').length;
//   const totalUnidadesDevueltas = filteredDevoluciones.reduce((sum, d) => sum + d.cantidad_devuelta, 0);

//   return (
//     <div className="p-4 md:p-8 space-y-6">
//       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
//         <div>
//           <h1 className="flex items-center gap-2">
//             <RotateCcw className="w-6 h-6" />
//             Devoluciones al Proveedor
//           </h1>
//           <p className="text-muted-foreground">Gestiona las devoluciones de productos a proveedores</p>
//         </div>
//         <div className="flex gap-2">
//           <Button onClick={handleOpenNewDevolucion} className="bg-orange-600 hover:bg-orange-700">
//             <Plus className="w-4 h-4 mr-2" />
//             Nueva Devolución
//           </Button>
//           <Button onClick={handleExport} variant="outline">
//             <FileDown className="w-4 h-4 mr-2" />
//             Exportar
//           </Button>
//         </div>
//       </div>

//       {/* Estadísticas */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-orange-100 rounded-lg">
//                 <RotateCcw className="w-6 h-6 text-orange-600" />
//               </div>
//               <div>
//                 <p className="text-sm text-muted-foreground">Total Devoluciones</p>
//                 <p className="text-2xl font-bold">{totalDevoluciones}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-yellow-100 rounded-lg">
//                 <XCircle className="w-6 h-6 text-yellow-600" />
//               </div>
//               <div>
//                 <p className="text-sm text-muted-foreground">Pendientes</p>
//                 <p className="text-2xl font-bold">{devolucionesPendientes}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-green-100 rounded-lg">
//                 <CheckCircle2 className="w-6 h-6 text-green-600" />
//               </div>
//               <div>
//                 <p className="text-sm text-muted-foreground">Completadas</p>
//                 <p className="text-2xl font-bold">{devolucionesCompletadas}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-500">
//           <CardContent className="p-6">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-orange-600 rounded-lg">
//                 <Package className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <p className="text-sm text-muted-foreground">Unidades Devueltas</p>
//                 <p className="text-2xl font-bold text-orange-600">{totalUnidadesDevueltas}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <Card>
//         <CardHeader>
//           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//             <CardTitle>Lista de Devoluciones</CardTitle>
//             <div className="w-full md:w-96">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
//                 <Input
//                   placeholder="Buscar por ID, proveedor, producto, motivo..."
//                   value={searchTerm}
//                   onChange={handleSearch}
//                   className="pl-10"
//                 />
//               </div>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="rounded-md border overflow-x-auto">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>ID</TableHead>
//                   <TableHead>Proveedor</TableHead>
//                   <TableHead>Producto</TableHead>
//                   <TableHead>Cantidad</TableHead>
//                   <TableHead>Motivo</TableHead>
//                   <TableHead>Fecha</TableHead>
//                   <TableHead>Estado</TableHead>
//                   <TableHead className="text-right">Acciones</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredDevoluciones.length === 0 ? (
//                   <TableRow>
//                     <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
//                       No se encontraron devoluciones
//                     </TableCell>
//                   </TableRow>
//                 ) : (
//                   filteredDevoluciones.map((devolucion) => (
//                     <TableRow key={devolucion.id_dev_prov}>
//                       <TableCell>#{devolucion.id_dev_prov}</TableCell>
//                       <TableCell>{getProveedorName(devolucion.id_proveedor)}</TableCell>
//                       <TableCell>{getProductoNameFromDetalle(devolucion.id_detalle_compra)}</TableCell>
//                       <TableCell>
//                         <Badge variant="outline">{devolucion.cantidad_devuelta} unidades</Badge>
//                       </TableCell>
//                       <TableCell className="max-w-xs truncate">{devolucion.motivo}</TableCell>
//                       <TableCell>{new Date(devolucion.fecha + 'T00:00:00').toLocaleDateString('es-ES')}</TableCell>
//                       <TableCell>{getEstadoBadge(devolucion.estado)}</TableCell>
//                       <TableCell className="text-right">
//                         <div className="flex gap-2 justify-end">
//                           <Button variant="outline" size="sm" onClick={() => handleView(devolucion)}>
//                             <Eye className="w-4 h-4" />
//                           </Button>
//                           <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(devolucion)}>
//                             <Trash2 className="w-4 h-4" />
//                           </Button>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   ))
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Dialog Nueva Devolución */}
//       <Dialog open={newDevolucionDialogOpen} onOpenChange={setNewDevolucionDialogOpen}>
//         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Registrar Nueva Devolución</DialogTitle>
//             <DialogDescription>
//               Complete el formulario para registrar una devolución al proveedor
//             </DialogDescription>
//           </DialogHeader>
          
//           <form onSubmit={handleSubmitDevolucion}>
//             <div className="space-y-6 py-4">
//               <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
//                 <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
//                   ℹ️ Gestión Interna - Solo Punto Físico
//                 </p>
//                 <p className="text-xs text-blue-700 dark:text-blue-300">
//                   Esta aplicación es solo para gestión interna del negocio. Las devoluciones se gestionan únicamente desde nuestro establecimiento físico.
//                 </p>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="proveedor">Proveedor <span className="text-red-500">*</span></Label>
//                   <Select
//                     value={formData.id_proveedor}
//                     onValueChange={(value) => setFormData({ ...formData, id_proveedor: value })}
//                   >
//                     <SelectTrigger id="proveedor">
//                       <SelectValue placeholder="Selecciona un proveedor" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {mockProveedores.map(proveedor => (
//                         <SelectItem key={proveedor.id_proveedor} value={proveedor.id_proveedor.toString()}>
//                           {proveedor.nombre}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="detalle_compra">Detalle de Compra <span className="text-red-500">*</span></Label>
//                   <Select
//                     value={formData.id_detalle_compra}
//                     onValueChange={(value) => {
//                       setFormData({ ...formData, id_detalle_compra: value });
//                       // Actualizar información del detalle seleccionado
//                       const detalle = mockDetalleCompras.find(d => d.id_detalle_compra === parseInt(value));
//                       setSelectedDetalleInfo(detalle);
//                     }}
//                   >
//                     <SelectTrigger id="detalle_compra">
//                       <SelectValue placeholder="Selecciona un detalle de compra" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {mockDetalleCompras.map(detalle => {
//                         const producto = mockProductos.find(p => p.id_producto === detalle.id_producto);
//                         return (
//                           <SelectItem key={detalle.id_detalle_compra} value={detalle.id_detalle_compra.toString()}>
//                             #{detalle.id_detalle_compra} - {producto?.nombre || 'N/A'} ({detalle.cantidad} unidades disponibles)
//                           </SelectItem>
//                         );
//                       })}
//                     </SelectContent>
//                   </Select>
//                   {selectedDetalleInfo && (
//                     <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
//                       💡 Máximo disponible: <span className="font-semibold">{selectedDetalleInfo.cantidad} unidades</span> | 
//                       Precio: <span className="font-semibold">${selectedDetalleInfo.precio_unitario}</span>
//                     </div>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="fecha">Fecha <span className="text-red-500">*</span></Label>
//                   <div className="relative">
//                     <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
//                     <Input
//                       id="fecha"
//                       type="date"
//                       value={formData.fecha}
//                       onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
//                       className="pl-10"
//                       max={new Date().toISOString().split('T')[0]}
//                       required
//                     />
//                   </div>
//                   <p className="text-xs text-muted-foreground">
//                     No puede ser una fecha futura
//                   </p>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="cantidad">Cantidad Devuelta <span className="text-red-500">*</span></Label>
//                   <Input
//                     id="cantidad"
//                     type="number"
//                     min="1"
//                     max={selectedDetalleInfo?.cantidad || undefined}
//                     value={formData.cantidad_devuelta}
//                     onChange={(e) => setFormData({ ...formData, cantidad_devuelta: e.target.value })}
//                     required
//                   />
//                   {selectedDetalleInfo && formData.cantidad_devuelta && (
//                     <div className="text-xs">
//                       {parseInt(formData.cantidad_devuelta) > selectedDetalleInfo.cantidad ? (
//                         <span className="text-red-600 font-medium">
//                           ⚠️ Excede el máximo disponible ({selectedDetalleInfo.cantidad} unidades)
//                         </span>
//                       ) : (
//                         <span className="text-green-600 font-medium">
//                           ✓ Cantidad válida | Monto: ${(parseInt(formData.cantidad_devuelta) * selectedDetalleInfo.precio_unitario).toFixed(2)}
//                         </span>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="estado">Estado <span className="text-red-500">*</span></Label>
//                   <Select
//                     value={formData.estado}
//                     onValueChange={(value) => setFormData({ ...formData, estado: value })}
//                   >
//                     <SelectTrigger id="estado">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="pendiente">
//                         <div className="flex items-center gap-2">
//                           <XCircle className="w-4 h-4 text-yellow-600" />
//                           Pendiente
//                         </div>
//                       </SelectItem>
//                       <SelectItem value="aprobada">
//                         <div className="flex items-center gap-2">
//                           <CheckCircle2 className="w-4 h-4 text-green-600" />
//                           Aprobada
//                         </div>
//                       </SelectItem>
//                       <SelectItem value="rechazada">
//                         <div className="flex items-center gap-2">
//                           <XCircle className="w-4 h-4 text-red-600" />
//                           Rechazada
//                         </div>
//                       </SelectItem>
//                     </SelectContent>
//                   </Select>
//                   <p className="text-xs text-muted-foreground">
//                     {formData.estado === 'pendiente' && '⏳ Esperando aprobación del proveedor'}
//                     {formData.estado === 'aprobada' && '✓ Devolución aprobada y procesada'}
//                     {formData.estado === 'rechazada' && '✗ Devolución rechazada por el proveedor'}
//                   </p>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="motivo">Motivo de Devolución <span className="text-red-500">*</span></Label>
//                 <Textarea
//                   id="motivo"
//                   value={formData.motivo}
//                   onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
//                   placeholder="Ej: Producto defectuoso, mercancía dañada, error en pedido, producto vencido..."
//                   rows={4}
//                   required
//                 />
//                 <p className="text-xs text-muted-foreground">
//                   {formData.motivo.length}/500 caracteres | Describe claramente el motivo
//                 </p>
//               </div>

//               {/* Vista previa del resumen */}
//               {formData.id_proveedor && formData.id_detalle_compra && formData.cantidad_devuelta && (
//                 <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border-orange-300">
//                   <CardHeader>
//                     <CardTitle className="text-sm flex items-center gap-2">
//                       <Package className="w-4 h-4 text-orange-600" />
//                       Resumen de la Devolución
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-2 text-sm">
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">Proveedor:</span>
//                       <span className="font-semibold">{getProveedorName(parseInt(formData.id_proveedor))}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">Producto:</span>
//                       <span className="font-semibold">{getProductoNameFromDetalle(parseInt(formData.id_detalle_compra))}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">Cantidad:</span>
//                       <span className="font-semibold">{formData.cantidad_devuelta} unidades</span>
//                     </div>
//                     {selectedDetalleInfo && (
//                       <div className="flex justify-between border-t pt-2">
//                         <span className="font-semibold text-orange-600">Monto Total:</span>
//                         <span className="font-bold text-orange-600">
//                           ${(parseInt(formData.cantidad_devuelta) * selectedDetalleInfo.precio_unitario).toFixed(2)}
//                         </span>
//                       </div>
//                     )}
//                   </CardContent>
//                 </Card>
//               )}
//             </div>

//             <DialogFooter>
//               <Button type="button" variant="outline" onClick={() => setNewDevolucionDialogOpen(false)}>
//                 Cancelar
//               </Button>
//               <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
//                 <RotateCcw className="w-4 h-4 mr-2" />
//                 Registrar Devolución
//               </Button>
//             </DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>

//       {/* Dialog Detalles de Devolución */}
//       <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
//         <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Detalles de la Devolución #{viewingDevolucion?.id_dev_prov}</DialogTitle>
//             <DialogDescription>
//               Información completa de la devolución al proveedor
//             </DialogDescription>
//           </DialogHeader>
//           {viewingDevolucion && (
//             <div className="space-y-6 py-4">
//               <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
//                 <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
//                   ℹ️ Gestión Interna - Solo Punto Físico
//                 </p>
//                 <p className="text-xs text-blue-700 dark:text-blue-300">
//                   Esta aplicación es solo para gestión interna del negocio. Las devoluciones se gestionan únicamente desde nuestro establecimiento físico.
//                 </p>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <p className="text-sm font-medium text-muted-foreground">ID Devolución</p>
//                   <p className="font-medium">#{viewingDevolucion.id_dev_prov}</p>
//                 </div>

//                 <div className="space-y-2">
//                   <p className="text-sm font-medium text-muted-foreground">Estado</p>
//                   <div>{getEstadoBadge(viewingDevolucion.estado)}</div>
//                 </div>

//                 <div className="space-y-2">
//                   <p className="text-sm font-medium text-muted-foreground">Proveedor</p>
//                   <p className="font-medium">{getProveedorName(viewingDevolucion.id_proveedor)}</p>
//                 </div>

//                 <div className="space-y-2">
//                   <p className="text-sm font-medium text-muted-foreground">Producto</p>
//                   <p className="font-medium">{getProductoNameFromDetalle(viewingDevolucion.id_detalle_compra)}</p>
//                 </div>

//                 <div className="space-y-2">
//                   <p className="text-sm font-medium text-muted-foreground">Cantidad Devuelta</p>
//                   <Badge variant="outline" className="w-fit">
//                     {viewingDevolucion.cantidad_devuelta} unidades
//                   </Badge>
//                 </div>

//                 <div className="space-y-2">
//                   <p className="text-sm font-medium text-muted-foreground">Fecha de Devolución</p>
//                   <p>
//                     {new Date(viewingDevolucion.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
//                       year: 'numeric',
//                       month: 'long',
//                       day: 'numeric',
//                     })}
//                   </p>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <p className="text-sm font-medium text-muted-foreground">Motivo de la Devolución</p>
//                 <div className="p-4 bg-muted rounded-lg">
//                   <p>{viewingDevolucion.motivo}</p>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <p className="text-sm font-medium text-muted-foreground">Información de la Compra Original</p>
//                 <Card>
//                   <CardContent className="p-4 space-y-2">
//                     <div className="flex justify-between">
//                       <span className="text-sm text-muted-foreground">ID Detalle Compra:</span>
//                       <span className="font-medium">#{viewingDevolucion.id_detalle_compra}</span>
//                     </div>
//                     {(() => {
//                       const detalle = mockDetalleCompras.find(d => d.id_detalle_compra === viewingDevolucion.id_detalle_compra);
//                       if (detalle) {
//                         return (
//                           <>
//                             <div className="flex justify-between">
//                               <span className="text-sm text-muted-foreground">Cantidad Original:</span>
//                               <span className="font-medium">{detalle.cantidad} unidades</span>
//                             </div>
//                             <div className="flex justify-between">
//                               <span className="text-sm text-muted-foreground">Precio Unitario:</span>
//                               <span className="font-medium">${detalle.precio_unitario.toFixed(2)}</span>
//                             </div>
//                             <div className="flex justify-between border-t pt-2">
//                               <span className="text-sm font-semibold">Monto Devuelto:</span>
//                               <span className="font-bold text-orange-600">
//                                 ${(viewingDevolucion.cantidad_devuelta * detalle.precio_unitario).toFixed(2)}
//                               </span>
//                             </div>
//                           </>
//                         );
//                       }
//                       return null;
//                     })()}
//                   </CardContent>
//                 </Card>
//               </div>
//             </div>
//           )}
//           <DialogFooter>
//             <Button onClick={() => setDetailsDialogOpen(false)}>Cerrar</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Dialog Eliminar Devolución */}
//       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Eliminar Devolución</AlertDialogTitle>
//             <AlertDialogDescription>
//               ¿Estás seguro de que deseas eliminar la devolución #{devolucionToDelete?.id_dev_prov}? 
//               Esta acción no se puede deshacer y afectará los registros históricos.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
//               Cancelar
//             </AlertDialogCancel>
//             <AlertDialogAction
//               onClick={confirmDelete}
//               className="bg-red-600 hover:bg-red-700"
//             >
//               Eliminar
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// }
