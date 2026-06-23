import { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Plus, Pencil, Trash2, Package, Eye, FileDown, /* MinusCircle, */ FileSpreadsheet, ShoppingCart, Handshake, Upload, X } from 'lucide-react';
import { fetchApi, API_BASE_URL } from '../../lib/api'; 
import { toast } from 'sonner';
import { exportToExcel, downloadMenu } from '../../shared/lib/exportUtils';
import { useAuth } from '../../features/auth';
import { formatCOP } from '../../lib/format';

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
  // Funcionalidad "Dar de Baja" deshabilitada temporalmente
  // const [bajaDialogOpen, setBajaDialogOpen] = useState(false);

  const [editingProducto, setEditingProducto] = useState<any | null>(null);
  const [viewingProducto, setViewingProducto] = useState<any | null>(null);
  const [productoToDelete, setProductoToDelete] = useState<number | null>(null);
  // Funcionalidad "Dar de Baja" deshabilitada temporalmente
  // const [productoBaja, setProductoBaja] = useState<any | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Funcionalidad "Dar de Baja" deshabilitada temporalmente
  // const [cantidadBaja, setCantidadBaja] = useState(1);
  // const [motivoBaja, setMotivoBaja] = useState('Uso interno del negocio');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
          imagen: p.img ? (p.img.startsWith('http') ? p.img : `${API_BASE_URL}${p.img}`) : null,
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
  // const isBarbero = user?.id_rol === 2 || user?.rol === 'Barbero';

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
    setImageFile(null);
    setImagePreview(null);
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
    setImageFile(null);
    setImagePreview(producto.imagen || null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe superar los 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formDataObj = new FormData();
    formDataObj.append('nombre', formData.nombre);
    formDataObj.append('descripcion', formData.descripcion);
    formDataObj.append('precio_neto', formData.precio);
    formDataObj.append('stock', formData.stock);
    formDataObj.append('codigo', formData.codigo);
    formDataObj.append('estado', formData.estado);
    formDataObj.append('tipo_adquisicion', formData.tipo_adquisicion);
    formDataObj.append('iva_porcentaje', formData.iva_porcentaje);
    formDataObj.append('id_categoria', formData.id_categoria);
    formDataObj.append('id_marca', formData.id_marca);
    
    if (imageFile) {
      formDataObj.append('imagen', imageFile);
    }

    try {
      if (editingProducto) {
        await fetchApi(`/products/${editingProducto.id_producto}`, { 
          method: 'PUT', 
          body: formDataObj 
        });
        toast.success('Producto actualizado correctamente');
      } else {
        await fetchApi('/products', { 
          method: 'POST', 
          body: formDataObj 
        });
        toast.success('Producto creado correctamente');
      }
      setDialogOpen(false); fetchProductos();
    } catch (error: any) { toast.error(error.message || 'Error al guardar el producto'); }
  };

  // Funcionalidad "Dar de Baja" deshabilitada temporalmente
  // const handleBaja = (producto: any) => {
  //   setProductoBaja(producto); setCantidadBaja(1); setMotivoBaja('Uso interno del negocio'); setBajaDialogOpen(true);
  // };
  // 
  // const confirmBaja = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (productoBaja && cantidadBaja > 0 && cantidadBaja <= productoBaja.stock) {
  //     try {
  //       const nuevoStock = productoBaja.stock - cantidadBaja;
  //       await fetchApi(`/products/${productoBaja.id_producto}`, {
  //         method: 'PUT', body: JSON.stringify({ ...productoBaja, precio_neto: productoBaja.precio, stock: nuevoStock })
  //       });
  //       toast.success(`${cantidadBaja} unidad(es) dada(s) de baja correctamente`);
  //       setBajaDialogOpen(false); setProductoBaja(null); fetchProductos();
  //     } catch (error: any) { toast.error(error.message || 'Error al dar de baja el producto'); }
  //     } else { toast.error('Cantidad inválida'); }
  // };

  const handleToggleEstado = async (producto: any) => {
    const nuevoEstado = producto.estado === 'Activo' ? 'Inactivo' : 'Activo';
    const toastId = toast.loading(`Cambiando estado a ${nuevoEstado}...`);
    try {
      await fetchApi(`/products/${producto.id_producto}`, {
        method: 'PUT', body: JSON.stringify({ ...producto, precio_neto: producto.precio, estado: nuevoEstado })
      });
      toast.success(`Producto ${nuevoEstado === 'Activo' ? 'activado' : 'inactivado'} correctamente`, { id: toastId });
      fetchProductos();
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar estado', { id: toastId });
    }
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
              <TableCell>{formatCOP(producto.precio)}</TableCell>
              <TableCell><Badge variant={producto.stock < 10 ? 'destructive' : 'default'} className={producto.stock >= 10 ? 'bg-blue-600' : ''}>{producto.stock}</Badge></TableCell>
              <TableCell>
                {isAdmin ? (
                  <button
                    onClick={() => handleToggleEstado(producto)}
                    className="focus:outline-none transition-transform active:scale-95"
                    title={`Cambiar a ${producto.estado === 'Activo' ? 'Inactivo' : 'Activo'}`}
                  >
                    <Badge 
                      className={`
                        cursor-pointer px-3 py-1 rounded-full border-2 transition-all duration-200
                        ${producto.estado === 'Activo' 
                          ? 'bg-green-600 text-white hover:bg-green-700 border-transparent shadow-sm' 
                          : 'bg-red-600 text-white hover:bg-red-700 border-transparent shadow-sm'}
                      `}
                    >
                      <span className={`w-2 h-2 rounded-full mr-2 ${producto.estado === 'Activo' ? 'bg-green-200' : 'bg-red-200'}`}></span>
                      {producto.estado || 'Activo'}
                    </Badge>
                  </button>
                ) : (
                  <Badge 
                    className={`
                      px-3 py-1 rounded-full border-2
                      ${producto.estado === 'Activo' 
                        ? 'bg-green-600 text-white border-transparent shadow-sm' 
                        : 'bg-red-600 text-white border-transparent shadow-sm'}
                    `}
                  >
                    <span className={`w-2 h-2 rounded-full mr-2 ${producto.estado === 'Activo' ? 'bg-green-200' : 'bg-red-200'}`}></span>
                    {producto.estado || 'Activo'}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {isAdmin && <Button variant="outline" size="sm" onClick={() => handleEdit(producto)}><Pencil className="w-4 h-4" /></Button>}
                  {isAdmin && <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(producto.id_producto)}><Trash2 className="w-4 h-4" /></Button>}
                  <Button variant="outline" size="sm" onClick={() => handleView(producto)}><Eye className="w-4 h-4" /></Button>
                  {/* Funcionalidad "Dar de Baja" deshabilitada temporalmente
                  {(isAdmin || isBarbero) && <Button variant="outline" size="sm" onClick={() => handleBaja(producto)} title="Dar de baja"><MinusCircle className="w-4 h-4" /></Button>}
                  */}
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
          <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-800">
            <Package className="w-6 h-6 text-blue-600" /> Productos
          </h1>
          <p className="text-muted-foreground">Gestiona el inventario de productos</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4 mr-2" /> Nuevo Producto</Button>}
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
            {tabFilteredProductos.length > 0 && (
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
              <div className="space-y-2 md:col-span-2">
                <Label>Imagen del Producto</Label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img src={imagePreview} alt="Preview" className="mx-auto h-32 w-32 object-cover rounded-md shadow-md" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeImage(); }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <span className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                            Sube una imagen
                          </span>
                          <p className="pl-1">o arrastra y suelta</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, WEBP hasta 5MB</p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Guardar</Button>
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

      {/* Funcionalidad "Dar de Baja" deshabilitada temporalmente
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
      */}

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detalles</DialogTitle></DialogHeader>
          {viewingProducto && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Nombre</Label><p className="font-bold">{viewingProducto.nombre}</p></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Precio Neto</Label><p className="font-bold">{formatCOP(viewingProducto.precio)}</p></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Tipo Adquisición</Label><p className="font-bold capitalize">{viewingProducto.tipo_adquisicion?.replace('_', ' ')}</p></div>
            </div>
          )}
          <DialogFooter><Button type="button" onClick={() => setDetailsDialogOpen(false)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}