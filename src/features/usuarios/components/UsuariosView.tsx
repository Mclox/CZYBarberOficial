// import { useState, useMemo } from 'react';
// import { Button } from '../../../components/ui/button';
// import { Input } from '../../../components/ui/input';
// import { Label } from '../../../components/ui/label';
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
// import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
// import { Badge } from '../../../components/ui/badge';
// import { Plus, Pencil, Trash2, Users, Eye, EyeOff, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
// import { mockUsuarios, mockRoles, Usuario } from '../../../shared/lib/mockData';
// import { toast } from 'sonner';
// import { SearchBar } from '../../../components/common/SearchBar';
// import { Pagination } from '../../../components/common/Pagination';

// export function UsuariosView() {
//   const [usuarios, setUsuarios] = useState<Usuario[]>(mockUsuarios);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
//   const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
//   const [viewingUsuario, setViewingUsuario] = useState<Usuario | null>(null);
//   const [usuarioToDelete, setUsuarioToDelete] = useState<number | null>(null);
//   const [showPassword, setShowPassword] = useState(false);
//   const [formData, setFormData] = useState({
//     nombre: '',
//     email: '',
//     confirmEmail: '',
//     password: '',
//     confirmPassword: '',
//     telefono: '',
//     id_rol: '',
//     estado: 'activo' as 'activo' | 'inactivo',
//   });

//   // Helper function to get role name (moved before useMemo)
//   const getRoleName = (id_rol: number) => {
//     return mockRoles.find(r => r.id_rol === id_rol)?.nombre || 'N/A';
//   };

//   // Filtrar usuarios por término de búsqueda
//   const filteredUsuarios = useMemo(() => {
//     if (!searchTerm.trim()) return usuarios;

//     const lowerSearch = searchTerm.toLowerCase();
//     return usuarios.filter((usuario) => {
//       const nombre = usuario.nombre.toLowerCase();
//       const email = usuario.email.toLowerCase();
//       const telefono = (usuario.telefono || '').toLowerCase();
//       const roleName = getRoleName(usuario.id_rol).toLowerCase();
//       const estado = usuario.estado.toLowerCase();
      
//       return (
//         nombre.includes(lowerSearch) ||
//         email.includes(lowerSearch) ||
//         telefono.includes(lowerSearch) ||
//         roleName.includes(lowerSearch) ||
//         estado.includes(lowerSearch)
//       );
//     });
//   }, [usuarios, searchTerm]);

//   const handleCreate = () => {
//     setEditingUsuario(null);
//     setShowPassword(false);
//     setFormData({ nombre: '', email: '', confirmEmail: '', password: '', confirmPassword: '', telefono: '', id_rol: '', estado: 'activo' });
//     setDialogOpen(true);
//   };

//   const handleEdit = (usuario: Usuario) => {
//     setEditingUsuario(usuario);
//     setShowPassword(false);
//     setFormData({
//       nombre: usuario.nombre,
//       email: usuario.email,
//       confirmEmail: usuario.email,
//       password: '',
//       confirmPassword: '',
//       telefono: usuario.telefono || '',
//       id_rol: usuario.id_rol.toString(),
//       estado: usuario.estado,
//     });
//     setDialogOpen(true);
//   };

//   const handleDelete = (id: number) => {
//     setUsuarioToDelete(id);
//     setDeleteDialogOpen(true);
//   };

//   const confirmDelete = () => {
//     if (usuarioToDelete) {
//       setUsuarios(usuarios.filter(u => u.id_usuario !== usuarioToDelete));
//       toast.success('Usuario eliminado correctamente');
//     }
//     setDeleteDialogOpen(false);
//     setUsuarioToDelete(null);
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     // Validar que el nombre no contenga caracteres especiales como '@'
//     const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
//     if (!nombreRegex.test(formData.nombre)) {
//       toast.error('Error de validación', {
//         description: 'El nombre solo puede contener letras y espacios, sin caracteres especiales como @, #, $, etc.',
//         style: { background: '#ef4444', color: '#fff' }
//       });
//       return;
//     }

