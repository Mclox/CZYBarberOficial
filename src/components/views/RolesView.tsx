import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Plus, Pencil, Trash2, Shield, Eye, Power, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { mockRoles, Role } from '../../lib/mockData';
import { ITEMS_PER_PAGE } from '../../lib/constants';
import { toast } from 'sonner';
import { Pagination } from '../common/Pagination';
import { SearchBar } from '../common/SearchBar';

export function RolesView() {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    estado: 'activo' as 'activo' | 'inactivo',
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleCreate = () => {
    setEditingRole(null);
    setFormData({ nombre: '', descripcion: '', estado: 'activo' });
    setDialogOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      nombre: role.nombre,
      descripcion: role.descripcion || '',
      estado: role.estado as 'activo' | 'inactivo',
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setRoleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (roleToDelete) {
      setRoles(roles.filter(r => r.id_rol !== roleToDelete));
      toast.success('Rol eliminado correctamente', {
        style: { background: '#10b981', color: '#fff' }
      });
    }
    setDeleteDialogOpen(false);
    setRoleToDelete(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que el nombre no comience con caracteres especiales
    const primerCaracter = formData.nombre.trim().charAt(0);
    const nombreStartsWithSpecialChar = /^[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(formData.nombre.trim());
    
    if (nombreStartsWithSpecialChar) {
      toast.error('Error de validación', {
        description: 'El nombre del rol no puede comenzar con caracteres especiales, números o espacios. Debe comenzar con una letra.',
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    // Validar que el nombre no esté vacío
    if (!formData.nombre.trim()) {
      toast.error('Error de validación', {
        description: 'El nombre del rol es obligatorio',
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    if (editingRole) {
      setRoles(roles.map(r =>
        r.id_rol === editingRole.id_rol
          ? { ...r, ...formData }
          : r
      ));
      toast.success('Rol actualizado correctamente', {
        style: { background: '#10b981', color: '#fff' }
      });
    } else {
      const newRole: Role = {
        id_rol: Math.max(...roles.map(r => r.id_rol)) + 1,
        ...formData,
        estado: formData.estado,
      };
      setRoles([...roles, newRole]);
      toast.success('Rol creado correctamente', {
        style: { background: '#10b981', color: '#fff' }
      });
    }

    setDialogOpen(false);
  };

  const handleToggleEstado = (role: Role) => {
    const newEstado = role.estado === 'activo' ? 'inactivo' : 'activo';
    setRoles(roles.map(r =>
      r.id_rol === role.id_rol
        ? { ...r, estado: newEstado }
        : r
    ));
    toast.success(
      `Rol ${newEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`,
      {
        style: { background: '#10b981', color: '#fff' }
      }
    );
  };

  const handleDetail = (role: Role) => {
    setSelectedRole(role);
    setDetailDialogOpen(true);
  };

  const filteredRoles = roles.filter(role =>
    role.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPaginatedRoles = filteredRoles.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-800">
            <Shield className="w-6 h-6 text-blue-600" />
            Roles
          </h1>
          <p className="text-muted-foreground">
            Gestiona los roles y permisos del sistema
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Rol
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPaginatedRoles.map((role) => (
                  <TableRow key={role.id_rol}>
                    <TableCell>{role.id_rol}</TableCell>
                    <TableCell>{role.nombre}</TableCell>
                    <TableCell>{role.descripcion || '-'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={role.estado === 'activo' ? 'default' : 'secondary'}
                        className={role.estado === 'activo' ? 'bg-green-600' : 'bg-gray-600'}
                      >
                        {role.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDetail(role)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Ver detalles
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleEstado(role)}
                                className={role.estado === 'activo' ? 'hover:bg-red-50 hover:border-red-200' : 'hover:bg-green-50 hover:border-green-200'}
                              >
                                <Power className={`w-4 h-4 ${role.estado === 'activo' ? 'text-red-600' : 'text-green-600'}`} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {role.estado === 'activo' ? 'Desactivar rol' : 'Activar rol'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(role)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Editar rol
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(role.id_rol)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Eliminar rol
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Paginador Personalizado */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground px-2">
                  Página
                </span>
                <span className="text-sm font-medium px-2 py-1 bg-blue-600 text-white rounded">
                  {currentPage}
                </span>
                <span className="text-sm text-muted-foreground px-2">
                  de {totalPages || 1}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Mostrando {filteredRoles.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredRoles.length)} de {filteredRoles.length} registros
              </span>
            </div>

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
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
            </DialogTitle>
            <DialogDescription>
              {editingRole ? 'Actualiza la información del rol' : 'Crea un nuevo rol en el sistema'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  required
                  placeholder="Ej: Administrador, Vendedor, Gerente..."
                />
                <p className="text-xs text-muted-foreground">Debe comenzar con una letra</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  rows={3}
                  placeholder="Describe las responsabilidades y permisos de este rol..."
                />
                <p className="text-xs text-muted-foreground">Opcional</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => setFormData({ ...formData, estado: value as 'activo' | 'inactivo' })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Los roles inactivos no podrán ser asignados a usuarios
                </p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
              <p><span className="text-red-500">*</span> Campos obligatorios</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                {editingRole ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El rol será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Detalles del Rol
            </DialogTitle>
            <DialogDescription>
              Información detallada del rol seleccionado
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={selectedRole.nombre}
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={selectedRole.descripcion || ''}
                  readOnly
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Badge 
                  variant={selectedRole.estado === 'activo' ? 'default' : 'secondary'}
                  className={selectedRole.estado === 'activo' ? 'bg-green-600' : 'bg-gray-600'}
                >
                  {selectedRole.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
