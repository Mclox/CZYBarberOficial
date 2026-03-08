// import { useState, useMemo } from 'react';
// import { Button } from '../ui/button';
// import { Input } from '../ui/input';
// import { Label } from '../ui/label';
// import { Textarea } from '../ui/textarea';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
// import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
// import { Badge } from '../ui/badge';
// import { Plus, Pencil, Trash2, Package, Eye, FileDown, MinusCircle, FileSpreadsheet, CheckCircle, XCircle, ShoppingCart, Handshake, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
// import { mockProductos, Producto } from '../../lib/mockData';
// import { toast } from 'sonner';
// import { exportToExcel, downloadMenu } from '../../shared/lib/exportUtils';
// import { useAuth } from '../../features/auth';
// import { Pagination } from '../common/Pagination';
// import { SearchBar } from '../common/SearchBar';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// export function ProductosView() {
//   const { user } = useAuth();
//   const [productos, setProductos] = useState<Producto[]>(mockProductos);
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [bajaDialogOpen, setBajaDialogOpen] = useState(false);
//   const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
//   const [viewingProducto, setViewingProducto] = useState<Producto | null>(null);
//   const [productoToDelete, setProductoToDelete] = useState<number | null>(null);
//   const [productoBaja, setProductoBaja] = useState<Producto | null>(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);
//   const [cantidadBaja, setCantidadBaja] = useState(1);
//   const [motivoBaja, setMotivoBaja] = useState('Uso interno del negocio');
//   const [tipoAdquisicion, setTipoAdquisicion] = useState<'todos' | 'consignacion' | 'compra_directa'>('todos');
//   const [formData, setFormData] = useState({
//     nombre: '',
//     descripcion: '',
//     precio: '',
//     stock: '0',
//     categoria: '',
//     codigo: '',
//     imagen: '',
//     estado: 'activo' as 'activo' | 'inactivo',
//     tipo_adquisicion: 'compra_directa' as 'consignacion' | 'compra_directa',
//   });

//   // Permisos basados en rol
//   const isAdmin = user?.id_rol === 1;
//   const isBarbero = user?.id_rol === 2;

//   // Filtrar productos por término de búsqueda y tipo de adquisición
//   const filteredProductos = useMemo(() => {
//     let filtered = productos;

//     // Filtrar por término de búsqueda
//     if (searchTerm.trim()) {
//       const lowerSearch = searchTerm.toLowerCase();
//       filtered = filtered.filter((producto) => {
//         const nombre = producto.nombre.toLowerCase();
//         const codigo = (producto.codigo || '').toLowerCase();
//         const categoria = (producto.categoria || '').toLowerCase();
//         const descripcion = (producto.descripcion || '').toLowerCase();
//         const idProducto = producto.id_producto.toString();
//         const precio = producto.precio.toString();
//         const stock = producto.stock.toString();
//         const estado = producto.estado.toLowerCase();
//         const tipoAdq = (producto.tipo_adquisicion || '').toLowerCase();

//         return (
//           nombre.includes(lowerSearch) ||
//           codigo.includes(lowerSearch) ||
//           categoria.includes(lowerSearch) ||
//           descripcion.includes(lowerSearch) ||
//           idProducto.includes(lowerSearch) ||
//           precio.includes(lowerSearch) ||
//           stock.includes(lowerSearch) ||
//           estado.includes(lowerSearch) ||
//           tipoAdq.includes(lowerSearch)
//         );
//       });
//     }

//     // Filtrar por tipo de adquisición
//     if (tipoAdquisicion !== 'todos') {
//       filtered = filtered.filter(p => p.tipo_adquisicion === tipoAdquisicion);
//     }

//     return filtered;
//   }, [productos, searchTerm, tipoAdquisicion]);

//   // Cálculo de paginación
//   const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const endIndex = startIndex + itemsPerPage;
//   const paginatedProductos = filteredProductos.slice(startIndex, endIndex);

//   const handleCreate = () => {
//     setEditingProducto(null);
//     setFormData({ nombre: '', descripcion: '', precio: '', stock: '0', categoria: '', codigo: '', imagen: '', estado: 'activo', tipo_adquisicion: 'compra_directa' });
//     setDialogOpen(true);
//   };

//   const handleEdit = (producto: Producto) => {
//     setEditingProducto(producto);
//     setFormData({
//       nombre: producto.nombre,
//       descripcion: producto.descripcion || '',
//       precio: producto.precio.toString(),
//       stock: producto.stock.toString(),
//       categoria: producto.categoria || '',
//       codigo: producto.codigo || '',
//       imagen: producto.imagen || '',
//       estado: (producto.estado || 'activo') as 'activo' | 'inactivo',
//       tipo_adquisicion: (producto.tipo_adquisicion || 'compra_directa') as 'consignacion' | 'compra_directa',
//     });
//     setDialogOpen(true);
//   };

//   const handleDelete = (id: number) => {
//     setProductoToDelete(id);
//     setDeleteDialogOpen(true);
//   };

//   const confirmDelete = () => {
//     if (productoToDelete) {
//       setProductos(productos.filter(p => p.id_producto !== productoToDelete));
//       toast.success('Producto eliminado correctamente', {
//         style: { background: '#10b981', color: '#fff' }
//       });
//     }
//     setDeleteDialogOpen(false);
//     setProductoToDelete(null);
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     // Validaciones de nombres
//     const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/;
//     if (!nombreRegex.test(formData.nombre)) {
//       toast.error('Error de validación', {
//         description: 'El nombre no puede iniciar con números o caracteres especiales',
//         style: { background: '#ef4444', color: '#fff' }
//       });
//       return;
//     }

//     if (formData.categoria && !nombreRegex.test(formData.categoria)) {
//       toast.error('Error de validación', {
//         description: 'La categoría no puede iniciar con números o caracteres especiales',
//         style: { background: '#ef4444', color: '#fff' }
//       });
//       return;
//     }

