import { useState, useMemo, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
// import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Pencil, /* Trash2, */ UserCircle, Eye, EyeOff, FileDown, Search, Users, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../ui/utils';
import { exportToExcelXLSX } from '../../shared/lib/exportUtils';
import { fetchApi } from '../../lib/api'; // Conexión a la API real
import { Pagination } from '../common/Pagination';
import { useAuth } from '../../features/auth';


// Función para buscar en fechas con múltiples formatos
const searchInDate = (dateStr: string, searchTerm: string): boolean => {
  if (!dateStr) return false;
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

// Validación de caracteres especiales permitidos
const validateName = (value: string): boolean => {
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
  return nameRegex.test(value) || value === '';
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-+()]+$/;
  return phoneRegex.test(phone) || phone === '';
};

const validateAddress = (address: string): boolean => {
  const addressRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,#°'-]+$/;
  return addressRegex.test(address) || address === '';
};

const parseFullName = (fullName: string) => {
  const parts = (fullName || '').trim().split(/\s+/);
  let primer_nombre = '';
  let segundo_nombre = '';
  let primer_apellido = '';
  let segundo_apellido = '';

  if (parts.length >= 4) {
    primer_nombre = parts[0];
    segundo_nombre = parts[1];
    primer_apellido = parts[2];
    segundo_apellido = parts.slice(3).join(' ');
  } else if (parts.length === 3) {
    primer_nombre = parts[0];
    primer_apellido = parts[1];
    segundo_apellido = parts[2];
  } else if (parts.length === 2) {
    primer_nombre = parts[0];
    primer_apellido = parts[1];
  } else if (parts.length === 1) {
    primer_nombre = parts[0];
  }

  return { primer_nombre, segundo_nombre, primer_apellido, segundo_apellido };
};

export function ClientesView() {
  const { user, hasPermission } = useAuth();
  // Estados para BD real
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.id_rol === 1 || user?.rol === 'Administrador';
  const canCreate = hasPermission ? hasPermission('Clientes', 'crear') : isAdmin;
  const canUpdate = hasPermission ? hasPermission('Clientes', 'actualizar') : isAdmin;

  // Estados UI
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  // Funcionalidad "Eliminar Cliente" deshabilitada temporalmente
  // const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any | null>(null);
  const [viewingCliente, setViewingCliente] = useState<any | null>(null);
  // const [clienteToDelete, setClienteToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Formulario adaptado para BD V2
  const [formData, setFormData] = useState({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    tipo_documento: 'CC',
    documento: '',
    email: '',
    email_confirmacion: '',
    telefono: '',
    direccion: '',
    estado: 'Activo' as 'Activo' | 'Inactivo',
    password: '',
    confirmPassword: ''
  });

  // --- 1. CARGAR DATOS DESDE API (GET) ---
  const fetchClientes = async () => {
    setLoading(true);
    try {
      const response = await fetchApi('/clients');
      if (response.success) {
        // Filtramos para mostrar SOLO a los clientes registrados (id_usuario IS NOT NULL)
        const clientesRegistrados = response.data.filter((c: any) => c.id_usuario !== null);
        setClientes(clientesRegistrados);
      }
    } catch (error: any) {
      toast.error('Error al cargar clientes desde la base de datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  // Filtrar clientes por término de búsqueda
  const filteredClientes = useMemo(() => {
    if (!searchTerm.trim()) return clientes;

    const lowerSearch = searchTerm.toLowerCase();
    const cleanSearch = lowerSearch.replace('#', '').trim();

    return clientes.filter((cliente) => {
      const idCliente = cliente.id_cliente.toString();
      const fullName = (cliente.nombre_final || '').toLowerCase();
      const email = (cliente.email_final || '').toLowerCase();
      const telefono = (cliente.telefono_final || '').toLowerCase();
      const documento = (cliente.documento || '').toLowerCase();
      const direccion = (cliente.direccion || '').toLowerCase();
      const estado = (cliente.estado || 'Activo').toLowerCase();

      if (lowerSearch.startsWith('#') && idCliente.includes(cleanSearch)) {
        return true;
      }

      return (
        idCliente.includes(cleanSearch) ||
        fullName.includes(lowerSearch) ||
        email.includes(lowerSearch) ||
        telefono.includes(lowerSearch) ||
        documento.includes(lowerSearch) ||
        direccion.includes(lowerSearch) ||
        searchInDate(cliente.fecha_registro || '', lowerSearch) ||
        estado.includes(lowerSearch)
      );
    });
  }, [clientes, searchTerm]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.primer_nombre.trim()) {
      errors.primer_nombre = 'El primer nombre es obligatorio';
    } else if (!validateName(formData.primer_nombre)) {
      errors.primer_nombre = 'Solo letras y espacios';
    }

    if (!formData.segundo_nombre.trim()) {
      errors.segundo_nombre = 'El segundo nombre es obligatorio';
    } else if (!validateName(formData.segundo_nombre)) {
      errors.segundo_nombre = 'Solo letras y espacios';
    }

    if (!formData.primer_apellido.trim()) {
      errors.primer_apellido = 'El primer apellido es obligatorio';
    } else if (!validateName(formData.primer_apellido)) {
      errors.primer_apellido = 'Solo letras y espacios';
    }

    if (!formData.segundo_apellido.trim()) {
      errors.segundo_apellido = 'El segundo apellido es obligatorio';
    } else if (!validateName(formData.segundo_apellido)) {
      errors.segundo_apellido = 'Solo letras y espacios';
    }

    if (!formData.tipo_documento.trim()) {
      errors.tipo_documento = 'Tipo de documento obligatorio';
    }

    if (!formData.documento.trim()) {
      errors.documento = 'Documento obligatorio';
    }

    if (!formData.email.trim()) {
      errors.email = 'El email es obligatorio';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Formato de email no válido';
    }

    if (!formData.email_confirmacion.trim()) {
      errors.email_confirmacion = 'Confirme el email';
    } else if (formData.email !== formData.email_confirmacion) {
      errors.email_confirmacion = 'Los emails no coinciden';
    }

    if (!editingCliente) {
      if (!formData.password.trim()) {
        errors.password = 'La contraseña es obligatoria';
      } else if (formData.password.length < 6) {
        errors.password = 'Mínimo 6 caracteres';
      }
    }

    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    if (!formData.telefono.trim()) {
      errors.telefono = 'El teléfono es obligatorio';
    } else if (!validatePhone(formData.telefono)) {
      errors.telefono = 'Formato inválido';
    } else if (formData.telefono.replace(/\D/g, '').length < 7) {
      errors.telefono = 'Mínimo 7 dígitos';
    }

    if (formData.direccion && !validateAddress(formData.direccion)) {
      errors.direccion = 'Dirección contiene caracteres no válidos';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = () => {
    setEditingCliente(null);
    setShowPassword(false);
    setFormData({
      primer_nombre: '',
      segundo_nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      tipo_documento: 'CC',
      documento: '',
      email: '',
      email_confirmacion: '',
      telefono: '',
      direccion: '',
      estado: 'Activo',
      password: '',
      confirmPassword: ''
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleEdit = (cliente: any) => {
    setEditingCliente(cliente);
    setShowPassword(false);
    
    const parsedNames = parseFullName(cliente.nombre_final);

    setFormData({
      primer_nombre: parsedNames.primer_nombre,
      segundo_nombre: parsedNames.segundo_nombre,
      primer_apellido: parsedNames.primer_apellido,
      segundo_apellido: parsedNames.segundo_apellido,
      tipo_documento: cliente.tipo_documento || 'CC',
      documento: cliente.documento || '',
      email: cliente.email_final || '',
      email_confirmacion: cliente.email_final || '',
      telefono: cliente.telefono_final || '',
      direccion: cliente.direccion || '',
      estado: cliente.estado || 'Activo',
      password: '',
      confirmPassword: ''
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  // Funcionalidad "Eliminar Cliente" deshabilitada temporalmente
  // const handleDelete = (id: number) => {
  //   setClienteToDelete(id);
  //   setDeleteDialogOpen(true);
  // };
  // 
  // // --- 2. ELIMINAR (DELETE) ---
  // const confirmDelete = async () => {
  //   if (clienteToDelete) {
  //     try {
  //       await fetchApi(`/clients/${clienteToDelete}`, { method: 'DELETE' });
  //       toast.success('Cliente eliminado permanentemente', {
  //         style: { background: '#10b981', color: '#fff' }
  //       });
  //       fetchClientes();
  //     } catch (error: any) {
  //       toast.error(error.message || 'No se puede eliminar. Verifique que no tenga transacciones asociadas.', {
  //         style: { background: '#ef4444', color: '#fff' }
  //       });
  //     }
  //   }
  //   setDeleteDialogOpen(false);
  //   setClienteToDelete(null);
  // };

  // --- 3. CAMBIAR ESTADO ---
  const handleStatusChange = async (id: number, newStatus: 'Activo' | 'Inactivo') => {
    const cliente = clientes.find(c => c.id_cliente === id);
    if (!cliente) return;

    if (!window.confirm(`¿Desea cambiar el estado del cliente "${cliente.nombre_final}" a ${newStatus}?`)) {
      return;
    }

    const toastId = toast.loading(`Cambiando estado a ${newStatus === 'Activo' ? 'Activo' : 'Inactivo'}...`);

    try {
      const payload = {
        nombre: cliente.nombre_final,
        tipo_documento: cliente.tipo_documento || 'CC',
        documento: cliente.documento || '',
        email: cliente.email_final,
        telefono: cliente.telefono_final || '',
        direccion: cliente.direccion || null,
        id_rol: 3, // Rol de cliente siempre es 3
        estado: newStatus
      };

      await fetchApi(`/users/${cliente.id_usuario}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      setClientes(clientes.map(c => c.id_cliente === id ? { ...c, estado: newStatus } : c));
      toast.success(newStatus === 'Activo' ? 'Cliente activado' : 'Cliente desactivado', {
        id: toastId,
        style: { background: '#10b981', color: '#fff' }
      });
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar el estado en el servidor', { id: toastId });
    }
  };

  const handleExport = () => {
    const dataToExport = clientes.map(cliente => ({
      'ID': cliente.id_cliente,
      'Documento': `${cliente.tipo_documento || 'CC'} ${cliente.documento || ''}`,
      'Nombre': cliente.nombre_final,
      'Email': cliente.email_final || '',
      'Teléfono': cliente.telefono_final || '',
      'Dirección': cliente.direccion || '',
      'Estado': 'Registrado',
    }));

    const fechaActual = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    exportToExcelXLSX(dataToExport, `Clientes_Registrados_${fechaActual}`, 'Clientes');
    toast.success('Archivo Excel descargado exitosamente');
  };

  // --- 4. CREAR/ACTUALIZAR (POST/PUT) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    const fullName = [
      formData.primer_nombre,
      formData.segundo_nombre,
      formData.primer_apellido,
      formData.segundo_apellido
    ].filter(Boolean).map(s => s.trim()).join(' ');

    try {
      if (editingCliente) {
        const payload = {
          id_usuario: editingCliente.id_usuario,
          nombre: fullName,
          telefono: formData.telefono,
          email: formData.email,
          tipo_documento: formData.tipo_documento,
          documento: formData.documento,
          direccion: formData.direccion || null,
          contrasena: formData.password || null
        };
        await fetchApi(`/clients/${editingCliente.id_cliente}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        toast.success('Cliente actualizado correctamente');
      } else {
        // 1. Crear el Usuario (rol 3)
        const userPayload = {
          nombre: fullName,
          tipo_documento: formData.tipo_documento,
          documento: formData.documento,
          email: formData.email,
          telefono: formData.telefono,
          direccion: formData.direccion || null,
          id_rol: 3,
          password: formData.password
        };
        const resUser = await fetchApi('/users', {
          method: 'POST',
          body: JSON.stringify(userPayload)
        });

        if (resUser.success) {
          // 2. Crear el Cliente vinculado
          await fetchApi('/clients', {
            method: 'POST',
            body: JSON.stringify({ 
              id_usuario: resUser.id_usuario || resUser.data?.id_usuario,
              direccion_invitado: formData.direccion || null
            })
          });
          toast.success('Cliente registrado y cuenta de usuario creada');
        }
      }
      setDialogOpen(false);
      fetchClientes();
    } catch (error: any) {
      toast.error(error.message || 'Error guardando el cliente');
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClientes.slice(indexOfFirstItem, indexOfLastItem);

  const totalClientes = clientes.length;
  const clientesActivos = clientes.filter(c => (c.estado || 'Activo') === 'Activo').length;
  const clientesInactivos = clientes.filter(c => (c.estado || 'Activo') === 'Inactivo').length;
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-800">
            <UserCircle className="w-6 h-6" />
            Clientes Registrados
          </h1>
          <p className="text-muted-foreground">Gestiona la base de clientes formales de la barbería</p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md hover:shadow-blue-200/50 transition-all">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          )}
          <Button onClick={handleExport} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
            <FileDown className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-lg shadow-md">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Clientes</p>
                <p className="text-2xl font-bold text-blue-600">{totalClientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-300 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-600 rounded-lg shadow-md">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Activos</p>
                <p className="text-2xl font-bold text-green-600">{clientesActivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-300 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-600 rounded-lg shadow-md">
                <UserX className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Inactivos</p>
                <p className="text-2xl font-bold text-red-600">{clientesInactivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Lista de Clientes</CardTitle>
            <div className="w-full md:w-96">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por ID, nombre, documento, email, teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando base de datos...</div>
          ) : filteredClientes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No se encontraron clientes con ese criterio' : 'No hay clientes registrados'}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Doc.</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((cliente) => (
                    <TableRow key={cliente.id_cliente}>
                      <TableCell className="font-medium">#{cliente.id_cliente}</TableCell>
                      <TableCell className="font-medium text-xs">
                        {cliente.tipo_documento} {cliente.documento}
                      </TableCell>
                      <TableCell className="font-medium">{cliente.nombre_final}</TableCell>
                      <TableCell>{cliente.email_final || '-'}</TableCell>
                      <TableCell>{cliente.telefono_final || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{cliente.direccion || '-'}</TableCell>
                      <TableCell>
                        {canUpdate ? (
                          <button
                            onClick={() => handleStatusChange(cliente.id_cliente, (cliente.estado || 'Activo') === 'Activo' ? 'Inactivo' : 'Activo')}
                            className="focus:outline-none transition-transform active:scale-95"
                            title={`Cambiar a ${(cliente.estado || 'Activo') === 'Activo' ? 'Inactivo' : 'Activo'}`}
                          >
                            <Badge 
                              className={`
                                cursor-pointer px-3 py-1 rounded-full border-2 transition-all duration-200
                                ${(cliente.estado || 'Activo') === 'Activo' 
                                  ? 'bg-green-600 text-white hover:bg-green-700 border-transparent shadow-sm' 
                                  : 'bg-red-600 text-white hover:bg-red-700 border-transparent shadow-sm'}
                              `}
                            >
                              <span className={`w-2 h-2 rounded-full mr-2 ${(cliente.estado || 'Activo') === 'Activo' ? 'bg-green-200' : 'bg-red-200'}`}></span>
                              {(cliente.estado || 'Activo') === 'Activo' ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </button>
                        ) : (
                          <Badge 
                            className={`
                              px-3 py-1 rounded-full border-2
                              ${(cliente.estado || 'Activo') === 'Activo' 
                                ? 'bg-green-600 text-white border-transparent shadow-sm' 
                                : 'bg-red-600 text-white border-transparent shadow-sm'}
                            `}
                          >
                            <span className={`w-2 h-2 rounded-full mr-2 ${(cliente.estado || 'Activo') === 'Activo' ? 'bg-green-200' : 'bg-red-200'}`}></span>
                            {(cliente.estado || 'Activo') === 'Activo' ? 'Activo' : 'Inactivo'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setViewingCliente(cliente); setDetailsDialogOpen(true); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canUpdate && (
                            <Button variant="outline" size="sm" onClick={() => handleEdit(cliente)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {/* Funcionalidad "Eliminar Cliente" deshabilitada temporalmente
                          <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(cliente.id_cliente)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Label htmlFor="itemsPerPage" className="text-sm text-muted-foreground">Mostrar:</Label>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => { setItemsPerPage(parseInt(value)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[80px] h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredClientes.length}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
            <DialogDescription>
              {editingCliente ? 'Actualiza los datos del cliente en el sistema.' : 'Crea un nuevo cliente y una cuenta de usuario asociada.'}
            </DialogDescription>
          </DialogHeader>



          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-4">
              {/* Sección Datos Personales */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-800 border-b pb-2">Datos Personales</h3>
                
                {/* Primer Nombre y Segundo Nombre */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primer_nombre">Primer Nombre <span className="text-red-500">*</span></Label>
                    <Input id="primer_nombre" required value={formData.primer_nombre} onChange={e => setFormData({ ...formData, primer_nombre: e.target.value })} className={formErrors.primer_nombre ? 'border-red-500' : ''} />
                    {formErrors.primer_nombre && <p className="text-xs text-red-500">{formErrors.primer_nombre}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="segundo_nombre">Segundo Nombre <span className="text-red-500">*</span></Label>
                    <Input id="segundo_nombre" required value={formData.segundo_nombre} onChange={e => setFormData({ ...formData, segundo_nombre: e.target.value })} className={formErrors.segundo_nombre ? 'border-red-500' : ''} />
                    {formErrors.segundo_nombre && <p className="text-xs text-red-500">{formErrors.segundo_nombre}</p>}
                  </div>
                </div>

                {/* Primer Apellido y Segundo Apellido */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primer_apellido">Primer Apellido <span className="text-red-500">*</span></Label>
                    <Input id="primer_apellido" required value={formData.primer_apellido} onChange={e => setFormData({ ...formData, primer_apellido: e.target.value })} className={formErrors.primer_apellido ? 'border-red-500' : ''} />
                    {formErrors.primer_apellido && <p className="text-xs text-red-500">{formErrors.primer_apellido}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="segundo_apellido">Segundo Apellido <span className="text-red-500">*</span></Label>
                    <Input id="segundo_apellido" required value={formData.segundo_apellido} onChange={e => setFormData({ ...formData, segundo_apellido: e.target.value })} className={formErrors.segundo_apellido ? 'border-red-500' : ''} />
                    {formErrors.segundo_apellido && <p className="text-xs text-red-500">{formErrors.segundo_apellido}</p>}
                  </div>
                </div>

                {/* Tipo de Documento y Número de Documento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo_documento">Tipo Doc. <span className="text-red-500">*</span></Label>
                    <Select value={formData.tipo_documento} onValueChange={(val) => setFormData({ ...formData, tipo_documento: val })}>
                      <SelectTrigger id="tipo_documento" className={formErrors.tipo_documento ? 'border-red-500' : ''}>
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
                    {formErrors.tipo_documento && <p className="text-xs text-red-500">{formErrors.tipo_documento}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documento">Documento <span className="text-red-500">*</span></Label>
                    <Input id="documento" required value={formData.documento} onChange={e => setFormData({ ...formData, documento: e.target.value })} className={formErrors.documento ? 'border-red-500' : ''} placeholder="Ej: 1020304050" />
                    {formErrors.documento && <p className="text-xs text-red-500">{formErrors.documento}</p>}
                  </div>
                </div>

                {/* Teléfono y Dirección */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono <span className="text-red-500">*</span></Label>
                    <Input id="telefono" required value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} className={formErrors.telefono ? 'border-red-500' : ''} />
                    {formErrors.telefono && <p className="text-xs text-red-500">{formErrors.telefono}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="direccion">Dirección (Opcional)</Label>
                    <Input id="direccion" value={formData.direccion} onChange={e => setFormData({ ...formData, direccion: e.target.value })} className={formErrors.direccion ? 'border-red-500' : ''} />
                    {formErrors.direccion && <p className="text-xs text-red-500">{formErrors.direccion}</p>}
                  </div>
                </div>

                {/* Correo Electrónico y Confirmar Correo Electrónico */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                    <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={!!editingCliente} className={formErrors.email ? 'border-red-500' : ''} />
                    {formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmEmail">Confirmar Email <span className="text-red-500">*</span></Label>
                    <Input id="confirmEmail" type="email" value={formData.email_confirmacion} onChange={e => setFormData({ ...formData, email_confirmacion: e.target.value })} disabled={!!editingCliente} className={formErrors.email_confirmacion ? 'border-red-500' : ''} />
                    {formErrors.email_confirmacion && <p className="text-xs text-red-500">{formErrors.email_confirmacion}</p>}
                  </div>
                </div>

                {/* Contraseña y Confirmar Contraseña */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña {editingCliente ? '(opcional)' : <span className="text-red-500">*</span>}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!editingCliente}
                        className={cn("pr-10", formErrors.password ? 'border-red-500' : '')}
                        placeholder={editingCliente ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
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
                    {formErrors.password && <p className="text-xs text-red-500">{formErrors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña {editingCliente ? '(opcional)' : <span className="text-red-500">*</span>}</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required={!editingCliente && formData.password.length > 0}
                        className={cn("pr-10", formErrors.confirmPassword ? 'border-red-500' : '')}
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
                    {formErrors.confirmPassword && <p className="text-xs text-red-500">{formErrors.confirmPassword}</p>}
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalle */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-800"><UserCircle className="w-5 h-5" />Detalles del Cliente</DialogTitle>
            <DialogDescription>Información detallada del perfil del cliente seleccionado</DialogDescription>
          </DialogHeader>
          {viewingCliente && (
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-800 border-b pb-2">Datos Personales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ID Cliente</Label>
                    <Input value={`#${viewingCliente.id_cliente}`} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Documento</Label>
                    <Input value={`${viewingCliente.tipo_documento || 'CC'} - ${viewingCliente.documento || ''}`} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre Completo</Label>
                    <Input value={viewingCliente.nombre_final || ''} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={viewingCliente.email_final || '-'} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input value={viewingCliente.telefono_final || '-'} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Input value={viewingCliente.direccion || '-'} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <div className="mt-1">
                      <Badge className={cn((viewingCliente.estado || 'Activo') === 'Activo' ? 'bg-green-600 text-white' : 'bg-red-600 text-white')}>
                        {(viewingCliente.estado || 'Activo') === 'Activo' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter><Button type="button" variant="outline" onClick={() => setDetailsDialogOpen(false)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Funcionalidad "Eliminar Cliente" deshabilitada temporalmente
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará de forma permanente al cliente y su cuenta de usuario asociada. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      */}
    </div>
  );
}