import { useState, useMemo, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Pencil, Trash2, Scissors, Search, CheckCircle, XCircle, Eye, Clock, DollarSign, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from '../common/Pagination';
import { SearchBar } from '../common/SearchBar';
import { useAuth } from '../../features/auth';
import { fetchApi } from '../../lib/api'; // Conexión a la API real

export function ServiciosView() {
  const { user } = useAuth();
  const isCliente = user?.id_rol === 3 || user?.rol === 'Cliente';
  const isAdmin = user?.id_rol === 1 || user?.rol === 'Administrador';

  const [servicios, setServicios] = useState<any[]>([]); // Array vacío para la BD
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [editingServicio, setEditingServicio] = useState<any | null>(null);
  const [viewingServicio, setViewingServicio] = useState<any | null>(null);
  const [servicioToDelete, setServicioToDelete] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio_neto: '',
    duracion_minutos: '',
    estado: 'Activo', // Asumimos estado por defecto para UI
  });

  // --- 1. LEER (GET): Obtener servicios de la Base de Datos ---
  const fetchServicios = async () => {
    setLoading(true);
    try {
      const response = await fetchApi('/services');
      if (response.success) {
        setServicios(response.data);
      }
    } catch (error: any) {
      toast.error('Error al cargar los servicios desde la base de datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicios();
  }, []);

  // --- BÚSQUEDA ---
  const filteredServicios = useMemo(() => {
    if (!searchTerm.trim()) return servicios;

    const lowerSearch = searchTerm.toLowerCase();
    return servicios.filter((servicio) => {
      const nombre = (servicio.nombre || '').toLowerCase();
      const descripcion = (servicio.descripcion || '').toLowerCase();

      return (
        nombre.includes(lowerSearch) ||
        descripcion.includes(lowerSearch)
      );
    });
  }, [servicios, searchTerm]);

  // --- CONTROLADORES DE MODALES ---
  const handleCreate = () => {
    setEditingServicio(null);
    setFormData({ nombre: '', descripcion: '', precio_neto: '', duracion_minutos: '', estado: 'Activo' });
    setDialogOpen(true);
  };

  const handleEdit = (servicio: any) => {
    setEditingServicio(servicio);
    setFormData({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion || '',
      precio_neto: servicio.precio_neto.toString(),
      duracion_minutos: servicio.duracion_minutos.toString(),
      estado: servicio.estado || 'Activo',
    });
    setDialogOpen(true);
  };

  const handleView = (servicio: any) => {
    setViewingServicio(servicio);
    setDetailsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setServicioToDelete(id);
    setDeleteDialogOpen(true);
  };

  // --- 2. ELIMINAR (DELETE) ---
  const confirmDelete = async () => {
    if (servicioToDelete) {
      try {
        await fetchApi(`/services/${servicioToDelete}`, { method: 'DELETE' });
        toast.success('Servicio eliminado correctamente');
        fetchServicios();
      } catch (error: any) {
        toast.error(error.message || 'Error al eliminar. Verifica que no tenga citas o ventas asociadas.');
      }
    }
    setDeleteDialogOpen(false);
    setServicioToDelete(null);
  };

  // --- 3. CREAR Y ACTUALIZAR (POST / PUT) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast.error('El nombre del servicio es obligatorio');
      return;
    }

    const precio = parseFloat(formData.precio_neto);
    if (isNaN(precio) || precio <= 0) {
      toast.error('El precio debe ser un valor válido mayor a 0');
      return;
    }

    const duracion = parseInt(formData.duracion_minutos);
    if (isNaN(duracion) || duracion <= 0) {
      toast.error('La duración debe ser un número entero mayor a 0');
      return;
    }

    const payload = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precio_neto: precio,
      duracion_minutos: duracion,
      iva_porcentaje: 0.00 // Asumimos 0% por defecto para servicios según tu DB
    };

    try {
      if (editingServicio) {
        await fetchApi(`/services/${editingServicio.id_servicio}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        toast.success('Servicio actualizado correctamente');
      } else {
        await fetchApi('/services', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        toast.success('Servicio creado correctamente');
      }
      setDialogOpen(false);
      fetchServicios();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el servicio');
    }
  };

  // --- CAMBIO RÁPIDO DE ESTADO (Solo UI por ahora si DB no tiene la columna) ---
  const handleToggleEstado = (servicio: any) => {
    // Como tu tabla original de Servicios en BD no tiene campo estado, lo simularemos aquí
    // o podrías agregar el UPDATE en el backend si en el futuro le agregas la columna estado.
    toast.info('Para cambiar el estado necesitas agregar la columna "estado" a la tabla Servicios en la BD.', {
      icon: <XCircle className="w-4 h-4 text-blue-500" />
    });
  };

  const totalPages = Math.ceil(filteredServicios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredServicios.slice(startIndex, endIndex);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Scissors className="w-6 h-6" />
            Servicios
          </h1>
          <p className="text-muted-foreground">
            {isCliente ? 'Consulta nuestro catálogo de servicios' : 'Gestiona los servicios ofrecidos'}
          </p>
        </div>
        {!isCliente && isAdmin && (
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Servicio
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Lista de Servicios</CardTitle>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por nombre o descripción..."
              className="w-full md:w-96"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando base de datos...</div>
          ) : filteredServicios.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron servicios registrados.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Duración (min)</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((servicio) => (
                    <TableRow key={servicio.id_servicio}>
                      <TableCell className="font-medium">{servicio.nombre}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {servicio.descripcion || '-'}
                      </TableCell>
                      <TableCell className="font-semibold text-green-700">
                        ${servicio.precio_neto ? servicio.precio_neto.toFixed(2) : '0.00'}
                      </TableCell>
                      <TableCell>{servicio.duracion_minutos || '-'} min</TableCell>
                      <TableCell>
                        <Badge className="bg-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Activo
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleView(servicio)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!isCliente && isAdmin && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleEdit(servicio)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(servicio.id_servicio)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredServicios.length > itemsPerPage && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredServicios.length}
                  />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="itemsPerPage" className="text-sm text-muted-foreground">Mostrar:</Label>
                    <Select value={itemsPerPage.toString()} onValueChange={(val) => { setItemsPerPage(parseInt(val)); setCurrentPage(1); }}>
                      <SelectTrigger className="w-[80px] h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL CREAR / EDITAR */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingServicio ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
            <DialogDescription>
              {editingServicio ? 'Modifica los datos del servicio en la base de datos.' : 'Ingresa los detalles para registrar un nuevo servicio.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Servicio <span className="text-red-500">*</span></Label>
                <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej: Corte Clásico" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precio">Precio Neto <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="precio" type="number" step="0.01" min="0" value={formData.precio_neto} onChange={(e) => setFormData({ ...formData, precio_neto: e.target.value })} className="pl-8" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duracion">Duración (min) <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="duracion" type="number" min="1" value={formData.duracion_minutos} onChange={(e) => setFormData({ ...formData, duracion_minutos: e.target.value })} className="pl-8" required />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción (Opcional)</Label>
                <Textarea id="descripcion" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} rows={3} placeholder="Detalles del servicio..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#D4AF37] hover:bg-[#B8941F] text-black">
                {editingServicio ? 'Actualizar BD' : 'Guardar BD'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL ELIMINAR */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Servicio?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción borrará el servicio de la base de datos permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL DETALLES */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-[#D4AF37]" />
              Detalles del Servicio
            </DialogTitle>
          </DialogHeader>
          {viewingServicio && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <h3 className="font-bold text-lg mb-1">{viewingServicio.nombre}</h3>
                <p className="text-sm text-muted-foreground">{viewingServicio.descripcion || 'Sin descripción'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">ID Servicio</Label>
                  <p className="font-semibold">#{viewingServicio.id_servicio}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Precio Neto</Label>
                  <p className="font-bold text-green-600">${viewingServicio.precio_neto?.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Duración</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {viewingServicio.duracion_minutos} minutos
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Estado</Label>
                  <p><Badge className="bg-green-600">Activo</Badge></p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDetailsDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}