//     if (editingProducto) {
//       const updatedProductos = productos.map(p =>
//         p.id_producto === editingProducto.id_producto
//           ? { ...p, ...formData, precio: parseFloat(formData.precio), stock: parseInt(formData.stock) }
//           : p
//       );
//       setProductos(updatedProductos);
//       toast.success('Producto actualizado correctamente', {
//         style: { background: '#10b981', color: '#fff' }
//       });
//     } else {
//       const newProducto: Producto = {
//         id_producto: Math.max(...productos.map(p => p.id_producto)) + 1,
//         ...formData,
//         precio: parseFloat(formData.precio),
//         stock: parseInt(formData.stock),
//       };
//       const updatedProductos = [...productos, newProducto];
//       setProductos(updatedProductos);
//       toast.success('Producto creado correctamente', {
//         style: { background: '#10b981', color: '#fff' }
//       });
//     }

//     setDialogOpen(false);
//   };

//   const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const term = e.target.value;
//     setSearchTerm(term);
//   };

//   const handleView = (producto: Producto) => {
//     setViewingProducto(producto);
//     setDetailsDialogOpen(true);
//   };

//   const handleExportExcel = () => {
//     exportToExcel(productos, 'productos');
//   };

//   const handleDownloadMenu = () => {
//     downloadMenu(productos);
//   };

//   const handleBaja = (producto: Producto) => {
//     setProductoBaja(producto);
//     setCantidadBaja(1);
//     setMotivoBaja('Uso interno del negocio');
//     setBajaDialogOpen(true);
//   };

//   const confirmBaja = () => {
//     if (productoBaja && cantidadBaja > 0 && cantidadBaja <= productoBaja.stock) {
//       const updatedProductos = productos.map(p =>
//         p.id_producto === productoBaja.id_producto
//           ? { ...p, stock: p.stock - cantidadBaja }
//           : p
//       );
//       setProductos(updatedProductos);
//       toast.success(`${cantidadBaja} unidad(es) dada(s) de baja correctamente`, {
//         description: `Motivo: ${motivoBaja}`,
//         style: { background: '#10b981', color: '#fff' }
//       });
//       setBajaDialogOpen(false);
//       setProductoBaja(null);
//     } else {
//       toast.error('Cantidad inválida', {
//         description: 'La cantidad debe ser mayor que 0 y menor o igual al stock disponible',
//         style: { background: '#ef4444', color: '#fff' }
//       });
//     }
//   };

//   const handleToggleEstado = (producto: Producto) => {
//     const nuevoEstado = producto.estado === 'activo' ? 'inactivo' : 'activo';
//     setProductos(productos.map(p =>
//       p.id_producto === producto.id_producto
//         ? { ...p, estado: nuevoEstado }
//         : p
//     ));
//     toast.success(`Producto ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`, {
//       style: { background: '#10b981', color: '#fff' }
//     });
//   };

//   return (
//     <div className="p-4 md:p-8 space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="flex items-center gap-2">
//             <Package className="w-6 h-6" />
//             Productos
//           </h1>
//           <p className="text-muted-foreground">Gestiona el inventario de productos</p>
//         </div>
//         <div className="flex gap-2">
//           {isAdmin && (
//             <Button onClick={handleCreate}>
//               <Plus className="w-4 h-4 mr-2" />
//               Nuevo Producto
//             </Button>
//           )}
//           <Button onClick={handleExportExcel}>
//             <FileSpreadsheet className="w-4 h-4 mr-2" />
//             Exportar a Excel
//           </Button>
//           <Button onClick={handleDownloadMenu}>
//             <FileDown className="w-4 h-4 mr-2" />
//             Descargar Catálogo
//           </Button>
//         </div>
//       </div>

//       <Tabs defaultValue="todos" onValueChange={(value) => {
//         setTipoAdquisicion(value as 'todos' | 'consignacion' | 'compra_directa');
//         setCurrentPage(1);
//       }}>
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
//           <TabsList className="grid grid-cols-3 w-full md:w-auto">
//             <TabsTrigger value="todos" className="flex items-center gap-2">
//               <Package className="w-4 h-4" />
//               Todos ({productos.length})
//             </TabsTrigger>
//             <TabsTrigger value="consignacion" className="flex items-center gap-2">
//               <Handshake className="w-4 h-4" />
//               Consignación ({productos.filter(p => p.tipo_adquisicion === 'consignacion').length})
//             </TabsTrigger>
//             <TabsTrigger value="compra_directa" className="flex items-center gap-2">
//               <ShoppingCart className="w-4 h-4" />
//               Compra Directa ({productos.filter(p => p.tipo_adquisicion === 'compra_directa').length})
//             </TabsTrigger>
//           </TabsList>
//           <SearchBar
//             value={searchTerm}
//             onChange={setSearchTerm}
//             placeholder="Buscar por nombre, código, categoría..."
//             className="w-full md:w-96"
//           />
//         </div>

