import { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Plus, Pencil, Trash2, Users, Eye, EyeOff } from 'lucide-react';
import { mockUsuarios, mockRoles, Usuario } from '../../lib/mockData';
import { ITEMS_PER_PAGE } from '../../lib/constants';
import { toast } from 'sonner';
import { SearchBar } from '../common/SearchBar';
import { Pagination } from '../common/Pagination';

export function UsuariosView() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(mockUsuarios);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [viewingUsuario, setViewingUsuario] = useState<Usuario | null>(null);
  const [usuarioToDelete, setUsuarioToDelete] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    id_rol: '',
    estado: 'activo' as 'activo' | 'inactivo',
  });

  // Helper function to get role name
  const getRoleName = (id_rol: number) => {
    return mockRoles.find(r => r.id_rol === id_rol)?.nombre || 'N/A';
  };

  // Filtrar usuarios por término de búsqueda
  const filteredUsuarios = useMemo(() => {
    if (!searchTerm.trim()) return usuarios;

    const lowerSearch = searchTerm.toLowerCase();
    return usuarios.filter((usuario) => {
      const nombre = usuario.nombre.toLowerCase();
      const email = usuario.email.toLowerCase();
      const telefono = (usuario.telefono || '').toLowerCase();
      const roleName = getRoleName(usuario.id_rol).toLowerCase();
      const estado = usuario.estado.toLowerCase();
      
      return (
        nombre.includes(lowerSearch) ||
        email.includes(lowerSearch) ||
        telefono.includes(lowerSearch) ||
        roleName.includes(lowerSearch) ||
        estado.includes(lowerSearch)
      );
    });
  }, [usuarios, searchTerm]);

  const handleCreate = () => {
    setEditingUsuario(null);
    setShowPassword(false);
    setFormData({ nombre: '', email: '', confirmEmail: '', password: '', confirmPassword: '', telefono: '', id_rol: '', estado: 'activo' });
    setDialogOpen(true);
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setShowPassword(false);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      confirmEmail: usuario.email,
      password: '',
      confirmPassword: '',
      telefono: usuario.telefono || '',
      id_rol: usuario.id_rol.toString(),
      estado: usuario.estado,
    });
    setDialogOpen(true);
  };

  const handleView = (usuario: Usuario) => {
    setViewingUsuario(usuario);
    setDetailsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setUsuarioToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (usuarioToDelete) {
      setUsuarios(usuarios.filter(u => u.id_usuario !== usuarioToDelete));
      toast.success('Usuario eliminado correctamente');
    }
    setDeleteDialogOpen(false);
    setUsuarioToDelete(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que el nombre no contenga caracteres especiales como '@'
    const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!nombreRegex.test(formData.nombre)) {
      toast.error('Error de validación', {
        description: 'El nombre solo puede contener letras y espacios, sin caracteres especiales como @, #, $, etc.',
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    // Validar que todos los campos obligatorios estén completos
    if (!formData.nombre.trim() || !formData.email.trim() || !formData.confirmEmail.trim() || !formData.id_rol) {
      toast.error('Error de validación', {
        description: 'Todos los campos obligatorios deben estar completos',
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    // Validar que la contraseña sea obligatoria solo al crear un nuevo usuario
    if (!editingUsuario && !formData.password.trim()) {
      toast.error('Error de validación', {
        description: 'La contraseña es obligatoria para crear un nuevo usuario',
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    // Validar confirmación de email
    if (formData.email !== formData.confirmEmail) {
      toast.error('Error de validación', {
        description: 'Los correos electrónicos no coinciden',
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Error de validación', {
        description: 'El formato del correo electrónico no es válido',
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    // Validar confirmación de contraseña (solo si se está ingresando una nueva)
    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Error de validación', {
          description: 'Las contraseñas no coinciden',
          style: { background: '#ef4444', color: '#fff' }
        });
        return;
      }

      // Validar longitud mínima de contraseña
      if (formData.password.length < 6) {
        toast.error('Error de validación', {
          description: 'La contraseña debe tener al menos 6 caracteres',
          style: { background: '#ef4444', color: '#fff' }
        });
        return;
      }
    }

    // Validar formato de teléfono si está presente
    if (formData.telefono.trim()) {
      const telefonoRegex = /^[0-9+\-\s()]+$/;
      if (!telefonoRegex.test(formData.telefono)) {
        toast.error('Error de validación', {
          description: 'El teléfono solo puede contener números y caracteres: + - ( )',
          style: { background: '#ef4444', color: '#fff' }
        });
        return;
      }
    }

    if (editingUsuario) {
      setUsuarios(usuarios.map(u =>
        u.id_usuario === editingUsuario.id_usuario
          ? { ...u, nombre: formData.nombre, email: formData.email, telefono: formData.telefono, id_rol: parseInt(formData.id_rol), estado: formData.estado, password: formData.password || u.password }
          : u
      ));
      toast.success('Usuario actualizado correctamente', {
        style: { background: '#10b981', color: '#fff' }
      });
    } else {
      const newUsuario: Usuario = {
        id_usuario: Math.max(...usuarios.map(u => u.id_usuario)) + 1,
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        id_rol: parseInt(formData.id_rol),
        estado: formData.estado,
        password: formData.password,
      };
      setUsuarios([...usuarios, newUsuario]);
      toast.success('Usuario creado correctamente', {
        style: { background: '#10b981', color: '#fff' }
      });
    }

    setDialogOpen(false);
  };

  const totalPages = Math.ceil(filteredUsuarios.length / ITEMS_PER_PAGE);
  const currentItems = filteredUsuarios.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-800">
            <Users className="w-6 h-6 text-blue-600" />
            Usuarios
          </h1>
          <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Lista de Usuarios</CardTitle>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por nombre, email, teléfono, rol o estado..."
              className="w-full md:w-96"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsuarios.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No se encontraron usuarios con ese criterio' : 'No hay usuarios registrados'}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((usuario) => (
                    <TableRow key={usuario.id_usuario}>
                      <TableCell>{usuario.id_usuario}</TableCell>
                      <TableCell>{usuario.nombre}</TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>{usuario.telefono || '-'}</TableCell>
                      <TableCell>{getRoleName(usuario.id_rol)}</TableCell>
                      <TableCell>
                        <Badge variant={usuario.estado === 'activo' ? 'default' : 'secondary'}>
                          {usuario.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(usuario)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(usuario.id_usuario)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleView(usuario)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              {filteredUsuarios.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={ITEMS_PER_PAGE}
                  totalItems={filteredUsuarios.length}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
            <DialogDescription>
              {editingUsuario ? 'Actualiza la información del usuario' : 'Crea un nuevo usuario en el sistema'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
                <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required placeholder="Ej: Juan Pérez" />
                <p className="text-xs text-muted-foreground">Solo letras y espacios</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required placeholder="correo@ejemplo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmEmail">Confirmar Email <span className="text-red-500">*</span></Label>
                <Input id="confirmEmail" type="email" value={formData.confirmEmail} onChange={(e) => setFormData({ ...formData, confirmEmail: e.target.value })} required placeholder="correo@ejemplo.com" />
                <p className="text-xs text-muted-foreground">Debe coincidir con el email</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} placeholder="Ej: +57 300 123 4567" />
                <p className="text-xs text-muted-foreground">Opcional</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="id_rol">Rol <span className="text-red-500">*</span></Label>
                <Select value={formData.id_rol} onValueChange={(value) => setFormData({ ...formData, id_rol: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockRoles.map((rol) => (
                      <SelectItem key={rol.id_rol} value={rol.id_rol.toString()}>{rol.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña {editingUsuario ? '(opcional para editar)' : <span className="text-red-500">*</span>}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUsuario}
                    className="pr-10"
                    placeholder={editingUsuario ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-blue-50"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                  </Button>
                </div>
                {!editingUsuario && <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña {editingUsuario ? '(opcional para editar)' : <span className="text-red-500">*</span>}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required={!editingUsuario}
                    className="pr-10"
                    placeholder="Confirmar contraseña"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-blue-50"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                  </Button>
                </div>
                {!editingUsuario && <p className="text-xs text-muted-foreground">Debe coincidir con la contraseña</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado <span className="text-red-500">*</span></Label>
                <Select value={formData.estado} onValueChange={(value: 'activo' | 'inactivo') => setFormData({ ...formData, estado: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="text-sm text-muted-foreground mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
              <p><span className="text-red-500">*</span> Campos obligatorios</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">{editingUsuario ? 'Actualizar' : 'Crear'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. El usuario será eliminado permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
            <DialogDescription>
              Información detallada del usuario seleccionado
            </DialogDescription>
          </DialogHeader>
          {viewingUsuario && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>ID</Label>
                <Input value={viewingUsuario.id_usuario} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={viewingUsuario.nombre} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={viewingUsuario.email} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={viewingUsuario.telefono || '-'} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Input value={getRoleName(viewingUsuario.id_rol)} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Badge variant={viewingUsuario.estado === 'activo' ? 'default' : 'secondary'}>
                  {viewingUsuario.estado}
                </Badge>
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
