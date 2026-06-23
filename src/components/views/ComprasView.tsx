import { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ShoppingBag, Search, Eye, FileDown, Package, Plus, Trash2, Calendar, XCircle, AlertCircle, Pencil, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { mockCompras, mockProveedores, mockDetalleCompras, mockProductos } from '../../shared/lib/mockData';
import { toast } from 'sonner';
import { exportToExcelXLSX } from '../../shared/lib/exportUtils';
import { formatCOP } from '../../lib/format';
import { Pagination } from '../common/Pagination';


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

export function ComprasView() {
  const [compras, setCompras] = useState(mockCompras);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [newCompraDialogOpen, setNewCompraDialogOpen] = useState(false);
  const [editCompraDialogOpen, setEditCompraDialogOpen] = useState(false);
  const [anularDialogOpen, setAnularDialogOpen] = useState(false);
  const [viewingCompra, setViewingCompra] = useState<any | null>(null);
  const [editingCompra, setEditingCompra] = useState<any | null>(null);
  const [compraToAnular, setCompraToAnular] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Estados para el formulario de nueva compra
  const [formData, setFormData] = useState({
    id_proveedor: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'completada',
  });
  
  const [productos, setProductos] = useState<{
    id_producto: string;
    cantidad: number;
    precio_unitario: number;
  }[]>([]);

  // Funciones auxiliares (deben estar antes del useMemo)
  const getProveedorName = (id: number) => {
    const proveedor = mockProveedores.find(p => p.id_proveedor === id);
    return proveedor?.nombre || 'N/A';
  };

  const getCompraDetalle = (id_compra: number) => {
    const detalles = mockDetalleCompras.filter(d => d.id_compra === id_compra);
    return detalles.map(d => {
      const producto = mockProductos.find(p => p.id_producto === d.id_producto);
      return { ...d, producto: producto?.nombre || 'N/A' };
    });
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'completada':
        return (
          <Badge className="bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completada
          </Badge>
        );
      case 'pendiente':
        return (
          <Badge className="bg-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'cancelada':
        return (
          <Badge className="bg-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelada
          </Badge>
        );
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  // Búsqueda avanzada por TODOS los campos
  const filteredCompras = useMemo(() => {
    if (!searchTerm.trim()) return compras;

    const lowerSearch = searchTerm.toLowerCase();
    const cleanSearch = lowerSearch.replace('#', '').trim();
    
    return compras.filter((compra) => {
      const idCompra = compra.id_compra.toString();
      const proveedorName = getProveedorName(compra.id_proveedor).toLowerCase();
      const total = compra.total.toString();
      const estado = compra.estado.toLowerCase();
      
      // Búsqueda por ID (con o sin #)
      if (lowerSearch.startsWith('#') && idCompra.includes(cleanSearch)) {
        return true;
      }
      
      return (
        idCompra.includes(cleanSearch) ||
        proveedorName.includes(lowerSearch) ||
        searchInDate(compra.fecha, lowerSearch) ||
        total.includes(cleanSearch) ||
        estado.includes(lowerSearch)
      );
    });
  }, [compras, searchTerm]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.id_proveedor) {
      errors.proveedor = 'Debes seleccionar un proveedor';
    }

    if (!formData.fecha) {
      errors.fecha = 'La fecha es obligatoria';
    } else {
      const fecha = new Date(formData.fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fecha > hoy) {
        errors.fecha = 'La fecha no puede ser futura';
      }
    }

    if (productos.length === 0) {
      errors.productos = 'Debes agregar al menos un producto';
    }

    const hasInvalidProduct = productos.some(p => {
      return !p.id_producto || p.cantidad <= 0 || p.precio_unitario < 0;
    });

    if (hasInvalidProduct) {
      errors.productos = 'Todos los productos deben tener información válida (producto seleccionado, cantidad > 0, precio ≥ 0)';
    }

    // Validar productos duplicados
    const productIds = productos.map(p => p.id_producto);
    const hasDuplicates = productIds.some((id, index) => productIds.indexOf(id) !== index);
    if (hasDuplicates) {
      errors.productos = 'No puedes agregar el mismo producto más de una vez';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleExport = () => {
    const dataToExport = compras.map(compra => ({
      'ID': compra.id_compra,
      'Proveedor': getProveedorName(compra.id_proveedor),
      'Fecha': new Date(compra.fecha + 'T00:00:00').toLocaleDateString('es-ES'),
      'Total': formatCOP(compra.total),
      'Estado': compra.estado === 'completada' ? 'Completada' : compra.estado === 'pendiente' ? 'Pendiente' : 'Cancelada',
    }));

    const fechaActual = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    exportToExcelXLSX(dataToExport, `Compras_${fechaActual}`, 'Compras');
    
    toast.success('Archivo Excel descargado exitosamente', {
      style: { background: '#10b981', color: '#fff' }
    });
  };

  const handleView = (compra: any) => {
    const detalles = getCompraDetalle(compra.id_compra);
    setViewingCompra({ ...compra, detalles });
    setDetailsDialogOpen(true);
  };

  const handleEdit = (compra: any) => {
    setEditingCompra(compra);
    const detalles = getCompraDetalle(compra.id_compra);
    
    setFormData({
      id_proveedor: compra.id_proveedor.toString(),
      fecha: compra.fecha,
      estado: compra.estado,
    });
    
    setProductos(detalles.map(d => ({
      id_producto: d.id_producto.toString(),
      cantidad: d.cantidad,
      precio_unitario: d.precio_unitario,
    })));
    
    setFormErrors({});
    setEditCompraDialogOpen(true);
  };

  const handleOpenNewCompra = () => {
    setEditingCompra(null);
    setFormData({
      id_proveedor: '',
      fecha: new Date().toISOString().split('T')[0],
      estado: 'completada',
    });
    setProductos([]);
    setFormErrors({});
    setNewCompraDialogOpen(true);
  };

  const handleAgregarProducto = () => {
    setProductos([...productos, { id_producto: '', cantidad: 1, precio_unitario: 0 }]);
    if (formErrors.productos) {
      setFormErrors({ ...formErrors, productos: '' });
    }
  };

  const handleEliminarProducto = (index: number) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  const handleProductoChange = (index: number, field: string, value: any) => {
    const newProductos = [...productos];
    newProductos[index] = { ...newProductos[index], [field]: value };
    setProductos(newProductos);
    
    if (formErrors.productos) {
      setFormErrors({ ...formErrors, productos: '' });
    }
  };

  const calcularTotal = () => {
    return productos.reduce((sum, p) => sum + (p.cantidad * p.precio_unitario), 0);
  };

  const handleSubmitCompra = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario', {
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    const total = calcularTotal();
    const nextId = Math.max(...compras.map(c => c.id_compra), 0) + 1;
    
    const newCompra = {
      id_compra: nextId,
      id_proveedor: parseInt(formData.id_proveedor),
      fecha: formData.fecha,
      total: total,
      estado: formData.estado as any,
    };
    
    // Agregar al inicio del listado
    setCompras([newCompra, ...compras]);
    
    toast.success('Compra registrada exitosamente', {
      description: `ID: #${nextId} - Total: ${formatCOP(total)}`,
      style: { background: '#10b981', color: '#fff' }
    });
    
    setNewCompraDialogOpen(false);
  };

  const handleUpdateCompra = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario', {
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    const total = calcularTotal();
    
    const updatedCompras = compras.map(c => {
      if (c.id_compra === editingCompra.id_compra) {
        return {
          ...c,
          id_proveedor: parseInt(formData.id_proveedor),
          fecha: formData.fecha,
          total: total,
          estado: formData.estado as any,
        };
      }
      return c;
    });
    
    setCompras(updatedCompras);
    
    toast.success('Compra actualizada exitosamente', {
      description: `Total actualizado: ${formatCOP(total)}`,
      style: { background: '#10b981', color: '#fff' }
    });
    
    setEditCompraDialogOpen(false);
  };

  const handleStatusChange = (id: number, newStatus: string) => {
    const updatedCompras = compras.map(c => {
      if (c.id_compra === id) {
        return { ...c, estado: newStatus as any };
      }
      return c;
    });
    
    setCompras(updatedCompras);
    
    const statusMessages: Record<string, string> = {
      completada: 'Compra marcada como completada',
      pendiente: 'Compra marcada como pendiente',
      cancelada: 'Compra anulada',
    };
    
    toast.success(statusMessages[newStatus] || 'Estado actualizado', {
      style: { background: '#10b981', color: '#fff' }
    });
  };

  const handleAnularCompra = (compra: any) => {
    if (compra.estado === 'cancelada') {
      toast.error('Esta compra ya está cancelada', {
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }
    
    setCompraToAnular(compra);
    setAnularDialogOpen(true);
  };

  const confirmAnularCompra = () => {
    if (compraToAnular) {
      handleStatusChange(compraToAnular.id_compra, 'cancelada');
    }
    setAnularDialogOpen(false);
  };

  // Estadísticas
  const totalCompras = filteredCompras.reduce((sum, compra) => sum + compra.total, 0);
  const comprasCompletadas = filteredCompras.filter(c => c.estado === 'completada').length;

  // Paginación
  const totalPages = Math.ceil(filteredCompras.length / itemsPerPage);
  const currentPaginatedCompras = filteredCompras.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" />
            Compras
          </h1>
          <p className="text-muted-foreground">Gestiona las compras a proveedores</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleOpenNewCompra} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Compra
          </Button>
          <Button onClick={handleExport} variant="outline">
            <FileDown className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Compras</p>
                <p className="text-2xl font-bold text-blue-600">{filteredCompras.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-600 rounded-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completadas</p>
                <p className="text-2xl font-bold text-green-600">{comprasCompletadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total en Compras</p>
                <p className="text-2xl font-bold text-blue-800">{formatCOP(totalCompras)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Lista de Compras</CardTitle>
            <div className="w-full md:w-96">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por ID, proveedor, fecha, total, estado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCompras.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No se encontraron compras con ese criterio' : 'No hay compras registradas'}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPaginatedCompras.map((compra) => (
                    <TableRow key={compra.id_compra}>
                      <TableCell className="font-medium">#{compra.id_compra}</TableCell>
                      <TableCell>{getProveedorName(compra.id_proveedor)}</TableCell>
                      <TableCell>
                        {new Date(compra.fecha + 'T00:00:00').toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell className="font-medium text-blue-600">{formatCOP(compra.total)}</TableCell>
                      <TableCell>
                        <Select
                          value={compra.estado}
                          onValueChange={(value) => handleStatusChange(compra.id_compra, value)}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue>
                              {getEstadoBadge(compra.estado)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="completada">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>Completada</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="pendiente">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-yellow-600" />
                                <span>Pendiente</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="cancelada">
                              <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-600" />
                                <span>Cancelada</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => handleView(compra)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(compra)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAnularCompra(compra)}
                            disabled={compra.estado === 'cancelada'}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginador Personalizado */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
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
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredCompras.length}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Ver Detalles */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              Detalles de la Compra #{viewingCompra?.id_compra}
            </DialogTitle>
            <DialogDescription>Información completa de la compra</DialogDescription>
          </DialogHeader>
          {viewingCompra && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ID Compra</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">#{viewingCompra.id_compra}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <div className="p-3 bg-muted rounded-md">
                    {getEstadoBadge(viewingCompra.estado)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">{getProveedorName(viewingCompra.id_proveedor)}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p>
                      {new Date(viewingCompra.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Productos Comprados</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingCompra.detalles?.map((detalle: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{detalle.producto}</TableCell>
                          <TableCell>{detalle.cantidad}</TableCell>
                          <TableCell>{formatCOP(detalle.precio_unitario)}</TableCell>
                          <TableCell className="text-right">
                            {formatCOP(detalle.cantidad * detalle.precio_unitario)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between items-center py-2 border-t-2 border-blue-600">
                    <span className="font-semibold text-lg">Total:</span>
                    <span className="font-bold text-2xl text-blue-600">
                      {formatCOP(viewingCompra.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Nueva Compra */}
      <Dialog open={newCompraDialogOpen} onOpenChange={setNewCompraDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nueva Compra</DialogTitle>
            <DialogDescription>
              Complete el formulario para registrar una nueva compra a proveedor
            </DialogDescription>
          </DialogHeader>
          

          
          <form onSubmit={handleSubmitCompra}>
            <div className="space-y-6 py-4">
              {/* Información General */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Información General</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proveedor">
                      Proveedor <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.id_proveedor}
                      onValueChange={(value) => {
                        setFormData({ ...formData, id_proveedor: value });
                        if (formErrors.proveedor) {
                          setFormErrors({ ...formErrors, proveedor: '' });
                        }
                      }}
                    >
                      <SelectTrigger id="proveedor" className={formErrors.proveedor ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecciona un proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockProveedores.map((prov) => (
                          <SelectItem key={prov.id_proveedor} value={prov.id_proveedor.toString()}>
                            {prov.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.proveedor && (
                      <p className="text-xs text-red-500">{formErrors.proveedor}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fecha">
                      Fecha <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
                        className={`pl-10 ${formErrors.fecha ? 'border-red-500' : ''}`}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    {formErrors.fecha && (
                      <p className="text-xs text-red-500">{formErrors.fecha}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado">
                      Estado <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.estado}
                      onValueChange={(value) => setFormData({ ...formData, estado: value })}
                    >
                      <SelectTrigger id="estado">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completada">Completada</SelectItem>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Productos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">
                    Productos <span className="text-red-500">*</span>
                  </h3>
                  <Button type="button" onClick={handleAgregarProducto} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Producto
                  </Button>
                </div>

                {formErrors.productos && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      {formErrors.productos}
                    </AlertDescription>
                  </Alert>
                )}

                {productos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    No hay productos agregados. Haz clic en "Agregar Producto" para comenzar.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {productos.map((producto, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2 space-y-2">
                              <Label>Producto</Label>
                              <Select
                                value={producto.id_producto}
                                onValueChange={(value) => handleProductoChange(index, 'id_producto', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un producto" />
                                </SelectTrigger>
                                <SelectContent>
                                  {mockProductos.map((prod) => (
                                    <SelectItem key={prod.id_producto} value={prod.id_producto.toString()}>
                                      {prod.nombre}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Cantidad</Label>
                              <Input
                                type="number"
                                min="1"
                                value={producto.cantidad}
                                onChange={(e) => handleProductoChange(index, 'cantidad', parseInt(e.target.value) || 0)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Precio Unit.</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={producto.precio_unitario}
                                onChange={(e) => handleProductoChange(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                              Subtotal: <span className="font-medium text-blue-600">
                                {formatCOP(producto.cantidad * producto.precio_unitario)}
                              </span>
                            </p>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleEliminarProducto(index)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              {productos.length > 0 && (
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between items-center py-3 border-t-2 border-blue-600">
                      <span className="font-semibold text-lg">Total:</span>
                      <span className="font-bold text-2xl text-blue-600">
                        {formatCOP(calcularTotal())}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewCompraDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Registrar Compra
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Compra */}
      <Dialog open={editCompraDialogOpen} onOpenChange={setEditCompraDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Compra #{editingCompra?.id_compra}</DialogTitle>
            <DialogDescription>
              Actualiza la información de la compra
            </DialogDescription>
          </DialogHeader>
          

          
          <form onSubmit={handleUpdateCompra}>
            <div className="space-y-6 py-4">
              {/* ID no editable */}
              <div className="space-y-2">
                <Label>ID de la Compra</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">#{editingCompra?.id_compra}</p>
                </div>
              </div>

              {/* Información General */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Información General</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_proveedor">
                      Proveedor <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.id_proveedor}
                      onValueChange={(value) => {
                        setFormData({ ...formData, id_proveedor: value });
                        if (formErrors.proveedor) {
                          setFormErrors({ ...formErrors, proveedor: '' });
                        }
                      }}
                    >
                      <SelectTrigger id="edit_proveedor" className={formErrors.proveedor ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecciona un proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockProveedores.map((prov) => (
                          <SelectItem key={prov.id_proveedor} value={prov.id_proveedor.toString()}>
                            {prov.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.proveedor && (
                      <p className="text-xs text-red-500">{formErrors.proveedor}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_fecha">
                      Fecha <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="edit_fecha"
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => {
                          setFormData({ ...formData, fecha: e.target.value });
                          if (formErrors.fecha) {
                            setFormErrors({ ...formErrors, fecha: '' });
                          }
                        }}
                        className={`pl-10 ${formErrors.fecha ? 'border-red-500' : ''}`}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    {formErrors.fecha && (
                      <p className="text-xs text-red-500">{formErrors.fecha}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_estado">
                      Estado <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.estado}
                      onValueChange={(value) => setFormData({ ...formData, estado: value })}
                    >
                      <SelectTrigger id="edit_estado">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completada">Completada</SelectItem>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Productos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">
                    Productos <span className="text-red-500">*</span>
                  </h3>
                  <Button type="button" onClick={handleAgregarProducto} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Producto
                  </Button>
                </div>

                {formErrors.productos && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      {formErrors.productos}
                    </AlertDescription>
                  </Alert>
                )}

                {productos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    No hay productos agregados. Haz clic en "Agregar Producto" para comenzar.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {productos.map((producto, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2 space-y-2">
                              <Label>Producto</Label>
                              <Select
                                value={producto.id_producto}
                                onValueChange={(value) => handleProductoChange(index, 'id_producto', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un producto" />
                                </SelectTrigger>
                                <SelectContent>
                                  {mockProductos.map((prod) => (
                                    <SelectItem key={prod.id_producto} value={prod.id_producto.toString()}>
                                      {prod.nombre}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Cantidad</Label>
                              <Input
                                type="number"
                                min="1"
                                value={producto.cantidad}
                                onChange={(e) => handleProductoChange(index, 'cantidad', parseInt(e.target.value) || 0)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Precio Unit.</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={producto.precio_unitario}
                                onChange={(e) => handleProductoChange(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                              Subtotal: <span className="font-medium text-blue-600">
                                {formatCOP(producto.cantidad * producto.precio_unitario)}
                              </span>
                            </p>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleEliminarProducto(index)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              {productos.length > 0 && (
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between items-center py-3 border-t-2 border-blue-600">
                      <span className="font-semibold text-lg">Total:</span>
                      <span className="font-bold text-2xl text-blue-600">
                        {formatCOP(calcularTotal())}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditCompraDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Actualizar Compra
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Anular Compra */}
      <AlertDialog open={anularDialogOpen} onOpenChange={setAnularDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular esta compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cambiará el estado de la compra a "Cancelada". 
              La compra #{compraToAnular?.id_compra} por un total de {formatCOP(compraToAnular?.total)} será anulada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAnularCompra} className="bg-destructive text-destructive-foreground">
              Anular Compra
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