//         <TabsContent value="todos" className="mt-0">
//           <Card>
//             <CardHeader>
//               <CardTitle>Todos los Productos</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="rounded-md border overflow-x-auto">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Imagen</TableHead>
//                       <TableHead>Nombre</TableHead>
//                       <TableHead>Categoría</TableHead>
//                       <TableHead>Tipo Adquisición</TableHead>
//                       <TableHead>Precio</TableHead>
//                       <TableHead>Stock</TableHead>
//                       <TableHead>Estado</TableHead>
//                       <TableHead className="text-right">Acciones</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {paginatedProductos.map((producto) => (
//                       <TableRow key={producto.id_producto}>
//                         <TableCell>
//                           {producto.imagen ? (
//                             <img 
//                               src={producto.imagen} 
//                               alt={producto.nombre}
//                               className="w-12 h-12 object-cover rounded-md"
//                             />
//                           ) : (
//                             <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
//                               <Package className="w-6 h-6 text-gray-400" />
//                             </div>
//                           )}
//                         </TableCell>
//                         <TableCell>{producto.nombre}</TableCell>
//                         <TableCell>{producto.categoria || '-'}</TableCell>
//                         <TableCell>
//                           {producto.tipo_adquisicion === 'consignacion' ? (
//                             <Badge variant="outline" className="flex items-center gap-1 w-fit">
//                               <Handshake className="w-3 h-3" />
//                               Consignación
//                             </Badge>
//                           ) : (
//                             <Badge variant="outline" className="flex items-center gap-1 w-fit">
//                               <ShoppingCart className="w-3 h-3" />
//                               Compra Directa
//                             </Badge>
//                           )}
//                         </TableCell>
//                         <TableCell>${producto.precio.toFixed(2)}</TableCell>
//                         <TableCell>
//                           <Badge variant={producto.stock < 10 ? 'destructive' : 'default'}>
//                             {producto.stock}
//                           </Badge>
//                         </TableCell>
//                         <TableCell>
//                           <Badge variant={producto.estado === 'activo' ? 'default' : 'secondary'}>
//                             {producto.estado || 'activo'}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="text-right">
//                           <div className="flex justify-end gap-2">
//                             {isAdmin && (
//                               <Button variant="outline" size="sm" onClick={() => handleEdit(producto)}>
//                                 <Pencil className="w-4 h-4" />
//                               </Button>
//                             )}
//                             {isAdmin && (
//                               <Button variant="outline" size="sm" onClick={() => handleDelete(producto.id_producto)}>
//                                 <Trash2 className="w-4 h-4" />
//                               </Button>
//                             )}
//                             <Button variant="outline" size="sm" onClick={() => handleView(producto)}>
//                               <Eye className="w-4 h-4" />
//                             </Button>
//                             {(isAdmin || isBarbero) && (
//                               <Button variant="outline" size="sm" onClick={() => handleBaja(producto)} title="Dar de baja">
//                                 <MinusCircle className="w-4 h-4" />
//                               </Button>
//                             )}
//                             {isAdmin && (
//                               <Button
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={() => handleToggleEstado(producto)}
//                                 title="Cambiar estado"
//                               >
//                                 {producto.estado === 'activo' ? (
//                                   <XCircle className="w-4 h-4" />
//                                 ) : (
//                                   <CheckCircle className="w-4 h-4" />
//                                 )}
//                               </Button>
//                             )}
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>
              
//               {/* Paginador Personalizado */}
//               <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
//                 <div className="flex items-center gap-2">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => setCurrentPage(1)}
//                     disabled={currentPage === 1}
//                     className="h-8 w-8 p-0"
//                   >
//                     <ChevronsLeft className="w-4 h-4" />
//                   </Button>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
//                     disabled={currentPage === 1}
//                     className="h-8 w-8 p-0"
//                   >
//                     <ChevronLeft className="w-4 h-4" />
//                   </Button>
                  
//                   <div className="flex items-center gap-1">
//                     <span className="text-sm text-muted-foreground px-2">
//                       Página
//                     </span>
//                     <span className="text-sm font-medium px-2 py-1 bg-blue-600 text-white rounded">
//                       {currentPage}
//                     </span>
//                     <span className="text-sm text-muted-foreground px-2">
//                       de {totalPages || 1}
//                     </span>
//                   </div>
                  
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
//                     disabled={currentPage === totalPages || totalPages === 0}
//                     className="h-8 w-8 p-0"
//                   >
//                     <ChevronRight className="w-4 h-4" />
//                   </Button>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => setCurrentPage(totalPages)}
//                     disabled={currentPage === totalPages || totalPages === 0}
//                     className="h-8 w-8 p-0"
//                   >
//                     <ChevronsRight className="w-4 h-4" />
//                   </Button>
//                 </div>
                
//                 <div className="flex items-center gap-2">
//                   <span className="text-sm text-muted-foreground">
//                     Mostrando {filteredProductos.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredProductos.length)} de {filteredProductos.length} registros
//                   </span>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <Label htmlFor="itemsPerPage" className="text-sm text-muted-foreground">
//                     Mostrar:
//                   </Label>
//                   <Select
//                     value={itemsPerPage.toString()}
//                     onValueChange={(value) => {
//                       setItemsPerPage(parseInt(value));
//                       setCurrentPage(1);
//                     }}
//                   >
//                     <SelectTrigger className="w-[80px] h-8">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="5">5</SelectItem>
//                       <SelectItem value="10">10</SelectItem>
//                       <SelectItem value="20">20</SelectItem>
//                       <SelectItem value="50">50</SelectItem>
//                       <SelectItem value="100">100</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="consignacion" className="mt-0">
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <Handshake className="w-5 h-5 text-[#D4AF37]" />
//                 Productos por Consignación
//               </CardTitle>
//               <p className="text-sm text-muted-foreground">
//                 Productos como ceras, gels y cremas para peinar que se obtienen por consignación
//               </p>
//             </CardHeader>
//             <CardContent>
//               <div className="rounded-md border overflow-x-auto">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Imagen</TableHead>
//                       <TableHead>Nombre</TableHead>
//                       <TableHead>Categoría</TableHead>
//                       <TableHead>Precio</TableHead>
//                       <TableHead>Stock</TableHead>
//                       <TableHead>Estado</TableHead>
//                       <TableHead className="text-right">Acciones</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {paginatedProductos.map((producto) => (
//                       <TableRow key={producto.id_producto}>
//                         <TableCell>
//                           {producto.imagen ? (
//                             <img 
//                               src={producto.imagen} 
//                               alt={producto.nombre}
//                               className="w-12 h-12 object-cover rounded-md"
//                             />
//                           ) : (
//                             <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
//                               <Package className="w-6 h-6 text-gray-400" />
//                             </div>
//                           )}
//                         </TableCell>
//                         <TableCell>{producto.nombre}</TableCell>
//                         <TableCell>{producto.categoria || '-'}</TableCell>
//                         <TableCell>${producto.precio.toFixed(2)}</TableCell>
//                         <TableCell>
//                           <Badge variant={producto.stock < 10 ? 'destructive' : 'default'}>
//                             {producto.stock}
//                           </Badge>
//                         </TableCell>
//                         <TableCell>
//                           <Badge variant={producto.estado === 'activo' ? 'default' : 'secondary'}>
//                             {producto.estado || 'activo'}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="text-right">
//                           <div className="flex justify-end gap-2">
//                             {isAdmin && (
//                               <Button variant="outline" size="sm" onClick={() => handleEdit(producto)}>
//                                 <Pencil className="w-4 h-4" />
//                               </Button>
//                             )}
//                             {isAdmin && (
//                               <Button variant="outline" size="sm" onClick={() => handleDelete(producto.id_producto)}>
//                                 <Trash2 className="w-4 h-4" />
//                               </Button>
//                             )}
//                             <Button variant="outline" size="sm" onClick={() => handleView(producto)}>
//                               <Eye className="w-4 h-4" />
//                             </Button>
//                             {(isAdmin || isBarbero) && (
//                               <Button variant="outline" size="sm" onClick={() => handleBaja(producto)} title="Dar de baja">
//                                 <MinusCircle className="w-4 h-4" />
//                               </Button>
//                             )}
//                             {isAdmin && (
//                               <Button
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={() => handleToggleEstado(producto)}
//                                 title="Cambiar estado"
//                               >
//                                 {producto.estado === 'activo' ? (
//                                   <XCircle className="w-4 h-4" />
//                                 ) : (
//                                   <CheckCircle className="w-4 h-4" />
//                                 )}
//                               </Button>
//                             )}
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>
              
