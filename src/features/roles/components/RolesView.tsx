import { useState, useMemo, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { Checkbox } from '../../../components/ui/checkbox';
import { Badge } from '../../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Plus, Pencil, Trash2, Shield, Eye, Search, Power } from 'lucide-react';
import { Permiso } from '../../../shared/lib/mockData';
import { toast } from 'sonner';
import { SearchBar } from '../../../components/common/SearchBar';
import { Pagination } from '../../../components/common/Pagination';
import { fetchApi } from '../../../lib/api'; // Conexión a la API real

const MODULOS = [
  'Roles',
  'Usuarios',
  'Productos',
  'Proveedores',
  'Compras',
  'DetalleCompras',
  'Devoluciones',
  'DevolucionesProveedor',
  'Consignaciones',
  'Servicios',
  'Citas',
  'Empleados',
  'Clientes',
  'Pagos',
  'Ventas',
  'VentasDetalle',
];

export function RolesView() {
  const [roles, setRoles] = useState<any[]>([]); // Array vacío, conectaremos a la BD
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);
  const [viewingRole, setViewingRole] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    estado: 'Activo', // Ajustado a mayúscula para coincidir con BD
  });
  const [permissions, setPermissions] = useState<Permiso[]>([]);

  // --- 1. CARGAR DATOS DE LA BD (GET) ---
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await fetchApi('/roles');
      if (response.success) {
        setRoles(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar los roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleCreate = () => {
    setEditingRole(null);
    setFormData({ nombre: '', descripcion: '', estado: 'Activo' });
    // Initialize permissions with all modules set to false
    setPermissions(MODULOS.map(modulo => ({
      modulo,
      crear: false,
      leer: false,
      actualizar: false,
      eliminar: false,
    })));
    setDialogOpen(true);
  };

  const handleEdit = (role: any) => {
    setEditingRole(role);
    setFormData({
      nombre: role.nombre,
      descripcion: role.descripcion || '',
      estado: role.nombre.toLowerCase() === 'administrador' || role.nombre.toLowerCase() === 'admin' ? 'Activo' : role.estado || 'Activo',
    });
    // Ensure all modules are present in permissions
    const rolePermissions = role.permisos || [];
    const fullPermissions = MODULOS.map(modulo => {
      const existing = rolePermissions.find((p: any) => p.modulo === modulo);
      return existing || {
        modulo,
        crear: false,
        leer: false,
        actualizar: false,
        eliminar: false,
      };
    });
    setPermissions(fullPermissions);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setRoleToDelete(id);
    setDeleteDialogOpen(true);
  };

  // --- 2. ELIMINAR (DELETE) ---
  const confirmDelete = async () => {
    if (roleToDelete) {
      try {
        await fetchApi(`/roles/${roleToDelete}`, { method: 'DELETE' });
        toast.success('Rol eliminado correctamente');
        fetchRoles(); // Recargar la tabla
      } catch (error: any) {
        toast.error(error.message || 'Error al eliminar el rol. Puede estar en uso.');
      }
    }
    setDeleteDialogOpen(false);
    setRoleToDelete(null);
  };

  // --- 3. CAMBIAR ESTADO RÁPIDO (PUT) ---
  const handleToggleEstado = async (role: any) => {
    // No permitir cambiar estado del rol Admin
    if (role.nombre.toLowerCase() === 'administrador' || role.nombre.toLowerCase() === 'admin') {
      toast.error('No se puede modificar el estado del rol Administrador', {
        description: 'Este rol siempre debe permanecer activo para mantener la integridad del sistema',
      });
      return;
    }

    const newEstado = role.estado === 'Activo' ? 'Inactivo' : 'Activo';
    try {
      await fetchApi(`/roles/${role.id_rol}`, {
        method: 'PUT',
        body: JSON.stringify({ ...role, estado: newEstado })
      });
      toast.success(`Rol ${newEstado} correctamente`);
      fetchRoles();
    } catch (error: any) {
      toast.error('Error al cambiar el estado del rol');
    }
  };

  // --- 4. GUARDAR / CREAR (POST/PUT) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que el nombre no comience con caracteres especiales
    const nombreStartsWithSpecialChar = /^[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(formData.nombre.trim());
    if (nombreStartsWithSpecialChar) {
      toast.error('Error de validación', {
        description: 'El nombre del rol no puede comenzar con caracteres especiales o números.',
      });
      return;
    }

    if (!formData.nombre.trim()) {
      toast.error('El nombre del rol es obligatorio');
      return;
    }

    // Preparamos el payload incluyendo los permisos
    const payload = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      estado: formData.estado,
      permisos: permissions
    };

    try {
      if (editingRole) {
        await fetchApi(`/roles/${editingRole.id_rol}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        toast.success('Rol actualizado correctamente');
      } else {
        await fetchApi('/roles', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        toast.success('Rol creado correctamente');
      }
      setDialogOpen(false);
      fetchRoles(); // Recargamos datos de la BD
    } catch (error: any) {
      toast.error(error.message || 'Error guardando el rol');
    }
  };

  const updatePermission = (modulo: string, tipo: 'crear' | 'leer' | 'actualizar' | 'eliminar', value: boolean) => {
    setPermissions(permissions.map(p =>
      p.modulo === modulo ? { ...p, [tipo]: value } : p
    ));
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      const lowerSearch = searchTerm.toLowerCase();
      const id = role.id_rol.toString();
      const nombre = role.nombre.toLowerCase();
      const descripcion = (role.descripcion || '').toLowerCase();
      const estado = (role.estado || 'Activo').toLowerCase();
      
      return (
        id.includes(lowerSearch) ||
        nombre.includes(lowerSearch) ||
        descripcion.includes(lowerSearch) ||
        estado.includes(lowerSearch)
      );
    });
  }, [roles, searchTerm]);

  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const currentRoles = filteredRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewDetails = (role: any) => {
    // Normalizar permisos para que no falte ninguno en la vista visual
    const rolePermissions = role.permisos || [];
    const fullPermissions = MODULOS.map(modulo => {
      const existing = rolePermissions.find((p: any) => p.modulo === modulo);
      return existing || {
        modulo,
        crear: false,
        leer: false,
        actualizar: false,
        eliminar: false,
      };
    });
    setViewingRole({ ...role, permisos: fullPermissions });
    setDetailsDialogOpen(true);
  };

  const canDeleteRole = (roleName: string) => {
    return roleName.toLowerCase() !== 'admin' && roleName.toLowerCase() !== 'administrador';
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Roles
          </h1>
          <p className="text-muted-foreground">
            Gestiona los roles y permisos del sistema
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Rol
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por ID, nombre, descripción o estado..."
            />
          </div>

          {loading ? (
             <div className="text-center py-8 text-muted-foreground">Cargando roles desde la base de datos...</div>
          ) : (
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
                  {currentRoles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No se encontraron roles
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentRoles.map((role) => (
                      <TableRow key={role.id_rol}>
                        <TableCell>{role.id_rol}</TableCell>
                        <TableCell className="font-medium">{role.nombre}</TableCell>
                        <TableCell>{role.descripcion || '-'}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={role.estado === 'Activo' ? 'default' : 'secondary'}
                            className={role.estado === 'Activo' ? 'bg-green-600' : 'bg-gray-600'}
                          >
                            {role.estado || 'Activo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(role)}
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleEstado(role)}
                              className={role.estado === 'Activo' ? 'hover:bg-red-50 hover:border-red-200' : 'hover:bg-green-50 hover:border-green-200'}
                              title={role.estado === 'Activo' ? 'Desactivar rol' : 'Activar rol'}
                            >
                              <Power className={`w-4 h-4 ${role.estado === 'Activo' ? 'text-red-600' : 'text-green-600'}`} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(role)}
                              title="Editar rol"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {canDeleteRole(role.nombre) ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(role.id_rol)}
                                title="Eliminar rol"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                                title="El rol Admin no se puede eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Paginación */}
          {filteredRoles.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredRoles.length}
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? 'Actualiza la información del rol y sus permisos'
                : 'Crea un nuevo rol y asigna sus permisos'}
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
                  rows={2}
                  placeholder="Describe las responsabilidades y permisos de este rol..."
                />
                <p className="text-xs text-muted-foreground">Opcional</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => setFormData({ ...formData, estado: value as 'Activo' | 'Inactivo' })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Los roles inactivos no podrán ser asignados a usuarios
                </p>
              </div>
              <div className="space-y-2">
                <Label>Permisos por Módulo</Label>
                <div className="rounded-md border overflow-x-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Módulo</TableHead>
                        <TableHead className="text-center w-[100px]">Crear</TableHead>
                        <TableHead className="text-center w-[100px]">Leer</TableHead>
                        <TableHead className="text-center w-[100px]">Actualizar</TableHead>
                        <TableHead className="text-center w-[100px]">Eliminar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permissions.map((permiso) => (
                        <TableRow key={permiso.modulo}>
                          <TableCell>{permiso.modulo}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={permiso.crear}
                                onCheckedChange={(checked) =>
                                  updatePermission(permiso.modulo, 'crear', checked as boolean)
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={permiso.leer}
                                onCheckedChange={(checked) =>
                                  updatePermission(permiso.modulo, 'leer', checked as boolean)
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={permiso.actualizar}
                                onCheckedChange={(checked) =>
                                  updatePermission(permiso.modulo, 'actualizar', checked as boolean)
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={permiso.eliminar}
                                onCheckedChange={(checked) =>
                                  updatePermission(permiso.modulo, 'eliminar', checked as boolean)
                                }
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground mb-4 p-3 bg-amber-50 rounded-md border border-amber-200">
              <p><span className="text-red-500">*</span> Campos obligatorios</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingRole ? 'Actualizar BD' : 'Crear en BD'}
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
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalles del Rol
            </DialogTitle>
            <DialogDescription>
              Información detallada del rol seleccionado
            </DialogDescription>
          </DialogHeader>
          {viewingRole && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={viewingRole.nombre}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={viewingRole.descripcion || ''}
                  readOnly
                  rows={2}
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Permisos por Módulo</Label>
                <div className="rounded-md border overflow-x-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Módulo</TableHead>
                        <TableHead className="text-center w-[100px]">Crear</TableHead>
                        <TableHead className="text-center w-[100px]">Leer</TableHead>
                        <TableHead className="text-center w-[100px]">Actualizar</TableHead>
                        <TableHead className="text-center w-[100px]">Eliminar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingRole.permisos.map((permiso: any) => (
                        <TableRow key={permiso.modulo}>
                          <TableCell>{permiso.modulo}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox checked={permiso.crear} disabled />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox checked={permiso.leer} disabled />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox checked={permiso.actualizar} disabled />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox checked={permiso.eliminar} disabled />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