//     // Validar que todos los campos obligatorios estén completos
//     if (!formData.nombre.trim() || !formData.email.trim() || !formData.confirmEmail.trim() || !formData.id_rol) {
//       toast.error('Error de validación', {
//         description: 'Todos los campos obligatorios deben estar completos',
//         style: { background: '#ef4444', color: '#fff' }
//       });
//       return;
//     }

//     // Validar que la contraseña sea obligatoria solo al crear un nuevo usuario
//     if (!editingUsuario && !formData.password.trim()) {
//       toast.error('Error de validación', {
//         description: 'La contraseña es obligatoria para crear un nuevo usuario',
//         style: { background: '#ef4444', color: '#fff' }
//       });
//       return;
//     }

//     // Validar confirmación de email
//     if (formData.email !== formData.confirmEmail) {
//       toast.error('Error de validación', {
//         description: 'Los correos electrónicos no coinciden',
//         style: { background: '#ef4444', color: '#fff' }
//       });
//       return;
//     }

//     // Validar formato de email
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(formData.email)) {
//       toast.error('Error de validación', {
//         description: 'El formato del correo electrónico no es válido',
//         style: { background: '#ef4444', color: '#fff' }
//       });
//       return;
//     }

//     // Validar confirmación de contraseña (solo si se está ingresando una nueva)
//     if (formData.password || formData.confirmPassword) {
//       if (formData.password !== formData.confirmPassword) {
//         toast.error('Error de validación', {
//           description: 'Las contraseñas no coinciden',
//           style: { background: '#ef4444', color: '#fff' }
//         });
//         return;
//       }

//       // Validar longitud mínima de contraseña
//       if (formData.password.length < 6) {
//         toast.error('Error de validación', {
//           description: 'La contraseña debe tener al menos 6 caracteres',
//           style: { background: '#ef4444', color: '#fff' }
//         });
//         return;
//       }
//     }

//     // Validar formato de teléfono si está presente
//     if (formData.telefono.trim()) {
//       const telefonoRegex = /^[0-9+\-\s()]+$/;
//       if (!telefonoRegex.test(formData.telefono)) {
//         toast.error('Error de validación', {
//           description: 'El teléfono solo puede contener números y caracteres: + - ( )',
//           style: { background: '#ef4444', color: '#fff' }
//         });
//         return;
//       }
//     }

//     if (editingUsuario) {
//       setUsuarios(usuarios.map(u =>
//         u.id_usuario === editingUsuario.id_usuario
//           ? { ...u, nombre: formData.nombre, email: formData.email, telefono: formData.telefono, id_rol: parseInt(formData.id_rol), estado: formData.estado, password: formData.password || u.password }
//           : u
//       ));
//       toast.success('Usuario actualizado correctamente', {
//         style: { background: '#10b981', color: '#fff' }
//       });
//     } else {
//       const newUsuario: Usuario = {
//         id_usuario: Math.max(...usuarios.map(u => u.id_usuario)) + 1,
//         nombre: formData.nombre,
//         email: formData.email,
//         telefono: formData.telefono,
//         id_rol: parseInt(formData.id_rol),
//         estado: formData.estado,
//         password: formData.password,
//       };
//       setUsuarios([...usuarios, newUsuario]);
//       toast.success('Usuario creado correctamente', {
//         style: { background: '#10b981', color: '#fff' }
//       });
//     }

//     setDialogOpen(false);
//   };

//   const handleView = (usuario: Usuario) => {
//     setViewingUsuario(usuario);
//     setDetailsDialogOpen(true);
//   };

//   const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
//   const currentItems = filteredUsuarios.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

//   return (
//     <div className="p-4 md:p-8 space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="flex items-center gap-2">
//             <Users className="w-6 h-6" />
//             Usuarios
//           </h1>
//           <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
//         </div>
//         <Button onClick={handleCreate}>
//           <Plus className="w-4 h-4 mr-2" />
//           Nuevo Usuario
//         </Button>
//       </div>

//       <Card>
//         <CardHeader>
//           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//             <CardTitle>Lista de Usuarios</CardTitle>
//             <SearchBar
//               value={searchTerm}
//               onChange={setSearchTerm}
//               placeholder="Buscar por nombre, email, teléfono, rol o estado..."
//               className="w-full md:w-96"
//             />
//           </div>
//         </CardHeader>
//         <CardContent>
//           {filteredUsuarios.length === 0 ? (
//             <div className="text-center py-8 text-gray-500">
//               {searchTerm ? 'No se encontraron usuarios con ese criterio' : 'No hay usuarios registrados'}
//             </div>
//           ) : (
//             <div className="rounded-md border overflow-x-auto">
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>ID</TableHead>
//                     <TableHead>Nombre</TableHead>
//                     <TableHead>Email</TableHead>
//                     <TableHead>Teléfono</TableHead>
//                     <TableHead>Rol</TableHead>
//                     <TableHead>Estado</TableHead>
//                     <TableHead className="text-right">Acciones</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {currentItems.map((usuario) => (
//                   <TableRow key={usuario.id_usuario}>
//                     <TableCell>{usuario.id_usuario}</TableCell>
//                     <TableCell>{usuario.nombre}</TableCell>
//                     <TableCell>{usuario.email}</TableCell>
//                     <TableCell>{usuario.telefono || '-'}</TableCell>
//                     <TableCell>{getRoleName(usuario.id_rol)}</TableCell>
//                     <TableCell>
//                       <Badge variant={usuario.estado === 'activo' ? 'default' : 'secondary'}>
//                         {usuario.estado}
//                       </Badge>
//                     </TableCell>
//                     <TableCell className="text-right">
//                       <div className="flex justify-end gap-2">
//                         <Button variant="outline" size="sm" onClick={() => handleEdit(usuario)}>
//                           <Pencil className="w-4 h-4" />
//                         </Button>
//                         <Button variant="outline" size="sm" onClick={() => handleDelete(usuario.id_usuario)}>
//                           <Trash2 className="w-4 h-4" />
//                         </Button>
//                         <Button variant="outline" size="sm" onClick={() => handleView(usuario)}>
//                           <Eye className="w-4 h-4" />
//                         </Button>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//                 </TableBody>
//               </Table>
              
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
//                     Mostrando {filteredUsuarios.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredUsuarios.length)} de {filteredUsuarios.length} registros
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
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
//         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>{editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
//             <DialogDescription>
//               {editingUsuario ? 'Actualiza la información del usuario' : 'Crea un nuevo usuario en el sistema'}
//             </DialogDescription>
//           </DialogHeader>
//           <form onSubmit={handleSubmit}>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
//               <div className="space-y-2">
//                 <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
//                 <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required placeholder="Ej: Juan Pérez" />
//                 <p className="text-xs text-muted-foreground">Solo letras y espacios</p>
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
//                 <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required placeholder="correo@ejemplo.com" />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="confirmEmail">Confirmar Email <span className="text-red-500">*</span></Label>
//                 <Input id="confirmEmail" type="email" value={formData.confirmEmail} onChange={(e) => setFormData({ ...formData, confirmEmail: e.target.value })} required placeholder="correo@ejemplo.com" />
//                 <p className="text-xs text-muted-foreground">Debe coincidir con el email</p>
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="telefono">Teléfono</Label>
//                 <Input id="telefono" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} placeholder="Ej: +57 300 123 4567" />
//                 <p className="text-xs text-muted-foreground">Opcional</p>
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="id_rol">Rol <span className="text-red-500">*</span></Label>
//                 <Select value={formData.id_rol} onValueChange={(value) => setFormData({ ...formData, id_rol: value })}>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Selecciona un rol" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {mockRoles.filter(rol => rol.id_rol !== 1).map((rol) => (
//                       <SelectItem key={rol.id_rol} value={rol.id_rol.toString()}>{rol.nombre}</SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="password">Contraseña {editingUsuario ? '(opcional para editar)' : <span className="text-red-500">*</span>}</Label>
//                 <div className="relative">
//                   <Input
//                     id="password"
//                     type={showPassword ? 'text' : 'password'}
//                     value={formData.password}
//                     onChange={(e) => setFormData({ ...formData, password: e.target.value })}
//                     required={!editingUsuario}
//                     className="pr-10"
//                     placeholder={editingUsuario ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
//                   />
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-amber-50"
//                   >
//                     {showPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
//                   </Button>
//                 </div>
//                 {!editingUsuario && <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>}
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="confirmPassword">Confirmar Contraseña {editingUsuario ? '(opcional para editar)' : <span className="text-red-500">*</span>}</Label>
//                 <div className="relative">
//                   <Input
//                     id="confirmPassword"
//                     type={showPassword ? 'text' : 'password'}
//                     value={formData.confirmPassword}
//                     onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
//                     required={!editingUsuario}
//                     className="pr-10"
//                     placeholder="Confirmar contraseña"
//                   />
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-amber-50"
//                   >
//                     {showPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
//                   </Button>
//                 </div>
//                 {!editingUsuario && <p className="text-xs text-muted-foreground">Debe coincidir con la contraseña</p>}
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="estado">Estado <span className="text-red-500">*</span></Label>
//                 <Select value={formData.estado} onValueChange={(value: 'activo' | 'inactivo') => setFormData({ ...formData, estado: value })}>
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="activo">Activo</SelectItem>
//                     <SelectItem value="inactivo">Inactivo</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//             <div className="text-sm text-muted-foreground mb-4 p-3 bg-amber-50 rounded-md border border-amber-200">
//               <p><span className="text-red-500">*</span> Campos obligatorios</p>
//             </div>
//             <DialogFooter>
//               <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
//               <Button type="submit">{editingUsuario ? 'Actualizar' : 'Crear'}</Button>
//             </DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>

//       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
//             <AlertDialogDescription>Esta acción no se puede deshacer. El usuario será eliminado permanentemente.</AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancelar</AlertDialogCancel>
//             <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>

//       <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
//         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Detalles del Usuario</DialogTitle>
//             <DialogDescription>
//               Información detallada del usuario seleccionado
//             </DialogDescription>
//           </DialogHeader>
//           {viewingUsuario && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
//               <div className="space-y-2">
//                 <Label htmlFor="nombre">Nombre</Label>
//                 <Input id="nombre" value={viewingUsuario.nombre} readOnly />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="email">Email</Label>
//                 <Input id="email" type="email" value={viewingUsuario.email} readOnly />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="telefono">Teléfono</Label>
//                 <Input id="telefono" value={viewingUsuario.telefono || ''} readOnly />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="id_rol">Rol</Label>
//                 <Select value={viewingUsuario.id_rol.toString()} onValueChange={(value) => setFormData({ ...formData, id_rol: value })} disabled>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Selecciona un rol" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {mockRoles.filter(rol => rol.id_rol !== 1).map((rol) => (
//                       <SelectItem key={rol.id_rol} value={rol.id_rol.toString()}>{rol.nombre}</SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="estado">Estado</Label>
//                 <Select value={viewingUsuario.estado} onValueChange={(value: 'activo' | 'inactivo') => setFormData({ ...formData, estado: value })} disabled>
//                   <SelectTrigger>
//                     <SelectValue />
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
//     </div>
//   );
// }


import { useState, useMemo, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Plus, Pencil, Trash2, Users, Eye, EyeOff, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { mockRoles } from '../../../shared/lib/mockData';
import { ITEMS_PER_PAGE } from '../../../lib/constants';
import { toast } from 'sonner';
import { SearchBar } from '../../../components/common/SearchBar';
import { Pagination } from '../../../components/common/Pagination';
import { fetchApi } from '../../../lib/api'; // Importamos nuestro conector a la API

export function UsuariosView() {
  const [usuarios, setUsuarios] = useState<any[]>([]); // Inicializamos vacío, ya no usamos mockUsuarios
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<any | null>(null);
  const [viewingUsuario, setViewingUsuario] = useState<any | null>(null);
  const [usuarioToDelete, setUsuarioToDelete] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    tipo_documento: 'CC',
    documento: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    id_rol: '',
    estado: 'Activo', // En tu BD usamos 'Activo'/'Inactivo'
  });

  // --- 1. LEER (GET): Obtener usuarios de la Base de Datos ---
  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await fetchApi('/users');
      if (response.success) {
        setUsuarios(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar al cargar el componente
  useEffect(() => {
    fetchUsuarios();
  }, []);

  const getRoleName = (id_rol: number) => {
    return mockRoles.find(r => r.id_rol === id_rol)?.nombre || 'N/A';
  };

  const filteredUsuarios = useMemo(() => {
    if (!searchTerm.trim()) return usuarios;
    const lowerSearch = searchTerm.toLowerCase();
    return usuarios.filter((usuario) => {
      const nombre = (usuario.nombre || '').toLowerCase();
      const email = (usuario.email || '').toLowerCase();
      const telefono = (usuario.telefono || '').toLowerCase();
      const documento = (usuario.documento || '').toLowerCase();
      const roleName = (usuario.rol_nombre || getRoleName(usuario.id_rol)).toLowerCase();
      
      return (
        nombre.includes(lowerSearch) ||
        email.includes(lowerSearch) ||
        telefono.includes(lowerSearch) ||
        documento.includes(lowerSearch) ||
        roleName.includes(lowerSearch)
      );
    });
  }, [usuarios, searchTerm]);

  const handleCreate = () => {
    setEditingUsuario(null);
    setShowPassword(false);
    setFormData({ 
      nombre: '', tipo_documento: 'CC', documento: '', email: '', confirmEmail: '', 
      password: '', confirmPassword: '', telefono: '', id_rol: '', estado: 'Activo' 
    });
    setDialogOpen(true);
  };

  const handleEdit = (usuario: any) => {
    setEditingUsuario(usuario);
    setShowPassword(false);
    setFormData({
      nombre: usuario.nombre,
      tipo_documento: usuario.tipo_documento || 'CC',
      documento: usuario.documento || '',
      email: usuario.email,
      confirmEmail: usuario.email,
      password: '',
      confirmPassword: '',
      telefono: usuario.telefono || '',
      id_rol: usuario.id_rol.toString(),
      estado: usuario.estado || 'Activo',
    });
    setDialogOpen(true);
  };

  const handleView = (usuario: any) => {
    setViewingUsuario(usuario);
    setDetailsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setUsuarioToDelete(id);
    setDeleteDialogOpen(true);
  };

  // --- 4. ELIMINAR (DELETE): Borrar usuario en la Base de Datos ---
  const confirmDelete = async () => {
    if (usuarioToDelete) {
      try {
        await fetchApi(`/users/${usuarioToDelete}`, { method: 'DELETE' });
        toast.success('Usuario eliminado correctamente');
        fetchUsuarios(); // Recargar la tabla
      } catch (error: any) {
        toast.error(error.message || 'Error al eliminar el usuario');
      }
    }
    setDeleteDialogOpen(false);
    setUsuarioToDelete(null);
  };

  // --- 2 y 3. CREAR (POST) Y ACTUALIZAR (PUT) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones del frontend
    if (!formData.nombre.trim() || !formData.email.trim() || !formData.documento.trim() || !formData.id_rol) {
      toast.error('Todos los campos obligatorios (*) deben estar completos');
      return;
    }

    if (formData.email !== formData.confirmEmail) {
      toast.error('Los correos electrónicos no coinciden');
      return;
    }

    if (!editingUsuario && !formData.password.trim()) {
      toast.error('La contraseña es obligatoria para crear un nuevo usuario');
      return;
    }

    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres');
        return;
      }
    }

    // Preparamos los datos para enviar al backend
    const payload = {
      nombre: formData.nombre,
      tipo_documento: formData.tipo_documento,
      documento: formData.documento,
      email: formData.email,
      telefono: formData.telefono,
      id_rol: parseInt(formData.id_rol),
      estado: formData.estado,
      password: formData.password // El backend lo mapea a 'contrasena'
    };

    try {
      if (editingUsuario) {
        // ACTUALIZAR (PUT)
        await fetchApi(`/users/${editingUsuario.id_usuario}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        toast.success('Usuario actualizado correctamente');
      } else {
        // CREAR (POST)
        await fetchApi('/users', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        toast.success('Usuario creado correctamente');
      }
      
      setDialogOpen(false);
      fetchUsuarios(); // Recargar la tabla con los datos frescos
      
    } catch (error: any) {
      toast.error(error.message || 'Ocurrió un error al procesar la solicitud');
    }
  };

  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
  const currentItems = filteredUsuarios.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-blue-800 font-bold">
            <Users className="w-6 h-6 text-blue-600" />
            Usuarios
          </h1>
          <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
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
              placeholder="Buscar por nombre, documento, email..."
              className="w-full md:w-96"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="text-center py-8 text-muted-foreground">Cargando usuarios desde la base de datos...</div>
          ) : filteredUsuarios.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No se encontraron usuarios con ese criterio' : 'No hay usuarios registrados'}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doc.</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((usuario) => (
                    <TableRow key={usuario.id_usuario}>
                      <TableCell className="font-medium text-xs">
                        {usuario.tipo_documento} {usuario.documento}
                      </TableCell>
                      <TableCell>{usuario.nombre}</TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>{usuario.telefono || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {usuario.rol_nombre || getRoleName(usuario.id_rol)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(usuario)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(usuario.id_usuario)}>
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
              {filteredUsuarios.length > itemsPerPage && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
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
              {editingUsuario ? 'Actualiza la información en la base de datos' : 'Crea un nuevo usuario en la base de datos'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              
              <div className="space-y-2">
                <Label htmlFor="tipo_documento">Tipo Doc. <span className="text-red-500">*</span></Label>
                <Select value={formData.tipo_documento} onValueChange={(val) => setFormData({ ...formData, tipo_documento: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">Cédula (CC)</SelectItem>
                    <SelectItem value="CE">Cédula Extranjería (CE)</SelectItem>
                    <SelectItem value="TI">Tarjeta Identidad (TI)</SelectItem>
                    <SelectItem value="NIT">NIT</SelectItem>
                    <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documento">Documento <span className="text-red-500">*</span></Label>
                <Input id="documento" value={formData.documento} onChange={(e) => setFormData({ ...formData, documento: e.target.value })} required placeholder="Ej: 1020304050" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nombre">Nombre Completo <span className="text-red-500">*</span></Label>
                <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required placeholder="Ej: Juan Pérez" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required placeholder="correo@ejemplo.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmEmail">Confirmar Email <span className="text-red-500">*</span></Label>
                <Input id="confirmEmail" type="email" value={formData.confirmEmail} onChange={(e) => setFormData({ ...formData, confirmEmail: e.target.value })} required placeholder="correo@ejemplo.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} placeholder="Ej: 300 123 4567" />
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
                <Label htmlFor="password">Contraseña {editingUsuario ? '(opcional)' : <span className="text-red-500">*</span>}</Label>
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
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)} className="absolute right-1 top-1/2 transform -translate-y-1/2">
                    {showPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required={!editingUsuario && formData.password.length > 0}
                    className="pr-10"
                    placeholder="Confirmar contraseña"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                {editingUsuario ? 'Actualizar BD' : 'Guardar en BD'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario de la Base de Datos?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
          </DialogHeader>
          {viewingUsuario && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>ID Interno</Label>
                <Input value={viewingUsuario.id_usuario} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Documento</Label>
                <Input value={`${viewingUsuario.tipo_documento} - ${viewingUsuario.documento}`} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={viewingUsuario.nombre} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={viewingUsuario.email} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Input value={viewingUsuario.rol_nombre || getRoleName(viewingUsuario.id_rol)} readOnly className="bg-muted" />
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

