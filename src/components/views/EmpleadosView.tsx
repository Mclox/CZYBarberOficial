import { useState, useMemo, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DollarSign, Briefcase, Plus, Pencil, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { fetchApi } from '../../lib/api'; // Conexión API real
import { SearchBar } from '../common/SearchBar';
import { Pagination } from '../common/Pagination';
import { ITEMS_PER_PAGE } from '../../lib/constants';
import { formatCOP } from '../../lib/format';
import { useAuth } from '../../features/auth';

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

export function EmpleadosView() {
  const { user, hasPermission } = useAuth();
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const isAdmin = user?.id_rol === 1 || user?.rol === 'Administrador';
  const canCreate = hasPermission ? hasPermission('Empleados', 'crear') : isAdmin;
  const canUpdate = hasPermission ? hasPermission('Empleados', 'actualizar') : isAdmin;

  // --- Employee Management State ---
  const [employeeFormData, setEmployeeFormData] = useState({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    tipo_documento: 'CC',
    documento: '',
    telefono: '',
    direccion: '',
    email: '',
    confirmEmail: '',
    contrasena: '',
    confirmPassword: '',
    cargo: 'Barbero',
    estado: 'Activo',
    tipo_esquema: 'comision',
    porcentaje_comision: 60,
    porcentaje_dueno: 40,
    pago_silla_semanal: 0,
  });
  
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // --- FETCH DATA ---
  const fetchEmpleados = async () => {
    setLoading(true);
    try {
      const response = await fetchApi('/employees');
      if (response.success) {
        setEmpleados(response.data);
      }
    } catch (error) {
      toast.error('Error al cargar barberos de la BD');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return empleados;
    return empleados.filter(e =>
      (e.nombre || '').toLowerCase().includes(employeeSearch.toLowerCase()) ||
      (e.apellido || '').toLowerCase().includes(employeeSearch.toLowerCase()) ||
      (e.documento || '').toLowerCase().includes(employeeSearch.toLowerCase())
    );
  }, [empleados, employeeSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [employeeSearch]);

  const handleEmployeeCreate = () => {
    setEditingEmployee(null);
    setShowPassword(false);
    setEmployeeFormData({
      primer_nombre: '',
      segundo_nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      tipo_documento: 'CC',
      documento: '',
      telefono: '',
      direccion: '',
      email: '',
      confirmEmail: '',
      contrasena: '',
      confirmPassword: '',
      cargo: 'Barbero',
      estado: 'Activo',
      tipo_esquema: 'comision',
      porcentaje_comision: 60,
      porcentaje_dueno: 40,
      pago_silla_semanal: 0,
    });
    setDialogOpen(true);
  };

  const handleEmployeeEdit = (emp: any) => {
    setEditingEmployee(emp);
    setShowPassword(false);

    const parsedNames = parseFullName(emp.nombre);

    setEmployeeFormData({
      primer_nombre: parsedNames.primer_nombre,
      segundo_nombre: parsedNames.segundo_nombre,
      primer_apellido: parsedNames.primer_apellido,
      segundo_apellido: parsedNames.segundo_apellido,
      tipo_documento: emp.tipo_documento || 'CC',
      documento: emp.documento || '',
      telefono: emp.telefono || '',
      direccion: emp.direccion || '',
      email: emp.email || '',
      confirmEmail: emp.email || '',
      contrasena: '',
      confirmPassword: '',
      cargo: emp.cargo || 'Barbero',
      estado: emp.estado || 'Activo',
      tipo_esquema: emp.tipo_esquema === 'alquiler' ? 'silla' : 'comision',
      porcentaje_comision: emp.porcentaje_comision || 0,
      porcentaje_dueno: 100 - (emp.porcentaje_comision || 0),
      pago_silla_semanal: emp.pago_silla_semanal || 0,
    });
    setDialogOpen(true);
  };

  const handleView = (emp: any) => {
    setViewingEmployee(emp);
    setDetailsDialogOpen(true);
  };

  const handleEmployeeSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que todos los campos obligatorios estén completos
    if (
      !employeeFormData.primer_nombre.trim() ||
      !employeeFormData.segundo_nombre.trim() ||
      !employeeFormData.primer_apellido.trim() ||
      !employeeFormData.segundo_apellido.trim() ||
      !employeeFormData.tipo_documento.trim() ||
      !employeeFormData.documento.trim() ||
      !employeeFormData.email.trim() ||
      !employeeFormData.confirmEmail.trim()
    ) {
      toast.error('Todos los campos obligatorios (*) deben estar completos');
      return;
    }

    // Validar contraseña obligatoria al registrar
    if (!editingEmployee && !employeeFormData.contrasena.trim()) {
      toast.error('La contraseña es obligatoria para registrar un nuevo empleado');
      return;
    }

    // Validar que coincidan los emails
    if (employeeFormData.email !== employeeFormData.confirmEmail) {
      toast.error('Los correos electrónicos no coinciden');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(employeeFormData.email)) {
      toast.error('El formato del correo electrónico no es válido');
      return;
    }

    // Validar confirmación de contraseña (si se ingresa una)
    if (employeeFormData.contrasena || employeeFormData.confirmPassword) {
      if (employeeFormData.contrasena !== employeeFormData.confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        return;
      }
      if (employeeFormData.contrasena.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres');
        return;
      }
    }

    // Validar esquema de comisión
    if (employeeFormData.tipo_esquema === 'comision') {
      const com = employeeFormData.porcentaje_comision || 0;
      const due = employeeFormData.porcentaje_dueno || 0;
      if (com + due !== 100) return toast.error('La suma de porcentajes debe ser 100%');
    }

    // Adaptar nombres para la BD
    const payload = {
        ...employeeFormData,
        tipo_esquema: employeeFormData.tipo_esquema === 'silla' ? 'alquiler' : 'porcentaje'
    };

    try {
        if (editingEmployee) {
            await fetchApi(`/employees/${editingEmployee.id_empleado}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            toast.success('Perfil de barbero actualizado');
        } else {
            await fetchApi('/employees', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            toast.success('Nuevo barbero registrado');
        }
        setDialogOpen(false);
        fetchEmpleados();
    } catch (error: any) {
        toast.error(error.message || 'Error guardando barbero');
    }
  };

  const toggleEmployeeStatus = async (emp: any) => {
    const newStatus = emp.estado === 'Activo' ? 'Inactivo' : 'Activo';
    if (!window.confirm(`¿Desea cambiar el estado del empleado "${emp.nombre}" a ${newStatus}?`)) {
      return;
    }
    const toastId = toast.loading(`Cambiando estado a ${newStatus}...`);
    try {
        await fetchApi(`/employees/${emp.id_empleado}/status`, {
            method: 'PUT',
            body: JSON.stringify({ estado: newStatus })
        });
        toast.success(`Barbero ${newStatus === 'Activo' ? 'activado' : 'inactivado'} correctamente`, { id: toastId });
        fetchEmpleados();
    } catch (e: any) {
        toast.error(e.message || 'Error al cambiar el estado', { id: toastId });
    }
  };

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const currentItems = filteredEmployees.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full space-y-6 h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-800">
            <Briefcase className="w-6 h-6 text-blue-600" />
            Gestión de Empleados
          </h1>
          <p className="text-muted-foreground">Configura los barberos y esquemas de pago.</p>
        </div>
        {canCreate && (
          <Button onClick={handleEmployeeCreate} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-blue-200/50 transition-all">
            <Plus className="w-4 h-4 mr-2" /> Nuevo barbero
          </Button>
        )}
      </div>

      <div className="space-y-8 animate-in fade-in duration-500">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>Lista de Barberos</CardTitle>
              <SearchBar
                value={employeeSearch}
                onChange={setEmployeeSearch}
                placeholder="Buscar barbero por nombre, documento..."
                className="w-full md:w-96"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-10">Cargando barberos...</p>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {employeeSearch ? 'No se encontraron barberos con ese criterio' : 'No hay barberos registrados'}
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
                      <TableHead>Esquema de Pago</TableHead>
                      <TableHead>Detalle</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((emp) => (
                      <TableRow key={emp.id_empleado}>
                        <TableCell>{emp.id_empleado}</TableCell>
                        <TableCell className="font-medium text-xs">
                          {emp.tipo_documento} {emp.documento}
                        </TableCell>
                        <TableCell className="font-medium">
                          {`${emp.nombre} ${emp.apellido || ''}`.trim()}
                        </TableCell>
                        <TableCell>{emp.email || '-'}</TableCell>
                        <TableCell>{emp.telefono || '-'}</TableCell>
                        <TableCell>
                          <span className="capitalize">
                            {emp.tipo_esquema === 'porcentaje' ? 'Porcentaje' : 'Alquiler'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {emp.tipo_esquema === 'porcentaje' ? `${emp.porcentaje_comision || 0}%` : 'Fijo'}
                        </TableCell>
                        <TableCell>
                          {canUpdate ? (
                            <button
                              onClick={() => toggleEmployeeStatus(emp)}
                              className="focus:outline-none transition-transform active:scale-95"
                              title={`Cambiar a ${emp.estado === 'Activo' ? 'Inactivo' : 'Activo'}`}
                            >
                              <Badge 
                                className={`
                                  cursor-pointer px-3 py-1 rounded-full border-2 transition-all duration-200
                                  ${emp.estado === 'Activo' 
                                    ? 'bg-green-600 text-white hover:bg-green-700 border-transparent shadow-sm' 
                                    : 'bg-red-600 text-white hover:bg-red-700 border-transparent shadow-sm'}
                                `}
                              >
                                <span className={`w-2 h-2 rounded-full mr-2 ${emp.estado === 'Activo' ? 'bg-green-200' : 'bg-red-200'}`}></span>
                                {emp.estado || 'Activo'}
                              </Badge>
                            </button>
                          ) : (
                            <Badge 
                              className={`
                                px-3 py-1 rounded-full border-2
                                ${emp.estado === 'Activo' 
                                  ? 'bg-green-600 text-white border-transparent shadow-sm' 
                                  : 'bg-red-600 text-white border-transparent shadow-sm'}
                              `}
                            >
                              <span className={`w-2 h-2 rounded-full mr-2 ${emp.estado === 'Activo' ? 'bg-green-200' : 'bg-red-200'}`}></span>
                              {emp.estado || 'Activo'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleView(emp)} title="Ver detalles">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {canUpdate && (
                              <Button variant="outline" size="sm" onClick={() => handleEmployeeEdit(emp)} title="Configurar / Editar">
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginación */}
                {filteredEmployees.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={ITEMS_PER_PAGE}
                    totalItems={filteredEmployees.length}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal para Crear y Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? 'Editar Barbero' : 'Nuevo Barbero'}</DialogTitle>
            <DialogDescription>
              {editingEmployee ? 'Actualiza la información del barbero y su esquema de pago' : 'Crea un nuevo barbero en el sistema'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEmployeeSave}>
            <div className="space-y-6 py-4">
              {/* Sección Datos Personales */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-800 border-b pb-2">Datos Personales</h3>
                
                {/* Primer Nombre y Segundo Nombre */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primer_nombre">Primer Nombre <span className="text-red-500">*</span></Label>
                    <Input id="primer_nombre" required value={employeeFormData.primer_nombre} onChange={e => setEmployeeFormData({ ...employeeFormData, primer_nombre: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="segundo_nombre">Segundo Nombre <span className="text-red-500">*</span></Label>
                    <Input id="segundo_nombre" required value={employeeFormData.segundo_nombre} onChange={e => setEmployeeFormData({ ...employeeFormData, segundo_nombre: e.target.value })} />
                  </div>
                </div>

                {/* Primer Apellido y Segundo Apellido */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primer_apellido">Primer Apellido <span className="text-red-500">*</span></Label>
                    <Input id="primer_apellido" required value={employeeFormData.primer_apellido} onChange={e => setEmployeeFormData({ ...employeeFormData, primer_apellido: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="segundo_apellido">Segundo Apellido <span className="text-red-500">*</span></Label>
                    <Input id="segundo_apellido" required value={employeeFormData.segundo_apellido} onChange={e => setEmployeeFormData({ ...employeeFormData, segundo_apellido: e.target.value })} />
                  </div>
                </div>

                {/* Tipo de Documento y Número de Documento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo_documento">Tipo Doc. <span className="text-red-500">*</span></Label>
                    <Select value={employeeFormData.tipo_documento} onValueChange={(val) => setEmployeeFormData({ ...employeeFormData, tipo_documento: val })}>
                      <SelectTrigger id="tipo_documento">
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
                    <Input id="documento" required value={employeeFormData.documento} onChange={e => setEmployeeFormData({ ...employeeFormData, documento: e.target.value })} placeholder="Ej: 1020304050" />
                  </div>
                </div>

                {/* Teléfono y Dirección */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono <span className="text-red-500">*</span></Label>
                    <Input id="telefono" required value={employeeFormData.telefono} onChange={e => setEmployeeFormData({ ...employeeFormData, telefono: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="direccion">Dirección (Opcional)</Label>
                    <Input id="direccion" value={employeeFormData.direccion} onChange={e => setEmployeeFormData({ ...employeeFormData, direccion: e.target.value })} />
                  </div>
                </div>

                {/* Correo Electrónico y Confirmar Correo Electrónico */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                    <Input id="email" type="email" value={employeeFormData.email} onChange={e => setEmployeeFormData({ ...employeeFormData, email: e.target.value })} disabled={!!editingEmployee} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmEmail">Confirmar Email <span className="text-red-500">*</span></Label>
                    <Input id="confirmEmail" type="email" value={employeeFormData.confirmEmail} onChange={e => setEmployeeFormData({ ...employeeFormData, confirmEmail: e.target.value })} disabled={!!editingEmployee} />
                  </div>
                </div>

                {/* Contraseña y Confirmar Contraseña */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contrasena">Contraseña {editingEmployee ? '(opcional)' : <span className="text-red-500">*</span>}</Label>
                    <div className="relative">
                      <Input
                        id="contrasena"
                        type={showPassword ? 'text' : 'password'}
                        value={employeeFormData.contrasena}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, contrasena: e.target.value })}
                        required={!editingEmployee}
                        className="pr-10"
                        placeholder={editingEmployee ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña {editingEmployee ? '(opcional)' : <span className="text-red-500">*</span>}</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={employeeFormData.confirmPassword}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, confirmPassword: e.target.value })}
                        required={!editingEmployee && employeeFormData.contrasena.length > 0}
                        className="pr-10"
                        placeholder="Confirmar contraseña"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección Esquema de Pago */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-800 border-b pb-2">Esquema de Pago</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo_esquema">Tipo de Pago <span className="text-red-500">*</span></Label>
                    <Select value={employeeFormData.tipo_esquema} onValueChange={v => setEmployeeFormData({ ...employeeFormData, tipo_esquema: v as any })}>
                      <SelectTrigger id="tipo_esquema">
                        <SelectValue placeholder="Selecciona esquema" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comision">Porcentaje (Comisión)</SelectItem>
                        <SelectItem value="silla">Alquiler Silla (Fijo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {employeeFormData.tipo_esquema === 'comision' ? (
                    <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-left-2">
                      <div className="space-y-2">
                        <Label htmlFor="porcentaje_comision">Comisión Barbero %</Label>
                        <Input id="porcentaje_comision" type="number" min="0" max="100" value={employeeFormData.porcentaje_comision} onChange={e => setEmployeeFormData({ ...employeeFormData, porcentaje_comision: parseInt(e.target.value), porcentaje_dueno: 100 - parseInt(e.target.value) })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="porcentaje_dueno">Negocio %</Label>
                        <Input id="porcentaje_dueno" type="number" disabled value={employeeFormData.porcentaje_dueno} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 animate-in slide-in-from-right-2">
                      <Label htmlFor="pago_silla_semanal">Valor Alquiler (No guardado en DB)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="pago_silla_semanal" type="number" className="pl-10" value={employeeFormData.pago_silla_semanal} onChange={e => setEmployeeFormData({ ...employeeFormData, pago_silla_semanal: parseInt(e.target.value) })} disabled />
                      </div>
                    </div>
                  )}
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

      {/* Modal para Ver Detalles */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Empleado</DialogTitle>
            <DialogDescription>
              Información detallada del barbero seleccionado
            </DialogDescription>
          </DialogHeader>
          {viewingEmployee && (
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-800 border-b pb-2">Datos Personales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ID</Label>
                    <Input value={viewingEmployee.id_empleado} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Documento</Label>
                    <Input value={`${viewingEmployee.tipo_documento} - ${viewingEmployee.documento}`} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre Completo</Label>
                    <Input value={`${viewingEmployee.nombre} ${viewingEmployee.apellido || ''}`.trim()} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={viewingEmployee.email || '-'} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input value={viewingEmployee.telefono || '-'} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Input value={viewingEmployee.direccion || '-'} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Input value={viewingEmployee.cargo || 'Barbero'} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <div className="mt-1">
                      <Badge className={viewingEmployee.estado === 'Activo' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                        {viewingEmployee.estado}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-800 border-b pb-2">Esquema de Pago</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Pago</Label>
                    <Input value={viewingEmployee.tipo_esquema === 'porcentaje' ? 'Porcentaje (Comisión)' : 'Alquiler Silla (Fijo)'} readOnly />
                  </div>
                  {viewingEmployee.tipo_esquema === 'porcentaje' ? (
                    <div className="space-y-2">
                      <Label>Comisión Barbero %</Label>
                      <Input value={`${viewingEmployee.porcentaje_comision || 0}%`} readOnly />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Valor Alquiler Semanal</Label>
                      <Input value={formatCOP(viewingEmployee.pago_silla_semanal || 0)} readOnly />
                    </div>
                  )}
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