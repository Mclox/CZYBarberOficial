import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Plus, Pencil, Trash2, Truck, Search, Eye, FileDown, CheckCircle, XCircle } from 'lucide-react';
import { mockProveedores, Proveedor } from '../../shared/lib/mockData';
import { toast } from 'sonner';
import { exportProveedores } from '../../lib/moduleExports';
import { Pagination } from '../common/Pagination';


export function ProveedoresView() {
  const [proveedores, setProveedores] = useState<Proveedor[]>(mockProveedores);
  const [filteredProveedores, setFilteredProveedores] = useState<Proveedor[]>(mockProveedores);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const [viewingProveedor, setViewingProveedor] = useState<Proveedor | null>(null);
  const [proveedorToDelete, setProveedorToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    nombre: '',
    nit: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    const filtered = proveedores.filter(proveedor => {
      const idProveedor = proveedor.id_proveedor.toString();
      const nit = (proveedor.nit || '').toLowerCase();
      const direccion = (proveedor.direccion || '').toLowerCase();
      
      return proveedor.nombre.toLowerCase().includes(term) ||
             idProveedor.includes(term) ||
             proveedor.contacto?.toLowerCase().includes(term) ||
             proveedor.email?.toLowerCase().includes(term) ||
             proveedor.telefono?.toLowerCase().includes(term) ||
             nit.includes(term) ||
             direccion.includes(term);
    });
    setFilteredProveedores(filtered);
  };

  const handleExport = () => {
    exportProveedores(proveedores);
  };

  const handleCreate = () => {
    setEditingProveedor(null);
    setFormData({ nombre: '', nit: '', contacto: '', telefono: '', email: '', direccion: '' });
    setDialogOpen(true);
  };

  const handleEdit = (proveedor: Proveedor) => {
    setEditingProveedor(proveedor);
    setFormData({
      nombre: proveedor.nombre,
      nit: proveedor.nit || '',
      contacto: proveedor.contacto || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      direccion: proveedor.direccion || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setProveedorToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (proveedorToDelete) {
      const updatedProveedores = proveedores.filter(p => p.id_proveedor !== proveedorToDelete);
      setProveedores(updatedProveedores);
      setFilteredProveedores(updatedProveedores.filter(p => {
        const term = searchTerm.toLowerCase();
        return p.nombre.toLowerCase().includes(term) ||
               p.contacto?.toLowerCase().includes(term) ||
               p.email?.toLowerCase().includes(term) ||
               p.telefono?.toLowerCase().includes(term);
      }));
      toast.success('Proveedor eliminado correctamente');
    }
    setDeleteDialogOpen(false);
    setProveedorToDelete(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProveedor) {
      const updatedProveedores = proveedores.map(p =>
        p.id_proveedor === editingProveedor.id_proveedor ? { ...p, ...formData } : p
      );
      setProveedores(updatedProveedores);
      setFilteredProveedores(updatedProveedores.filter(p => {
        const term = searchTerm.toLowerCase();
        return p.nombre.toLowerCase().includes(term) ||
               p.contacto?.toLowerCase().includes(term) ||
               p.email?.toLowerCase().includes(term) ||
               p.telefono?.toLowerCase().includes(term);
      }));
      toast.success('Proveedor actualizado correctamente');
    } else {
      const newProveedor: Proveedor = {
        id_proveedor: Math.max(...proveedores.map(p => p.id_proveedor)) + 1,
        ...formData,
      };
      const updatedProveedores = [...proveedores, newProveedor];
      setProveedores(updatedProveedores);
      setFilteredProveedores(updatedProveedores.filter(p => {
        const term = searchTerm.toLowerCase();
        return p.nombre.toLowerCase().includes(term) ||
               p.contacto?.toLowerCase().includes(term) ||
               p.email?.toLowerCase().includes(term) ||
               p.telefono?.toLowerCase().includes(term);
      }));
      toast.success('Proveedor creado correctamente');
    }

    setDialogOpen(false);
  };

  const handleView = (proveedor: Proveedor) => {
    setViewingProveedor(proveedor);
    setDetailsDialogOpen(true);
  };

  const handleToggleEstado = (proveedor: Proveedor) => {
    const nuevoEstado = proveedor.estado === 'activo' ? 'inactivo' : 'activo';
    setProveedores(proveedores.map(p =>
      p.id_proveedor === proveedor.id_proveedor
        ? { ...p, estado: nuevoEstado }
        : p
    ));
    setFilteredProveedores(filteredProveedores.map(p =>
      p.id_proveedor === proveedor.id_proveedor
        ? { ...p, estado: nuevoEstado }
        : p
    ));
    toast.success(`Proveedor ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`, {
      style: { background: '#10b981', color: '#fff' }
    });
  };

  // Paginación
  const totalPages = Math.ceil(filteredProveedores.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProveedores.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Truck className="w-6 h-6" />
            Proveedores
          </h1>
          <p className="text-muted-foreground">Gestiona los proveedores del sistema</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proveedor
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
            <CardTitle>Lista de Proveedores</CardTitle>
            <div className="w-full md:w-96">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar proveedores..."
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
                  <TableHead>Nombre</TableHead>
                  <TableHead>NIT</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((proveedor) => (
                  <TableRow key={proveedor.id_proveedor}>
                    <TableCell>{proveedor.nombre}</TableCell>
                    <TableCell>{proveedor.nit || '-'}</TableCell>
                    <TableCell>{proveedor.contacto || '-'}</TableCell>
                    <TableCell>{proveedor.telefono || '-'}</TableCell>
                    <TableCell>{proveedor.email || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(proveedor)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(proveedor.id_proveedor)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleView(proveedor)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleEstado(proveedor)}
                          className={proveedor.estado === 'activo' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
                        >
                          {proveedor.estado === 'activo' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
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
              totalItems={filteredProveedores.length}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
            <DialogDescription>
              {editingProveedor ? 'Actualiza la información del proveedor' : 'Agrega un nuevo proveedor al sistema'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nit">NIT *</Label>
                <Input id="nit" value={formData.nit} onChange={(e) => setFormData({ ...formData, nit: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contacto">Contacto</Label>
                <Input id="contacto" value={formData.contacto} onChange={(e) => setFormData({ ...formData, contacto: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input 
                  id="telefono" 
                  type="tel"
                  value={formData.telefono} 
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                  required 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input id="direccion" value={formData.direccion} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Proveedor</DialogTitle>
            <DialogDescription>
              Información detallada del proveedor seleccionado
            </DialogDescription>
          </DialogHeader>
          {viewingProveedor && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" value={viewingProveedor.nombre} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nit">NIT</Label>
                <Input id="nit" value={viewingProveedor.nit || ''} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contacto">Contacto</Label>
                <Input id="contacto" value={viewingProveedor.contacto || ''} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" value={viewingProveedor.telefono || ''} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={viewingProveedor.email || ''} readOnly />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input id="direccion" value={viewingProveedor.direccion || ''} readOnly />
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