//               {/* Paginador Personalizado */}
//               <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
//                 <div className="flex items-center gap-2">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => setCurrentPage(1)}
//                     disabled={currentPage === 1}
//                     className="h-8 w-8 p-0"
//                   >
//                     <ChevronsLeft className="w-4 h-4" />
//                   </Button>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
//                     disabled={currentPage === 1}
//                     className="h-8 w-8 p-0"
//                   >
//                     <ChevronLeft className="w-4 h-4" />
//                   </Button>
                  
//                   <div className="flex items-center gap-1">
//                     <span className="text-sm text-muted-foreground px-2">
//                       Página
//                     </span>
//                     <span className="text-sm font-medium px-2 py-1 bg-blue-600 text-white rounded">
//                       {currentPage}
//                     </span>
//                     <span className="text-sm text-muted-foreground px-2">
//                       de {totalPages || 1}
//                     </span>
//                   </div>
                  
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
//                     disabled={currentPage === totalPages || totalPages === 0}
//                     className="h-8 w-8 p-0"
//                   >
//                     <ChevronRight className="w-4 h-4" />
//                   </Button>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => setCurrentPage(totalPages)}
//                     disabled={currentPage === totalPages || totalPages === 0}
//                     className="h-8 w-8 p-0"
//                   >
//                     <ChevronsRight className="w-4 h-4" />
//                   </Button>
//                 </div>
                
//                 <div className="flex items-center gap-2">
//                   <span className="text-sm text-muted-foreground">
//                     Mostrando {filteredProductos.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredProductos.length)} de {filteredProductos.length} registros
//                   </span>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <Label htmlFor="itemsPerPage2" className="text-sm text-muted-foreground">
//                     Mostrar:
//                   </Label>
//                   <Select
//                     value={itemsPerPage.toString()}
//                     onValueChange={(value) => {
//                       setItemsPerPage(parseInt(value));
//                       setCurrentPage(1);
//                     }}
//                   >
//                     <SelectTrigger className="w-[80px] h-8">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="5">5</SelectItem>
//                       <SelectItem value="10">10</SelectItem>
//                       <SelectItem value="20">20</SelectItem>
//                       <SelectItem value="50">50</SelectItem>
//                       <SelectItem value="100">100</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="compra_directa" className="mt-0">
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <ShoppingCart className="w-5 h-5 text-[#D4AF37]" />
//                 Productos de Compra Directa
//               </CardTitle>
//               <p className="text-sm text-muted-foreground">
//                 Productos como bebidas, comestibles y herramientas que se compran directamente
//               </p>
//             </CardHeader>
//             <CardContent>
//               <div className="rounded-md border overflow-x-auto">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Imagen</TableHead>
//                       <TableHead>Nombre</TableHead>
//                       <TableHead>Categoría</TableHead>
//                       <TableHead>Precio</TableHead>
//                       <TableHead>Stock</TableHead>
//                       <TableHead>Estado</TableHead>
//                       <TableHead className="text-right">Acciones</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {paginatedProductos.map((producto) => (
//                       <TableRow key={producto.id_producto}>
//                         <TableCell>
//                           {producto.imagen ? (
//                             <img 
//                               src={producto.imagen} 
//                               alt={producto.nombre}
//                               className="w-12 h-12 object-cover rounded-md"
//                             />
//                           ) : (
//                             <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
//                               <Package className="w-6 h-6 text-gray-400" />
//                             </div>
//                           )}
//                         </TableCell>
//                         <TableCell>{producto.nombre}</TableCell>
//                         <TableCell>{producto.categoria || '-'}</TableCell>
//                         <TableCell>${producto.precio.toFixed(2)}</TableCell>
//                         <TableCell>
//                           <Badge variant={producto.stock < 10 ? 'destructive' : 'default'}>
//                             {producto.stock}
//                           </Badge>
//                         </TableCell>
//                         <TableCell>
//                           <Badge variant={producto.estado === 'activo' ? 'default' : 'secondary'}>
//                             {producto.estado || 'activo'}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="text-right">
//                           <div className="flex justify-end gap-2">
//                             {isAdmin && (
//                               <Button variant="outline" size="sm" onClick={() => handleEdit(producto)}>
//                                 <Pencil className="w-4 h-4" />
//                               </Button>
//                             )}
//                             {isAdmin && (
//                               <Button variant="outline" size="sm" onClick={() => handleDelete(producto.id_producto)}>
//                                 <Trash2 className="w-4 h-4" />
//                               </Button>
//                             )}
//                             <Button variant="outline" size="sm" onClick={() => handleView(producto)}>
//                               <Eye className="w-4 h-4" />
//                             </Button>
//                             {(isAdmin || isBarbero) && (
//                               <Button variant="outline" size="sm" onClick={() => handleBaja(producto)} title="Dar de baja">
//                                 <MinusCircle className="w-4 h-4" />
//                               </Button>
//                             )}
//                             {isAdmin && (
//                               <Button
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={() => handleToggleEstado(producto)}
//                                 title="Cambiar estado"
//                               >
//                                 {producto.estado === 'activo' ? (
//                                   <XCircle className="w-4 h-4" />
//                                 ) : (
//                                   <CheckCircle className="w-4 h-4" />
//                                 )}
//                               </Button>
//                             )}
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>
              
//               {/* Paginador Personalizado */}
//               <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
//                 <div className="flex items-center gap-2">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => setCurrentPage(1)}
//                     disabled={currentPage === 1}
//                     className="h-8 w-8 p-0"
//                   >
//                     <ChevronsLeft className="w-4 h-4" />
//                   </Button>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
//                     disabled={currentPage === 1}
//                     className="h-8 w-8 p-0"
//                   >
//                     <ChevronLeft className="w-4 h-4" />
//                   </Button>
                  
//                   <div className="flex items-center gap-1">
//                     <span className="text-sm text-muted-foreground px-2">
//                       Página
//                     </span>
//                     <span className="text-sm font-medium px-2 py-1 bg-blue-600 text-white rounded">
//                       {currentPage}
//                     </span>
//                     <span className="text-sm text-muted-foreground px-2">
//                       de {totalPages || 1}
//                     </span>
//                   </div>
                  
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
//                     disabled={currentPage === totalPages || totalPages === 0}
//                     className="h-8 w-8 p-0"
//                   >
//                     <ChevronRight className="w-4 h-4" />
//                   </Button>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => setCurrentPage(totalPages)}
//                     disabled={currentPage === totalPages || totalPages === 0}
//                     className="h-8 w-8 p-0"
//                   >
//                     <ChevronsRight className="w-4 h-4" />
//                   </Button>
//                 </div>
                
//                 <div className="flex items-center gap-2">
//                   <span className="text-sm text-muted-foreground">
//                     Mostrando {filteredProductos.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredProductos.length)} de {filteredProductos.length} registros
//                   </span>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <Label htmlFor="itemsPerPage3" className="text-sm text-muted-foreground">
//                     Mostrar:
//                   </Label>
//                   <Select
//                     value={itemsPerPage.toString()}
//                     onValueChange={(value) => {
//                       setItemsPerPage(parseInt(value));
//                       setCurrentPage(1);
//                     }}
//                   >
//                     <SelectTrigger className="w-[80px] h-8">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="5">5</SelectItem>
//                       <SelectItem value="10">10</SelectItem>
//                       <SelectItem value="20">20</SelectItem>
//                       <SelectItem value="50">50</SelectItem>
//                       <SelectItem value="100">100</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>

//       <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>{editingProducto ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
//             <DialogDescription>
//               {editingProducto ? 'Actualiza la información del producto' : 'Agrega un nuevo producto al inventario'}
//             </DialogDescription>
//           </DialogHeader>
//           <form onSubmit={handleSubmit}>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
//               <div className="space-y-2">
//                 <Label htmlFor="nombre">Nombre</Label>
//                 <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="categoria">Categoría</Label>
//                 <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Selecciona una categoría" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="Cuidado del Cabello">Cuidado del Cabello</SelectItem>
//                     <SelectItem value="Cuidado de la Barba">Cuidado de la Barba</SelectItem>
//                     <SelectItem value="Styling">Styling</SelectItem>
//                     <SelectItem value="Herramientas">Herramientas</SelectItem>
//                     <SelectItem value="Accesorios">Accesorios</SelectItem>
//                     <SelectItem value="Otro">Otro</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="space-y-2 md:col-span-2">
//                 <Label htmlFor="descripcion">Descripción</Label>
//                 <Textarea id="descripcion" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} rows={2} />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="codigo">Código</Label>
//                 <Input id="codigo" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="stock">Stock</Label>
//                 <Input id="stock" type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} required />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="precio">Precio</Label>
//                 <Input id="precio" type="number" step="0.01" value={formData.precio} onChange={(e) => setFormData({ ...formData, precio: e.target.value })} required />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="estado">Estado</Label>
//                 <Select id="estado" value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value as 'activo' | 'inactivo' })}>
//                   <SelectTrigger>
//                     <SelectValue>{formData.estado}</SelectValue>
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="activo">Activo</SelectItem>
//                     <SelectItem value="inactivo">Inactivo</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="space-y-2 md:col-span-2">
//                 <Label htmlFor="imagen">URL de la Imagen</Label>
//                 <Input 
//                   id="imagen" 
//                   type="url" 
//                   value={formData.imagen} 
//                   onChange={(e) => setFormData({ ...formData, imagen: e.target.value })} 
//                   placeholder="https://ejemplo.com/imagen.jpg"
//                 />
//                 {formData.imagen && (
//                   <div className="mt-2">
//                     <img src={formData.imagen} alt="Preview" className="w-24 h-24 object-cover rounded-md" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
//                   </div>
//                 )}
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="tipo_adquisicion">Tipo de Adquisición</Label>
//                 <Select id="tipo_adquisicion" value={formData.tipo_adquisicion} onValueChange={(value) => setFormData({ ...formData, tipo_adquisicion: value as 'consignacion' | 'compra_directa' })}>
//                   <SelectTrigger>
//                     <SelectValue>{formData.tipo_adquisicion}</SelectValue>
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="compra_directa">Compra Directa</SelectItem>
//                     <SelectItem value="consignacion">Consignación</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//             <DialogFooter>
//               <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
//               <Button type="submit">{editingProducto ? 'Actualizar' : 'Crear'}</Button>
//             </DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>

//       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
//             <AlertDialogDescription>Esta acción no se puede deshacer. El producto será eliminado permanentemente.</AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancelar</AlertDialogCancel>
//             <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>

//       <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>Detalles del Producto</DialogTitle>
//             <DialogDescription>
//               Información detallada del producto seleccionado
//             </DialogDescription>
//           </DialogHeader>
//           {viewingProducto && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
//               <div className="space-y-2">
//                 <Label htmlFor="nombre">Nombre</Label>
//                 <Input id="nombre" value={viewingProducto.nombre} readOnly />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="categoria">Categoría</Label>
//                 <Input id="categoria" value={viewingProducto.categoria || ''} readOnly />
//               </div>
//               <div className="space-y-2 md:col-span-2">
//                 <Label htmlFor="descripcion">Descripción</Label>
//                 <Textarea id="descripcion" value={viewingProducto.descripcion || ''} readOnly rows={2} />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="precio">Precio</Label>
//                 <Input id="precio" type="number" step="0.01" value={viewingProducto.precio.toFixed(2)} readOnly />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="stock">Stock</Label>
//                 <Input id="stock" type="number" value={viewingProducto.stock} readOnly />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="estado">Estado</Label>
//                 <Select id="estado" value={viewingProducto.estado} disabled>
//                   <SelectTrigger>
//                     <SelectValue>{viewingProducto.estado}</SelectValue>
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="activo">Activo</SelectItem>
//                     <SelectItem value="inactivo">Inactivo</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//           )}
//           <DialogFooter>
//             <Button type="button" variant="outline" onClick={() => setDetailsDialogOpen(false)}>Cerrar</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       <Dialog open={bajaDialogOpen} onOpenChange={setBajaDialogOpen}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>Dar de Baja Producto</DialogTitle>
//             <DialogDescription>
//               Registra la baja de un producto del inventario
//             </DialogDescription>
//           </DialogHeader>
//           {productoBaja && (
//             <form onSubmit={confirmBaja}>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="nombre">Nombre</Label>
//                   <Input id="nombre" value={productoBaja.nombre} readOnly />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="categoria">Categoría</Label>
//                   <Input id="categoria" value={productoBaja.categoria || ''} readOnly />
//                 </div>
//                 <div className="space-y-2 md:col-span-2">
//                   <Label htmlFor="descripcion">Descripción</Label>
//                   <Textarea id="descripcion" value={productoBaja.descripcion || ''} readOnly rows={2} />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="precio">Precio</Label>
//                   <Input id="precio" type="number" step="0.01" value={productoBaja.precio.toFixed(2)} readOnly />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="stock">Stock</Label>
//                   <Input id="stock" type="number" value={productoBaja.stock} readOnly />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="cantidadBaja">Cantidad a dar de baja</Label>
//                   <Input id="cantidadBaja" type="number" value={cantidadBaja} onChange={(e) => setCantidadBaja(parseInt(e.target.value))} required />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="motivoBaja">Motivo de la baja</Label>
//                   <Select id="motivoBaja" value={motivoBaja} onValueChange={(value) => setMotivoBaja(value)}>
//                     <SelectTrigger>
//                       <SelectValue>{motivoBaja}</SelectValue>
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="Uso interno del negocio">Uso interno del negocio</SelectItem>
//                       <SelectItem value="Daño">Daño</SelectItem>
//                       <SelectItem value="Obsoletos">Obsoletos</SelectItem>
//                       <SelectItem value="Otro">Otro</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//               <DialogFooter>
//                 <Button type="button" variant="outline" onClick={() => setBajaDialogOpen(false)}>Cancelar</Button>
//                 <Button type="submit">Dar de Baja</Button>
//               </DialogFooter>
//             </form>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }



import { useState, useMemo, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Plus, Pencil, Trash2, Package, Eye, FileDown, MinusCircle, FileSpreadsheet, CheckCircle, XCircle, ShoppingCart, Handshake, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { fetchApi } from '../../lib/api'; 
import { toast } from 'sonner';
import { exportToExcel, downloadMenu } from '../../shared/lib/exportUtils';
import { useAuth } from '../../features/auth';

import { SearchBar } from '../common/SearchBar';
import { Pagination } from '../common/Pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export function ProductosView() {
  const { user } = useAuth();
  const [productos, setProductos] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true); 
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bajaDialogOpen, setBajaDialogOpen] = useState(false);

  const [editingProducto, setEditingProducto] = useState<any | null>(null);
  const [viewingProducto, setViewingProducto] = useState<any | null>(null);
  const [productoToDelete, setProductoToDelete] = useState<number | null>(null);
  const [productoBaja, setProductoBaja] = useState<any | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [cantidadBaja, setCantidadBaja] = useState(1);
  const [motivoBaja, setMotivoBaja] = useState('Uso interno del negocio');
  
  // Estado para saber qué pestaña está activa
  const [activeTab, setActiveTab] = useState<'todos' | 'consignacion' | 'compra_directa'>('todos');

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '0',
    categoria: '', 
    id_categoria: '1', 
    id_marca: '1',     
    codigo: '',
    imagen: '',
    estado: 'Activo',
    tipo_adquisicion: 'compra_directa',
    iva_porcentaje: '19.00'
  });

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const response = await fetchApi('/products');
      if (response.success) {
        const formattedData = response.data.map((p: any) => ({
          ...p,
          precio: p.precio_neto, 
          categoria: p.categoria_nombre || 'Sin categoría',
          imagen: p.img,
          // Normalizamos el string por si viene null de la BD antigua
          tipo_adquisicion: p.tipo_adquisicion || 'compra_directa' 
        }));
        setProductos(formattedData);
      }
    } catch (error: any) {
      toast.error('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const isAdmin = user?.id_rol === 1 || user?.rol === 'Administrador';
  const isBarbero = user?.id_rol === 2 || user?.rol === 'Barbero';

  // 1. Filtrar solo por búsqueda de texto (Para que los contadores de las Tabs funcionen bien)
  const searchFilteredProductos = useMemo(() => {
    if (!searchTerm.trim()) return productos;
    const lowerSearch = searchTerm.toLowerCase();
    return productos.filter((producto) => {
      const nombre = (producto.nombre || '').toLowerCase();
      const codigo = (producto.codigo || '').toLowerCase();
      const categoria = (producto.categoria || '').toLowerCase();
      const descripcion = (producto.descripcion || '').toLowerCase();
      return nombre.includes(lowerSearch) || codigo.includes(lowerSearch) || categoria.includes(lowerSearch) || descripcion.includes(lowerSearch);
    });
  }, [productos, searchTerm]);

  // 2. Filtrar por la Pestaña Activa (Para la paginación final)
  const tabFilteredProductos = useMemo(() => {
    if (activeTab === 'todos') return searchFilteredProductos;
    return searchFilteredProductos.filter(p => p.tipo_adquisicion === activeTab);
  }, [searchFilteredProductos, activeTab]);

  const totalPages = Math.ceil(tabFilteredProductos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProductos = tabFilteredProductos.slice(startIndex, endIndex);

  // Contadores para las pestañas
  const countConsignacion = searchFilteredProductos.filter(p => p.tipo_adquisicion === 'consignacion').length;
  const countDirecta = searchFilteredProductos.filter(p => p.tipo_adquisicion === 'compra_directa').length;

  const handleCreate = () => {
    setEditingProducto(null);
    setFormData({
      nombre: '', descripcion: '', precio: '', stock: '0',
      categoria: '', id_categoria: '1', id_marca: '1', codigo: '',
      imagen: '', estado: 'Activo', tipo_adquisicion: 'compra_directa', iva_porcentaje: '19.00'
    });
    setDialogOpen(true);
  };

  const handleEdit = (producto: any) => {
    setEditingProducto(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio.toString(),
      stock: producto.stock.toString(),
      categoria: producto.categoria || '',
      id_categoria: producto.id_categoria?.toString() || '1',
      id_marca: producto.id_marca?.toString() || '1',
      codigo: producto.codigo || '',
      imagen: producto.img || '',
      estado: producto.estado || 'Activo',
      tipo_adquisicion: producto.tipo_adquisicion || 'compra_directa',
      iva_porcentaje: producto.iva_porcentaje?.toString() || '19.00'
    });
    setDialogOpen(true);
  };

  const handleView = (producto: any) => { setViewingProducto(producto); setDetailsDialogOpen(true); };
  const handleDelete = (id: number) => { setProductoToDelete(id); setDeleteDialogOpen(true); };

  const confirmDelete = async () => {
    if (productoToDelete) {
      try {
        await fetchApi(`/products/${productoToDelete}`, { method: 'DELETE' });
        toast.success('Producto eliminado correctamente');
        fetchProductos();
      } catch (error: any) {
        toast.error(error.message || 'Error al eliminar el producto.');
      }
    }
    setDeleteDialogOpen(false); setProductoToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nombre: formData.nombre, descripcion: formData.descripcion,
      precio_neto: parseFloat(formData.precio), stock: parseInt(formData.stock),
      codigo: formData.codigo, img: formData.imagen, estado: formData.estado,
      tipo_adquisicion: formData.tipo_adquisicion, iva_porcentaje: parseFloat(formData.iva_porcentaje),
      id_categoria: parseInt(formData.id_categoria), id_marca: parseInt(formData.id_marca)
    };

    try {
      if (editingProducto) {
        await fetchApi(`/products/${editingProducto.id_producto}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Producto actualizado correctamente');
      } else {
        await fetchApi('/products', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Producto creado correctamente');
      }
      setDialogOpen(false); fetchProductos();
    } catch (error: any) { toast.error(error.message || 'Error al guardar el producto'); }
  };

  const handleBaja = (producto: any) => {
    setProductoBaja(producto); setCantidadBaja(1); setMotivoBaja('Uso interno del negocio'); setBajaDialogOpen(true);
  };

  const confirmBaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (productoBaja && cantidadBaja > 0 && cantidadBaja <= productoBaja.stock) {
      try {
        const nuevoStock = productoBaja.stock - cantidadBaja;
        await fetchApi(`/products/${productoBaja.id_producto}`, {
          method: 'PUT', body: JSON.stringify({ ...productoBaja, precio_neto: productoBaja.precio, stock: nuevoStock })
        });
        toast.success(`${cantidadBaja} unidad(es) dada(s) de baja correctamente`);
        setBajaDialogOpen(false); setProductoBaja(null); fetchProductos();
      } catch (error: any) { toast.error(error.message || 'Error al dar de baja el producto'); }
    } else { toast.error('Cantidad inválida'); }
  };

  const handleToggleEstado = async (producto: any) => {
    const nuevoEstado = producto.estado === 'Activo' ? 'Inactivo' : 'Activo';
    try {
      await fetchApi(`/products/${producto.id_producto}`, {
        method: 'PUT', body: JSON.stringify({ ...producto, precio_neto: producto.precio, estado: nuevoEstado })
      });
      toast.success(`Producto ${nuevoEstado === 'Activo' ? 'activado' : 'desactivado'} correctamente`);
      fetchProductos();
    } catch (error: any) { toast.error('Error al cambiar estado'); }
  };

  const renderTable = (items: any[]) => (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Imagen</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Tipo Adquisición</TableHead>
            <TableHead>Precio Neto</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((producto) => (
            <TableRow key={producto.id_producto}>
              <TableCell>
                {producto.imagen ? (
                  <img src={producto.imagen} alt={producto.nombre} className="w-12 h-12 object-cover rounded-md" />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </TableCell>
              <TableCell>{producto.nombre}</TableCell>
              <TableCell>{producto.categoria || '-'}</TableCell>
              <TableCell>
                {producto.tipo_adquisicion === 'consignacion' ? (
                  <Badge variant="outline" className="flex items-center gap-1 w-fit"><Handshake className="w-3 h-3" /> Consignación</Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1 w-fit"><ShoppingCart className="w-3 h-3" /> Directa</Badge>
                )}
              </TableCell>
              <TableCell>${(producto.precio || 0).toFixed(2)}</TableCell>
              <TableCell><Badge variant={producto.stock < 10 ? 'destructive' : 'default'}>{producto.stock}</Badge></TableCell>
              <TableCell>
                <Badge variant={producto.estado === 'Activo' ? 'default' : 'secondary'} className={producto.estado === 'Activo' ? 'bg-green-600' : ''}>
                  {producto.estado || 'Activo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {isAdmin && <Button variant="outline" size="sm" onClick={() => handleEdit(producto)}><Pencil className="w-4 h-4" /></Button>}
                  {isAdmin && <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(producto.id_producto)}><Trash2 className="w-4 h-4" /></Button>}
                  <Button variant="outline" size="sm" onClick={() => handleView(producto)}><Eye className="w-4 h-4" /></Button>
                  {(isAdmin || isBarbero) && <Button variant="outline" size="sm" onClick={() => handleBaja(producto)} title="Dar de baja"><MinusCircle className="w-4 h-4" /></Button>}
                  {isAdmin && (
                    <Button variant="outline" size="sm" onClick={() => handleToggleEstado(producto)} title="Cambiar estado" className={producto.estado === 'Activo' ? 'text-green-600' : 'text-gray-500'}>
                      {producto.estado === 'Activo' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Package className="w-6 h-6" /> Productos
          </h1>
          <p className="text-muted-foreground">Gestiona el inventario de productos</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" /> Nuevo Producto</Button>}
          <Button onClick={() => exportToExcel(productos, 'productos')} variant="outline"><FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar</Button>
          <Button onClick={() => downloadMenu(productos)} variant="outline"><FileDown className="w-4 h-4 mr-2" /> Catálogo</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val: any) => { setActiveTab(val); setCurrentPage(1); }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <TabsList className="grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="todos" className="flex items-center gap-2">
              <Package className="w-4 h-4" /> Todos ({searchFilteredProductos.length})
            </TabsTrigger>
            <TabsTrigger value="consignacion" className="flex items-center gap-2">
              <Handshake className="w-4 h-4" /> Consignación ({countConsignacion})
            </TabsTrigger>
            <TabsTrigger value="compra_directa" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" /> Directa ({countDirecta})
            </TabsTrigger>
          </TabsList>
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar producto..." className="w-full md:w-96" />
        </div>

        {loading ? (
          <Card><CardContent><div className="text-center py-8 text-muted-foreground">Cargando base de datos...</div></CardContent></Card>
        ) : (
          <>
            <TabsContent value="todos" className="mt-0">
              <Card>
                <CardHeader><CardTitle>Todos los Productos</CardTitle></CardHeader>
                <CardContent>{renderTable(paginatedProductos)}</CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="consignacion" className="mt-0">
              <Card>
                <CardHeader><CardTitle>Productos en Consignación</CardTitle></CardHeader>
                <CardContent>{renderTable(paginatedProductos)}</CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compra_directa" className="mt-0">
              <Card>
                <CardHeader><CardTitle>Productos de Compra Directa</CardTitle></CardHeader>
                <CardContent>{renderTable(paginatedProductos)}</CardContent>
              </Card>
            </TabsContent>

            {/* Paginación para todas las pestañas */}
            {tabFilteredProductos.length > itemsPerPage && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} totalItems={tabFilteredProductos.length} />
              </div>
            )}
          </>
        )}
      </Tabs>

      {/* MODAL CREAR / EDITAR */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProducto ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2"><Label>Nombre <span className="text-red-500">*</span></Label><Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Código</Label><Input value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} placeholder="Ej: PRD-01" /></div>
              <div className="space-y-2 md:col-span-2"><Label>Descripción</Label><Textarea value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} rows={2} /></div>
              <div className="space-y-2"><Label>Stock <span className="text-red-500">*</span></Label><Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Precio Neto (Sin IVA) <span className="text-red-500">*</span></Label><Input type="number" step="0.01" value={formData.precio} onChange={(e) => setFormData({ ...formData, precio: e.target.value })} required /></div>
              <div className="space-y-2"><Label>IVA (%)</Label><Input type="number" step="0.01" value={formData.iva_porcentaje} onChange={(e) => setFormData({ ...formData, iva_porcentaje: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Tipo de Adquisición</Label>
                <Select value={formData.tipo_adquisicion} onValueChange={(val) => setFormData({ ...formData, tipo_adquisicion: val as any })}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compra_directa">Compra Directa</SelectItem>
                    <SelectItem value="consignacion">Consignación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2"><Label>URL de la Imagen</Label><Input type="url" value={formData.imagen} onChange={(e) => setFormData({ ...formData, imagen: e.target.value })} placeholder="https://ejemplo.com/imagen.jpg" /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#D4AF37] hover:bg-[#B8941F] text-black">{editingProducto ? 'Actualizar BD' : 'Guardar BD'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DEMÁS MODALES DE BAJA Y ELIMINAR SE MANTIENEN IGUAL... */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Eliminar de la Base de Datos?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={bajaDialogOpen} onOpenChange={setBajaDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Dar de Baja (Uso Interno)</DialogTitle></DialogHeader>
          {productoBaja && (
            <form onSubmit={confirmBaja}>
              <div className="space-y-4 py-4">
                <div className="p-3 bg-muted rounded-md font-bold">{productoBaja.nombre} (Stock: {productoBaja.stock})</div>
                <div className="space-y-2"><Label>Cantidad a descontar</Label><Input type="number" min="1" max={productoBaja.stock} value={cantidadBaja} onChange={(e) => setCantidadBaja(parseInt(e.target.value))} required /></div>
              </div>
              <DialogFooter><Button type="button" variant="outline" onClick={() => setBajaDialogOpen(false)}>Cancelar</Button><Button type="submit" variant="destructive">Confirmar Baja</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detalles</DialogTitle></DialogHeader>
          {viewingProducto && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Nombre</Label><p className="font-bold">{viewingProducto.nombre}</p></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Precio Neto</Label><p className="font-bold">${viewingProducto.precio?.toFixed(2)}</p></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Tipo Adquisición</Label><p className="font-bold capitalize">{viewingProducto.tipo_adquisicion?.replace('_', ' ')}</p></div>
            </div>
          )}
          <DialogFooter><Button type="button" onClick={() => setDetailsDialogOpen(false)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}